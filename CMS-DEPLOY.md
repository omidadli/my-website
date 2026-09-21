# راهنمای اتصال CMS به Cloudflare (D1 + R2)

این سایت حالا یک API کامل روی **Cloudflare Pages Functions** دارد:

| مسیر | کار | دسترسی |
|---|---|---|
| `GET /api/content` | خواندن کل محتوای سایت از D1 | عمومی (کش ۳۰ ثانیه) |
| `PUT /api/content` | ذخیره‌ی کل محتوا در D1 | فقط ادمین |
| `POST /api/auth` | ورود با نام کاربری + رمز عبور | عمومی (با محدودیت تلاش ناموفق) |
| `GET /api/auth` | اعتبارسنجی جلسه‌ی ادمین | با توکن |
| `GET /api/media` | لیست کتابخانه رسانه | عمومی |
| `POST /api/media` | آپلود فایل در R2 | فقط ادمین |
| `DELETE /api/media?key=…` | حذف فایل از R2 | فقط ادمین |
| `GET /api/media/file/<key>` | دریافت فایل از R2 | عمومی (کش طولانی) |
| `POST /api/slug` | ساخت اسلاگ انگلیسی از عنوان فارسی | فقط ادمین |

## قدم ۱ — پر کردن wrangler.toml

نام و آیدی دیتابیس D1 و نام باکت R2 را در فایل `wrangler.toml` بگذارید:

```bash
npx wrangler login
npx wrangler d1 list        # → database_name و database_id
npx wrangler r2 bucket list # → نام باکت (اگر ندارید: npx wrangler r2 bucket create omid-adli-media)
```

## قدم ۲ — ساخت جدول‌های دیتابیس

```bash
npx wrangler d1 execute <DATABASE_NAME> --remote --file=./schema.sql
```

## قدم ۳ — تعریف Secrets (مهم‌ترین بخش امنیتی)

```bash
npx wrangler pages secret put ADMIN_USERNAME   # نام کاربری دلخواه شما
npx wrangler pages secret put ADMIN_PASSWORD   # رمز عبور قوی (حداقل ۱۶ کاراکتر پیشنهاد می‌شود)
npx wrangler pages secret put AUTH_SECRET      # خروجی: openssl rand -hex 32
npx wrangler pages secret put GEMINI_API_KEY   # اختیاری — برای ترجمه‌ی عنوان فارسی به اسلاگ انگلیسی با Gemini
```

> اگر `GEMINI_API_KEY` نگذارید، اسلاگ‌ها به‌صورت فینگلیش ساخته می‌شوند (مثلاً `afzayesh-narkh-tabdil`) و همیشه دستی قابل ویرایش‌اند.

## قدم ۴ — Bindings (اگر با Git یکپارچه دیپلوی می‌کنید)

در داشبورد Cloudflare: **Workers & Pages → پروژه‌ی شما → Settings → Functions → Bindings**:
- D1 database → binding name: `DB`
- R2 bucket → binding name: `MEDIA`

(اگر با `wrangler pages deploy` دیپلوی می‌کنید، همان `wrangler.toml` کافی است.)

## قدم ۵ — دیپلوی

```bash
npm run build
npx wrangler pages deploy dist
```

## توسعه‌ی محلی

```bash
npm run build
npx wrangler pages dev dist --port 8788   # ترمینال ۱ (API + دیتابیس محلی)
npm run dev                               # ترمینال ۲ (Vite — درخواست‌های /api را به 8788 پروکسی می‌کند)
```

اگر API محلی در دسترس نباشد، سایت به‌طور خودکار به **حالت محلی (localStorage)** برمی‌گردد و ورود ادمین با همان رمز محلی قدیمی ممکن است — این حالت فقط برای توسعه است و در نسخه‌ی دیپلوی‌شده، ورود فقط از طریق نام کاربری/رمز عبور ابری انجام می‌شود.

## لایه‌های امنیتی فعال

- رمز عبور و نام کاربری فقط در Secrets کلودفلر (هرگز داخل کد یا ریپازیتوری).
- توکن جلسه: امضای HMAC-SHA256 با انقضای ۷ روزه.
- محدودیت نرخ ورود: بیش از ۸ تلاش ناموفق از یک IP → ۱۵ دقیقه قفل.
- مقایسه‌ی رمز به‌صورت timing-safe.
- آپلود رسانه: فقط ادمین، حداکثر ۱۰MB، فقط فرمت‌های مجاز (تصویر/PDF)، کلید تصادفی‌سازی‌شده در R2.
- فایل‌های SVG با هدر CSP خنثی‌سازی می‌شوند.
- هدرهای امنیتی سراسری در `public/_headers` (nosniff, frame-options, referrer-policy).
