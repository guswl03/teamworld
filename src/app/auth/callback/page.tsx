"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { useSession } from "@/components/session-provider";
let exchange: { code: string; promise: Promise<unknown> } | null = null;
export default function Callback() {
  const { refresh } = useSession();
  const router = useRouter();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function complete() {
      try {
        const params = new URLSearchParams(location.search);
        const code = params.get("code");
        if (params.has("error") || !code)
          throw new Error("GitHub 로그인이 취소되었거나 연결이 만료되었어요.");
        if (!exchange || exchange.code !== code)
          exchange = {
            code,
            promise: getSupabase()
              .auth.exchangeCodeForSession(code)
              .then((result) => {
                if (result.error) throw result.error;
              }),
          };
        await exchange.promise;
        if (!active) return;
        sessionStorage.removeItem("teamworld:demo");
        history.replaceState({}, "", "/auth/callback");
        await refresh();
        if (active) router.replace("/world");
      } catch {
        if (active)
          setError(
            "로그인을 완료하지 못했어요. 처음 화면에서 GitHub 로그인을 다시 시도해 주세요.",
          );
      }
    }
    void complete();
    return () => {
      active = false;
    };
  }, [refresh, router]);
  return (
    <main className="centered-state">
      <span className="large-spark">✦</span>
      <h1>{error ? "다시 연결해 볼까요?" : "모험가를 확인하고 있어요"}</h1>
      <p role={error ? "alert" : "status"}>
        {error || "잠시 후 월드로 안내할게요."}
      </p>
      {error && (
        <Link href="/" className="button primary">
          처음으로
        </Link>
      )}
    </main>
  );
}
