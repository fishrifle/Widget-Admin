"use client";

import { useAuth, useUser } from "@clerk/nextjs";

export default function TestAuthPage() {
  const { userId, isSignedIn } = useAuth();
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading auth state...</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Clerk Authentication Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Auth Status:</h2>
          <p>Is Signed In: {isSignedIn ? 'Yes' : 'No'}</p>
          <p>User ID: {userId || 'None'}</p>
        </div>

        {user && (
          <div className="p-4 border rounded">
            <h2 className="font-semibold">User Info:</h2>
            <p>Email: {user.emailAddresses[0]?.emailAddress}</p>
            <p>Name: {user.firstName} {user.lastName}</p>
            <p>Created: {user.createdAt?.toLocaleDateString()}</p>
          </div>
        )}

        <div className="p-4 border rounded">
          <h2 className="font-semibold">Environment Check:</h2>
          <p>Publishable Key: {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Set' : 'Missing'}</p>
        </div>

        <div className="space-x-4">
          <a href="/sign-in" className="bg-blue-500 text-white px-4 py-2 rounded">Sign In</a>
          <a href="/sign-up" className="bg-green-500 text-white px-4 py-2 rounded">Sign Up</a>
          <a href="/dashboard" className="bg-purple-500 text-white px-4 py-2 rounded">Dashboard</a>
        </div>
      </div>
    </div>
  );
}