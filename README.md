# JOBDETECT

Secure AI-powered job posting classification platform built with FastAPI, React, and scikit-learn.

This project classifies job postings into job categories, detects suspicious/fraud-like listings, secures APIs using JWT authentication, and provides analytics dashboards with historical insights.

## Project Purpose

JOBDETECT helps teams and platforms automatically understand incoming job descriptions.

Main goals:
- Classify job postings into 12 categories.
- Flag potential fraud-like job descriptions.
- Provide analytics and history for trend analysis.
- Demonstrate full-stack integration, security hardening, and deployment readiness.

## Who This Project Is For

- Students building full-stack AI projects.
- Recruiters or HR-tech prototypes.
- Developers learning secure FastAPI + React integration.
- Teams preparing interview-ready/placement-ready project portfolios.

## Key Features

- AI job classification using trained scikit-learn model.
- Fraud risk signal generation for suspicious postings.
- JWT authentication with access token and refresh token flow.
- Protected APIs for classification/history/analytics.
- Rate limiting for abuse prevention and login protection.
- Prediction history and analytics APIs.
- Full frontend + backend integration through Axios.
- Render deployment readiness and Docker support.

## Tech Stack

Backend:
- Python
- FastAPI
- SQLAlchemy (async)
- SQLite
- Pydantic
- Uvicorn
- PyJWT

Machine Learning:
- scikit-learn
- NumPy
- Pickle model loading

Frontend:
- React
- Vite
- Axios
- Zustand
- Tailwind CSS

Deployment/Infra:
- Render
- Docker and Docker Compose

## High-Level Workflow

1. User logs in from React UI.
2. Backend verifies credentials and issues JWT tokens.
3. Frontend sends protected API requests with Bearer token.
4. User submits a job description for classification.
5. Backend preprocesses text and runs ML prediction.
6. Backend computes confidence and fraud-related signals.
7. Result is stored in database history.
8. Frontend shows category, confidence, and analytics views.

## Project Structure

```text
JOBDETECT-main/
  backend/
    app/
      main.py
      config.py
      auth/
      routes/
      middleware/
      services/
      ml/
      models/
      database/
      static/
    requirements.txt
    saved_models/
  frontend/
    src/
      pages/
      services/
      store/
    package.json
  ml_training/
    train_model.py
  docker-compose.yml
  build.sh
```

## API Overview

Auth:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- GET /api/auth/me

Jobs:
- POST /api/jobs/classify
- GET /api/jobs/history

Analytics:
- GET /api/analysis/stats
- GET /api/analysis/trends
- GET /api/analysis/top-keywords

Health:
- GET /api/health

## Default Local URLs and Ports

- Frontend URL: http://localhost:5173
- Backend URL: http://127.0.0.1:8000
- Health endpoint: http://127.0.0.1:8000/api/health
- API docs (if enabled): http://127.0.0.1:8000/api/docs

## Setup Guide (Any System)

You can run this project on Windows, macOS, or Linux.

### Prerequisites

- Python 3.11+ recommended
- Node.js 18+
- npm
- Git
- Optional: Docker Desktop

### 1) Clone Repository

```bash
git clone <your-repo-url>
cd JOBDETECT-main
```

If your extracted folder has nested path, use the folder containing backend/ and frontend/.

### 2) Backend Setup

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

macOS/Linux:

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

Create environment file:

```bash
copy .env.example .env
```

If copy is not available:

```bash
cp .env.example .env
```

Run backend:

```bash
uvicorn app.main:app --reload --port 8000
```

### 3) Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

On Windows PowerShell with restricted policy, use:

```powershell
npm.cmd install
npm.cmd run dev
```

### 4) Optional Docker Run

From project root:

```bash
docker compose up --build
```

Note:
- Ensure Docker Desktop is running.

## Security and Reliability Notes

- JWT auth for secure API access.
- Refresh token flow to maintain sessions.
- Rate limiting middleware to prevent misuse.
- Login attempt controls against brute force behavior.
- Structured logging and health endpoint for debugging.

## Model Training / Re-Training

```bash
cd ml_training
python train_model.py
```

Model artifact is stored in backend/saved_models and loaded by backend at startup.

## .gitignore Section (Required Team Guidance)

If you keep .gitignore, your teammate can clone/download project and run it normally.
.gitignore only stops unnecessary local files from being uploaded, it does not break project.

What your teammate must do after download:
1. Install Python dependencies
2. Install frontend dependencies
3. Create local env file from env example
4. Run backend
5. Run frontend

Important:
- .venv, node_modules, .env, logs, cache are usually ignored.
- So teammate must generate/install these on their own machine.
- This is normal and correct.

One-line viva style:
.gitignore keeps repo clean and secure; after cloning, each user installs dependencies locally and creates their own environment file.

## Quick Troubleshooting

- Backend not starting:
  - Check Python version and requirements installation.
  - Check backend/.env values.

- Frontend not starting:
  - Run npm install again.
  - Use npm.cmd on Windows PowerShell if npm is blocked.

- Docker error about engine/pipe:
  - Start Docker Desktop and retry docker compose up --build.

- 401/Unauthorized errors:
  - Login again and refresh token flow should recreate access token.

## Resume/Placement Summary

Built and deployed a secure full-stack AI classification platform integrating React and FastAPI, implementing JWT auth, refresh-token flow, rate limiting, fraud signal detection, and analytics endpoints with cloud deployment readiness.

## License

MIT
