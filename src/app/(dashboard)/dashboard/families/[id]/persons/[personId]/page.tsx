import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Heart,
  Pencil,
  Shield,
  User,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VisibilityLevel } from "@/generated/prisma/client";

interface Props {
  params: Promise<{ id: string; personId: string }>;
}

const visibilityLabels: Record<VisibilityLevel, { label: string; variant: "public" | "member" | "admin" | "private" }> = {
  PUBLIC: { label: "عام", variant: "public" },
  MEMBER: { label: "للأعضاء", variant: "member" },
  ADMIN: { label: "للمسؤولين", variant: "admin" },
  SHARED_LINK: { label: "رابط مشاركة", variant: "private" },
};

function formatDate(date: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
  }).format(date);
}

function yearsRange(birthDate: Date | null, deathDate: Date | null, isLiving: boolean) {
  const birthYear = birthDate?.getFullYear();
  const deathYear = deathDate?.getFullYear();
  if (!birthYear && !deathYear) return null;
  if (birthYear && deathYear) return `${birthYear} - ${deathYear}`;
  if (birthYear && isLiving) return `مواليد ${birthYear}`;
  if (birthYear) return `${birthYear} - ؟`;
  return deathYear ? `توفي ${deathYear}` : null;
}

export default async function PersonProfilePage({ params }: Props) {
  const { id, personId } = await params;
  const session = await auth();
  const user = session!.user;
  const isSystemAdmin = user.accountType === "SYSTEM_ADMIN";

  const [family, adminAssignment, person] = await Promise.all([
    db.family.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, name: true, slug: true },
    }),
    isSystemAdmin
      ? Promise.resolve(true)
      : db.familyAdminAssignment.findFirst({
          where: { familyId: id, userId: user.id, isActive: true },
          select: { id: true },
        }),
    db.person.findFirst({
      where: { id: personId, familyId: id, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        gender: true,
        isLiving: true,
        birthDate: true,
        deathDate: true,
        biography: true,
        notes: true,
        visibilityLevel: true,
        parentRelations: {
          where: { parent: { deletedAt: null } },
          select: {
            parent: { select: { id: true, fullName: true, gender: true, isLiving: true } },
          },
        },
        childRelations: {
          where: { child: { deletedAt: null } },
          select: {
            child: { select: { id: true, fullName: true, gender: true, isLiving: true } },
          },
        },
        marriagesAsPersonA: {
          where: { deletedAt: null },
          include: {
            personB: { select: { id: true, fullName: true, familyId: true, family: { select: { name: true } } } },
          },
          orderBy: { createdAt: "desc" },
        },
        marriagesAsPersonB: {
          where: { deletedAt: null },
          include: {
            personA: { select: { id: true, fullName: true, familyId: true, family: { select: { name: true } } } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
  ]);

  if (!family || !person) notFound();
  if (!isSystemAdmin && !adminAssignment) notFound();

  const parents = person.parentRelations.map((r) => r.parent);
  const children = person.childRelations.map((r) => r.child);
  const marriages = [
    ...person.marriagesAsPersonA.map((m) => ({
      id: m.id,
      spouse: m.personB,
      marriageDate: m.marriageDate,
      divorceDate: m.divorceDate,
      status: m.status,
    })),
    ...person.marriagesAsPersonB.map((m) => ({
      id: m.id,
      spouse: m.personA,
      marriageDate: m.marriageDate,
      divorceDate: m.divorceDate,
      status: m.status,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/families/${id}`}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="العودة إلى العائلة"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-sm text-muted-foreground">عائلة {family.name}</p>
            <h1 className="text-2xl font-bold text-foreground">{person.fullName}</h1>
          </div>
        </div>
        <Button variant="gold" size="sm" asChild>
          <Link href={`/dashboard/families/${id}/persons/${person.id}/edit`}>
            <Pencil className="ml-1 h-4 w-4" />
            تعديل
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-muted-foreground" />
                الملخص
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={person.gender === "MALE" ? "member" : "private"}>
                  {person.gender === "MALE" ? "ذكر" : "أنثى"}
                </Badge>
                <Badge variant={person.isLiving ? "public" : "private"}>
                  {person.isLiving ? "على قيد الحياة" : "متوفى"}
                </Badge>
                <Badge variant={visibilityLabels[person.visibilityLevel].variant}>
                  {visibilityLabels[person.visibilityLevel].label}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoRow label="الميلاد" value={formatDate(person.birthDate)} />
                <InfoRow label="الوفاة" value={formatDate(person.deathDate)} />
                <InfoRow label="السنوات" value={yearsRange(person.birthDate, person.deathDate, person.isLiving)} />
              </div>

              {person.biography ? (
                <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                  <p className="text-sm leading-7 text-muted-foreground">{person.biography}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">لا توجد نبذة مسجلة.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-muted-foreground" />
                العلاقات المباشرة
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <RelationList title="الوالدان" people={parents} familyId={id} />
              <RelationList title="الأبناء" people={children} familyId={id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="h-4 w-4 text-muted-foreground" />
                الزيجات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {marriages.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد زيجات مسجلة.</p>
              ) : (
                <ul className="space-y-2">
                  {marriages.map((marriage) => {
                    const sameFamily = marriage.spouse.familyId === id;
                    return (
                      <li
                        key={marriage.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
                      >
                        <div>
                          {sameFamily ? (
                            <Link
                              href={`/dashboard/families/${id}/persons/${marriage.spouse.id}`}
                              className="text-sm font-medium text-foreground hover:text-accent"
                            >
                              {marriage.spouse.fullName}
                            </Link>
                          ) : (
                            <p className="text-sm font-medium text-foreground">{marriage.spouse.fullName}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            عائلة {marriage.spouse.family.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {marriage.marriageDate && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              {marriage.marriageDate.getFullYear()}
                            </span>
                          )}
                          <Badge variant={marriage.status === "ACTIVE" ? "public" : "private"}>
                            {marriage.status === "ACTIVE" ? "قائم" : "منتهي"}
                          </Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-muted-foreground" />
                الخصوصية والملاحظات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="مستوى الظهور" value={visibilityLabels[person.visibilityLevel].label} />
              <div>
                <p className="text-xs text-muted-foreground">ملاحظات داخلية</p>
                <p className="mt-1 text-sm leading-6 text-foreground">
                  {person.notes || "لا توجد ملاحظات."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value ?? "غير مسجل"}</p>
    </div>
  );
}

function RelationList({
  title,
  people,
  familyId,
}: {
  title: string;
  people: Array<{ id: string; fullName: string; gender: "MALE" | "FEMALE"; isLiving: boolean }>;
  familyId: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      {people.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد بيانات مسجلة.</p>
      ) : (
        <ul className="space-y-1">
          {people.map((person) => (
            <li key={person.id}>
              <Link
                href={`/dashboard/families/${familyId}/persons/${person.id}`}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted/40"
              >
                <span>{person.fullName}</span>
                <span className="text-xs text-muted-foreground">
                  {person.gender === "MALE" ? "ذكر" : "أنثى"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
