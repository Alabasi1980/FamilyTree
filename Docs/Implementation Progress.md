# حالة تنفيذ إصلاحات Last Review.md

**آخر تحديث:** 7 يونيو 2026  
**المرجع:** `Docs/Last Review.md` و `C:\Users\Fares\.claude\plans\compiled-crafting-panda.md`

---

## ✅ الدفعة 1 — منجزة بالكامل (بدون تغيير Schema)

### الملفات الجديدة المنشأة

| الملف | الوصف | الحالة |
|-------|-------|--------|
| `app/src/lib/domain/family-rules/index.ts` | تعريف نوع `ValidationResult` + دوال مساعدة `allowed()` / `prohibited()` / `insufficientData()` | ✅ منجز |
| `app/src/lib/domain/family-rules/marriage-validators.ts` | ثلاثة validators للزواج (انظر تفاصيل أدناه) | ✅ منجز |
| `app/src/lib/domain/family-rules/gender-validators.ts` | validator لمنع تغيير الجنس الخطر | ✅ منجز |

### الملفات المعدلة

| الملف | التغيير | الحالة |
|-------|---------|--------|
| `app/src/lib/actions/marriages.ts` | استبدال فحص التكرار القديم بـ validators الجديدة، إضافة فحص حد الزوجات والجمع بين الأختين | ✅ منجز |
| `app/src/lib/actions/persons.ts` | إصلاح `createPersonAsSpouseOf` + إصلاح `updatePerson` + إضافة transactions | ✅ منجز |
| `app/src/lib/actions/branch-unification.ts` | منع الوالد الوهمي + transaction كاملة في `applyBranchUnification` | ✅ منجز |

---

## تفاصيل كل إصلاح

### 1. `marriage-validators.ts` — ثلاثة validators

**`validateRemarriage(personAId, personBId, db)`**
- يفحص وجود زواج `ACTIVE` فقط (وليس كل السجلات غير المحذوفة)
- يسمح بإعادة الزواج بعد أن ينتهي الزواج السابق (`ENDED`)
- يستبدل الفحص القديم في `marriages.ts` الذي كان يمنع إعادة الزواج مطلقاً

**`validateActiveMarriageLimits(personAId, personBId, db)`**
- يفحص عدد الزوجات `ACTIVE` للرجل (يجب أن يكون < 4)
- يفحص أن المرأة لا تملك زوجاً `ACTIVE` آخر
- يُستدعى في `addMarriage()` بعد فحص المحارم

**`validateConcurrentMarriageCombination(maleId, newFemaleId, db)`**
- يجلب الزوجات النشطات للرجل
- لكل زوجة حالية، يفحص إذا كانت الزوجة الجديدة محرمًا عليها بالنسب
- يستخدم دالة `areBloodMahram()` الداخلية (تعكس منطق `isMahram` في `marriages.ts`)
- يمنع الجمع بين الأختين وكل المحارم بالنسب

---

### 2. `gender-validators.ts` — validator واحد

**`validateGenderChange(personId, newGender, db)`**
- إذا كان الشخص والداً لأبناء: يفحص إذا كان هناك والد/ة من نفس الجنس الجديد لأحد الأبناء
- إذا كان لديه زيجات نشطة: يفحص إذا كان تغيير الجنس سيُنشئ زواجاً بين نفس الجنس

---

### 3. إصلاحات `marriages.ts`

تسلسل الفحوصات الجديد في `addMarriage()`:
1. فحص نفس الشخص (موجود)
2. فحص وجود الأشخاص (موجود)
3. فحص الجنس المختلف (موجود)
4. فحص الصلاحيات (موجود)
5. فحص المحارم `isMahram()` (موجود)
6. **جديد:** `validateRemarriage()` — يسمح بإعادة الزواج بعد الطلاق
7. **جديد:** `validateActiveMarriageLimits()` — حد 4 زوجات للرجل، 1 للمرأة
8. **جديد:** `validateConcurrentMarriageCombination()` — منع الجمع بين الأختين

---

### 4. إصلاحات `persons.ts`

