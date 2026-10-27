# Scan+ Admin (Next.js + Firebase Admin)

Admin dashboard from Figma, built with **Next.js App Router**, **Firebase Auth** (client), and **Firebase Admin SDK** (API routes).

## Stack

| Layer | Tech |
|---|---|
| UI | Next.js 15 + React |
| Login | Firebase Auth (email/password) |
| Data CRUD | Firestore via `firebase-admin` in `/app/api/*` |

## Setup

1. Copy env:

```bash
cp .env.example .env.local
```

2. Fill `NEXT_PUBLIC_FIREBASE_*` from Firebase Console → Project settings → Web app.

3. Enable **Email/Password** in Firebase Authentication.

4. Create Firestore database.

5. Download **Service account** key:
   - Firebase Console → Project settings → Service accounts → Generate new private key  
   - Save as `serviceAccountKey.json` in project root (gitignored)

6. In Firestore, create a document at `users/{firebaseAuthUid}` with:

```json
{
  "email": "you@email.com",
  "displayName": "Your Name",
  "userRole": "admin"
}
```

`userRole` must be exactly `"admin"` or login is rejected.

7. Run:

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in with that Firebase Auth email/password.

### Auth flow

1. Client signs in with Firebase Auth (email/password)
2. Server verifies ID token via Firebase Admin
3. Server loads `users/{uid}` and requires `userRole === "admin"`
4. Only then is the dashboard allowed (`GET /api/auth/verify`)

### Seed sample products/blogs

After logging in as admin:

```bash
# POST /api/seed with Authorization: Bearer <idToken>
```

## API routes (Admin SDK)

- `GET /api/auth/verify`
- `GET/POST /api/products`
- `PUT/DELETE /api/products/[id]`
- `GET/POST /api/blogs`
- `PUT/DELETE /api/blogs/[id]`
- `GET /api/users`
- `GET /api/scans`
- `GET /api/stats`
- `POST /api/seed`

All require `Authorization: Bearer <Firebase ID token>` and `userRole: admin`.
