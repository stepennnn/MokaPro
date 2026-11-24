# Panduan Instalasi & Deployment MokaPro

Dokumen ini menjelaskan langkah demi langkah menjalankan **MokaPro** (Backend **Laravel 13 + Sanctum** & Frontend **React 19 + Vite**) di lingkungan **lokal (development)** maupun **production**.

---

## 1. Prasyarat Sistem

- **PHP** `>= 8.3` dengan ekstensi: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`, `fileinfo`
- **Composer** `>= 2.7`
- **Node.js** `>= 20.x` dan **npm** `>= 10.x`
- **MySQL** `>= 8.0` atau **MariaDB** `>= 10.6` (InnoDB diperlukan untuk transaksi & *row-level locking* inventaris)
- **Nginx** atau **Apache** (untuk production)

---

## 2. Setup Pengembangan Lokal (Development)

### A. Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Sesuaikan koneksi database di `backend/.env`:

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000
APP_TIMEZONE=Asia/Jakarta
MOKAPRO_TAX_RATE=0.1000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mokapro_dev
DB_USERNAME=mokapro
DB_PASSWORD=secret

SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173,localhost:4173,127.0.0.1:4173,localhost,localhost:8000,127.0.0.1,127.0.0.1:8000,::1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173
SESSION_DRIVER=database
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
```

Jalankan migrasi, seeder produk awal, dan buat akun karyawan (Admin / Kasir / Barista):

```bash
php artisan migrate --seed
php artisan mokapro:employee
```

Jalankan server backend:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

### B. Frontend (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Secara default, `frontend/vite.config.js` mem-proxy `/api` dan `/sanctum` ke `MOKAPRO_BACKEND_URL` (`http://127.0.0.1:8000`) dan menggunakan `VITE_BASE_PATH=/`. Akses aplikasi di `http://localhost:5173`.

---

## 3. Deployment Production

MokaPro menggunakan autentikasi **Laravel Sanctum SPA Stateful Cookie** (`HttpOnly` session cookie + `XSRF-TOKEN`). Tersedia dua pola arsitektur deployment:

### Pola A (Direkomendasikan): Same-Origin Reverse Proxy
Frontend dan backend disajikan di domain yang sama, misalnya `https://pos.example.com`:
- `/` → file statis `frontend/dist`
- `/api/*` dan `/sanctum/*` → diteruskan ke Laravel (PHP-FPM)

Keunggulan: tidak terkena pembatasan *third-party cookie* browser modern, tidak memerlukan `SameSite=None`, dan konfigurasi CORS minimal.

**`backend/.env` (Pola A):**
```env
APP_NAME=MokaPro
APP_ENV=production
APP_DEBUG=false
APP_URL=https://pos.example.com
APP_TIMEZONE=Asia/Jakarta
MOKAPRO_TAX_RATE=0.1000

SANCTUM_STATEFUL_DOMAINS=pos.example.com
CORS_ALLOWED_ORIGINS=https://pos.example.com

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax
```

**`frontend/.env.production` (Pola A):**
```env
VITE_BASE_PATH=/
VITE_API_URL=
```

---

### Pola B: Domain / Subdomain Terpisah
Frontend di `https://app.example.com` dan API backend di `https://api.example.com`.

**`backend/.env` (Pola B — Subdomain Sama):**
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.example.com
APP_TIMEZONE=Asia/Jakarta
MOKAPRO_TAX_RATE=0.1000

SANCTUM_STATEFUL_DOMAINS=app.example.com,api.example.com
CORS_ALLOWED_ORIGINS=https://app.example.com

SESSION_DRIVER=database
SESSION_DOMAIN=.example.com
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax
```

> **Catatan jika beda domain utama** (misal `https://mokapro-ui.vercel.app` dan `https://api.mokapro.id`):
> - Set `SESSION_DOMAIN=null`
> - Set `SESSION_SECURE_COOKIE=true` (wajib HTTPS di kedua sisi)
> - Set `SESSION_SAME_SITE=none`
> - Pastikan `CORS_ALLOWED_ORIGINS` berisi origin frontend **secara eksplisit** (jangan gunakan `*` karena `supports_credentials => true`).

