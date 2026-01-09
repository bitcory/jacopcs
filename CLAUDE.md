# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

통화녹음 관리 시스템 (Call Recording Admin) - A web admin dashboard for managing call recordings uploaded from an Android app. Built with Next.js 16 and Firebase.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS 4
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Language**: TypeScript

### Key Components

- `app/lib/firebase.ts` - Firebase initialization (auth, db, storage exports)
- `app/contexts/AuthContext.tsx` - Authentication context with Google Sign-In, user state management
- `app/layout.tsx` - Root layout with AuthProvider wrapper

### User Roles & Status
Users have:
- **role**: `admin` | `user` (first user auto-becomes admin)
- **status**: `pending` | `approved` | `rejected`

### Firebase Collections
- `users` - User profiles with role/status
- `recordings` - Call recording metadata with downloadUrl to Storage

### Pages
- `/` - Dashboard (recordings list, stats)
- `/login` - Google Sign-In
- `/pending` - Waiting for admin approval
- `/users` - User management (admin only)
- `/stats` - Statistics
- `/settings` - Settings

### Related Android App
The companion Android app source is at `/Users/toolb/AndroidStudioProjects/CallRecorderUploader`. APK is distributed via `/public/jcopcs.apk`.
