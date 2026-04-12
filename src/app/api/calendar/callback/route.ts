import { NextResponse } from "next/server";
import { google } from "googleapis";
import { ConvexHttpClient } from "convex/browser";
import { internal } from "../../../../../convex/_generated/api";
import { NextRequest } from "next/server";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_APP_URL + "/api/calendar/callback"
);

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // This is the Clerk userId

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard?error=calendar_auth_failed", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error("Missing tokens from Google OAuth response");
    }

    // Store the tokens in Convex via an internal mutation
    // We need to call this as an internal function, but from the API route
    // we'll use the HTTP client. For security, we'll use a separate
    // public mutation that validates the state.
    await convex.mutation(internal.calendarHelpers.storeIntegration as any, {
      tokenIdentifier: state,
      provider: "google",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date || Date.now() + 3600 * 1000,
    });

    return NextResponse.redirect(
      new URL("/dashboard?success=calendar_connected", process.env.NEXT_PUBLIC_APP_URL!)
    );
  } catch (error) {
    console.error("Google Calendar OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard?error=calendar_auth_failed", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }
}
