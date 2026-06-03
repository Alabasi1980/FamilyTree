import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import EditPersonForm from "./edit-person-form";

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
    </div>
  );
}
