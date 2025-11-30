import { NextResponse } from "next/server";
import { postTweet } from "@/lib/twitter";
import { postFacebook } from "@/lib/facebook";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { caption, imageUrl, platforms, accounts } = await req.json();

    if (!caption) {
      return NextResponse.json(
        { error: "Caption is required" },
        { status: 400 }
      );
    }

    const results: any = {};
    const targetPlatforms = platforms || ["twitter"];

    // 1. Post to Twitter (X)
    if (targetPlatforms.includes("twitter")) {
      try {
        // Future: Support multiple Twitter accounts via 'accounts' array
        const tweet = await postTweet(caption, imageUrl);
        results.twitter = { success: true, id: tweet.data.id };
      } catch (e: any) {
        console.error("Twitter Error:", e);
        results.twitter = { success: false, error: e.message };
      }
    }

    // 2. Post to Facebook
    if (targetPlatforms.includes("facebook")) {
      try {
        const fbPost = await postFacebook(caption, imageUrl);
        results.facebook = { success: true, id: fbPost.id };
      } catch (e: any) {
        console.error("Facebook Error:", e);
        results.facebook = { success: false, error: e.message };
      }
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error: any) {
    console.error("Posting Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to post" },
      { status: 500 }
    );
  }
}
