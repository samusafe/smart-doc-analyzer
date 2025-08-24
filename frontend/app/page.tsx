import FileAnalyzer from "@/components/analysis/FileAnalyzer";
import { SignedOut } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-12">
      <div className="w-full max-w-7xl">
        <FileAnalyzer />
        <SignedOut>
          <p className="mt-8 text-center text-sm text-gray-500">
            Sign in to save analyses and collections.
          </p>
        </SignedOut>
      </div>
    </main>
  );
}
