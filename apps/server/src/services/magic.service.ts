import type { MagicUserMetadata } from "@magic-sdk/admin";
import { Magic } from "@magic-sdk/admin";

const MAGIC_ENDPOINT =
  process.env.MAGIC_ENDPOINT ?? "https://tee.express.magiclabs.com";

let magicSingleton: InstanceType<typeof Magic> | null = null;

const getMagicAdmin = () => {
  const secret = process.env.MAGIC_SECRET_KEY;
  if (!secret) {
    throw new Error("MAGIC_SECRET_KEY must be set");
  }
  if (!magicSingleton) {
    magicSingleton = new Magic(secret, { endpoint: MAGIC_ENDPOINT });
  }
  return magicSingleton;
};

const getUserMetadataByIssuer = async (
  apiBaseUrl: string,
  secretKey: string,
  issuer: string,
): Promise<MagicUserMetadata> => {
  const params = new URLSearchParams({
    issuer,
    wallet_type: "NONE",
  });
  const url = `${apiBaseUrl}/v1/admin/user?${params.toString()}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "X-Magic-Secret-Key": secretKey },
  });
  let raw: Record<string, unknown>;
  try {
    raw = (await res.json()) as Record<string, unknown>;
  } catch {
    raw = {};
  }
  if (!res.ok) {
    if (res.status === 404) {
      return {
        issuer: null,
        publicAddress: null,
        email: null,
        oauthProvider: null,
        phoneNumber: null,
        username: null,
        wallets: null,
      };
    }
    throw new Error(
      typeof raw.message === "string"
        ? raw.message
        : `Magic admin user lookup failed (${res.status})`,
    );
  }
  const data =
    raw.data && typeof raw.data === "object"
      ? (raw.data as Record<string, unknown>)
      : raw.user && typeof raw.user === "object"
        ? (raw.user as Record<string, unknown>)
        : raw;
  return {
    issuer: (data.issuer as string | null | undefined) ?? null,
    publicAddress: (data.public_address as string | null | undefined) ?? null,
    email:
      (data.email as string | null | undefined) ??
      (data.public_email as string | null | undefined) ??
      null,
    oauthProvider: (data.oauth_provider as string | null | undefined) ?? null,
    phoneNumber: (data.phone_number as string | null | undefined) ?? null,
    username: (data.username as string | null | undefined) ?? null,
    wallets: (data.wallets as MagicUserMetadata["wallets"]) ?? null,
  };
};

export const verifyMagicDidToken = async (didToken: string) => {
  const secret = process.env.MAGIC_SECRET_KEY;
  if (!secret) {
    throw new Error("MAGIC_SECRET_KEY must be set");
  }
  const magic = getMagicAdmin();
  magic.token.validate(didToken);
  const issuer = magic.token.getIssuer(didToken);
  const metadata = await getUserMetadataByIssuer(
    magic.apiBaseUrl,
    secret,
    issuer,
  );
  if (!metadata.email) {
    const [, claim] = magic.token.decode(didToken);
    const c = claim as unknown as Record<string, unknown>;
    const fromClaim = pickEmailFromDidClaim(c);
    if (fromClaim) {
      return { ...metadata, email: fromClaim };
    }
  }
  return metadata;
};

function pickEmailFromDidClaim(c: Record<string, unknown>): string | null {
  const tryKeys = [
    c.email,
    c.login_email,
    c.em,
    c.public_email,
    c.sub,
  ];
  for (const v of tryKeys) {
    if (typeof v === "string" && v.includes("@")) {
      return v.toLowerCase();
    }
  }
  return null;
}
