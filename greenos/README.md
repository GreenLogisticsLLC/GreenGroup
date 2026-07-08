# Green OS — Node.js backend

Internal platform at **os.greengrouplogistics.com**, deployed from:

```
repositories/GreenGroup/greenos
```

## Architecture

```
GreenGroup/
├── index.html, assets/     ← marketing site (greengrouplogistics.com)
├── greenos/                ← Node.js app (THIS folder)
│   ├── server.js           ← cPanel startup file
│   ├── src/
│   │   ├── app.js
│   │   ├── routes/
│   │   └── modules/
│   │       └── attendance/ ← first live module
│   ├── prisma/
│   └── public/             ← Green OS web UI
```

Future modules: CRM, TMS, HR, Dispatch, Accounting, AI, Customer Portal.

## Local development

```bash
cd greenos
cp .env.example .env
npm install
npm run setup
npm run dev
```

Open http://localhost:3847

**Login:** `owner` / `Admin123!@Green` (full access) or `admin` / `Admin123!@Green`

## cPanel Node.js App

| Field | Value |
|-------|-------|
| Application root | `repositories/GreenGroup/greenos` |
| Application URL | `os.greengrouplogistics.com` |
| Startup file | `server.js` |
| Node.js | 18 or 20 |

After clone, in Terminal:

```bash
cd /home/ijh19zqesepn/repositories/GreenGroup/greenos
cp .env.example .env
# edit JWT_SECRET, WEBHOOK_SECRET
npm ci
npm run setup
```

Restart the Node.js app in cPanel.

## Cron (auto-update with GreenGroup)

Add to existing GreenGroup cron or separate entry:

```bash
/bin/bash /home/ijh19zqesepn/repositories/GreenGroup/greenos/tools/cpanel-deploy-build.sh
```

Runs after `git pull` on GreenGroup `main`.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/v1/auth/login` | JWT login |
| GET | `/api/v1/platform/modules` | Module list |
| GET | `/api/v1/dashboard` | Attendance dashboard |
| POST | `/api/v1/webhook/attendance` | Door reader webhook |

## Marketing site login flow

`greengrouplogistics.com/greenos.html` → API login → redirect to `os.greengrouplogistics.com/?token=...`

Configure in `assets/js/greenos-config.js`:

```javascript
apiBaseUrl: "https://os.greengrouplogistics.com/api/v1",
appUrl: "https://os.greengrouplogistics.com/",
```
