import "server-only";

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

let cachedClient: SecretManagerServiceClient | null = null;

function getClient(): SecretManagerServiceClient {
  if (cachedClient) return cachedClient;

  const projectId = resolveProjectId();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  const hasExplicitCreds = Boolean(clientEmail && privateKey);

  cachedClient = new SecretManagerServiceClient({
    projectId: projectId,
    credentials: hasExplicitCreds
      ? { client_email: clientEmail as string, private_key: privateKey as string }
      : undefined,
  });
  return cachedClient;
}

function resolveProjectId(): string | undefined {
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT
  );
}

export async function accessSecretLatest(
  secretId: string,
  projectId?: string
): Promise<string> {
  const resolvedProjectId = projectId || resolveProjectId();
  if (!resolvedProjectId) {
    throw new Error(
      `Cannot resolve projectId for Secret Manager. Set FIREBASE_PROJECT_ID or GCLOUD_PROJECT.`
    );
  }
  const name = `projects/${resolvedProjectId}/secrets/${secretId}/versions/latest`;
  const [version] = await getClient().accessSecretVersion({ name });
  const data = version.payload?.data as unknown as Uint8Array | undefined;
  const payload = data ? Buffer.from(data).toString("utf8") : undefined;
  if (!payload) {
    throw new Error(`Secret ${secretId} has empty payload`);
  }
  return payload;
}

/**
 * Returns the secret value. Prefers environment variable if present; otherwise
 * fetches from Secret Manager using the latest version.
 */
export async function getSecret(
  envNameOrSecretId: string,
  options?: { secretId?: string; projectId?: string }
): Promise<string> {
  const envValue = process.env[envNameOrSecretId as keyof NodeJS.ProcessEnv];
  if (typeof envValue === "string" && envValue.length > 0) {
    return envValue;
  }
  const secretId = options?.secretId ?? envNameOrSecretId;
  return accessSecretLatest(secretId, options?.projectId);
}


