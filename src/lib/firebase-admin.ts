import "server-only";

import { initializeApp, getApps, App, applicationDefault, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// This function initializes and returns the Firebase Admin App instance.
// It ensures that the app is initialized only once.
const getFirebaseAdminApp = (): App => {
  // If the app is already initialized, return the existing instance.
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Try to initialize using explicit service account credentials from env vars
  // for local development. Fall back to application default credentials in GCP.
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  const useExplicitCreds = Boolean(projectId && clientEmail && privateKey);

  const app = initializeApp({
    credential: useExplicitCreds
      ? cert({ projectId: projectId!, clientEmail: clientEmail!, privateKey: privateKey! })
      : applicationDefault(),
    // Providing projectId ensures Google libraries can detect it even with ADC
    projectId: projectId,
  });
  return app;
}

// Get the initialized Firebase Admin App.
const adminApp = getFirebaseAdminApp();

// Export the admin services.
export const dbAdmin = getFirestore(adminApp);
export const authAdmin = getAuth(adminApp);