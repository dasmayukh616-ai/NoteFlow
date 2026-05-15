import { clerkClient, getAuth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

import { err, ok } from "@/lib/parity-api/response";
import type { UserDto } from "@/lib/parity-api/types";

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) {
    return err("Unauthenticated", "You must be signed in.", 401);
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const primaryEmail =
      user.primaryEmailAddressId == null
        ? null
        : user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)
            ?.emailAddress ?? null;

    const data: UserDto = {
      id: user.id,
      email: primaryEmail,
      name: user.fullName ?? user.firstName ?? null,
      imageUrl: user.imageUrl ?? null,
    };

    return ok(data);
  } catch (error) {
    console.error("GET /api/v1/auth/me failed", error);
    return err("UpstreamUnavailable", "Failed to load current user.", 503);
  }
}