**`createPersonAsSpouseOf`** (السطور ~548-620):
- ✅ إضافة فحص مبكر لحد الزوجات قبل إنشاء الشخص الجديد
- ✅ إصلاح `isLiving: person.isLiving` → `isLiving: true`
- ✅ لف الإنشاء + الـ PersonAncestry + الزواج في `db.$transaction()`

**`updatePerson`** (السطور ~387-460):
- ✅ إضافة فحص `validateGenderChange()` إذا تغير الجنس

**`createPersonAsChildOf`** (السطور ~480-515):
- ✅ لف `person.create` + `parentChildRelation.create` في `db.$transaction()`

**`createPersonAsParentOf`** (السطور ~517-570):
- ✅ لف `person.create` + `parentChildRelation.create` في `db.$transaction()`

**ملاحظة:** `recomputeFamilyAncestry` تُستدعى بعد الـ transaction (وليس داخلها) لأنها تستخدم `db.$transaction([...])` الداخلية الخاصة بها.

---

### 5. إصلاحات `branch-unification.ts`

**`applyBranchUnification`**:
- ✅ منع إنشاء "والد مشترك" / "والدة مشتركة" بأسماء افتراضية
- ✅ إذا كان اسم الوالد/الوالدة مطلوباً ولم يُقدَّم → يُرجع خطأ واضح
- ✅ لف جميع عمليات الكتابة في `db.$transaction()` واحدة: نقل الأشخاص + إنشاء الوالدين + ربطهم + تحديث حالة الطلب
- ✅ `recomputeFamilyAncestry` تُستدعى بعد الـ transaction

---

## ✅ الدفعة 2 — منجزة جزئياً (تغييرات Schema)

### 1. إضافة `relationType` إلى `ParentChildRelation` ✅ منجز

**آخر تحديث:** 9 يونيو 2026

**ما تم:**
- إضافة enum `ParentChildRelationType` (BIOLOGICAL, STEP, GUARDIANSHIP, ADOPTIVE, UNKNOWN)
- إضافة حقل `relationType` على `ParentChildRelation` بافتراضي `BIOLOGICAL`
- Migration: `20260609000000_add_parent_relation_type`
- تحديث `recomputeFamilyAncestry()` لبناء جدول الأسلاف من BIOLOGICAL فقط
- تحديث `isMahram()` في `marriages.ts` لفلترة BIOLOGICAL في استعلامات الإخوة/الأعمام/الأبناء
- تحديث `areBloodMahram()` في `marriage-validators.ts` بنفس الفلترة

**الأثر الفقهي:** المتبنى والمكفول لا يُعدّان محارم بالنسب — فقط العلاقات البيولوجية تدخل في حسابات المحارم.

**ملاحظة للمستقبل:** عندما تُضاف واجهة لاختيار نوع العلاقة، ستحتاج `validateParentSlot()` و`validateNewParentSlot()` تعديلاً لتقبل والدَيْن بيولوجيَيْن + والد/ة من نوع آخر.

---

### 2. إصلاح Unique Constraint للزواج ⏳ لم يبدأ

منع (A,B) و(B,A) معاً على مستوى قاعدة البيانات.

### 3. إضافة `endReason` إلى `MarriageRelation` ⏳ لم يبدأ

```prisma
enum MarriageEndReason { DIVORCE, DEATH_OF_SPOUSE, ANNULMENT, UNKNOWN }
```

---

## ✅ الدفعة 2 — مكتملة بالكامل (تغييرات Schema)

### 2. إصلاح Unique Constraint للزواج ✅ منجز

**آخر تحديث:** 9 يونيو 2026

**ما تم:**
- حذف `@@unique([personAId, personBId])` من `MarriageRelation` (كان يمنع إعادة الزواج بعد الطلاق)
- استبداله بـ Partial Unique Index عبر Raw SQL:
  ```sql
  CREATE UNIQUE INDEX "MarriageRelation_active_pair_unique"
    ON "MarriageRelation" (LEAST("personAId","personBId"), GREATEST("personAId","personBId"))
    WHERE "deletedAt" IS NULL AND "status" = 'ACTIVE';
  ```
