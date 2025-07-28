"use client";

import { useUser } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

export default function AuthStatusPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Authentication Status</h1>
        
        {user ? (
          <div className="space-y-4">
            <p className="text-green-600 font-semibold">✅ You are signed in</p>
            <div className="space-y-2">
              <p><strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}</p>
              <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
              <p><strong>User ID:</strong> {user.id}</p>
            </div>
            
            <div className="space-y-2 pt-4">
              <Link href="/dashboard" className="block w-full bg-blue-500 text-white p-2 rounded text-center">
                Go to Dashboard
              </Link>
              
              <SignOutButton>
                <button className="w-full bg-red-500 text-white p-2 rounded">
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-red-600 font-semibold">❌ You are not signed in</p>
            
            <div className="space-y-2">
              <Link href="/sign-in" className="block w-full bg-blue-500 text-white p-2 rounded text-center">
                Sign In
              </Link>
              
              <Link href="/sign-up" className="block w-full bg-green-500 text-white p-2 rounded text-center">
                Sign Up
              </Link>
            </div>
          </div>
        )}
        
        <Link href="/" className="block text-center text-blue-500 mt-4">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}