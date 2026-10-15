![CloudVault Banner](./public/brand/cloudvault-banner.svg)

<div align="center">

# CloudVault

### *Your files. Organized. Under control.*

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![S3 Storage](https://img.shields.io/badge/S3_Object_Storage-MinIO_%2F_AWS-E05D44?style=flat-square&logo=amazon-s3)](https://min.io/)
[![Vitest](https://img.shields.io/badge/Tests-Vitest-6E9F18?style=flat-square&logo=vitest)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

**A premium, production-ready full-stack cloud storage and asset management platform engineered with Next.js App Router, TypeScript, PostgreSQL, Prisma ORM, private S3-compatible object storage, and a refined off-white & shades-of-blue visual design system.**

</div>

---

## 1. Purpose & Motivation

Most cloud storage demonstrations are limited to superficial frontend mockups or toy applications that save base64 strings in local storage. **CloudVault** was designed and engineered from the ground up as a production-grade full-stack platform that addresses real-world storage challenges:

1. **Storage Isolation**: Object buckets remain strictly private. Direct access is denied; assets are served through short-lived presigned URLs or authenticated streaming proxies.
2. **True Non-Destructive Versioning**: Every revision persists immutable file copies in S3 with unique storage keys and SHA-256 integrity checksums, enabling one-click historical rollbacks.
3. **Cryptographically Secure Sharing**: Share tokens are generated with 256 bits of cryptographic entropy. Plaintext tokens are never stored in the database—only their SHA-256 digests are persisted, protecting user files even in the event of database exfiltration.
4. **Server-Side Quota Enforcement**: Storage consumption is verified against physical object sizes in PostgreSQL before writes occur, preventing denial-of-service and storage exhaustion.

---

## 2. Key Features

- **Intuitive Explorer UI**: Switch between high-density list views and image thumbnail grid views with instantaneous keyword search, category filtering, and multi-parameter sorting (Name, Date, Size).
- **Deeply Nested Folders**: Recursive self-referential folder hierarchies with real-time breadcrumb navigation and cross-folder moves.
- **In-Browser File Previews**: Stream and preview images (`JPG`, `PNG`, `WEBP`, `SVG`, `GIF`), code/text documents (`MD`, `TXT`, `SQL`, `JSON`, `TS`, `JS`), and PDF documents without downloading.
- **Drag-and-Drop Ingestion**: Full-panel drag-over dropzones supporting multi-file queueing, upload progress indicators, and cancellation.
- **Granular Link Sharing**: Configurable time-based expiration (1 day, 7 days, 30 days, Never), permission boundaries (View-Only vs. Download), and instant revocation.
- **Standalone Public Share Portals**: Beautiful recipient pages rendering file details and authorized previews without leaking account data or storage keys.
- **Accurate Storage Accounting**: Visual quota meter calculated from verified database metadata with user tier management.
- **Auditing & Compliance**: Every upload, download, share generation, version change, and deletion is recorded in a structured `AuditLog` table.
- **Zero-Cloud-Cost Local Run**: Preconfigured Docker Compose environment (PostgreSQL + MinIO) with a seamless local storage driver fallback that runs out-of-the-box on clean machines without paid AWS credentials.

---

## 3. Product Preview

CloudVault delivers an enterprise SaaS experience comparable to Linear and Dropbox:

| View | Description | Highlights |
| :--- | :--- | :--- |
| **Explorer Grid** | Visual card layout for digital assets | Real image thumbnails, version pills, star toggles |
| **Explorer Table** | High-density administrative list | Sortable columns, file type badges, quick action menus |
| **Share Modal** | Cryptographic link generator | Token hashing, expiration picker, revocation table |
| **Version History** | Immutable revision control | Version comparison, historical downloads, rollback button |
| **Public Portal** | Standalone recipient share page | Token resolution, view-only vs download access |

---

## 4. Architecture Overview

CloudVault utilizes a modern decoupled architecture where Next.js App Router handles server-side route guards, API route handlers, and UI rendering, while metadata and binary storage are cleanly separated.

### System Architecture Diagram

```mermaid
graph TD
    Client[Web Browser / Client] -->|HTTPS Requests| NextApp[Next.js 14 App Router]
    NextApp -->|SSR & React Server Components| UI[Dashboard & Public Pages]
    NextApp -->|REST Route Handlers| API[Secure API Endpoints]
    
    API -->|Session Authentication| Auth[Auth Layer - Scrypt & HMAC]
    API -->|Relational Metadata| DB[(PostgreSQL 16 via Prisma ORM)]
    API -->|Storage Abstraction Layer| StorageService[Storage Service Factory]
    
    StorageService -->|S3 Client Protocol| MinIO[(MinIO S3 / AWS S3)]
    StorageService -->|Filesystem Driver Fallback| LocalFS[(Local Uploads Directory)]
```

### File Upload & Ingestion Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant API as /api/files (Route Handler)
    participant Auth as Auth & Session Layer
    participant DB as PostgreSQL (Prisma)
    participant Storage as Object Storage (MinIO / S3)

    User->>API: POST /api/files (multipart: file, folderId)
    API->>Auth: Validate cv_session cookie
    Auth-->>API: User authenticated (userId)
    API->>DB: Query user storage quota & used bytes
    alt Storage quota exceeded
        API-->>User: 400 Bad Request (Quota Exceeded)
    end
    API->>API: Generate fileId, safeKey, compute SHA-256 hash
    API->>Storage: upload(storageKey, buffer, mimeType)
    Storage-->>API: Upload verified
    API->>DB: Transaction: Create File, Create FileVersion (v1), Increment storageUsedBytes
    DB-->>API: Transaction committed
    API->>DB: Log Audit Event (FILE_UPLOAD)
    API-->>User: 201 Created (File metadata)
```

---

## 5. Database Schema & ER Diagram

The database schema is managed through Prisma ORM targeting PostgreSQL.

```mermaid
erDiagram
    User ||--o{ Folder : owns
    User ||--o{ File : owns
    User ||--o{ FileVersion : uploads
    User ||--o{ AuditLog : triggers
    Folder ||--o{ Folder : "parent/children"
    Folder ||--o{ File : contains
    File ||--o{ FileVersion : "tracks revisions"
    File ||--o{ ShareLink : "shared via"

    User {
        string id PK
        string email UK
        string passwordHash
        string name
        string role
        float storageQuotaBytes
        float storageUsedBytes
        datetime createdAt
        datetime updatedAt
    }

    Folder {
        string id PK
        string name
        string userId FK
        string parentId FK
        boolean isTrash
        datetime createdAt
        datetime updatedAt
    }

    File {
        string id PK
        string name
        string originalName
        string mimeType
        float sizeBytes
        string userId FK
        string folderId FK
        boolean isStarred
        boolean isTrash
        int currentVersionNumber
        datetime createdAt
        datetime updatedAt
    }

    FileVersion {
        string id PK
        string fileId FK
        int versionNumber
        string storageKey
        float sizeBytes
        string mimeType
        string checksumSha256
        string uploadedById FK
        datetime createdAt
    }

    ShareLink {
        string id PK
        string fileId FK
        string tokenHash UK
        string permission
        datetime expiresAt
        int maxDownloads
        int downloadCount
        boolean isRevoked
        datetime createdAt
    }

    AuditLog {
        string id PK
        string userId FK
        string action
        string resourceType
        string resourceId
        string details
        string ipAddress
        datetime createdAt
    }
```

---

## 6. Project Directory Structure

```
cloudvault/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Automated CI (lint, test, build)
├── app/
│   ├── api/                       # REST API route handlers
│   │   ├── auth/                  # Register, login, logout, me
│   │   ├── files/                 # CRUD, download, upload, versions, share
│   │   ├── folders/               # Nested folders CRUD
│   │   ├── share/                 # Public share resolution & download
│   │   ├── storage/               # Local storage signed token handler
│   │   └── user/                  # Storage quota metrics
│   ├── dashboard/                 # Authenticated application
│   │   ├── layout.tsx             # Shell with sidebar & quota meter
│   │   ├── page.tsx               # Main file manager explorer
│   │   ├── recent/                # Recently accessed files
│   │   ├── starred/               # Starred files view
│   │   ├── trash/                 # Trash & permanent deletion
│   │   └── settings/              # User settings & security info
│   ├── login/                     # User login page
│   ├── register/                  # User registration page
│   ├── share/[token]/             # Standalone public recipient share page
│   ├── globals.css                # Custom design system tokens
│   ├── layout.tsx                 # Root layout with brand metadata
│   └── page.tsx                   # Public landing page with showcase
├── components/
│   ├── modals/                    # Upload, Preview, Share, Version, Move, Rename
│   └── Toast.tsx                  # Toast notification context
├── lib/
│   ├── auth.ts                    # Scrypt hashing & HMAC session tokens
│   ├── audit.ts                   # Security audit event logger
│   ├── prisma.ts                  # Prisma client singleton
│   ├── storage/                   # Storage abstraction (S3 & Local drivers)
│   └── validators.ts              # Zod validation schemas
├── prisma/
│   ├── migrations/                # Versioned SQL migrations
│   └── schema.prisma              # PostgreSQL schema definition
├── public/
│   ├── brand/                     # Original vector brand assets (logo, banner, stamp)
│   └── icon.svg                   # Vector favicon
├── scripts/
│   └── seed.js                    # Demo user & files seeder
├── tests/                         # Vitest unit & integration test suite
├── docker-compose.yml             # Local PostgreSQL & MinIO services
├── tailwind.config.ts             # Off-white & shades-of-blue theme tokens
├── tsconfig.json                  # Strict TypeScript configuration
└── vitest.config.ts               # Test runner configuration
```

---

## 7. Prerequisites

- **Node.js**: `v18.18.0` or higher (tested with `Node v24.19.0`)
- **npm**: `v9.0.0` or higher
- **Docker & Docker Compose** *(Optional for local database and MinIO storage)*

---

## 8. Installation & Quickstart

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/cloudvault.git
cd cloudvault
npm install
```

### 2. Configure Environment Variables

Copy the template configuration:

```bash
cp .env.example .env
```

Review key configuration values in `.env`:

```env
DATABASE_URL="postgresql://cloudvault:cloudvault_secret_password@localhost:5432/cloudvault?schema=public"
AUTH_SECRET="your_custom_32_character_secret_key"
STORAGE_DRIVER="local" # Use "local" for zero-docker runs, or "s3" for MinIO / AWS
```

### 3. Start Local Infrastructure (Docker Compose)

When Docker is available on your workstation:

```bash
docker compose up -d
```

This starts:
- **PostgreSQL 16** on `localhost:5432`
- **MinIO S3** API on `localhost:9000` (Console on `localhost:9001`)
- **Bucket Initializer** which creates the private `cloudvault-storage` bucket automatically.

### 4. Run Database Migrations

Apply the migration schema:

```bash
npx prisma migrate dev
```

*(Alternatively, to sync schema directly: `npx prisma db push`)*

### 5. Seed Demo Data

Populate the database with sample folders, multi-version files, and an active share link:

```bash
npm run seed
```

**Default Demo Credentials:**
- Email: `demo@cloudvault.dev`
- Password: `DemoPassword123!`

### 6. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 9. Environment Variable Reference

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Base public URL of the application | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/cloudvault` |
| `AUTH_SECRET` | 256-bit secret key for HMAC session signing | Random 32+ character string |
| `SESSION_MAX_AGE_SECONDS` | Cookie session lifetime in seconds | `604800` (7 days) |
| `STORAGE_DRIVER` | Storage provider driver (`s3` or `local`) | `local` |
| `S3_ENDPOINT` | Custom S3 endpoint (for MinIO or R2) | `http://localhost:9000` |
| `S3_REGION` | S3 Region | `us-east-1` |
| `S3_BUCKET_NAME` | S3 private bucket name | `cloudvault-storage` |
| `S3_ACCESS_KEY_ID` | S3 Access Key ID | `minioadmin` |
| `S3_SECRET_ACCESS_KEY`| S3 Secret Access Key | `minioadminpassword` |
| `DEFAULT_USER_QUOTA_BYTES` | Default storage quota per user | `10737418240` (10 GB) |
| `MAX_FILE_SIZE_BYTES` | Maximum single file upload limit | `104857600` (100 MB) |

---

## 10. Development & Testing Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server on port 3000 |
| `npm run test` | Runs complete Vitest unit & integration test suite |
| `npm run type-check` | Executes TypeScript compiler (`tsc --noEmit`) to verify types |
| `npm run build` | Builds optimized Next.js production bundle |
| `npm run seed` | Seeds database with demo user, nested folders, and versioned files |
| `npm run prisma:migrate`| Applies pending Prisma migrations |

---

## 11. API Endpoint Reference

### Authentication Endpoints
- `POST /api/auth/register` — Create new user account with 10 GB default quota.
- `POST /api/auth/login` — Authenticate credentials and receive secure session cookie.
- `POST /api/auth/logout` — Invalidate session and clear HTTP-only cookie.
- `GET /api/auth/me` — Retrieve current authenticated user profile and quota metrics.

### File Management Endpoints
- `GET /api/files` — List files and folders with filtering (`view`, `folderId`, `search`, `type`, `sortBy`).
- `POST /api/files` — Upload new file with server-side quota verification and SHA-256 calculation.
- `GET /api/files/:id` — Retrieve file details, version history, and active share links.
- `PATCH /api/files/:id` — Update file name, toggle starred status, move folder, or soft-delete to trash.
- `DELETE /api/files/:id` — Permanently delete file and purge all historical versions from S3.
- `GET /api/files/:id/download` — Stream file or return short-lived presigned URL (`inline=true` for preview).

### Version Control Endpoints
- `GET /api/files/:id/versions` — List all immutable historical revisions for a file.
- `POST /api/files/:id/versions` — Upload replacement file version without overwriting prior copies.
- `POST /api/files/:id/versions/:versionId/restore` — Rollback file head to a previous version.

### Secure Sharing Endpoints
- `GET /api/files/:id/share` — List active share links for a file.
- `POST /api/files/:id/share` — Generate cryptographic share link with expiration and permissions.
- `DELETE /api/files/:id/share?linkId=:id` — Revoke active share link.
- `GET /api/share/:token` — Resolve public share link metadata.
- `GET /api/share/:token/download` — Download shared file if permitted by share policy.

### Folder & Storage Endpoints
- `GET /api/folders` — List user folders for navigation and move dialogues.
- `POST /api/folders` — Create nested folder.
- `PATCH /api/folders/:id` — Rename or move folder.
- `DELETE /api/folders/:id` — Move folder to trash.
- `GET /api/user/storage` — Retrieve accurate storage usage and quota metrics.

---

## 12. Security Considerations & Threat Model

| Risk Area | Threat Vector | CloudVault Mitigation |
| :--- | :--- | :--- |
| **Direct Object Access** | Unauthenticated users scraping S3 URLs | Buckets are private. Presigned URLs expire after 900 seconds. Direct public bucket access is prohibited. |
| **Share Link Exfiltration** | Database leak exposing active share tokens | Tokens are generated with 256 bits of entropy; only their SHA-256 hash is saved in PostgreSQL. |
| **IDOR / Parameter Tampering**| Manipulating file IDs in requests | All mutations verify `userId === session.user.id` on every query before execution. |
| **Path Traversal** | Filenames containing `../` escaping directories | Storage keys sanitize characters: `key.replace(/[^a-zA-Z0-9_\-\.]/g, '_')`. |
| **Denial of Service (DoS)** | Giant uploads exhausting server memory | 100 MB strict request size bounding and pre-upload quota checks. |
| **Session Hijacking** | XSS attacks stealing session tokens | Cookies configured with `httpOnly: true`, `sameSite: "lax"`, and `secure` in production. |
| **Data Corruption** | Silent file corruption during transfer | SHA-256 checksums are calculated and stored with every version for tamper-proof verification. |

---

## 13. Production Deployment Guide

### Database (PostgreSQL)
CloudVault runs on any managed PostgreSQL service (AWS RDS, Supabase, Neon, Railway). Set `DATABASE_URL` in your production environment and run:
```bash
npx prisma migrate deploy
```

### Object Storage (AWS S3 or Cloudflare R2)
1. Create a private S3 bucket (e.g. `my-production-cloudvault`).
2. Ensure **Block all public access** is turned ON.
3. Configure IAM credentials with `s3:GetObject`, `s3:PutObject`, and `s3:DeleteObject` permissions.
4. Set production environment variables:
   ```env
   STORAGE_DRIVER="s3"
   S3_REGION="us-east-1"
   S3_BUCKET_NAME="my-production-cloudvault"
   S3_ACCESS_KEY_ID="AKIA..."
   S3_SECRET_ACCESS_KEY="..."
   S3_FORCE_PATH_STYLE="false"
   ```

### Web Application (Vercel / Docker / Node Server)
The application builds cleanly with `npm run build` and runs using `npm start` or standard Vercel / container deployments.

---

## 14. License & Credits

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

Designed and engineered with strict adherence to the off-white & shades-of-blue brand design system.

![Curated / Engineered by Vedansh Chamoli](./public/brand/cloudvault-stamp.svg)
