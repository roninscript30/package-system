# MediVault

> **Resilient multipart upload system for large medical files.**

MediVault is a full-stack web application that lets healthcare professionals securely upload large medical imaging files (MRI, CT, DICOM, and more) to AWS S3 with zero data-loss guarantees, automatic pause/resume, and per-user access control.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Quick Start](#quick-start)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)

---

## Project Overview

Traditional browser uploads fail on large files due to network timeouts, memory limits, and the lack of any recovery mechanism. MediVault solves this by splitting every file into 5–10 MB chunks, uploading them in parallel directly to AWS S3 through pre-signed URLs, and tracking each chunk's status in MongoDB so that interrupted uploads can be resumed exactly where they left off.

The system is designed for medical environments where data integrity is non-negotiable:
- Files are only marked complete when every chunk has been confirmed by S3.
- AWS credentials are never exposed to the browser.
- Bucket credentials stored in the database are encrypted with Fernet symmetric encryption.
- Every API route is authenticated with JWT tokens and protected by IP-based rate limits.

---

## Key Features

| Feature | Details |
|---------|---------|
| **Resumable uploads** | Interrupted uploads resume from the last successful chunk |
| **Parallel chunk upload** | Up to 5 concurrent chunk uploads per file |
| **Adaptive chunk sizing** | Chunk size adjusts (5–10 MB) based on measured network speed |
| **File type validation** | Magic-byte inspection blocks disallowed file types before upload |
| **SHA-256 checksum** | Computed in-browser; sent on start and finalized on complete |
| **JWT authentication** | Bcrypt-hashed passwords; HS256 access tokens with configurable TTL |
| **Per-user bucket management** | Users add/remove their own AWS S3 buckets; credentials stored encrypted |
| **Rate limiting** | slowapi IP-rate limits on all auth and upload endpoints |
| **Mock S3 mode** | Full upload lifecycle testable without real AWS credentials |
| **Upload history** | Per-user history stored in MongoDB with file metadata |
| **Local file preview** | DICOM, JPEG, PNG, PDF, Excel previewed in-browser before upload |

---

## Tech Stack

### Backend
| Component | Technology |
|-----------|-----------|
| API framework | [FastAPI](https://fastapi.tiangolo.com/) 0.115 |
| ASGI server | [Uvicorn](https://www.uvicorn.org/) 0.30 |
| Database | [MongoDB](https://www.mongodb.com/) 7 via [pymongo](https://pymongo.readthedocs.io/) |
| Auth | [PyJWT](https://pyjwt.readthedocs.io/) + [bcrypt](https://pypi.org/project/bcrypt/) |
| Storage | [boto3](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html) 1.35 (AWS S3 multipart) |
| Rate limiting | [slowapi](https://github.com/laurentS/slowapi) |
| Encryption | [cryptography](https://cryptography.io/) (Fernet) |
| Validation | [Pydantic](https://docs.pydantic.dev/) v2 |

### Frontend
| Component | Technology |
|-----------|-----------|
| UI framework | [React](https://react.dev/) 19 |
| Build tool | [Vite](https://vite.dev/) 8 |
| Styling | [Tailwind CSS](https://tailwindcss.com/) 3 |
| HTTP client | [Axios](https://axios-http.com/) |
| DICOM viewer | [Cornerstone Core](https://docs.cornerstonejs.org/) |
| PDF viewer | [pdf.js](https://mozilla.github.io/pdf.js/) |

### Infrastructure
| Component | Technology |
|-----------|-----------|
| Object storage | AWS S3 (multipart upload + pre-signed URLs) |
| Database container | Docker Compose (mongo:7) |

---

## Project Structure

```
package-system/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── main.py             # FastAPI app factory, CORS, startup/shutdown
│   │   ├── config.py           # Pydantic-settings configuration with validation
│   │   ├── auth.py             # JWT helpers: create, verify, get_current_user
│   │   ├── auth_routes.py      # POST /api/auth/register, /login, GET /me
│   │   ├── routes.py           # POST /api/upload/* lifecycle endpoints
│   │   ├── schemas.py          # Pydantic request/response models
│   │   ├── database.py         # MongoDB client, collections, TTL index setup
│   │   ├── s3_client.py        # boto3 helpers: initiate, presign, complete, abort
│   │   ├── mock_s3_service.py  # File-backed mock for local testing
│   │   ├── encryption_utils.py # Fernet encrypt/decrypt for bucket credentials
│   │   ├── rate_limit.py       # slowapi limiter instance
│   │   ├── cleanup.py          # Background task: abort expired upload sessions
│   │   └── __init__.py
│   ├── .env.example            # Environment variable template
│   ├── requirements.txt        # Python dependencies
│   ├── seed_user.py            # Helper: create a seed user for local testing
│   ├── set_cors.py             # Helper: update CORS config at runtime
│   ├── validate_mock_e2e.py    # End-to-end mock upload validation script
│   ├── README.md               # Backend-specific notes
│   └── SECURITY.md             # Security hardening reference
│
├── frontend/                   # React + Vite application
│   ├── src/
│   │   ├── App.jsx             # Root component: auth state, routing, bucket management
│   │   ├── main.jsx            # React DOM entry point
│   │   ├── api/
│   │   │   ├── authApi.js      # Auth API calls (register, login, me)
│   │   │   └── uploadApi.js    # Upload lifecycle + bucket management API calls
│   │   ├── hooks/
│   │   │   └── useChunkedUpload.js  # Core upload state machine
│   │   ├── components/
│   │   │   ├── Login.jsx            # Login / register form
│   │   │   ├── FileUploader.jsx     # Drag-and-drop file selector
│   │   │   ├── ProgressTracker.jsx  # Per-chunk progress display
│   │   │   ├── UploadStatus.jsx     # Overall upload status + error details
│   │   │   ├── UploadHistory.jsx    # Past uploads table
│   │   │   ├── FilePreviewModal.jsx # Local file preview modal
│   │   │   ├── ToastStack.jsx       # Notification stack
│   │   │   └── viewers/             # DICOM, PDF, image viewer sub-components
│   │   └── utils/
│   │       ├── chunker.js       # Split File into Blob chunks
│   │       ├── checksum.js      # SHA-256 in-browser via SubtleCrypto
│   │       ├── fileTypeUtils.js # Magic-byte file type validation
│   │       └── storage.js       # LocalStorage helpers for auth token
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── docker-compose.yml          # MongoDB service definition
└── medivault_complete_documentation.md  # Extended design document
```

---

## Installation & Setup

### Prerequisites

| Requirement | Minimum version |
|-------------|----------------|
| Python | 3.10 |
| Node.js | 18 |
| npm | 9 |
| MongoDB | 6 (or Docker) |
| AWS account | — (or use mock S3 for local dev) |

---

### 1. Clone the repository

```bash
git clone https://github.com/ANURA4G/package-system.git
cd package-system
```

### 2. Start MongoDB

The easiest way is Docker Compose:

```bash
docker compose up -d mongo
```

This starts MongoDB on port 27017 with a persistent named volume (`mongo_data`).

### 3. Configure the backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in the required values:

```env
# AWS (leave blank and set USE_MOCK_S3=true to skip real AWS)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
S3_BUCKET_NAME=your_bucket

# MongoDB
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=medivault

# Auth — must be at least 32 characters
JWT_SECRET_KEY=replace_with_a_strong_random_secret_at_least_32_chars

# CORS
CORS_ALLOW_ORIGINS=http://localhost:5173
```

> **No AWS account?** Set `USE_MOCK_S3=true` in `.env` to use the built-in file-backed mock.

### 4. Install backend dependencies

```bash
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 5. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Quick Start

Open two terminals from the project root.

**Terminal 1 — Backend**

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Expected output:

```
MongoDB connection successful target=localhost:27017 database=medivault
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Terminal 2 — Frontend**

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

1. Register a new account (or use the seed helper: `python backend/seed_user.py`).
2. Log in.
3. Select a medical file (DICOM, JPEG, PNG, PDF, or ZIP).
4. Click **Upload**.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `MongoDB connection failed` on startup | MongoDB not running | Run `docker compose up -d mongo` |
| `JWT_SECRET_KEY is too weak` | Placeholder value in `.env` | Set a strong random 32+ character value |
| `ENCRYPTION_KEY is not configured` | Missing key in `.env` | Generate a Fernet key: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` and add it |
| CORS error in browser | Frontend origin not in `CORS_ALLOW_ORIGINS` | Add `http://localhost:5173` (or your frontend URL) to the env var |
| Upload stalls, no progress | Network interruption or S3 credentials wrong | Check `.env` AWS values; for local dev use `USE_MOCK_S3=true` |
| `Invalid token` after page refresh | JWT expired (default 60 min TTL) | Log in again; increase `ACCESS_TOKEN_EXPIRE_MINUTES` if needed |
| File type rejected | File extension or magic bytes not in allowlist | Allowed types: `dcm`, `dicom`, `jpg`, `jpeg`, `png`, `pdf`, `zip` |

---

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, components, data flow, security model |
| [USAGE.md](USAGE.md) | Step-by-step usage, configuration reference, sample flows |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution workflow, coding standards, PR checklist |
| [backend/SECURITY.md](backend/SECURITY.md) | JWT, CORS, rate-limit, and S3 hardening reference |
| [medivault_complete_documentation.md](medivault_complete_documentation.md) | Extended design document |
