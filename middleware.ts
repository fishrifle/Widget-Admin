// ──────────────────────────────────────────────────────────────────────────────
// File: middleware.ts    ← must live at the project root (next to package.json)
// ──────────────────────────────────────────────────────────────────────────────
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // run on all routes except Next internals & static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
