## MokaPro backend setup

### Requirements

- PHP 8.3 with `pdo_mysql`
- Composer
- MySQL with InnoDB support

### Local development

Run these commands from `backend`:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
composer install
if (Select-String -Path .env -Pattern '^APP_KEY=$' -Quiet) { php artisan key:generate }
```

Create two empty databases named `mokapro_dev` and `mokapro_test` in your local MySQL instance. Configure `DB_CONNECTION=mysql`, `DB_HOST`, `DB_PORT`, `DB_DATABASE=mokapro_dev`, `DB_USERNAME`, and `DB_PASSWORD` in the ignored local `.env`. Use a dedicated local database user; never use production credentials or commit `.env`.

Before migrating, verify that `DB_DATABASE` is exactly `mokapro_dev`. Then run:

```powershell
php artisan migrate
php artisan test
```

The default test command uses the isolated SQLite in-memory database from `phpunit.xml`. Tests involving MySQL row locks must target the separate empty `mokapro_test` database:

```powershell
$env:DB_CONNECTION = 'mysql'
$env:DB_DATABASE = 'mokapro_test'
try {
    php artisan test
} finally {
    Remove-Item Env:DB_CONNECTION, Env:DB_DATABASE -ErrorAction SilentlyContinue
}
```

Never run `migrate:fresh` against `mokapro_dev`, an existing application database, or production. `MOKAPRO_TAX_RATE` defaults to `0.1000` (10%); `APP_TIMEZONE` defaults to `Asia/Jakarta`. Both values are read through Laravel config.

### Employee PIN sessions

Provision employees interactively; the PIN prompt is hidden and the command stores only a PIN hash plus a random password hash:

```powershell
php artisan mokapro:employee
```

Do not seed a shared/default PIN. The session API is `GET /api/login-options?role=cashier`, `POST /api/login`, `GET /api/session`, and `POST /api/logout`. Login requires an active employee's assigned role and a 6–12 digit PIN. Five failed credential attempts lock the employee for 15 minutes, independent of client IP; login and login-option routes are also limited to 30 requests per minute per IP.

The API uses Laravel's stateful session middleware and CSRF protection; browser clients must use the session cookie and CSRF cookie rather than storing a bearer token. In production, serve the SPA and API from the same origin, use HTTPS, set `SESSION_SECURE_COOKIE=true`, and configure a shared persistent `CACHE_STORE` for rate limits.

For local frontend development, run Vite on port 5173 and Laravel on port 8000. Vite proxies `/api` and `/sanctum` to `http://127.0.0.1:8000`; set `MOKAPRO_BACKEND_URL` in the frontend environment if Laravel uses another URL. The Vite origin is included in Sanctum's default stateful domains.

<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

In addition, [Laracasts](https://laracasts.com) contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

You can also watch bite-sized lessons with real-world projects on [Laravel Learn](https://laravel.com/learn), where you will be guided through building a Laravel application from scratch while learning PHP fundamentals.

## Agentic Development

Laravel's predictable structure and conventions make it ideal for AI coding agents like Claude Code, Cursor, and GitHub Copilot. Install [Laravel Boost](https://laravel.com/docs/ai) to supercharge your AI workflow:

```bash
composer require laravel/boost --dev

php artisan boost:install
```

Boost provides your agent 15+ tools and skills that help agents build Laravel applications while following best practices.

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
