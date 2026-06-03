# حديقة العائلات — Families Tree

منصة لتسجيل وعرض أشجار العائلات وربطها ببعضها.

## المتطلبات

- Node.js 18+
- PostgreSQL (محلي أو Supabase أو Neon)

## التشغيل

### 1. إعداد قاعدة البيانات

```bash
cp .env.example .env
# عدّل DATABASE_URL في .env
```

### 2. تثبيت الحزم

```bash
npm install
```

### 3. إنشاء الجداول

```bash
npm run db:push
```

### 4. بيانات تجريبية (اختياري)

```bash
npm run db:seed
```

يُنشئ مدير النظام: `admin@families-tree.local` / `Admin@1234`
وعائلة تجريبية: **عائلة الراشدي** (عامة، 4 أفراد)

### 5. تشغيل التطبيق

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)

## الصفحات

| المسار | الوصف |
| --- | --- |
| `/` | حديقة العائلات (عرض عام) |
| `/login` | تسجيل الدخول |
| `/register` | إنشاء حساب |
| `/family/[slug]` | شجرة العائلة التفاعلية |
| `/dashboard` | لوحة تحكم المستخدم |
| `/dashboard/families` | إدارة العائلات |
| `/dashboard/requests` | الطلبات والمراجعة |
| `/admin` | لوحة مدير النظام |
| `/admin/users` | إدارة المستخدمين |

## التقنيات

- **Next.js 16** (App Router, Turbopack)
- **Prisma 7** + PostgreSQL + Closure Table
- **NextAuth v5** (JWT + Credentials)
- **@xyflow/react** (شجرة العائلة التفاعلية)
- **Tailwind CSS v4** + shadcn/ui (RTL-first)
- **IBM Plex Sans Arabic**
