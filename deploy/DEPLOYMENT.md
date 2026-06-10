# دليل النشر المفصّل — بستان الأصول

هذا الدليل مخصّص لتنفيذ النشر خطوة بخطوة من جهازك المحلي إلى الخادم. كل خطوة توضح مكان التنفيذ (محلي / خادم)، الأوامر القابلة للنسخ، النتائج المتوقعة، وكيفية حل الأخطاء الشائعة.

---

## ملاحظات مهمة قبل البدء

- إذا كنت داخل Droplet web console (متصل بالخادم عبر المتصفح)، لا تشغّل أوامر SSH هناك — نفّذ أوامر الخادم مباشرة في تلك الطرفية.
- تأكد أن لديك مفتاح SSH صالح على جهازك: `$HOME/.ssh/copilot_bustanalosool`.

## المسارات الافتراضية على الخادم

- مجلد التطبيق: `/var/www/bustanalosool`
- مجلد التشغيل الحالي: `/var/www/bustanalosool/repo`
- مجلد النشر المؤقت: `/var/www/bustanalosool/release`
- ملف البيئة: `/var/www/bustanalosool/repo/.env`

## قائمة التحقق قبل كل نشر

- لديك اتصال SSH صالح إلى `root@142.93.100.200`.
- البناء المحلي ينجح: `cd app && npm run build`.
- ملف `app/.env` موجود ومكتمل على جهازك.

---

## الجزء 0 — أول نشر فقط: رفع ملف .env إلى الخادم

هذه الخطوة مطلوبة **مرة واحدة فقط** عند أول نشر. بعد ذلك يقوم السكربت بنسخ `.env` تلقائياً من النسخة السابقة.

### الخطوة 1: إنشاء المجلد على الخادم

```powershell
ssh -i "$HOME/.ssh/copilot_bustanalosool" root@142.93.100.200 "mkdir -p /var/www/bustanalosool/repo"
```

نتيجة متوقعة: لا يظهر أي خطأ.

### الخطوة 2: رفع ملف .env

```powershell
Set-Location "d:\Families Tree"
scp -i "$HOME/.ssh/copilot_bustanalosool" app/.env root@142.93.100.200:/var/www/bustanalosool/repo/.env
```

نتيجة متوقعة: الأمر ينتهي بلا أخطاء.

### الخطوة 3: التحقق من وصول الملف

```powershell
ssh -i "$HOME/.ssh/copilot_bustanalosool" root@142.93.100.200 "grep -E 'DATABASE_URL|AUTH_SECRET|NEXT_PUBLIC' /var/www/bustanalosool/repo/.env"
```

نتيجة متوقعة: ترى أسماء المتغيرات مع قيمها.

### الخطوة 4: التحقق من وجود NEXT_PUBLIC_BASE_PATH (مهم جداً)

هذا المتغير يُخبر التطبيق بمسار تشغيله (`/bustanalosool`). إذا لم يكن موجوداً **وقت البناء**، ستُصبح جميع الروابط الداخلية خاطئة — تؤدي إلى `teranoo.com/register` بدل `teranoo.com/bustanalosool/register`.

تحقق من وجوده:

```powershell
ssh -i "$HOME/.ssh/copilot_bustanalosool" root@142.93.100.200 "grep NEXT_PUBLIC_BASE_PATH /var/www/bustanalosool/repo/.env"
```

النتيجة المتوقعة:

```text
NEXT_PUBLIC_BASE_PATH=/bustanalosool
```

إذا لم تظهر هذه السطر، أضفه يدوياً:

```powershell
ssh -i "$HOME/.ssh/copilot_bustanalosool" root@142.93.100.200 "echo 'NEXT_PUBLIC_BASE_PATH=/bustanalosool' >> /var/www/bustanalosool/repo/.env"
```

ثم تحقق مرة أخرى بأمر `grep` السابق.

> **ملاحظة:** بعد إضافة هذا المتغير يجب إعادة البناء على الخادم حتى يأخذ أثره، لأن Next.js يقرأه وقت البناء وليس وقت التشغيل.

أخطاء شائعة في هذا الجزء:

- `No such file or directory` للملف المحلي: تأكد أنك في `d:\Families Tree` وأن `app/.env` موجود وليس `app/.env.example`.
- `Permission denied (publickey)`: راجع مسار المفتاح وتأكد من وجوده.

