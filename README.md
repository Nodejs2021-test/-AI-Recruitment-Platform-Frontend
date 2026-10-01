# AI Recruitment Platform - React Frontend (Vite + TypeScript)

## Overview
Modern, responsive React frontend built with **Vite**, **TypeScript**, **Tailwind CSS**, and **Redux Toolkit (RTK Query)**, pre-configured to communicate seamlessly with the new Python FastAPI backend.

## Key Features
- **Candidate Portal**: Job discovery, application submission with resume upload, AI Resume Optimizer & ATS Matcher, interactive AI Assessment test runner with timer and code editor, and asynchronous AI Video Interview simulator.
- **HR & Admin Dashboard**: Job management, AI Job Description Generator, candidate talent pipeline, AI Candidate Matcher & Ranker, AI Assessment Generation, candidate test reports, and candidate rejection coaching feedback.
- **Role-Based Access Control**: Granular routing and UI state based on `ADMIN`, `HR`, and `CANDIDATE` roles.
- **RTK Query Integration**: Automated cache invalidation and query synchronization configured to hit the Python backend at `http://localhost:8001`.

## Setup & Running Locally

### 1. Requirements
Node.js 18+ and npm installed.

### 2. Environment Configuration
The `.env` file is pre-configured with:
```env
VITE_BACKEND_URL=http://localhost:8001
```

### 3. Start Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5174/`.

### 4. Build for Production
```bash
npm run build
```
Build output is generated into the `dist/` directory.
