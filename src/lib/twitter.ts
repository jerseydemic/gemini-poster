import { TwitterApi } from "twitter-api-v2";

// Lazy initialization to prevent build errors when keys are missing
const getTwitterClient = () => {
    const appKey = process.env.TWITTER_APP_KEY;
    const appSecret = process.env.TWITTER_APP_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET;

    if (!appKey || !appSecret || !accessToken || !accessSecret) {
        throw new Error("Twitter API keys are not fully configured in .env");
    }

    return new TwitterApi({
        appKey,
        appSecret,
        accessToken,
        accessSecret,
    });
};

export async function postTweet(text: string, imageUrl?: string) {
    const client = getTwitterClient().readWrite;

    let mediaId;
    if (imageUrl) {
        // In a real scenario, we'd download the image buffer and upload it
        // const mediaId = await client.v1.uploadMedia(imageBuffer, { mimeType: 'image/png' });
        // For now, we'll just post text if image upload logic is complex without real URL
        console.log("Image upload skipped in mock:", imageUrl);
    }

    const tweet = await client.v2.tweet({
        text: text,
        // media: { media_ids: [mediaId] } 
    });

    return tweet;
}


