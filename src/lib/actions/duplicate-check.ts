"use server";

import { db } from "@/lib/db";

export interface DuplicateCandidate {
  id: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
  isLiving: boolean;
  birthDate: string | null;
  birthYear: number | null;
  score: number; // 0–100
  reasons: string[];
}

function nameTokens(name: string): string[] {
  return name
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/[ةه]/g, "ه")
    .replace(/ى/g, "ي")
    .split(/\s+/)
    .filter(Boolean);
}

function nameSimilarity(a: string, b: string): number {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (ta.length === 0 || tb.length === 0) return 0;

  // Count shared tokens
  const setB = new Set(tb);
  const shared = ta.filter((t) => setB.has(t)).length;
  const unionSize = new Set([...ta, ...tb]).size;
  return shared / unionSize; // Jaccard similarity
}

export async function findDuplicateCandidates(
  familyId: string,
  fullName: string,
  gender: "MALE" | "FEMALE",
  birthYear?: number,
  excludePersonId?: string
): Promise<DuplicateCandidate[]> {
  if (!fullName.trim() || !familyId) return [];

  const allPersons = await db.person.findMany({
    where: {
      familyId,
      deletedAt: null,
      gender,
      ...(excludePersonId ? { id: { not: excludePersonId } } : {}),
    },
    select: { id: true, fullName: true, gender: true, isLiving: true, birthYear: true, birthDate: true },
  });

  const candidates: DuplicateCandidate[] = [];

  for (const person of allPersons) {
    const reasons: string[] = [];
    let score = 0;

    const similarity = nameSimilarity(fullName, person.fullName);

    // Score: name similarity (0–60 points)
    const namePts = Math.round(similarity * 60);
    score += namePts;
    if (similarity >= 0.8) reasons.push("اسم متطابق تقريباً");
    else if (similarity >= 0.5) reasons.push("تشابه في الاسم");

    // Score: birth year proximity (0–30 points)
    const candidateBirthYear = person.birthYear ?? person.birthDate?.getFullYear() ?? null;
    if (birthYear && candidateBirthYear) {
      const py = candidateBirthYear;
      const diff = Math.abs(py - birthYear);
      if (diff === 0) { score += 30; reasons.push("نفس سنة الميلاد"); }
      else if (diff <= 2) { score += 20; reasons.push("سنة ميلاد قريبة جداً"); }
      else if (diff <= 5) { score += 10; reasons.push("سنة ميلاد قريبة"); }
    }

    // Only include if score is meaningful
    if (score >= 35) {
      candidates.push({
        id: person.id,
        fullName: person.fullName,
        gender: person.gender,
        isLiving: person.isLiving,
        birthDate: person.birthDate?.toISOString() ?? null,
        birthYear: candidateBirthYear,
        score: Math.min(score, 100),
        reasons,
      });
    }
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, 5);
}
