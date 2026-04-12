import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_APP_URL + "/api/calendar/callback"
);

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

export async function GET(req: NextRequest) {
  const { userId } = await getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state: userId, // pass userId so we can match on callback
  });

  return NextResponse.redirect(authUrl);
}
