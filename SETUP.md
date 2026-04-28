# EEIC E-Certificate — Next.js + Supabase Setup Guide

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)
- An SMTP email account (or use Resend/SendGrid)

---

## Step 1 — Clone & Install

```bash
cd /home/entlaqa/Projects/eeic-certificates-nextjs
npm install
```

---

## Step 2 — Copy Metronic Assets

The UI relies on the same CSS as the original Laravel app. Copy the asset bundle:

```bash
cp -r "/home/entlaqa/Projects/EEIC E-Certificate/public/assets" \
      /home/entlaqa/Projects/eeic-certificates-nextjs/public/assets
```

This preserves all Metronic Bootstrap classes (card, table-row-dashed, btn-light-primary, etc.)
exactly as they appear in the original app.

---

## Step 3 — Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

| Variable | Where to find |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon / public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role (keep secret) |
| `MAIL_HOST` | Your SMTP host (e.g. smtp.gmail.com) |
| `MAIL_PORT` | 587 (TLS) or 465 (SSL) |
| `MAIL_USERNAME` | Your email address |
| `MAIL_PASSWORD` | App password (not your account password) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally, your domain in production |
| `HASHIDS_SALT` | Must be **identical** to your Laravel `config/hashids.php` salt (default: empty string) |
| `HASHIDS_LENGTH` | Must match Laravel config (default: 0) |

---

## Step 4 — Apply Supabase Schema

1. Go to **Supabase Dashboard → SQL Editor**
2. Paste the contents of `supabase/schema.sql`
3. Click **Run**

---

## Step 5 — Create Storage Buckets

In **Supabase Dashboard → Storage → New Bucket**, create these 4 buckets:

| Bucket name | Public |
|---|---|
| `fonts` | No |
| `templates` | Yes (needed for preview images) |
| `signatures` | No |
| `attachments` | No |

Then set policies (Storage → Policies) for each bucket:
- **INSERT**: `is_admin()` (defined in schema.sql)
- **SELECT**: `auth.role() = 'authenticated'`

---

## Step 6 — Create Admin User

1. Go to **Supabase Dashboard → Authentication → Users → Invite User**
2. Enter email + password
3. Then in **SQL Editor**, promote to admin:

```sql
update profiles
set is_admin = true
where id = (select id from auth.users where email = 'your@email.com');
```

---

## Step 7 — Run Locally

```bash
npm run dev
```

Open http://localhost:3000 — you will be redirected to `/login`.

---

## Step 8 — Migrate Existing Data (Optional)

If you have existing data in the Laravel SQLite database, export it and import:

```bash
# Export from Laravel SQLite
sqlite3 "/home/entlaqa/Projects/EEIC E-Certificate/database/database.sqlite" \
  ".mode csv" ".output /tmp/students.csv" "SELECT * FROM students;"

# Then use Supabase's CSV import in Table Editor
```

Repeat for: courses, groups, templates, fonts, enrollments, enrollment_templates.

**Also migrate files:**
```bash
# Upload existing fonts to Supabase Storage
# Upload existing template images to Supabase Storage
```

Use the Supabase CLI or Dashboard uploader for file migration.

---

## Project Structure

```
eeic-certificates-nextjs/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (admin)/
│   │   ├── layout.tsx          # Sidebar + navbar
│   │   ├── dashboard/          # Dashboard with stats
│   │   ├── fonts/              # Font list + upload
│   │   ├── groups/             # Group CRUD + Excel import
│   │   │   └── [id]/           # Group detail (students list)
│   │   │       └── edit/       # Edit group name
│   │   ├── templates/          # Template CRUD
│   │   │   ├── create/         # Template creation form
│   │   │   └── [id]/           # Template preview
│   │   └── generate/           # Group-template assignments
│   │       └── [studentId]/[courseId]/[templateId]/[groupId]/  # Certificate preview
│   ├── scan/[id]/[courseId]/[templateId]/  # Public certificate verify
│   └── api/
│       ├── fonts/              # GET list, POST upload
│       │   └── [id]/           # DELETE
│       ├── groups/             # POST create
│       │   └── [id]/           # GET, PUT, DELETE
│       │       └── export/     # GET Excel download
│       ├── templates/          # POST create
│       │   └── [id]/           # DELETE
│       ├── generate/           # POST assign template
│       │   └── download/       # GET generate+download PDF
│       └── email/
│           └── send-all/       # POST send certificates
├── components/admin/
│   ├── AdminSidebar.tsx
│   └── AdminNavbar.tsx
├── lib/
│   ├── supabase/{client,server,middleware}.ts
│   ├── hashids.ts              # encode/decode (matches Laravel Hashids config)
│   ├── language-detector.ts    # Arabic Unicode detection
│   ├── pdf/generate.ts         # pdf-lib certificate generator
│   ├── excel/{import,export}.ts
│   └── email/send.ts           # Nodemailer (Arabic/English templates)
├── types/database.ts           # Full TypeScript types
├── middleware.ts               # Auth protection
└── supabase/schema.sql         # Full Supabase schema
```

---

## Key Decisions & Notes

### Hashids
The Hashids encoding **must match** the Laravel app. Default Laravel config is `salt=""` and
`length=0`. Verify in `config/hashids.php` and set `HASHIDS_SALT` and `HASHIDS_LENGTH` accordingly.
If existing QR codes/scan URLs from the Laravel app need to still work, keep the salt identical.

### PDF Generation
Uses `pdf-lib` + `@pdf-lib/fontkit` for server-side PDF generation without a headless browser.
Fonts must be uploaded via the font management page before templates can use them.
The same pixel-coordinate positioning system is preserved; the Y-offset adjustments (`-15` for
student, `-10` for course) are replicated exactly.

### Arabic Text
Arabic text stored in the database renders correctly in the browser. For PDF rendering, `pdf-lib`
supports Arabic Unicode — upload Arabic fonts (Amiri, Cairo, NotoKufiArabic) via the font
management page and they will embed correctly.

### QR Codes
The `qrcode` npm package generates QR codes locally. No external service — student data stays
within your infrastructure (fixes the `quickchart.io` data leak from the original).

### Email
Standard SMTP via Nodemailer. Language detection uses the same Arabic Unicode range check as the
original `landrok/language-detector` library. Arabic emails are RTL-structured, English emails
are LTR, both matching the original blade templates.

### Authorization
All write endpoints check `auth.getUser()`. The RLS `is_admin()` function controls database-level
access. Full RBAC via the `profiles.is_admin` column.

---

## Production Deployment

### Vercel (recommended)
```bash
npm install -g vercel
vercel --prod
```
Set all `.env.local` variables in Vercel dashboard → Settings → Environment Variables.

### Self-hosted
```bash
npm run build
npm start
```

---

## Security Fixes Applied (vs. Original Laravel App)

| Issue | Fix |
|---|---|
| File uploads with no validation | Strict MIME + extension + size validation on all uploads |
| `$guarded = []` mass assignment | TypeScript `Insert` types enforce only allowed fields |
| XSS in mail templates | `escapeHtml()` applied to all user data in email HTML |
| External QR code service | Local `qrcode` package — no data leaves your server |
| `authorize(): true` on all FormRequests | `auth.getUser()` + `is_admin()` RLS on every write route |
| Hashids `[0]` without bounds check | `decode()` returns `null` → `404` response |
| Template file cleanup typo | `template.image` (not `template_imag`) used correctly |
| N+1 queries | Supabase nested selects (`students(*), courses(*)`) in one query |
