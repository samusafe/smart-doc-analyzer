"use client";
import { SignIn } from "@clerk/nextjs";

export function SignInView() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn />
    </div>
  );
}
