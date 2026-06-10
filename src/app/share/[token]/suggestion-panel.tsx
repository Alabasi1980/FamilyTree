"use client";

import { useState, useTransition } from "react";
import { X, UserPlus, Edit3, ChevronDown, ChevronUp, Loader2, CheckCircle2, MessageSquarePlus } from "lucide-react";
import { submitGuestSuggestion } from "@/lib/actions/guest-suggestions";

interface Person {
  id: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
}

interface Props {
  shareToken: string;
  persons: Person[];
  familyName: string;
}

type Mode = "idle" | "add_person" | "edit_person";

export default function SuggestionPanel({ shareToken, persons, familyName }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Guest identity
  const [guestName, setGuestName] = useState("");
  const [guestContact, setGuestContact] = useState("");

  // Add-person fields
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [isLiving, setIsLiving] = useState(true);
  const [birthYear, setBirthYear] = useState("");
  const [deathYear, setDeathYear] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [profession, setProfession] = useState("");
  const [notes, setNotes] = useState("");
  const [relatedPersonId, setRelatedPersonId] = useState("");
  const [relatedPersonRole, setRelatedPersonRole] = useState<"parent" | "child" | "spouse">("child");

  // Edit-person fields
  const [editTargetId, setEditTargetId] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editGender, setEditGender] = useState<"MALE" | "FEMALE">("MALE");
  const [editIsLiving, setEditIsLiving] = useState(true);
  const [editBirthYear, setEditBirthYear] = useState("");
  const [editDeathYear, setEditDeathYear] = useState("");
  const [editBirthPlace, setEditBirthPlace] = useState("");
  const [editProfession, setEditProfession] = useState("");
  const [editNotes, setEditNotes] = useState("");

  function resetForms() {
    setMode("idle");
    setError("");
    setFullName(""); setGender("MALE"); setIsLiving(true);
    setBirthYear(""); setDeathYear(""); setBirthPlace(""); setProfession(""); setNotes("");
    setRelatedPersonId(""); setRelatedPersonRole("child");
    setEditTargetId(""); setEditFullName(""); setEditGender("MALE"); setEditIsLiving(true);
    setEditBirthYear(""); setEditDeathYear(""); setEditBirthPlace(""); setEditProfession(""); setEditNotes("");
  }

  function selectEditTarget(personId: string) {
    const p = persons.find((x) => x.id === personId);
    if (!p) return;
    setEditTargetId(personId);
    setEditFullName(p.fullName);
    setEditGender(p.gender);
    setEditIsLiving(true);
    setEditBirthYear(""); setEditDeathYear(""); setEditBirthPlace(""); setEditProfession(""); setEditNotes("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      let result;

      if (mode === "add_person") {
        result = await submitGuestSuggestion({
          shareToken,
          guestName: guestName.trim() || undefined,
          guestContact: guestContact.trim() || undefined,
          requestType: "ADD_PERSON",
          payload: {
            fullName: fullName.trim(),
            gender,
            isLiving,
            birthYear: birthYear ? Number(birthYear) : undefined,
            deathYear: deathYear ? Number(deathYear) : undefined,
            birthPlace: birthPlace.trim() || undefined,
            profession: profession.trim() || undefined,
            notes: notes.trim() || undefined,
            relatedPersonId: relatedPersonId || undefined,
            relatedPersonRole: relatedPersonId ? relatedPersonRole : undefined,
          },
        });
      } else {
        result = await submitGuestSuggestion({
          shareToken,
          guestName: guestName.trim() || undefined,
          guestContact: guestContact.trim() || undefined,
          requestType: "EDIT_PERSON",
          payload: {
            targetPersonId: editTargetId,
            fullName: editFullName.trim(),
            gender: editGender,
            isLiving: editIsLiving,
            birthYear: editBirthYear ? Number(editBirthYear) : undefined,
            deathYear: editDeathYear ? Number(editDeathYear) : undefined,
            birthPlace: editBirthPlace.trim() || undefined,
            profession: editProfession.trim() || undefined,
            notes: editNotes.trim() || undefined,
          },
        });
      }

      if (result.success) {
        setSubmitted(true);
        setTimeout(() => { setSubmitted(false); setOpen(false); resetForms(); }, 3000);
      } else {
        setError(result.error ?? "حدث خطأ");
      }
    });
  }

  return (
    <div className="fixed bottom-5 left-5 z-50" dir="rtl">
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-4 py-2.5 shadow-lg hover:bg-accent/90 transition-all text-sm font-medium"
        >
          <MessageSquarePlus className="h-4 w-4" />
          اقتراح تعديل
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="w-80 rounded-xl border border-border/60 bg-card shadow-2xl shadow-black/40 flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 shrink-0">
            <h3 className="text-sm font-semibold text-foreground">اقتراح تعديل — {familyName}</h3>
            <button onClick={() => { setOpen(false); resetForms(); }} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-secondary/50">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Success state */}
          {submitted ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="text-sm font-medium text-foreground">تم إرسال اقتراحك بنجاح!</p>
              <p className="text-xs text-muted-foreground">سيراجعه مسؤول العائلة قريباً.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Guest identity */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">معلوماتك (اختياري)</p>
                <input
                  type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)}
                  placeholder="اسمك"
                  className="w-full text-xs px-2.5 py-1.5 rounded border border-border/60 bg-secondary/20 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60"
                />
                <input
                  type="text" value={guestContact} onChange={(e) => setGuestContact(e.target.value)}
                  placeholder="بريدك أو رقم هاتفك (للمتابعة)"
                  className="w-full text-xs px-2.5 py-1.5 rounded border border-border/60 bg-secondary/20 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60"
                />
              </div>

              <div className="border-t border-border/30" />

              {/* Mode selection */}
              {mode === "idle" && (
                <div className="space-y-2">
                  <div className="rounded-lg bg-muted/30 border border-border/30 px-3 py-2.5 text-[11px] text-muted-foreground leading-relaxed space-y-1">
                    <p>اقتراحاتك تُراجع من قِبل مسؤول عائلة <span className="font-medium text-foreground">{familyName}</span> وتُطبَّق بعد موافقته.</p>
                    <p className="text-[10px]">لن تظهر أي تغييرات في الشجرة حتى تتم الموافقة.</p>
                  </div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">نوع الاقتراح</p>
                  <button
                    onClick={() => setMode("add_person")}
                    className="w-full flex items-center gap-3 rounded-lg border border-border/50 bg-card/60 px-3 py-2.5 text-right hover:bg-secondary/50 transition-colors"
                  >
                    <UserPlus className="h-4 w-4 text-accent shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-foreground">إضافة فرد جديد</p>
                      <p className="text-[10px] text-muted-foreground">اقترح إضافة شخص غير موجود في الشجرة</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setMode("edit_person")}
                    className="w-full flex items-center gap-3 rounded-lg border border-border/50 bg-card/60 px-3 py-2.5 text-right hover:bg-secondary/50 transition-colors"
                  >
                    <Edit3 className="h-4 w-4 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-foreground">تعديل بيانات فرد موجود</p>
                      <p className="text-[10px] text-muted-foreground">اقترح تصحيح بيانات شخص في الشجرة</p>
                    </div>
                  </button>
                </div>
              )}

              {/* Add-person form */}
              {mode === "add_person" && (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setMode("idle")} className="text-muted-foreground hover:text-foreground">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <p className="text-xs font-semibold text-foreground">إضافة فرد جديد</p>
                  </div>

                  <input
                    required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="الاسم الكامل *"
                    className="w-full text-xs px-2.5 py-1.5 rounded border border-border/60 bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60"
                  />

                  <div className="flex gap-2 text-xs">
                    {(["MALE", "FEMALE"] as const).map((g) => (
                      <button key={g} type="button" onClick={() => setGender(g)}
                        className={`flex-1 py-1 rounded border transition-colors ${gender === g ? (g === "MALE" ? "border-blue-500/60 bg-blue-500/10 text-blue-400" : "border-rose-500/60 bg-rose-500/10 text-rose-400") : "border-border text-muted-foreground hover:border-border/80"}`}
                      >{g === "MALE" ? "ذكر" : "أنثى"}</button>
                    ))}
                  </div>

                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={!isLiving} onChange={(e) => setIsLiving(!e.target.checked)} className="w-3 h-3" />
                    <span className="text-muted-foreground">متوفى</span>
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)}
                      placeholder="سنة الميلاد"
                      className="text-xs px-2 py-1.5 rounded border border-border/60 bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60" />
                    <input type="number" value={deathYear} onChange={(e) => setDeathYear(e.target.value)}
                      placeholder="سنة الوفاة"
                      className="text-xs px-2 py-1.5 rounded border border-border/60 bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60" />
                  </div>

                  <input type="text" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder="مكان الميلاد"
                    className="w-full text-xs px-2.5 py-1.5 rounded border border-border/60 bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60" />

                  <input type="text" value={profession} onChange={(e) => setProfession(e.target.value)}
                    placeholder="المهنة"
                    className="w-full text-xs px-2.5 py-1.5 rounded border border-border/60 bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60" />

                  {/* Optional: link to existing person */}
                  {persons.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-muted-foreground">صلته بفرد موجود (اختياري)</p>
                      <select
                        value={relatedPersonId} onChange={(e) => setRelatedPersonId(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-border/60 bg-card text-foreground outline-none focus:border-primary/60"
                      >
                        <option value="">— اختر شخصاً —</option>
                        {persons.map((p) => (
                          <option key={p.id} value={p.id}>{p.fullName}</option>
                        ))}
                      </select>
                      {relatedPersonId && (
                        <div className="flex gap-1 text-[10px]">
                          {(["parent", "child", "spouse"] as const).map((r) => (
                            <button key={r} type="button" onClick={() => setRelatedPersonRole(r)}
                              className={`flex-1 py-1 rounded border transition-colors ${relatedPersonRole === r ? "border-primary/60 bg-primary/10 text-foreground" : "border-border text-muted-foreground"}`}
                            >
                              {r === "parent" ? "والده" : r === "child" ? "ابنه" : "زوجه"}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="ملاحظات إضافية..."
                    rows={2}
                    className="w-full text-xs px-2.5 py-1.5 rounded border border-border/60 bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 resize-none"
                  />

                  {error && <p className="text-xs text-destructive">{error}</p>}

                  <button type="submit" disabled={isPending || !fullName.trim()}
                    className="w-full text-xs py-2 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                    إرسال الاقتراح
                  </button>
                </form>
              )}

              {/* Edit-person form */}
              {mode === "edit_person" && (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setMode("idle")} className="text-muted-foreground hover:text-foreground">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <p className="text-xs font-semibold text-foreground">تعديل بيانات فرد</p>
                  </div>

                  <select
                    value={editTargetId} onChange={(e) => selectEditTarget(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded border border-border/60 bg-card text-foreground outline-none focus:border-primary/60"
                    required
                  >
                    <option value="">— اختر الشخص المراد تعديله —</option>
                    {persons.map((p) => (
                      <option key={p.id} value={p.id}>{p.fullName}</option>
                    ))}
                  </select>

                  {editTargetId && (
                    <>
                      <input
                        required type="text" value={editFullName} onChange={(e) => setEditFullName(e.target.value)}
                        placeholder="الاسم الكامل *"
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-border/60 bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60"
                      />

                      <div className="flex gap-2 text-xs">
                        {(["MALE", "FEMALE"] as const).map((g) => (
                          <button key={g} type="button" onClick={() => setEditGender(g)}
                            className={`flex-1 py-1 rounded border transition-colors ${editGender === g ? (g === "MALE" ? "border-blue-500/60 bg-blue-500/10 text-blue-400" : "border-rose-500/60 bg-rose-500/10 text-rose-400") : "border-border text-muted-foreground"}`}
                          >{g === "MALE" ? "ذكر" : "أنثى"}</button>
                        ))}
                      </div>

                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={!editIsLiving} onChange={(e) => setEditIsLiving(!e.target.checked)} className="w-3 h-3" />
                        <span className="text-muted-foreground">متوفى</span>
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" value={editBirthYear} onChange={(e) => setEditBirthYear(e.target.value)}
                          placeholder="سنة الميلاد"
                          className="text-xs px-2 py-1.5 rounded border border-border/60 bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60" />
                        <input type="number" value={editDeathYear} onChange={(e) => setEditDeathYear(e.target.value)}
                          placeholder="سنة الوفاة"
                          className="text-xs px-2 py-1.5 rounded border border-border/60 bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60" />
                      </div>

                      <input type="text" value={editBirthPlace} onChange={(e) => setEditBirthPlace(e.target.value)}
                        placeholder="مكان الميلاد"
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-border/60 bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60" />

                      <input type="text" value={editProfession} onChange={(e) => setEditProfession(e.target.value)}
                        placeholder="المهنة"
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-border/60 bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60" />

                      <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="ملاحظات / سبب التعديل"
                        rows={2}
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-border/60 bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 resize-none"
                      />
                    </>
                  )}

                  {error && <p className="text-xs text-destructive">{error}</p>}

                  <button type="submit" disabled={isPending || !editTargetId || !editFullName.trim()}
                    className="w-full text-xs py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Edit3 className="h-3.5 w-3.5" />}
                    إرسال الاقتراح
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