- يمنع زوجَيْن نشطَيْن لنفس الزوجين، مع السماح بإعادة الزواج بعد `ENDED`
- تطبيع الترتيب في `addMarriage()`: `const [normalizedA, normalizedB] = [personAId, personBId].sort()`
- Migration: `20260609010000_marriage_end_reason_and_unique`

### 3. إضافة `endReason` إلى `MarriageRelation` ✅ منجز

- إضافة enum `MarriageEndReason` (DIVORCE, DEATH_OF_SPOUSE, ANNULMENT, UNKNOWN)
- `divorceMarriage()` تقبل الآن `endReason` اختياري بدلاً من قيمة ثابتة

---

## ✅ الدفعة 3 — منجزة بالكامل (Workflows الزواج العابر للعائلتين + درجات الثقة)

**آخر تحديث:** 9 يونيو 2026

### الملفات المعدلة

| الملف | التغيير | الحالة |
|-------|---------|--------|
| `app/prisma/schema.prisma` | إضافة `RelationConfidence` enum + `CrossFamilyMarriageStatus` enum + نموذج `CrossFamilyMarriageRequest` + حقل `confidence` على `MarriageRelation` و`ParentChildRelation` + حقول Revocation على `MarriageRelation` | ✅ منجز |
| `app/src/lib/actions/marriages.ts` | منع الزواج المباشر بين شخصَيْن من عائلتين مختلفتين + توجيه للمسار الجديد | ✅ منجز |
| `app/src/lib/actions/cross-family-marriages.ts` | ملف جديد — 4 Server Actions | ✅ منجز |
| `app/src/lib/domain/family-rules/marriage-validators.ts` | تحديث `areBloodMahram` لإرجاع `MAHRAM / NOT_MAHRAM / UNCERTAIN` + معالجة العلاقات غير الموثقة | ✅ منجز |

---

### تفاصيل Schema Batch 3

**الحقول المضافة على `MarriageRelation`:**
- `confidence RelationConfidence @default(VERIFIED)` — درجة التوثيق
- `crossFamilyRequestId String?` — رابط لطلب الزواج العابر الذي أنشأ هذا الزواج
- `revokedAt DateTime?` — تاريخ إلغاء الزواج
- `revokedByUserId String?` — مَن ألغى الزواج
- `revocationReason String?` — سبب الإلغاء
- `supersededById String?` — Self-referential FK لسجل زواج لاحق يحل محله

**الحقل المضاف على `ParentChildRelation`:**
- `confidence RelationConfidence @default(VERIFIED)` — درجة توثيق علاقة النسب

**النموذج الجديد `CrossFamilyMarriageRequest`:**
- يدعم workflow الموافقة المزدوجة (كلتا العائلتين يوافقان)
- Status: `PENDING_FAMILY_A | PENDING_FAMILY_B | APPROVED | REJECTED | CANCELLED | APPLIED`
- عند تطبيق الطلب (APPLIED) يُنشأ `MarriageRelation` مرتبط بـ `crossFamilyRequestId`
- Migration: `20260609020000_batch3_confidence_cross_family`

---

### تفاصيل Server Actions الجديدة (`cross-family-marriages.ts`)

**`submitCrossMarriageRequest(personAId, personBId, options?)`**
- يتحقق أن الشخصين من عائلتَيْن مختلفتَيْن
- يتحقق من الجنس المختلف والأشخاص غير المحذوفين
- المقدِّم يعتمد عائلته تلقائياً → status = `PENDING_FAMILY_B` دائماً
- يمنع تكرار الطلبات المعلقة للزوجَيْن نفسَيْهما

**`reviewCrossMarriageRequest(requestId, approve, reason?)`**
- يتحقق أن المُراجِع يدير العائلة المعلقة (الطرف الثاني)
- رفض: → status = `REJECTED` مع سبب اختياري
- موافقة: → status = `APPROVED` + تلقائياً يستدعي `applyCrossMarriageRequest`

