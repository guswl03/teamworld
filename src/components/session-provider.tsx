"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { DEFAULT_TEAMS, WORLD_ID } from "@/lib/data";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { validProfile, validateNickname } from "@/lib/profile";
import type { Profile, Team } from "@/lib/types";

interface SessionContext {
  loading: boolean;
  demo: boolean;
  user: User | null;
  profile: Profile | null;
  teams: Team[];
  error: string;
  startDemo(): void;
  refresh(): Promise<void>;
  save(
    input: Pick<Profile, "nickname" | "team_id" | "avatar_type" | "status">,
  ): Promise<void>;
  logout(): Promise<void>;
}
const Context = createContext<SessionContext | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teams, setTeams] = useState<Team[]>(DEFAULT_TEAMS);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (sessionStorage.getItem("teamworld:demo") === "true") {
        setDemo(true);
        setTeams(DEFAULT_TEAMS);
        setUser(null);
        let stored: unknown = null;
        try {
          stored = JSON.parse(
            sessionStorage.getItem("teamworld:profile") || "null",
          );
        } catch {
          /* Ignore invalid local demo data. */
        }
        setProfile(validProfile(stored, DEFAULT_TEAMS) ? stored : null);
        return;
      }
      setDemo(false);
      if (!isConfigured) {
        setUser(null);
        setProfile(null);
        return;
      }
      const client = getSupabase();
      const { data: session } = await client.auth.getSession();
      if (!session.session) {
        setUser(null);
        setProfile(null);
        return;
      }
      const { data, error: authError } = await client.auth.getUser();
      if (authError)
        throw new Error("로그인이 만료되었어요. 다시 로그인해 주세요.");
      setUser(data.user);
      const [teamResult, profileResult] = await Promise.all([
        client
          .from("teams")
          .select("*")
          .eq("world_id", WORLD_ID)
          .order("sort_order"),
        client
          .from("profiles")
          .select("*")
          .eq("id", data.user!.id)
          .eq("world_id", WORLD_ID)
          .maybeSingle(),
      ]);
      if (teamResult.error || profileResult.error)
        throw new Error(
          "월드 정보를 불러오지 못했어요. 관리자에게 데이터베이스 설정을 확인해 달라고 요청해 주세요.",
        );
      if (!teamResult.data.length)
        throw new Error(
          "아직 이 월드의 초대 명단에 없어요. 관리자에게 GitHub 계정 초대를 요청해 주세요.",
        );
      setTeams(teamResult.data as Team[]);
      setProfile(profileResult.data as Profile | null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "월드에 연결하지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!isConfigured) return;
    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_OUT" &&
        sessionStorage.getItem("teamworld:demo") !== "true"
      ) {
        setUser(null);
        setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  function startDemo() {
    sessionStorage.setItem("teamworld:demo", "true");
    setDemo(true);
    setUser(null);
    setProfile(null);
    setTeams(DEFAULT_TEAMS);
    setError("");
    setLoading(false);
  }
  async function save(
    input: Pick<Profile, "nickname" | "team_id" | "avatar_type" | "status">,
  ) {
    const nicknameError = validateNickname(input.nickname);
    if (nicknameError) throw new Error(nicknameError);
    const candidate: Profile = {
      ...input,
      nickname: input.nickname.trim(),
      world_id: WORLD_ID,
      id: profile?.id || user?.id || crypto.randomUUID(),
    };
    if (!validProfile(candidate, teams))
      throw new Error("캐릭터와 소속 길드를 다시 선택해 주세요.");
    if (demo)
      sessionStorage.setItem("teamworld:profile", JSON.stringify(candidate));
    else {
      if (!user) throw new Error("먼저 GitHub로 로그인해 주세요.");
      const client = getSupabase();
      const fields = {
        nickname: candidate.nickname,
        avatar_type: candidate.avatar_type,
        team_id: candidate.team_id,
        status: candidate.status,
      };
      const result = profile
        ? await client
            .from("profiles")
            .update(fields)
            .eq("id", user.id)
            .select()
            .single()
        : await client
            .from("profiles")
            .insert({ ...fields, id: user.id, world_id: WORLD_ID })
            .select()
            .single();
      if (result.error)
        throw new Error(
          "프로필을 저장하지 못했어요. 연결 상태와 월드 초대 권한을 확인해 주세요.",
        );
      setProfile(result.data as Profile);
      return;
    }
    setProfile(candidate);
  }
  async function logout() {
    if (!demo && isConfigured) {
      const { error } = await getSupabase().auth.signOut();
      if (error) throw new Error("로그아웃하지 못했어요. 다시 시도해 주세요.");
    }
    sessionStorage.removeItem("teamworld:demo");
    sessionStorage.removeItem("teamworld:profile");
    setUser(null);
    setProfile(null);
    setDemo(false);
    setError("");
  }
  return (
    <Context.Provider
      value={{
        loading,
        demo,
        user,
        profile,
        teams,
        error,
        startDemo,
        refresh,
        save,
        logout,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error("SessionProvider is missing");
  return value;
}
