import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "@/components/profile/profile-form";
import { Settings, User } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      fullName: true,
      name: true,
      email: true,
      image: true,
      accountType: true,
      createdAt: true,
    },
  });

  if (!user) redirect("/login");

  const displayName = user.fullName ?? user.name ?? "";
  const roleLabel = {
    SYSTEM_ADMIN: "مدير النظام",
    MEMBER: "عضو",
    VISITOR: "زائر",
  }[user.accountType];

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
          {/* Avatar + meta */}
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

          {/* Edit form */}
          <ProfileForm initialFullName={displayName} />
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
    </div>
  );
}