**`applyCrossMarriageRequest(requestId)`**
- يتحقق أن status = `APPROVED` ولم يُطبَّق مسبقاً
- يُنشئ `MarriageRelation` مع `crossFamilyRequestId`
- يُحدّث status → `APPLIED` في نفس الـ transaction
- يمكن استدعاؤه يدوياً من System Admin في حال فشل التطبيق التلقائي

**`cancelCrossMarriageRequest(requestId)`**
- يتيح للمُقدِّم أو أي من مديري العائلتَيْن الإلغاء
- فقط للطلبات في حالة `PENDING_*` أو `APPROVED`

---

### سياسة درجات الثقة في Validators

`areBloodMahram()` (في `marriage-validators.ts`) تُرجع الآن قيمة ثلاثية:

| النتيجة | المعنى |
|---------|--------|
| `MAHRAM` | مسار محارم مؤكد عبر علاقات VERIFIED/LIKELY |
| `NOT_MAHRAM` | لا مسار محارم وكل العلاقات موثوقة |
| `UNCERTAIN` | لا مسار مؤكد لكن توجد علاقات UNVERIFIED/DISPUTED قد تخفي صلة |

**تأثير على `validateConcurrentMarriageCombination`:**
- `MAHRAM` → `PROHIBITED` (الجمع محرم)
- `UNCERTAIN` → `INSUFFICIENT_DATA` (blocking — يتطلب توثيق النسب أولاً)
- `NOT_MAHRAM` → `ALLOWED`

---

---

## ✅ الدفعة 4 — منجزة (ضوابط التواريخ + المصاهرة + حالة الزواج التلقائية)

**آخر تحديث:** 9 يونيو 2026

### الملفات الجديدة

| الملف | الوصف |
|-------|-------|
| `app/src/lib/domain/family-rules/chronology-validators.ts` | 4 validators للتواريخ |
| `app/src/lib/domain/family-rules/affinity-validators.ts` | validator المحرمات بالمصاهرة (4 حالات) |

### التواريخ والأعمار (`chronology-validators.ts`)

**`validatePersonChronology(data)`** — يُستدعى في `createPerson` و`updatePerson`:
- **PROHIBITED**: وفاة قبل ميلاد (تاريخ أو سنة)
- **WARNING**: تعارض بين `birthDate` و`birthYear`

**`validateParentChildChronology(parentId, childId, db)`** — يُستدعى في `addParentChildRelation`:
- **PROHIBITED**: الوالد أصغر من الطفل
- **PROHIBITED**: الوالد توفي قبل ميلاد الطفل
- **WARNING**: فارق العمر أقل من 12 سنة

**`validateMarriageChronology(personAId, personBId, marriageDate, divorceDate, db)`** — يُستدعى في `addMarriage`:
- **PROHIBITED**: زواج قبل ميلاد أحد الطرفين
- **PROHIBITED**: زواج بعد وفاة أحد الطرفين
- **WARNING**: زواج وعمر الشخص أقل من 12 سنة

**`validateDivorceChronology(marriageId, divorceDate, db)`** — يُستدعى في `divorceMarriage`:
- **PROHIBITED**: تاريخ انتهاء الزواج قبل تاريخ الزواج

### المحرمات بالمصاهرة (`affinity-validators.ts`)

**`validateAffinityMahram(personAId, personBId, db)`** — يُستدعى في `addMarriage` بعد `isMahram`:

| الحالة | الكود | الحكم |
|--------|-------|-------|
| زوجة الأب (الاستفراش) | `AFFINITY_STEPMOTHER` | PROHIBITED دائماً |
| زوجة الابن | `AFFINITY_DAUGHTER_IN_LAW` | PROHIBITED دائماً |
| أم الزوجة | `AFFINITY_MOTHER_IN_LAW` | PROHIBITED من مجرد العقد |
| الربيبة (بنت الزوجة) | `AFFINITY_STEPDAUGHTER` | PROHIBITED محافظاً |

جميع الحالات تغطي الزيجات السابقة (ENDED) أيضاً — التحريم دائم لا ينتهي بانتهاء الزواج.

### حالة الزواج التلقائية

في `addMarriage()`: إذا كان كلا الطرفين `isLiving: false` → يُنشأ الزواج بـ `status: "HISTORICAL"` بدلاً من `"ACTIVE"`.

