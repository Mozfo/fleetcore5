/**
 * Better Auth — Catch-all API Route
 *
 * Handles all /api/auth/* requests (sign-in, sign-up, session, etc.)
 *
 * @module app/api/auth/[...all]/route
 */

import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
