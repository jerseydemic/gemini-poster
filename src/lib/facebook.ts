export async function postFacebook(message: string, imageUrl?: string) {
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

    if (!pageId || !accessToken) {
        throw new Error("FACEBOOK_PAGE_ID or FACEBOOK_ACCESS_TOKEN is not set");
    }

    const baseUrl = `https://graph.facebook.com/v19.0/${pageId}`;
    let url;
    let body;

    if (imageUrl) {
        url = `${baseUrl}/photos`;
        body = {
            url: imageUrl,
            caption: message,
            access_token: accessToken,
            published: true
        };
    } else {
        url = `${baseUrl}/feed`;
        body = {
            message: message,
            access_token: accessToken,
            published: true
        };
    }

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error?.message || "Failed to post to Facebook");
    }

    return data;
}
