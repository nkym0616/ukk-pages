import { PAGES_URL } from "@shared/pages";

export const API_ORIGIN = (import.meta.env.VITE_API_URL || "").replace(
  /\/$/,
  ""
);
export const isPages = Boolean(API_ORIGIN);
export const apiUrl = (path: string) => `${API_ORIGIN}${path}`;
const SESSION_KEY = "ukk-pages-session";
const FLOW_KEY = "ukk-pages-login";
const random = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), n =>
    n.toString(16).padStart(2, "0")
  ).join("");

export function getPagesToken(): string | null {
  try {
    const data = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    if (
      typeof data?.token !== "string" ||
      !/^ukk_[a-f0-9]{64}$/.test(data.token) ||
      Date.parse(data.expiresAt) <= Date.now()
    ) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return data.token;
  } catch {
    return null;
  }
}
export function clearPagesSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(FLOW_KEY);
  } catch {}
}
export async function beginPagesLogin() {
  if (!isPages || window.location.href.split(/[?#]/)[0] !== PAGES_URL)
    throw new Error("正規の公開URLからログインしてください");
  const verifier = random();
  const state = random();
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  const challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  sessionStorage.setItem(
    FLOW_KEY,
    JSON.stringify({ verifier, state, expiresAt: Date.now() + 10 * 60_000 })
  );
  const url = new URL(apiUrl("/api/auth/google/start"));
  url.search = new URLSearchParams({
    returnTo: PAGES_URL,
    pages_challenge: challenge,
    pages_state: state,
  }).toString();
  window.location.assign(url.toString());
}
export async function completePagesLogin() {
  if (!isPages || !window.location.hash.includes("ukk_code")) return;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const code = params.get("ukk_code");
  const state = params.get("ukk_state");
  // Remove short-lived codes before loading third-party resources or making API calls.
  history.replaceState(null, "", window.location.pathname);
  const flow = JSON.parse(sessionStorage.getItem(FLOW_KEY) || "null");
  sessionStorage.removeItem(FLOW_KEY);
  if (!code || !flow || flow.state !== state || flow.expiresAt <= Date.now())
    throw new Error(
      "ログインの開始情報が一致しません。もう一度ログインしてください。"
    );
  const response = await fetch(apiUrl("/api/auth/pages/exchange"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    body: JSON.stringify({ code, verifier: flow.verifier }),
  });
  const data = await response.json();
  if (!response.ok || !/^ukk_[a-f0-9]{64}$/.test(data.token || ""))
    throw new Error(data.error || "ログインの確認に失敗しました");
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ token: data.token, expiresAt: data.expiresAt })
  );
}
