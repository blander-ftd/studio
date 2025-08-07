import "server-only";

import { initializeApp, getApps, App, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// This function initializes and returns the Firebase Admin App instance.
// It ensures that the app is initialized only once.
const getFirebaseAdminApp = (): App => {
  // If the app is already initialized, return the existing instance.
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // In a deployed Google Cloud environment (like App Hosting), the SDK 
  // automatically uses the project's service account credentials via applicationDefault().
  // No explicit credential configuration is needed.
  const app = initializeApp({
    credential: applicationDefault(),
  });
  return app;
}

// Get the initialized Firebase Admin App.
const adminApp = getFirebaseAdminApp();

// Export the admin services.
export const dbAdmin = getFirestore(adminApp);
export const authAdmin = getAuth(adminApp);