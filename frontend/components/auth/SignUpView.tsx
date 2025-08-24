"use client";
import { SignUp } from "@clerk/nextjs";

export function SignUpView() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp />
    </div>
  );
}
