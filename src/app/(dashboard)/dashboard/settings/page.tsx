import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "@/components/profile/profile-form";
import { PhoneForm } from "@/components/profile/phone-form";
import { EmailVerificationForm } from "@/components/profile/email-verification-form";
import { Settings, User, Users, ClipboardList, Clock, MailCheck, Phone, TreePine } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import Link from "next/link";

const statusLabel: Record<string, string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
};

const statusColor: Record<string, string> = {
  PENDING: "text-amber-400",
  APPROVED: "text-green-400",
  REJECTED: "text-red-400",
};

const editRequestTypeLabel: Record<string, string> = {
  ADD_PERSON: "إضافة شخص",
  EDIT_PERSON: "تعديل شخص",
  ADD_RELATION: "إضافة علاقة",
  EDIT_RELATION: "تعديل علاقة",
  ADD_FAMILY_INFO: "إضافة معلومات",
  EDIT_FAMILY_INFO: "تعديل معلومات",
};

const adminRequestTypeLabel: Record<string, string> = {
  CREATE_FAMILY_AND_ADMINISTER: "إنشاء عائلة",
  BECOME_FAMILY_ADMIN: "طلب إدارة عائلة",
  JOIN_FAMILY_ADMINS: "طلب انضمام كمسؤول",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect(withBasePath("/login"));

  const userId = session.user.id;

  const [user, adminFamilies, myEditRequests, myAdminRequests] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        fullName: true,
        name: true,
        email: true,
        emailVerified: true,
        phone: true,
        image: true,
        accountType: true,
        createdAt: true,
        accounts: { select: { provider: true }, take: 1 },
        linkedPerson: {
          select: {
            id: true,
            fullName: true,
            family: { select: { id: true, name: true } },
          },
        },
      },
    }),
    db.familyAdminAssignment.findMany({
      where: { userId, isActive: true },
      select: {
        family: {
          select: {
            id: true,
            name: true,
            _count: { select: { persons: { where: { deletedAt: null } } } },
          },
        },
      },
    }),
    db.editRequest.findMany({
      where: { submittedByUserId: userId },
      select: {
        id: true,
        requestType: true,
        status: true,
        createdAt: true,
        family: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.adminRequest.findMany({
      where: { submittedByUserId: userId },
      select: {
        id: true,
        requestType: true,
        status: true,
        createdAt: true,
        targetFamily: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  if (!user) redirect(withBasePath("/login"));

  const managedFamilyIds = adminFamilies.map((a) => a.family.id);

  const [pendingEditCount, pendingJoinCount] = await Promise.all([
    managedFamilyIds.length > 0
      ? db.editRequest.count({ where: { familyId: { in: managedFamilyIds }, status: "PENDING" } })
      : Promise.resolve(0),
    managedFamilyIds.length > 0
      ? db.adminRequest.count({
          where: {
            targetFamilyId: { in: managedFamilyIds },
            requestType: "JOIN_FAMILY_ADMINS",
            status: "PENDING",
          },
        })
      : Promise.resolve(0),
  ]);

  const totalPendingReview = pendingEditCount + pendingJoinCount;

  const myRequests = [
    ...myEditRequests.map((r) => ({
      id: r.id,
      label: editRequestTypeLabel[r.requestType] ?? r.requestType,
      familyName: r.family.name,
      status: r.status as string,
      createdAt: r.createdAt,
    })),
    ...myAdminRequests.map((r) => ({
      id: r.id,
      label: adminRequestTypeLabel[r.requestType] ?? r.requestType,
      familyName: r.targetFamily?.name ?? "—",
      status: r.status as string,
      createdAt: r.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const displayName = user.fullName ?? user.name ?? "";
  const roleLabel = {
    SYSTEM_ADMIN: "مدير النظام",
    MEMBER: "عضو",
    VISITOR: "زائر",
  }[user.accountType];

  const isFamilyAdmin = adminFamilies.length > 0 || user.accountType === "SYSTEM_ADMIN";
  const isGoogleUser = user.accounts.some((a) => a.provider === "google");
  const isEmailVerified = !!user.emailVerified;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">الإعدادات</h1>
      </div>

      {/* Profile info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            معلومات الحساب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt="صورة الملف الشخصي"
                className="w-14 h-14 rounded-full object-cover ring-2 ring-border/40"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-accent">
                {displayName[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div>
              <p className="font-medium text-foreground">{displayName || "—"}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">{roleLabel}</p>
            </div>
          </div>

          <Separator />

          <ProfileForm initialFullName={displayName} />
        </CardContent>
      </Card>

      {/* تأكيد البريد الإلكتروني */}
      {!isGoogleUser && (
        <Card className={isEmailVerified ? "border-border/30" : "border-amber-700/40"}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MailCheck className={`h-4 w-4 ${isEmailVerified ? "text-green-400" : "text-amber-400"}`} />
              تأكيد البريد الإلكتروني
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEmailVerified ? (
              <p className="text-sm text-green-400">بريدك الإلكتروني مؤكد ✓</p>
            ) : (
              user.email && <EmailVerificationForm email={user.email} />
            )}
          </CardContent>
        </Card>
      )}

      {/* رقم الهاتف */}
      <Card className={user.phone ? "border-border/30" : "border-amber-700/40"}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className={`h-4 w-4 ${user.phone ? "text-muted-foreground" : "text-amber-400"}`} />
            رقم الهاتف
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PhoneForm initialPhone={user.phone ?? ""} />
        </CardContent>
      </Card>

      {/* الشخص المرتبط */}
      <Card className={user.linkedPerson ? "border-border/30" : "border-amber-700/40"}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TreePine className={`h-4 w-4 ${user.linkedPerson ? "text-muted-foreground" : "text-amber-400"}`} />
            ورقتي في شجرة العائلة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.linkedPerson ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{user.linkedPerson.fullName}</p>
                <p className="text-xs text-muted-foreground">عائلة {user.linkedPerson.family.name}</p>
              </div>
              <Link
                href={`/dashboard/families/${user.linkedPerson.family.id}`}
                className="text-xs text-accent hover:underline"
              >
                عرض
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">لم يتم ربطك بأي ورقة في الشجرة بعد.</p>
              <Link href="/search" className="text-xs text-accent hover:underline">
                ابحث عن نفسك في شجرة العائلة
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account info (read-only) */}
      <Card className="border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground font-normal">معلومات الحساب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">البريد الإلكتروني</span>
            <span className="text-foreground">{user.email ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">نوع الحساب</span>
            <span className="text-foreground">{roleLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">تاريخ الانضمام</span>
            <span className="text-foreground">
              {user.createdAt.toLocaleDateString("ar")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* عائلاتي */}
      {adminFamilies.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              عائلاتي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {adminFamilies.map(({ family }) => (
              <Link
                key={family.id}
                href={`/dashboard/families/${family.id}`}
                className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">{family.name}</span>
                <span className="text-xs text-muted-foreground">{family._count.persons} فرد</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* تنتظر مراجعتي */}
      {isFamilyAdmin && totalPendingReview > 0 && (
        <Card className="border-amber-700/30 bg-amber-900/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              تنتظر مراجعتي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {totalPendingReview} {totalPendingReview === 1 ? "طلب معلق" : "طلبات معلقة"}
              </p>
              <Link
                href="/dashboard/requests"
                className="text-xs text-accent hover:underline"
              >
                عرض الطلبات
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* طلباتي الأخيرة */}
      {myRequests.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              طلباتي الأخيرة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {myRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{req.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {req.familyName} · {req.createdAt.toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
                <span className={`text-xs font-medium shrink-0 mr-2 ${statusColor[req.status] ?? "text-muted-foreground"}`}>
                  {statusLabel[req.status] ?? req.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