---

## ✅ الدفعة 5 — منجزة (الرضاعة)

**آخر تحديث:** 9 يونيو 2026

### Schema: نموذج FosterRelation

```prisma
model FosterRelation {
  childPersonId         String
  nursingMotherPersonId String
  nursingFatherId       String?   -- أب الرضاعة (زوج الأم المرضعة)
  confidence            FosterRelationConfidence @default(DOCUMENTED)
  ...
  @@unique([childPersonId, nursingMotherPersonId])
}
enum FosterRelationConfidence { DOCUMENTED, LIKELY, UNDOCUMENTED }
```

Migration: `20260609030000_batch5_foster_relation`

### `nursing-validators.ts`

**`validateNursingMahram(personAId, personBId, db)`** — يُستدعى في `addMarriage`:
- يفحص علاقات الرضاعة في الاتجاهين
- يحرم: الأم والأب من الرضاعة وأصولهما
- يحرم: الأخوة/الأخوات من الرضاعة (رضعوا من نفس المرضعة أو أبناؤها البيولوجيون)
- علاقة `UNDOCUMENTED` → `INSUFFICIENT_DATA` (يمنع الزواج ويطلب التوثيق)

---

## ✅ الدفعة 6 — منجزة (تحليل تأثير توحيد الفروع)

**آخر تحديث:** 9 يونيو 2026

### `analyzeBranchUnificationImpact(requestId)`

دالة استعلام جديدة في `branch-unification.ts` تُرجع:
- **`movingPersons`**: قائمة الأشخاص الذين سيُنقلون (الهدف + كل نسله)
- **`crossFamilyMarriages`**: الزيجات التي ستصبح عابرة للعائلتين بعد النقل
- **`crossFamilyParentLinks`**: علاقات الأبوة التي ستصبح عابرة للعائلتين
- **`sharedParentsToCreate`**: الوالدان المشتركان الذين سيُنشآن
- **`summary.hasWarnings`**: علامة تنبيه إذا كان هناك علاقات ستتأثر

الاستخدام: يُستدعى من الواجهة قبل تأكيد عملية التوحيد، يُظهر للمسؤول كل التبعات قبل الموافقة.

---

---

## ✅ الدفعة 7 — منجزة (الرضاعة + تدقيق البيانات + isMahram confidence)

**آخر تحديث:** 9 يونيو 2026

### الملفات الجديدة

| الملف | الوصف |
|-------|-------|
| `app/src/lib/actions/foster-relations.ts` | 4 Server Actions لإدارة علاقات الرضاعة |
| `app/src/lib/actions/data-audit.ts` | محرك تدقيق البيانات — يكشف 12 نوع انتهاك |

### Server Actions للرضاعة (`foster-relations.ts`)

**`addFosterRelation(input)`** — يضيف علاقة رضاعة:
- يتحقق أن الأم المرضعة أنثى وأن الأب الرضاعي ذكر
- يمنع التكرار لنفس الزوج (childPersonId + nursingMotherPersonId)
- يدعم confidence: `DOCUMENTED | LIKELY | UNDOCUMENTED`

**`removeFosterRelation(id)`** — حذف ناعم (soft-delete)

**`updateFosterRelationConfidence(id, confidence, notes?)`** — تحديث درجة التوثيق

**`getFosterRelationsForPerson(personId)`** — جلب علاقات الرضاعة لشخص (كمُرضَع أو كأم مرضعة)

### تحديث `isMahram()` في `marriages.ts`

`isMahram()` تُرجع الآن `"MAHRAM" | "UNCERTAIN" | "NOT_MAHRAM"` بدلاً من `boolean`:
- علاقات `UNVERIFIED/DISPUTED` → `UNCERTAIN` → يُمنع الزواج مع رسالة "يرجى توثيق علاقات النسب أولاً"
- متسقة مع `areBloodMahram()` في الـ validators

### محرك تدقيق البيانات (`data-audit.ts`)

**`auditFamilyData(familyId)`** — يكشف 12 نوع من الانتهاكات:

