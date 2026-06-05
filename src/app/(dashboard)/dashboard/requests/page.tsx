import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequestReviewCard } from "@/components/requests/request-review-card";
import { BranchUnificationReviewCard } from "@/components/requests/branch-unification-review-card";
import { ClipboardList, Send } from "lucide-react";

const statusLabels = {
  PENDING: { label: "قيد الانتظار", variant: "gold" as const },
  APPROVED: { label: "موافق عليه", variant: "public" as const },
  REJECTED: { label: "مرفوض", variant: "private" as const },
};

const requestTypeLabels: Record<string, string> = {
  ADD_PERSON: "إضافة فرد",
  EDIT_PERSON: "تعديل فرد",
  ADD_RELATION: "إضافة علاقة",
  EDIT_RELATION: "تعديل علاقة",
  ADD_FAMILY_INFO: "إضافة معلومات عائلة",
  EDIT_FAMILY_INFO: "تعديل معلومات عائلة",
  CREATE_FAMILY_AND_ADMINISTER: "طلب إنشاء عائلة جديدة",
  BECOME_FAMILY_ADMIN: "طلب إدارة عائلة",
  JOIN_FAMILY_ADMINS: "طلب الانضمام كمسؤول عائلة",
};

const branchRelationshipLabels: Record<string, string> = {
  FULL_SIBLINGS: "أخوة أشقاء",
  PATERNAL_SIBLINGS: "أخوة من الأب",
  MATERNAL_SIBLINGS: "أخوة من الأم",
};

const branchLabels = {
  request: "طلب توحيد فرعين",
  sourceFamily: "العائلة المرسلة",
  targetFamily: "العائلة المطلوبة",
  sourcePerson: "الطرف الأول",
  targetPerson: "الطرف الثاني",
  relationship: "الرابط",
  from: "من",
  unknown: "—",
};

