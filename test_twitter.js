require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

async function testTwitter() {
    console.log("Testing Twitter Configuration...");
    
    const appKey = process.env.TWITTER_APP_KEY;
    const appSecret = process.env.TWITTER_APP_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET;

    if (!appKey || !appSecret || !accessToken || !accessSecret) {
        console.error("FAILURE: Missing one or more Twitter API keys.");
        return;
    }

    const client = new TwitterApi({
        appKey,
        appSecret,
        accessToken,
        accessSecret,
    });

    try {
        const rwClient = client.readWrite;
        const result = await rwClient.v2.tweet("Hello world! Testing Gemini Poster integration. 🚀");
        console.log("SUCCESS: Tweet posted!", result);
    } catch (error) {
        console.error("FAILURE: Could not post tweet.", error);
    }
}

testTwitter();