---

## الجزء A — أوامر محلية (PowerShell على جهازك)

### الخطوة 1: افحص البناء محلياً

```powershell
Set-Location "d:\Families Tree\app"
npm run build
```

نتيجة متوقعة: البناء ينجح. إذا فشل، أصلح الأخطاء محليًا قبل المتابعة.

### الخطوة 2: شغّل سكربت النشر

```powershell
Set-Location "d:\Families Tree"
.\app\deploy\deploy-local.ps1
```

> إذا ظهرت رسالة منع التنفيذ، شغّل أولاً:
> `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

السكربت سيسألك بالتسلسل:

1. إنشاء الأرشيف → أجب `y`
1. رفع الأرشيف للخادم → أجب `y`
1. تنفيذ التحضير على الخادم (فك، تثبيت، بناء) → أجب `y`
1. تنفيذ التبديل وتشغيل النسخة الجديدة → أجب `y`

---

## الجزء B — أوامر الخادم يدوياً (عند الدخول مباشرة للخادم)

إذا كنت داخل جلسة SSH أو Droplet web console، انسخ والصق هذه الأوامر:

```bash
set -e

rm -rf /var/www/bustanalosool/release
mkdir -p /var/www/bustanalosool/release
tar -xzf /root/server-sync.tar.gz -C /var/www/bustanalosool/release --strip-components=1

if [ -f /var/www/bustanalosool/repo/.env ]; then
  cp /var/www/bustanalosool/repo/.env /var/www/bustanalosool/release/.env
else
  echo "Warning: .env not found in repo"
fi

cd /var/www/bustanalosool/release
if [ -f package-lock.json ]; then npm ci --loglevel=warn; else npm install --loglevel=warn; fi
npx prisma generate
npx prisma migrate deploy
npm run build

ts=$(date +%s)
if [ -d /var/www/bustanalosool/repo ]; then
  mv /var/www/bustanalosool/repo /var/www/bustanalosool/repo_prev_$ts
fi
mv /var/www/bustanalosool/release /var/www/bustanalosool/repo

pm2 restart bustan-alosool --update-env
pm2 save

pm2 describe bustan-alosool | head -40
echo "Deployment finished"
```

النتائج المتوقعة:

- `npm ci` أو `npm install`: رسائل `added X packages`.
- `npx prisma generate`: ينتهي بـ `Generated Prisma Client`.
- `npx prisma migrate deploy`: يُظهر `All migrations have been successfully applied`.
- `npm run build`: ينتج `.next/` ويُطبع قائمة routes.
- `pm2 restart`: يُظهر `status: online`.

---

## الجزء C — تشخيص الأخطاء

إذا فشل شيء ما، افحص السجلات على الخادم:

```bash
pm2 logs bustan-alosool --lines 200
pm2 describe bustan-alosool
tail -n 200 /root/.pm2/logs/bustan-alosool-error.log
```

أخطاء شائعة وحلولها:

- **Permission denied (publickey):** تحقق من وجود المفتاح وصلاحياته على جهازك.
- **npm ci fails:** احذف `node_modules` على الخادم وأعد المحاولة.
- **Prisma connection error:** تأكد من `DATABASE_URL` في `.env` وأن قاعدة البيانات تقبل الاتصال.
- **الروابط تذهب لـ teranoo.com بدون /bustanalosool:** راجع الجزء 0 خطوة 4 — `NEXT_PUBLIC_BASE_PATH` مفقود من `.env`.

---

## الجزء D — التراجع السريع (rollback)

إذا كانت النسخة الجديدة مكسورة:

```bash
# اعرف اسم النسخة السابقة
ls -td /var/www/bustanalosool/repo_prev_* | head -1

# استبدل النسخة الحالية بالسابقة (غيّر TIMESTAMP بالرقم الظاهر)
ts=$(date +%s)
mv /var/www/bustanalosool/repo /var/www/bustanalosool/release_bad_$ts
mv /var/www/bustanalosool/repo_prev_TIMESTAMP /var/www/bustanalosool/repo
pm2 restart bustan-alosool --update-env
```

---

*نهاية الدليل.*