export default async function RequestsPage() {
  const session = await auth();
  const user = session!.user;
  const isSystemAdmin = user.accountType === "SYSTEM_ADMIN";

  const myAdminFamilyIds = isSystemAdmin
    ? []
    : await db.familyAdminAssignment
        .findMany({ where: { userId: user.id, isActive: true }, select: { familyId: true } })
        .then((rows) => rows.map((r) => r.familyId));

  const isFamilyAdmin = isSystemAdmin || myAdminFamilyIds.length > 0;

  const [editToReview, adminToReview, branchToReview] = isFamilyAdmin
    ? await Promise.all([
        db.editRequest.findMany({
          where: isSystemAdmin
            ? { status: "PENDING" }
            : { status: "PENDING", familyId: { in: myAdminFamilyIds } },
          include: {
            submittedBy: { select: { fullName: true, name: true } },
            family: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        }),
        db.adminRequest.findMany({
          where: isSystemAdmin
            ? { status: "PENDING" }
            : { status: "PENDING", requestType: "JOIN_FAMILY_ADMINS", targetFamilyId: { in: myAdminFamilyIds } },
          include: {
            submittedBy: { select: { fullName: true, name: true } },
            targetFamily: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        }),
        db.branchUnificationRequest.findMany({
          where: isSystemAdmin
            ? { status: "PENDING" }
            : {
                status: "PENDING",
                OR: [
                  { sourceFamilyId: { in: myAdminFamilyIds }, sourceApprovedAt: null },
                  { targetFamilyId: { in: myAdminFamilyIds }, targetApprovedAt: null },
                ],
              },
          orderBy: { createdAt: "desc" },
          take: 30,
        }),
      ])
    : [[], [], []];

  const [myEditRequests, myAdminRequests, myBranchRequests] = !isSystemAdmin
    ? await Promise.all([
        db.editRequest.findMany({
          where: { submittedByUserId: user.id },
          include: { family: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        db.adminRequest.findMany({
          where: { submittedByUserId: user.id },
          include: { targetFamily: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        db.branchUnificationRequest.findMany({
          where: { submittedByUserId: user.id },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ])
    : [[], [], []];

  const allBranchRequests = [...branchToReview, ...myBranchRequests];
  const branchFamilyIds = Array.from(
    new Set(allBranchRequests.flatMap((req) => [req.sourceFamilyId, req.targetFamilyId]))
  );
  const branchPersonIds = Array.from(
    new Set(allBranchRequests.flatMap((req) => [req.sourcePersonId, req.targetPersonId]))
  );
  const branchUserIds = Array.from(new Set(allBranchRequests.map((req) => req.submittedByUserId)));

  const [branchFamilies, branchPersons, branchUsers] = await Promise.all([
    db.family.findMany({
      where: { id: { in: branchFamilyIds.length ? branchFamilyIds : ["__none__"] } },
      select: { id: true, name: true },
    }),
    db.person.findMany({
      where: { id: { in: branchPersonIds.length ? branchPersonIds : ["__none__"] } },
      select: { id: true, fullName: true },
    }),
    db.user.findMany({
      where: { id: { in: branchUserIds.length ? branchUserIds : ["__none__"] } },
      select: { id: true, fullName: true, name: true },
    }),
  ]);

  const branchFamilyMap = new Map(branchFamilies.map((family) => [family.id, family.name]));
  const branchPersonMap = new Map(branchPersons.map((person) => [person.id, person.fullName]));
  const branchUserMap = new Map(
    branchUsers.map((branchUser) => [
      branchUser.id,
      branchUser.fullName ?? branchUser.name ?? branchLabels.unknown,
    ])
  );

  const pendingToReviewCount =
    editToReview.filter((r) => r.status === "PENDING").length +
    adminToReview.filter((r) => r.status === "PENDING").length +
    branchToReview.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">الطلبات</h1>

      {isFamilyAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              تحتاج مراجعتك
              {pendingToReviewCount > 0 && (
                <Badge variant="gold" className="mr-auto text-xs">
                  {pendingToReviewCount}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {editToReview.length === 0 && adminToReview.length === 0 && branchToReview.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">لا توجد طلبات معلقة</p>
            ) : (
              <ul className="divide-y divide-border/40">
                {adminToReview.map((req) => (
                  <RequestRow
                    key={req.id}
                    label={requestTypeLabels[req.requestType] ?? req.requestType}
                    sub={[
                      req.proposedFamilyName ? `عائلة: ${req.proposedFamilyName}` : null,
                      req.targetFamily ? `عائلة: ${req.targetFamily.name}` : null,
                      req.submittedBy
                        ? `من: ${req.submittedBy.fullName ?? req.submittedBy.name ?? branchLabels.unknown}`
                        : null,
                      new Date(req.createdAt).toLocaleDateString("ar"),
                    ]}
                    status={req.status}
                    reviewCard={
                      req.status === "PENDING" ? (
                        <RequestReviewCard requestId={req.id} type="admin" />
                      ) : null
                    }
                  />
                ))}
                {branchToReview.map((req) => (
                  <BranchRequestRow
                    key={req.id}
                    request={req}
                    familyMap={branchFamilyMap}
                    personMap={branchPersonMap}
                    userMap={branchUserMap}
                    reviewCard={<BranchUnificationReviewCard requestId={req.id} />}
                  />
                ))}
                {editToReview.map((req) => (
                  <RequestRow
                    key={req.id}
                    label={requestTypeLabels[req.requestType] ?? req.requestType}
                    sub={[
                      req.family ? `عائلة: ${req.family.name}` : null,
                      req.submittedBy
                        ? `من: ${req.submittedBy.fullName ?? req.submittedBy.name ?? branchLabels.unknown}`
                        : null,
                      new Date(req.createdAt).toLocaleDateString("ar"),
                    ]}
                    status={req.status}
                    reviewCard={
                      req.status === "PENDING" ? (
                        <RequestReviewCard requestId={req.id} type="edit" />
                      ) : null
                    }
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {!isSystemAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="h-4 w-4 text-muted-foreground" />
              طلباتي المقدمة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {myAdminRequests.length === 0 && myEditRequests.length === 0 && myBranchRequests.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">لم تقدم أي طلبات بعد</p>
            ) : (
              <ul className="divide-y divide-border/40">
                {myAdminRequests.map((req) => (
                  <RequestRow
                    key={req.id}
                    label={requestTypeLabels[req.requestType] ?? req.requestType}
                    sub={[
                      req.proposedFamilyName ? `عائلة: ${req.proposedFamilyName}` : null,
                      req.targetFamily ? `عائلة: ${req.targetFamily.name}` : null,
                      new Date(req.createdAt).toLocaleDateString("ar"),
                    ]}
                    status={req.status}
                    reviewCard={null}
                  />
                ))}
                {myBranchRequests.map((req) => (
                  <BranchRequestRow
                    key={req.id}
                    request={req}
                    familyMap={branchFamilyMap}
                    personMap={branchPersonMap}
                    userMap={branchUserMap}
                    reviewCard={null}
                  />
                ))}
                {myEditRequests.map((req) => (
                  <RequestRow
                    key={req.id}
                    label={requestTypeLabels[req.requestType] ?? req.requestType}
                    sub={[
                      req.family ? `عائلة: ${req.family.name}` : null,
                      new Date(req.createdAt).toLocaleDateString("ar"),
                    ]}
                    status={req.status}
                    reviewCard={null}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type BranchRequest = {
  id: string;
  sourceFamilyId: string;
  targetFamilyId: string;
  sourcePersonId: string;
  targetPersonId: string;
  relationship: string;
  submittedByUserId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date;
};

function BranchRequestRow({
  request,
  familyMap,
  personMap,
  userMap,
  reviewCard,
}: {
  request: BranchRequest;
  familyMap: Map<string, string>;
  personMap: Map<string, string>;
  userMap: Map<string, string>;
  reviewCard: ReactNode;
}) {
  return (
    <RequestRow
      label={branchLabels.request}
      sub={[
        `${branchLabels.sourceFamily}: ${familyMap.get(request.sourceFamilyId) ?? branchLabels.unknown}`,
        `${branchLabels.sourcePerson}: ${personMap.get(request.sourcePersonId) ?? branchLabels.unknown}`,
        `${branchLabels.targetFamily}: ${familyMap.get(request.targetFamilyId) ?? branchLabels.unknown}`,
        `${branchLabels.targetPerson}: ${personMap.get(request.targetPersonId) ?? branchLabels.unknown}`,
        `${branchLabels.relationship}: ${branchRelationshipLabels[request.relationship] ?? request.relationship}`,
        `${branchLabels.from}: ${userMap.get(request.submittedByUserId) ?? branchLabels.unknown}`,
        new Date(request.createdAt).toLocaleDateString("ar"),
      ]}
      status={request.status}
      reviewCard={reviewCard}
    />
  );
}

function RequestRow({
  label,
  sub,
  status,
  reviewCard,
}: {
  label: string;
  sub: (string | null)[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewCard: ReactNode;
}) {
  return (
    <li className="flex items-start justify-between gap-3 px-6 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{sub.filter(Boolean).join(" • ")}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={statusLabels[status].variant}>{statusLabels[status].label}</Badge>
        {reviewCard}
      </div>
    </li>
  );
}
