import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { transactionState, getAdminDbMock } = vi.hoisted(() => {
  const state = {
    data: undefined as Record<string, unknown> | undefined,
    written: undefined as Record<string, unknown> | undefined,
    failWith: undefined as Error | undefined,
  };

  const db = {
    collection: () => ({ doc: () => ({}) }),
    runTransaction: async (
      fn: (transaction: {
        get: () => Promise<{ data: () => Record<string, unknown> | undefined }>;
        set: (ref: unknown, value: Record<string, unknown>) => void;
      }) => Promise<unknown>
    ) => {
      if (state.failWith) {
        throw state.failWith;
      }

      return fn({
        get: async () => ({ data: () => state.data }),
        set: (_ref, value) => {
          state.written = value;
        },
      });
    },
  };

  return { transactionState: state, getAdminDbMock: vi.fn(() => db) };
});

vi.mock("@/lib/firebase/admin", () => ({ getAdminDb: getAdminDbMock }));
vi.mock("firebase-admin/firestore", () => ({
  Timestamp: { fromMillis: (ms: number) => ({ toMillis: () => ms }) },
}));

import { enforceRateLimits } from "./rate-limit";

const RULE = { key: "test:ip:1.2.3.4", limit: 3, windowMs: 60_000 };

describe("enforceRateLimits", () => {
  beforeEach(() => {
    transactionState.data = undefined;
    transactionState.written = undefined;
    transactionState.failWith = undefined;
  });

  it("allows the first hit and records the window", async () => {
    const denial = await enforceRateLimits([RULE]);

    expect(denial).toBeNull();
    expect(transactionState.written).toMatchObject({ count: 1 });
  });

  it("increments within the same window", async () => {
    transactionState.data = { count: 1, windowStartedAt: Date.now() };

    const denial = await enforceRateLimits([RULE]);

    expect(denial).toBeNull();
    expect(transactionState.written).toMatchObject({ count: 2 });
  });

  it("denies once the limit is reached, with a retry hint", async () => {
    transactionState.data = { count: 3, windowStartedAt: Date.now() };

    const denial = await enforceRateLimits([RULE]);

    expect(denial).not.toBeNull();
    expect(denial?.key).toBe(RULE.key);
    expect(denial?.retryAfterSeconds).toBeGreaterThan(0);
    expect(denial?.retryAfterSeconds).toBeLessThanOrEqual(60);
    expect(transactionState.written).toBeUndefined();
  });

  it("resets the counter when the window has passed", async () => {
    transactionState.data = {
      count: 3,
      windowStartedAt: Date.now() - 61_000,
    };

    const denial = await enforceRateLimits([RULE]);

    expect(denial).toBeNull();
    expect(transactionState.written).toMatchObject({ count: 1 });
  });

  it("fails open when Firestore is unavailable", async () => {
    transactionState.failWith = new Error("firestore down");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const denial = await enforceRateLimits([RULE]);

    expect(denial).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("returns the first denial across multiple rules", async () => {
    transactionState.data = { count: 99, windowStartedAt: Date.now() };

    const denial = await enforceRateLimits([
      { ...RULE, key: "first" },
      { ...RULE, key: "second" },
    ]);

    expect(denial?.key).toBe("first");
  });
});
