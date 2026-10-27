import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function storageBucketName(projectId?: string) {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET ||
    (projectId ? `${projectId}.appspot.com` : undefined)
  );
}

let app: App | undefined;

function loadServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) return JSON.parse(json);

  const path =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    join(process.cwd(), "serviceAccountKey.json");

  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, "utf8"));
  }
  return null;
}

export function isAdminConfigured() {
  try {
    return Boolean(loadServiceAccount());
  } catch {
    return false;
  }
}

export function getAdminApp() {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0]!;
    return app;
  }

  const sa = loadServiceAccount();
  if (!sa) {
    throw new Error(
      "Firebase Admin not configured. Add serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT_JSON.",
    );
  }

  const projectId =
    sa.project_id ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  app = initializeApp({
    credential: cert(sa),
    projectId,
    storageBucket: storageBucketName(projectId),
  });
  return app;
}

export function adminDb() {
  return getFirestore(getAdminApp());
}

export function adminAuth() {
  return getAuth(getAdminApp());
}

export function adminStorage() {
  const appInstance = getAdminApp();
  const bucket =
    storageBucketName(
      process.env.FIREBASE_PROJECT_ID ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    ) || undefined;
  return bucket
    ? getStorage(appInstance).bucket(bucket)
    : getStorage(appInstance).bucket();
}
