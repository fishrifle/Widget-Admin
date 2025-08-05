import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SignInPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl",
            socialButtonsBlockButton: "w-full",
            socialButtonsBlockButtonText: "font-medium",
          },
        }}
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}
