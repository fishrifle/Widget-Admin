// app/layout.tsx
import "./globals.css";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export const metadata = {
  title: "PassItOn Admin",
  description: "Admin portal for PassItOn",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body suppressHydrationWarning={true} className="bg-gray-50 min-h-screen">
          <SignedOut>
            <header className="p-4 border-b border-gray-200 bg-white shadow-sm">
              <div className="container mx-auto flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">PassItOn</h1>
                <div className="flex gap-3">
                  <SignInButton mode="modal">
                    <button className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium">Sign In</button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Sign Up</button>
                  </SignUpButton>
                </div>
              </div>
            </header>
          </SignedOut>
          <main className="min-h-screen">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  )
}
