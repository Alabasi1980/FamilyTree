import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import { FamilyBuilder } from "@/components/persons/family-builder";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ focus?: string }>;
}

export default async function BuildFamilyPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { focus } = await searchParams;

  const session = await auth();
  if (!session?.user) redirect(withBasePath("/login"));

  const isSystemAdmin = session.user.accountType === "SYSTEM_ADMIN";

  const family = await db.family.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!family) notFound();

  const canManage =
    isSystemAdmin ||
    !!(await db.familyAdminAssignment.findFirst({
      where: { familyId: id, userId: session.user.id, isActive: true },
    }));
  if (!canManage) notFound();

  const persons = await db.person.findMany({
    where: { familyId: id, deletedAt: null },
    select: { id: true, fullName: true, gender: true, isLiving: true, birthDate: true },
    orderBy: { createdAt: "asc" },
  });

  const personIds = persons.map((p) => p.id);

  const [relations, marriages] = await Promise.all([
    personIds.length
      ? db.parentChildRelation.findMany({
          where: { parentPersonId: { in: personIds }, childPersonId: { in: personIds } },
          select: { parentPersonId: true, childPersonId: true },
        })
      : Promise.resolve([]),
    personIds.length
      ? db.marriageRelation.findMany({
          where: {
            deletedAt: null,
            OR: [{ personAId: { in: personIds } }, { personBId: { in: personIds } }],
          },
          select: { id: true, personAId: true, personBId: true },
        })
      : Promise.resolve([]),
  ]);

  return (
    <FamilyBuilder
      familyId={family.id}
      familyName={family.name}
      initialPersons={persons.map((p) => ({
        id: p.id,
        fullName: p.fullName,
        gender: p.gender,
        isLiving: p.isLiving,
        birthYear: p.birthDate ? new Date(p.birthDate).getFullYear() : null,
      }))}
      initialRelations={relations}
      initialMarriages={marriages}
      initialFocusId={focus ?? null}
    />
  );
}