| الكود | الخطورة | الوصف |
|-------|---------|-------|
| `FEMALE_MULTIPLE_ACTIVE_HUSBANDS` | CRITICAL | امرأة لها أكثر من زوج نشط |
| `MALE_EXCEEDS_WIFE_LIMIT` | CRITICAL | رجل له أكثر من 4 زوجات نشطات |
| `TOO_MANY_BIOLOGICAL_PARENTS` | CRITICAL | شخص له أكثر من والدَيْن بيولوجيَّيْن |
| `SAME_GENDER_BIOLOGICAL_PARENTS` | CRITICAL | والدان بيولوجيان من نفس الجنس |
| `DUPLICATE_ACTIVE_MARRIAGE` | CRITICAL | زوجان نشطان لنفس الزوجين |
| `ANCESTRY_CYCLE` | CRITICAL | دورة في النسب |
| `DEATH_BEFORE_BIRTH` | HIGH | وفاة قبل الميلاد |
| `PARENT_YOUNGER_THAN_CHILD` | HIGH | والد أصغر من ابنه |
| `PARENT_DIED_BEFORE_CHILD_BORN` | HIGH | والد توفي قبل ميلاد ابنه |
| `DIVORCE_BEFORE_MARRIAGE` | HIGH | طلاق قبل تاريخ الزواج |
| `ALIVE_WITH_DEATH_DATE` | MEDIUM | حي مع تاريخ وفاة |
| `ACTIVE_MARRIAGE_BOTH_DECEASED` | MEDIUM | زواج نشط بين متوفيَّيْن |
| `MISSING_ANCESTRY_SELF_RECORD` | MEDIUM | سجل PersonAncestry مفقود |

**`auditAllFamilies()`** — للـ SYSTEM_ADMIN: يُشغّل التدقيق على جميع العائلات ويرتّب النتائج حسب الخطورة.

---

## ✅ الدفعة 8 — منجزة (الحقول الإلزامية لإضافة الأشخاص)

**آخر تحديث:** 9 يونيو 2026

### القرار المعتمد

الحقول الإلزامية في جميع مسارات الإضافة:

- **`fullName`** — حرفان على الأقل (200 حرف كحد أقصى)
- **`gender`** — MALE أو FEMALE (مطلوب صريحاً أو مُستنتَج تلقائياً في مسار الزوج)
- **`isLiving`** — حالة الحياة (مع قيمة افتراضية ذكية per context — لا إجبار على التاريخ)

لا يُفرض `birthYear` أو أي تاريخ — الشجرة تخدم أجياراً تاريخية بدون تواريخ.

### التغييرات في `app/src/lib/actions/persons.ts`

| الدالة | التغيير |
| --- | --- |
| `createPersonAsChildOf` | `isLiving?` مضاف كمعامل اختياري (افتراضي: `true`). فحص `fullName` ≥2 |
| `createPersonAsParentOf` | `isLiving?` مضاف كمعامل اختياري (افتراضي: `false` للأجداد التاريخيين). فحص `fullName` ≥2 |
| `createPersonAsSpouseOf` | `isLiving?` مضاف كمعامل اختياري (افتراضي: `true`). فحص `fullName` ≥2 |

**الرسالة الجديدة:** `"الاسم يجب أن يكون حرفين على الأقل"` (بدل `"الاسم مطلوب"`)

**مسار `createPerson` (النموذج الكامل):** كان صحيحاً مسبقاً — Zod يفرض `fullName.min(2)` و`gender` و`isLiving.default(true)`.

---

## ✅ الدفعة 9 — منجزة (PersonFamilyMembership — الانتماء متعدد العائلات)

**آخر تحديث:** 9 يونيو 2026

### المشكلة التي تم حلها

`Person.familyId` كان حقلاً واحداً ثابتاً يمنع ظهور الشخص في أكثر من شجرة عائلية، ويُعطّل `recomputeFamilyAncestry` عن تتبع النسب عبر حدود العائلات (يُكسر mahram detection للحالات العابرة للعائلتين).

### التصميم المعتمد

