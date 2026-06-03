import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequestReviewCard } from "@/components/requests/request-review-card";
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

export default async function RequestsPage() {
  const session = await auth();
  const user = session!.user;
  const isSystemAdmin = user.accountType === "SYSTEM_ADMIN";

  // Families this user administers (non-SYSTEM_ADMIN family admins)
  const myAdminFamilyIds = isSystemAdmin
    ? []
    : await db.familyAdminAssignment
        .findMany({ where: { userId: user.id, isActive: true }, select: { familyId: true } })
        .then((rows) => rows.map((r) => r.familyId));

  const isFamilyAdmin = isSystemAdmin || myAdminFamilyIds.length > 0;

  // ── Requests I need to review ──────────────────────────────────────────────
  const [editToReview, adminToReview] = isFamilyAdmin
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
      ])
    : [[], []];

  // ── My submitted requests (non-SYSTEM_ADMIN) ───────────────────────────────
  const [myEditRequests, myAdminRequests] = !isSystemAdmin
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
      ])
    : [[], []];

  const pendingToReviewCount = editToReview.filter((r) => r.status === "PENDING").length +
    adminToReview.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">الطلبات</h1>

      {/* ── Requests awaiting my review ── */}
      {isFamilyAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              تحتاج مراجعتك
              {pendingToReviewCount > 0 && (
                <Badge variant="gold" className="mr-auto text-xs">{pendingToReviewCount}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {editToReview.length === 0 && adminToReview.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 py-4">لا توجد طلبات معلقة</p>
            ) : (
              <ul className="divide-y divide-border/40">
                {adminToReview.map((req) => (
                  <RequestRow
                    key={req.id}
                    label={requestTypeLabels[req.requestType] ?? req.requestType}
                    sub={[
                      req.proposedFamilyName ? `عائلة: ${req.proposedFamilyName}` : null,
                      "targetFamily" in req && req.targetFamily ? `عائلة: ${req.targetFamily.name}` : null,
                      req.submittedBy
                        ? `من: ${req.submittedBy.fullName ?? req.submittedBy.name ?? "—"}`
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
                {editToReview.map((req) => (
                  <RequestRow
                    key={req.id}
                    label={requestTypeLabels[req.requestType] ?? req.requestType}
                    sub={[
                      "family" in req && req.family ? `عائلة: ${req.family.name}` : null,
                      req.submittedBy
                        ? `من: ${req.submittedBy.fullName ?? req.submittedBy.name ?? "—"}`
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

      {/* ── My submitted requests ── */}
      {!isSystemAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-muted-foreground" />
              طلباتي المقدّمة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {myAdminRequests.length === 0 && myEditRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 py-4">لم تقدّم أي طلبات بعد</p>
            ) : (
              <ul className="divide-y divide-border/40">
                {myAdminRequests.map((req) => (
                  <RequestRow
                    key={req.id}
                    label={requestTypeLabels[req.requestType] ?? req.requestType}
                    sub={[
                      req.proposedFamilyName ? `عائلة: ${req.proposedFamilyName}` : null,
                      "targetFamily" in req && req.targetFamily ? `عائلة: ${req.targetFamily.name}` : null,
                      new Date(req.createdAt).toLocaleDateString("ar"),
                    ]}
                    status={req.status}
                    reviewCard={null}
                  />
                ))}
                {myEditRequests.map((req) => (
                  <RequestRow
                    key={req.id}
                    label={requestTypeLabels[req.requestType] ?? req.requestType}
                    sub={[
                      "family" in req && req.family ? `عائلة: ${req.family.name}` : null,
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

// ── helper component ──────────────────────────────────────────────────────────

function RequestRow({
  label,
  sub,
  status,
  reviewCard,
}: {
  label: string;
  sub: (string | null)[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewCard: React.ReactNode;
}) {
  return (
    <li className="px-6 py-3 flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {sub.filter(Boolean).join(" • ")}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={statusLabels[status].variant}>{statusLabels[status].label}</Badge>
        {reviewCard}
      </div>
    </li>
  );
}
