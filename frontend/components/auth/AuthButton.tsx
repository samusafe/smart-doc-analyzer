"use client";

import { SignedIn, SignedOut, UserButton, SignInButton, useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useSetAuthToken } from "../providers/AppProviders";

export function AuthButton() {
  const { getToken, isSignedIn } = useAuth();
  const setToken = useSetAuthToken();

  useEffect(() => {
    let cancelled = false;
    async function syncToken() {
      try {
        const t = await getToken({ template: 'backend' }).catch(() => getToken());
        if (!cancelled) setToken(t || undefined);
      } catch {
        if (!cancelled) setToken(undefined);
      }
    }
    syncToken();
    // Re-sync on visibility + every 2 minutes to avoid expiry
    const vis = () => { if (document.visibilityState === 'visible') syncToken(); };
    document.addEventListener('visibilitychange', vis);
    const interval = setInterval(syncToken, 2 * 60 * 1000);
    return () => { cancelled = true; document.removeEventListener('visibilitychange', vis); clearInterval(interval); };
  }, [getToken, isSignedIn, setToken]);

  return (
    <div className="flex items-center gap-2">
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="text-sm font-medium px-3 py-1 rounded-md border">Sign in</button>
        </SignInButton>
      </SignedOut>
    </div>
  );
}
