import test from "node:test";
import assert from "node:assert/strict";
import { createSupabaseAdmin } from "../src/lib/supabase-admin";

test("admin factory prefers the secret key and disables browser session behavior", () => {
  const calls: unknown[][] = [];
  const environment: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_SECRET_KEY: "new-secret-key",
    SUPABASE_SERVICE_ROLE_KEY: "legacy-key",
  };
  const fakeClient = { kind: "admin" };
  const factory = (...args: unknown[]) => {
    calls.push(args);
    return fakeClient;
  };

  assert.equal(createSupabaseAdmin(environment, factory), fakeClient);
  assert.deepEqual(calls, [
    [
      "https://project.supabase.co",
      "new-secret-key",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    ],
  ]);
});

test("admin factory reads configuration at call time and supports the legacy key", () => {
  const usedKeys: string[] = [];
  const environment: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "legacy-one",
  };
  const factory = (_url: string, key: string) => {
    usedKeys.push(key);
    return { key };
  };

  createSupabaseAdmin(environment, factory);
  environment.SUPABASE_SERVICE_ROLE_KEY = "legacy-two";
  createSupabaseAdmin(environment, factory);
  assert.deepEqual(usedKeys, ["legacy-one", "legacy-two"]);
});

test("admin factory fails without exposing incomplete configuration", () => {
  const privateUrl = "https://private-project.supabase.co";
  assert.throws(
    () =>
      createSupabaseAdmin({ NEXT_PUBLIC_SUPABASE_URL: privateUrl }, () => ({
        unused: true,
      })),
    (error: unknown) =>
      error instanceof Error &&
      !error.message.includes(privateUrl) &&
      !error.message.includes("undefined"),
  );
});
