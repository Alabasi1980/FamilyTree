# التحديث السريع للإنتاج

التطبيق منشور على:
`https://teranoo.com/bustanalosool`

مهم:

- واجهة التطبيق تعمل من `/bustanalosool`
- مسار المصادقة يعمل من `/api/auth`
- كود التطبيق على الخادم داخل `/var/www/bustanalosool/repo`
- التشغيل عبر PM2 باسم `bustan-alosool`

## أسرع خطوات النشر

1. انسخ التعديلات إلى الخادم داخل:
   `/var/www/bustanalosool/repo`

2. ادخل SSH ثم نفذ:

```bash
cd /var/www/bustanalosool/repo
npm ci
npx prisma generate
npx prisma db push
npm run build
set -a
. ./.env
set +a
pm2 restart bustan-alosool --update-env
pm2 save
```

## متى أحتاج كل أمر؟

- `npm ci`: عند تغير `package.json` أو `package-lock.json`
- `npx prisma db push`: عند تغير `prisma/schema.prisma`
- `npm run build`: بعد أي تعديل في الكود
- `pm2 restart ...`: بعد كل نشر فعلي

## تحقق سريع بعد النشر

افتح هذه الروابط:

- `https://teranoo.com/bustanalosool`
- `https://teranoo.com/bustanalosool/login`
- جرّب زر Google Login

## إذا تعطل Google Login

تحقق من أن Google Cloud OAuth Client يحتوي على redirect URI التالي:

`https://teranoo.com/api/auth/callback/google`
