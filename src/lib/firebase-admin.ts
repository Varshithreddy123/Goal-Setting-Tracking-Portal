import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';

// Lazy initialize Firebase Admin (server-side only)
const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Handle escaped newlines in env var and potential quotes
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n')
    : undefined,
};

function validateConfig() {
  const missing: string[] = [];
  if (!firebaseAdminConfig.projectId) missing.push('FIREBASE_PROJECT_ID');
  if (!firebaseAdminConfig.clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
  if (!firebaseAdminConfig.privateKey) missing.push('FIREBASE_PRIVATE_KEY');
  if (missing.length) {
    throw new Error(`Missing Firebase Admin env vars: ${missing.join(', ')}`);
  }
}

function init() {
  try {
    validateConfig();

    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: firebaseAdminConfig.projectId!,
          clientEmail: firebaseAdminConfig.clientEmail!,
          privateKey: firebaseAdminConfig.privateKey!,
        }),
      });
    }

    return getApp();
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
}

export const firebaseAdminApp = init();