**`frontend/.env.production` (Pola B):**
```env
VITE_BASE_PATH=/
VITE_API_URL=https://api.example.com
```

> Jika di-deploy pada subfolder (misalnya `https://example.com/MokaPro/`), set `VITE_BASE_PATH=/MokaPro/`. `vite.config.js` dan `BrowserRouter` di `src/main.jsx` akan otomatis menyesuaikan.

---

## 4. Langkah Build & Optimasi Production

### Backend Laravel

```bash
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan db:seed --class=ProductSeeder --force # opsional untuk data katalog awal
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

Pastikan hak akses direktori storage dan cache dapat ditulis oleh user web server (`www-data`):

```bash
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

Buat akun pengelola/kasir/barista awal via CLI:

```bash
php artisan mokapro:employee
```

### Frontend Vite

```bash
cd frontend
npm ci
npm run build
```

Hasil build statis berada di `frontend/dist/`.

---

## 5. Contoh Konfigurasi Web Server

### Nginx (Pola A — Same-Origin)

```nginx
server {
    listen 443 ssl http2;
    server_name pos.example.com;

    ssl_certificate     /etc/letsencrypt/live/pos.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pos.example.com/privkey.pem;

    # File statis React SPA
    root /var/www/mokapro/frontend/dist;
    index index.html;

    # Teruskan /api dan /sanctum ke Laravel
    location ~ ^/(api|sanctum|up)(/|$) {
        root /var/www/mokapro/backend/public;
        try_files $uri /index.php?$query_string;
    }

    location ~ \.php$ {
        root /var/www/mokapro/backend/public;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME /var/www/mokapro/backend/public/index.php;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }

    # SPA fallback untuk React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### Apache (VirtualHost — Pola A)

Aktifkan modul `mod_rewrite`, `mod_proxy`, `mod_proxy_fcgi`, dan `mod_headers`:

```apache
<VirtualHost *:443>
    ServerName pos.example.com

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/pos.example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/pos.example.com/privkey.pem

    DocumentRoot /var/www/mokapro/frontend/dist

    # Alias API & Sanctum ke Laravel public/index.php
    Alias /api /var/www/mokapro/backend/public/index.php
    Alias /sanctum /var/www/mokapro/backend/public/index.php

    <Directory /var/www/mokapro/backend/public>
        AllowOverride All
        Require all granted
    </Directory>

    <Directory /var/www/mokapro/frontend/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        RewriteEngine On
        RewriteCond %{REQUEST_URI} !^/(api|sanctum|up)
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^ index.html [L]
    </Directory>
</VirtualHost>
```

---

## 6. Checklist Verifikasi & Troubleshooting

1. **Verifikasi Otomatis Sebelum Deploy:**
   - Backend: `cd backend && php artisan test`
   - Frontend: `cd frontend && npm run lint && npm run build`
2. **Error `419 CSRF Token Mismatch`:**
   - Pastikan `SANCTUM_STATEFUL_DOMAINS` memuat hostname (+ port jika non-standar) frontend.
   - Pastikan `SESSION_SECURE_COOKIE=true` hanya diaktifkan jika diakses lewat HTTPS.
3. **Error `401 Unauthenticated` Setelah Login Berhasil:**
   - Pastikan `SESSION_DOMAIN` cocok dengan domain frontend & backend, serta `CORS_ALLOWED_ORIGINS` persis sama (termasuk skema `https://` dan tanpa trailing slash).
4. **Checkout Gagal `422`:**
   - Periksa stok bahan baku pada menu **Admin → Inventaris** (resep produk memotong stok secara otomatis saat transaksi).
   - Periksa apakah meja Dine-In yang dipilih masih terisi oleh order aktif di KDS.
