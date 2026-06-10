import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequestReviewCard } from "@/components/requests/request-review-card";
import { BranchUnificationReviewCard } from "@/components/requests/branch-unification-review-card";
import { CrossFamilyMarriageReviewCard } from "@/components/requests/cross-family-marriage-review-card";
import { ClipboardList, Send, Link2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

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
  LINK_USER_TO_PERSON: "طلب ربط بورقة في الشجرة",
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

type CrossFamilyMarriageStatus =
  | "PENDING_FAMILY_A"
  | "PENDING_FAMILY_B"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "APPLIED";

const crossFamilyStatusLabels: Record<
  CrossFamilyMarriageStatus,
  { label: string; variant: "gold" | "public" | "private" | "secondary" }
> = {
  PENDING_FAMILY_A: { label: "انتظار موافقة العائلة أ", variant: "gold" },
  PENDING_FAMILY_B: { label: "انتظار موافقة العائلة ب", variant: "gold" },
  APPROVED:         { label: "موافق عليه",               variant: "public" },
  APPLIED:          { label: "مُطبَّق",                   variant: "public" },
  REJECTED:         { label: "مرفوض",                    variant: "private" },
  CANCELLED:        { label: "ملغى",                     variant: "secondary" },
};

interface RequestsPageProps {
  searchParams: Promise<{ focus?: string | string[] }>;
}

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  const { focus } = await searchParams;
  const focusId = Array.isArray(focus) ? focus[0] : focus;
  const session = await auth();
  const user = session!.user;
  const isSystemAdmin = user.accountType === "SYSTEM_ADMIN";

  const myAdminFamilyIds = isSystemAdmin
    ? []
    : await db.familyAdminAssignment
        .findMany({ where: { userId: user.id, isActive: true }, select: { familyId: true } })
        .then((rows) => rows.map((r) => r.familyId));

  const isFamilyAdmin = isSystemAdmin || myAdminFamilyIds.length > 0;

  const [editToReview, adminToReview, branchToReview, crossFamilyToReview] = isFamilyAdmin
    ? await Promise.all([
        db.editRequest.findMany({
          where: isSystemAdmin
            ? { status: "PENDING" }
            : { status: "PENDING", familyId: { in: myAdminFamilyIds } },
          include: {
            submittedBy: { select: { fullName: true, name: true } },
            family: { select: { name: true } },
          },
          orderBy: [{ source: "desc" }, { createdAt: "desc" }],
          take: 30,
        }),
        db.adminRequest.findMany({
          where: isSystemAdmin
            ? { status: "PENDING" }
            : {
                status: "PENDING",
                requestType: { in: ["JOIN_FAMILY_ADMINS", "LINK_USER_TO_PERSON"] },
                targetFamilyId: { in: myAdminFamilyIds },
              },
          include: {
            submittedBy: { select: { fullName: true, name: true, email: true, phone: true } },
            targetFamily: { select: { name: true } },
            targetPerson: { select: { fullName: true } },
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
        db.crossFamilyMarriageRequest.findMany({
          where: isSystemAdmin
            ? { status: { in: ["PENDING_FAMILY_A", "PENDING_FAMILY_B"] } }
            : {
                OR: [
                  { status: "PENDING_FAMILY_A", familyAId: { in: myAdminFamilyIds } },
                  { status: "PENDING_FAMILY_B", familyBId: { in: myAdminFamilyIds } },
                ],
              },
          orderBy: { createdAt: "desc" },
          take: 30,
        }),
      ])
    : [[], [], [], []];

  const [myEditRequests, myAdminRequests, myBranchRequests, myCrossFamilyRequests] = !isSystemAdmin
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
        db.crossFamilyMarriageRequest.findMany({
          where: { submittedByUserId: user.id },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ])
    : [[], [], [], []];

  // ── Cross-family marriage lookup data ──────────────────────────────────────
  const allCrossRequests = [...crossFamilyToReview, ...myCrossFamilyRequests];
  const crossPersonIds = Array.from(
    new Set(allCrossRequests.flatMap((r) => [r.personAId, r.personBId]))
  );
  const crossFamilyIds = Array.from(
    new Set(allCrossRequests.flatMap((r) => [r.familyAId, r.familyBId]))
  );
  const crossSubmitterIds = Array.from(new Set(allCrossRequests.map((r) => r.submittedByUserId)));

  const [crossPersons, crossFamilies, crossSubmitters] = await Promise.all([
    db.person.findMany({
      where: { id: { in: crossPersonIds.length ? crossPersonIds : ["__none__"] } },
      select: { id: true, fullName: true, gender: true },
    }),
    db.family.findMany({
      where: { id: { in: crossFamilyIds.length ? crossFamilyIds : ["__none__"] } },
      select: { id: true, name: true },
    }),
    db.user.findMany({
      where: { id: { in: crossSubmitterIds.length ? crossSubmitterIds : ["__none__"] } },
      select: { id: true, fullName: true, name: true },
    }),
  ]);

  const crossPersonMap = new Map(crossPersons.map((p) => [p.id, p.fullName]));
  const crossFamilyMap = new Map(crossFamilies.map((f) => [f.id, f.name]));
  const crossSubmitterMap = new Map(
    crossSubmitters.map((u) => [u.id, u.fullName ?? u.name ?? "—"])
  );

  // ── Branch lookup data ──────────────────────────────────────────────────────
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
    branchToReview.filter((r) => r.status === "PENDING").length +
    crossFamilyToReview.length;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">الطلبات</h1>

      {/* Request lifecycle info */}
      <RequestTimeline />

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
            {editToReview.length === 0 && adminToReview.length === 0 && branchToReview.length === 0 && crossFamilyToReview.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">لا توجد طلبات معلقة</p>
            ) : (
              <ul className="divide-y divide-border/40">
                {crossFamilyToReview.map((req) => (
                  <CrossFamilyRequestRow
                    key={req.id}
                    request={req}
                    focusId={focusId}
                    personMap={crossPersonMap}
                    familyMap={crossFamilyMap}
                    submitterMap={crossSubmitterMap}
                    reviewCard={
                      <CrossFamilyMarriageReviewCard requestId={req.id} />
                    }
                  />
                ))}
                {adminToReview.map((req) => (
                  <RequestRow
                    key={req.id}
                    requestId={req.id}
                    focused={focusId === req.id}
                    label={requestTypeLabels[req.requestType] ?? req.requestType}
                    sub={[
                      req.proposedFamilyName ? `عائلة: ${req.proposedFamilyName}` : null,
                      req.targetFamily ? `عائلة: ${req.targetFamily.name}` : null,
                      req.targetPerson ? `الشخص: ${req.targetPerson.fullName}` : null,
                      req.submittedBy
                        ? `من: ${req.submittedBy.fullName ?? req.submittedBy.name ?? branchLabels.unknown}`
                        : null,
                      req.requestType === "JOIN_FAMILY_ADMINS" && req.applicantRelationship
                        ? `الصلة: ${req.applicantRelationship}`
                        : null,
                      req.requestType === "JOIN_FAMILY_ADMINS"
                        ? formatJoinContactLine(
                            req.applicantContactEmail ?? req.submittedBy?.email,
                            req.applicantContactPhone ?? req.submittedBy?.phone
                          )
                        : null,
                      new Date(req.createdAt).toLocaleDateString("ar"),
                    ]}
                    status={req.status}
                    details={
                      req.requestType === "JOIN_FAMILY_ADMINS" ? (
                        <JoinAdminRequestDetails
                          relationship={req.applicantRelationship}
                          message={req.applicantMessage}
                          email={req.applicantContactEmail ?? req.submittedBy?.email}
                          phone={req.applicantContactPhone ?? req.submittedBy?.phone}
                        />
                      ) : null
                    }
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
                    focusId={focusId}
                    familyMap={branchFamilyMap}
                    personMap={branchPersonMap}
                    userMap={branchUserMap}
                    reviewCard={<BranchUnificationReviewCard requestId={req.id} />}
                  />
                ))}
                {editToReview.map((req) => (
                  <RequestRow
                    key={req.id}
                    requestId={req.id}
                    focused={focusId === req.id}
                    label={requestTypeLabels[req.requestType] ?? req.requestType}
                    isGuestSuggestion={req.source === "SHARE_LINK_GUEST"}
                    sub={[
                      req.family ? `عائلة: ${req.family.name}` : null,
                      req.source === "SHARE_LINK_GUEST"
                        ? `من زائر: ${req.guestName ?? "مجهول"}`
                        : req.submittedBy
                        ? `من: ${req.submittedBy.fullName ?? req.submittedBy.name ?? branchLabels.unknown}`
                        : null,
                      new Date(req.createdAt).toLocaleDateString("ar"),
                    ]}
                    status={req.status}
                    details={
                      req.source === "SHARE_LINK_GUEST" && (req.guestName || req.guestContact)
                        ? <GuestSuggestionDetails name={req.guestName} contact={req.guestContact} />
                        : null
                    }
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
            {myAdminRequests.length === 0 && myEditRequests.length === 0 && myBranchRequests.length === 0 && myCrossFamilyRequests.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">لم تقدم أي طلبات بعد</p>
            ) : (
              <ul className="divide-y divide-border/40">
                {myCrossFamilyRequests.map((req) => (
                  <CrossFamilyRequestRow
                    key={req.id}
                    request={req}
                    focusId={focusId}
                    personMap={crossPersonMap}
                    familyMap={crossFamilyMap}
                    submitterMap={crossSubmitterMap}
                    reviewCard={null}
                  />
                ))}
                {myAdminRequests.map((req) => (
                  <RequestRow
                    key={req.id}
                    requestId={req.id}
                    focused={focusId === req.id}
                    label={requestTypeLabels[req.requestType] ?? req.requestType}
                    sub={[
                      req.proposedFamilyName ? `عائلة: ${req.proposedFamilyName}` : null,
                      req.targetFamily ? `عائلة: ${req.targetFamily.name}` : null,
                      req.requestType === "JOIN_FAMILY_ADMINS" && req.applicantRelationship
                        ? `الصلة: ${req.applicantRelationship}`
                        : null,
                      new Date(req.createdAt).toLocaleDateString("ar"),
                    ]}
                    status={req.status}
                    details={
                      req.requestType === "JOIN_FAMILY_ADMINS" ? (
                        <JoinAdminRequestDetails
                          relationship={req.applicantRelationship}
                          message={req.applicantMessage}
                          email={req.applicantContactEmail}
                          phone={req.applicantContactPhone}
                        />
                      ) : null
                    }
                    reviewCard={null}
                  />
                ))}
                {myBranchRequests.map((req) => (
                  <BranchRequestRow
                    key={req.id}
                    request={req}
                    focusId={focusId}
                    familyMap={branchFamilyMap}
                    personMap={branchPersonMap}
                    userMap={branchUserMap}
                    reviewCard={null}
                  />
                ))}
                {myEditRequests.map((req) => (
                  <RequestRow
                    key={req.id}
                    requestId={req.id}
                    focused={focusId === req.id}
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

type CrossFamilyRequest = {
  id: string;
  familyAId: string;
  familyBId: string;
  personAId: string;
  personBId: string;
  status: CrossFamilyMarriageStatus;
  marriageDate: Date | null;
  submittedByUserId: string;
  createdAt: Date;
};

function CrossFamilyRequestRow({
  request,
  focusId,
  personMap,
  familyMap,
  submitterMap,
  reviewCard,
}: {
  request: CrossFamilyRequest;
  focusId?: string;
  personMap: Map<string, string>;
  familyMap: Map<string, string>;
  submitterMap: Map<string, string>;
  reviewCard: ReactNode;
}) {
  const statusInfo = crossFamilyStatusLabels[request.status];
  return (
    <li
      id={`request-${request.id}`}
      className={cn(
        "scroll-mt-24 flex items-start justify-between gap-3 px-6 py-3 transition-colors",
        focusId === request.id && "bg-accent/10 ring-1 ring-inset ring-accent/30"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Heart className="h-3.5 w-3.5 shrink-0 text-rose-400" />
          <p className="text-sm font-medium text-foreground">طلب زواج عابر للعائلتين</p>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {[
            `عائلة أ: ${familyMap.get(request.familyAId) ?? "—"}`,
            `عائلة ب: ${familyMap.get(request.familyBId) ?? "—"}`,
            `الطرف الأول: ${personMap.get(request.personAId) ?? "—"}`,
            `الطرف الثاني: ${personMap.get(request.personBId) ?? "—"}`,
            `من: ${submitterMap.get(request.submittedByUserId) ?? "—"}`,
            request.marriageDate
              ? `تاريخ الزواج: ${new Date(request.marriageDate).toLocaleDateString("ar")}`
              : null,
            new Date(request.createdAt).toLocaleDateString("ar"),
          ]
            .filter(Boolean)
            .join(" • ")}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        {reviewCard}
      </div>
    </li>
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
  focusId,
  familyMap,
  personMap,
  userMap,
  reviewCard,
}: {
  request: BranchRequest;
  focusId?: string;
  familyMap: Map<string, string>;
  personMap: Map<string, string>;
  userMap: Map<string, string>;
  reviewCard: ReactNode;
}) {
  return (
    <RequestRow
      requestId={request.id}
      focused={focusId === request.id}
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
  requestId,
  focused,
  label,
  sub,
  status,
  details,
  reviewCard,
  isGuestSuggestion = false,
}: {
  requestId: string;
  focused?: boolean;
  label: string;
  sub: (string | null)[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  details?: ReactNode;
  reviewCard: ReactNode;
  isGuestSuggestion?: boolean;
}) {
  return (
    <li
      id={`request-${requestId}`}
      className={cn(
        "scroll-mt-24 flex items-start justify-between gap-3 px-6 py-3 transition-colors",
        focused && "bg-accent/10 ring-1 ring-inset ring-accent/30",
        isGuestSuggestion && "bg-amber-500/5"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {isGuestSuggestion && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">
              <Link2 className="h-2.5 w-2.5" />
              رابط مشاركة
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{sub.filter(Boolean).join(" • ")}</p>
        {details}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={statusLabels[status].variant}>{statusLabels[status].label}</Badge>
        {reviewCard}
      </div>
    </li>
  );
}

function GuestSuggestionDetails({
  name,
  contact,
}: {
  name?: string | null;
  contact?: string | null;
}) {
  if (!name && !contact) return null;
  return (
    <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs leading-6">
      {name && (
        <p>
          <span className="text-muted-foreground">اسم المقترح: </span>
          <span className="text-foreground">{name}</span>
        </p>
      )}
      {contact && (
        <p>
          <span className="text-muted-foreground">وسيلة التواصل: </span>
          <span className="text-foreground">{contact}</span>
        </p>
      )}
    </div>
  );
}

function JoinAdminRequestDetails({
  relationship,
  message,
  email,
  phone,
}: {
  relationship?: string | null;
  message?: string | null;
  email?: string | null;
  phone?: string | null;
}) {
  if (!relationship && !message && !email && !phone) return null;
  return (
    <div className="mt-2 rounded-lg border border-border/40 bg-background/35 px-3 py-2 text-xs leading-6">
      {relationship && (
        <p>
          <span className="text-muted-foreground">الصلة بالعائلة: </span>
          <span className="text-foreground">{relationship}</span>
        </p>
      )}
      {(email || phone) && (
        <p>
          <span className="text-muted-foreground">وسيلة التواصل: </span>
          <span className="text-foreground">{[email, phone].filter(Boolean).join(" / ")}</span>
        </p>
      )}
      {message && (
        <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
          <span className="text-foreground">رسالة الطالب: </span>
          {message}
        </p>
      )}
    </div>
  );
}

function RequestTimeline() {
  const steps = [
    { label: "تقديم الطلب", desc: "يُرسل الطلب ويظهر في قائمة المراجعة" },
    { label: "قيد المراجعة", desc: "المسؤول يراجع الطلب ويتخذ القرار" },
    { label: "النتيجة", desc: "موافقة أو رفض مع إشعار فوري" },
  ];
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
      <p className="mb-2.5 text-xs font-medium text-muted-foreground">مسار الطلب</p>
      <div className="flex items-start gap-0">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-1 items-start">
            <div className="flex flex-col items-center">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border/60 bg-background text-[10px] font-semibold text-muted-foreground">
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className="mt-0 h-px w-full" />
              )}
            </div>
            <div className="mr-2 flex-1 pb-2 pl-4">
              <p className="text-xs font-medium text-foreground">{step.label}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="mt-3 h-px flex-none w-4 bg-border/40" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatJoinContactLine(email?: string | null, phone?: string | null) {
  const contact = [email, phone].filter(Boolean).join(" / ");
  return contact ? `التواصل: ${contact}` : null;
}
