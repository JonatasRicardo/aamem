import "server-only";

import { createHash } from "node:crypto";

import { Timestamp } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin";

const RATE_LIMIT_COLLECTION = "rateLimits";

export type RateLimitRule = {
  limit: number;
  windowMs: number;
};

export type RateLimitEntry = RateLimitRule & {
  key: string;
};

export type RateLimitDenial = {
  key: string;
  retryAfterSeconds: number;
};

const MINUTE_MS = 60 * 1000;

export const PRAYER_REQUEST_IP_RULE: RateLimitRule = {
  limit: 5,
  windowMs: 10 * MINUTE_MS,
};

export const PRAYER_REQUEST_TENANT_RULE: RateLimitRule = {
  limit: 60,
  windowMs: 60 * MINUTE_MS,
};

export const PRAYER_CONTACT_IP_RULE: RateLimitRule = {
  limit: 10,
  windowMs: 10 * MINUTE_MS,
};

function rateLimitDocId(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Fixed window counter kept in Firestore so the limit holds across the
 * serverless instances the app is deployed to. Documents carry an `expiresAt`
 * field so a Firestore TTL policy on `rateLimits` can collect them.
 */
async function consumeRateLimit({ key, limit, windowMs }: RateLimitEntry) {
  const db = getAdminDb();
  const ref = db.collection(RATE_LIMIT_COLLECTION).doc(rateLimitDocId(key));

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data() ?? {};
    const now = Date.now();
    const previousWindowStartedAt =
      typeof data.windowStartedAt === "number" ? data.windowStartedAt : 0;
    const isSameWindow = now - previousWindowStartedAt < windowMs;
    const count = isSameWindow ? Number(data.count ?? 0) : 0;

    if (count >= limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((previousWindowStartedAt + windowMs - now) / 1000)
        ),
      };
    }

    const windowStartedAt = isSameWindow ? previousWindowStartedAt : now;

    transaction.set(ref, {
      count: count + 1,
      windowStartedAt,
      expiresAt: Timestamp.fromMillis(windowStartedAt + windowMs),
    });

    return { allowed: true, retryAfterSeconds: 0 };
  });
}

/**
 * Runs the rules in order and returns the first denial, or `null` when every
 * rule still has room.
 *
 * Fails open: if Firestore cannot be reached the request is allowed through,
 * because the write it guards would fail against the same unavailable backend
 * anyway, and blocking every visitor is the worse outcome.
 */
export async function enforceRateLimits(
  entries: RateLimitEntry[]
): Promise<RateLimitDenial | null> {
  for (const entry of entries) {
    try {
      const { allowed, retryAfterSeconds } = await consumeRateLimit(entry);

      if (!allowed) {
        return { key: entry.key, retryAfterSeconds };
      }
    } catch (error) {
      console.warn("[rate-limit] skipped rule", entry.key, error);
    }
  }

  return null;
}
