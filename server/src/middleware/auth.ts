import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../services/supabaseAdmin.js";

// Anon client for verifying user JWTs (auth.getUser respects the token)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export interface AuthenticatedRequest extends Request {
  userId: string;
  userEmail: string;
  subscriptionStatus: string;
}

export async function verifyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  // Fetch profile to check subscription status
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    res.status(401).json({ error: "User profile not found" });
    return;
  }

  if (profile.subscription_status !== "active") {
    res.status(402).json({ error: "subscription_required" });
    return;
  }

  const authedReq = req as AuthenticatedRequest;
  authedReq.userId = user.id;
  authedReq.userEmail = user.email ?? "";
  authedReq.subscriptionStatus = profile.subscription_status;

  next();
}