- `Person.familyId` يبقى كـ "العائلة الأصلية" — لا كسر في أي API
- جدول جديد `PersonFamilyMembership` للعضويات الثانوية
- `PersonMembershipRole`: `MARRIED_IN | BRANCH_MEMBER | CROSS_PARENT | DESCENDANT`

### الملفات الجديدة/المعدلة

| الملف | التغيير |
| --- | --- |
| `prisma/schema.prisma` | enum `PersonMembershipRole` + model `PersonFamilyMembership` + relations على Person/Family |
| `prisma/migrations/20260609040000_batch8_person_family_membership/migration.sql` | CREATE TYPE + CREATE TABLE + indexes + FKs |
| `actions/persons.ts` | `recomputeFamilyAncestry` يشمل الأعضاء الثانويين + `addParentChildRelation` يدعم cross-family |
| `actions/branch-unification.ts` | `applyBranchUnification` يضيف BRANCH_MEMBER بدل نقل familyId |
| `actions/cross-family-marriages.ts` | `applyCrossMarriageRequest` يضيف MARRIED_IN لكلا الزوجين |

### متى يُنشأ سجل PersonFamilyMembership؟

| الحدث | الدور | من يحصل عليه |
| --- | --- | --- |
| `applyCrossMarriageRequest` | `MARRIED_IN` | كل زوج في عائلة الطرف الآخر |
| `applyBranchUnification` | `BRANCH_MEMBER` | أشخاص الفرع + الوالد المشترك في كلتا العائلتين |
| `addParentChildRelation` (cross-family) | `CROSS_PARENT` | الوالد في عائلة الطفل |
| `addParentChildRelation` (cross-family) | `DESCENDANT` | الطفل في عائلة الوالد |

### تأثير على `recomputeFamilyAncestry`

بدلاً من `WHERE familyId = ?` فقط:
```
personIds = primary members (familyId = X) + PersonFamilyMembership(familyId = X)
```
→ mahram detection يعمل صحيحاً عبر حدود العائلات.

---

## ⏳ المرحلة التالية

- واجهة مستخدم: عرض نتيجة `analyzeBranchUnificationImpact` في صفحة مراجعة الطلب
- واجهة مستخدم: عرض طلبات `CrossFamilyMarriageRequest` ومراجعتها
- واجهة مستخدم: عرض وإدارة `PersonFamilyMembership` (الأشخاص المشتركون بين العائلات)
- محرك تدقيق البيانات (audit report UI)

---

## اختبارات التحقق المطلوبة

قبل اعتبار الدفعة 1 مكتملة، يجب التحقق يدوياً من:

```
✓ رجل له 4 زوجات نشطات يُرفض عند محاولة الخامسة
✓ امرأة لها زوج نشط يُرفض عند محاولة زواج آخر
✓ رجل يتزوج أخت زوجته الحالية يُرفض
✓ زواج منتهٍ (ENDED) يسمح بإعادة الزواج بين نفس الشخصين
✓ تغيير جنس أب إلى أنثى يُرفض إذا كان له أبناء مسجلون
✓ إضافة زوج من FamilyBuilder تمر عبر فحص حد الزوجات
✓ فشل إنشاء الزواج في createPersonAsSpouseOf لا يترك شخصاً بلا علاقة
✓ توحيد الفروع بلا اسم والد يوقف العملية بدل إنشاء "والد مشترك"
✓ الزوج الجديد المُنشأ من FamilyBuilder يولد حياً (isLiving: true)
```

للتشغيل: `npm run dev` في `app/` ثم اختبار كل سيناريو يدوياً.

---

## ملفات الكود المرجعية

- [domain/family-rules/index.ts](../app/src/lib/domain/family-rules/index.ts)
- [domain/family-rules/marriage-validators.ts](../app/src/lib/domain/family-rules/marriage-validators.ts)
- [domain/family-rules/gender-validators.ts](../app/src/lib/domain/family-rules/gender-validators.ts)
- [actions/marriages.ts](../app/src/lib/actions/marriages.ts)
- [actions/persons.ts](../app/src/lib/actions/persons.ts)
- [actions/branch-unification.ts](../app/src/lib/actions/branch-unification.ts)
