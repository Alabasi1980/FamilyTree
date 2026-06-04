import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import EditPersonForm from "./edit-person-form";
import MarriageManager from "@/components/persons/marriage-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  params: Promise<{ id: string; personId: string }>;
}

export default async function EditPersonPage({ params }: Props) {
  const { id, personId } = await params;
  const session = await auth();
  const user = session!.user;
  const isSystemAdmin = user.accountType === "SYSTEM_ADMIN";

  const [person, adminAssignment] = await Promise.all([
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
      },
    }),
    isSystemAdmin
      ? Promise.resolve(true)
      : db.familyAdminAssignment.findFirst({
          where: { familyId: id, userId: user.id, isActive: true },
        }),
  ]);

  if (!person) notFound();

  const isFamilyAdmin = isSystemAdmin || !!adminAssignment;
  if (!isFamilyAdmin) notFound();

  // Fetch family persons + linked IN_LAW persons + this person's marriages in parallel
  const rawFamilyLinks = await db.familyLink.findMany({
    where: {
      deletedAt: null,
      status: "APPROVED",
      linkType: "IN_LAW",
      OR: [{ familyAId: id }, { familyBId: id }],
    },
    include: {
      familyA: { select: { id: true, name: true } },
      familyB: { select: { id: true, name: true } },
    },
  });

  const inLawLinks = rawFamilyLinks.map((l) => ({
    familyId: l.familyAId === id ? l.familyBId : l.familyAId,
    familyName: l.familyAId === id ? l.familyB.name : l.familyA.name,
  }));
  const inLawFamilyIds = inLawLinks.map((l) => l.familyId);

  const [familyPersons, linkedPersonsRaw, rawMarriages] = await Promise.all([
    db.person.findMany({
      where: { familyId: id, deletedAt: null, id: { not: personId } },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    inLawFamilyIds.length > 0
      ? db.person.findMany({
          where: { familyId: { in: inLawFamilyIds }, deletedAt: null },
          select: { id: true, fullName: true, familyId: true },
          orderBy: { fullName: "asc" },
        })
      : Promise.resolve([] as { id: string; fullName: string; familyId: string }[]),
    db.marriageRelation.findMany({
      where: {
        deletedAt: null,
        OR: [{ personAId: personId }, { personBId: personId }],
      },
      select: { id: true, personAId: true, personBId: true, marriageDate: true, status: true, divorceDate: true },
    }),
  ]);

  const linkedPersonsForManager = linkedPersonsRaw.map((p) => ({
    id: p.id,
    fullName: p.fullName,
    familyName: inLawLinks.find((l) => l.familyId === p.familyId)?.familyName ?? "",
  }));

  // Build name map for marriages display
  const allPersonsMap = new Map<string, string>([
    [person.id, person.fullName],
    ...familyPersons.map((p) => [p.id, p.fullName] as [string, string]),
    ...linkedPersonsRaw.map((p) => [p.id, p.fullName] as [string, string]),
  ]);

  const marriages = rawMarriages.map((m) => ({
    id: m.id,
    personAId: m.personAId,
    personBId: m.personBId,
    personAName: allPersonsMap.get(m.personAId) ?? "؟",
    personBName: allPersonsMap.get(m.personBId) ?? "؟",
    marriageDate: m.marriageDate,
    status: m.status,
    divorceDate: m.divorceDate,
  }));

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/families/${id}`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">تعديل بيانات الفرد</h1>
      </div>
      <EditPersonForm person={person} familyId={id} />

      {/* Marriages for this person */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">زيجات {person.fullName}</CardTitle>
        </CardHeader>
        <CardContent>
          <MarriageManager
            familyId={id}
            persons={familyPersons}
            linkedPersons={linkedPersonsForManager}
            marriages={marriages}
            lockedPersonA={{ id: person.id, fullName: person.fullName }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
