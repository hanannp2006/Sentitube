export interface YouTubeChannel {
    id: string;
    title: string;
    description: string;
    customUrl: string;
    publishedAt: string;
    thumbnails: {
        default: { url: string };
        medium: { url: string };
        high: { url: string };
    };
    statistics: {
        viewCount: string;
        subscriberCount: string;
        videoCount: string;
    };
}

export interface YouTubeVideo {
    id: string;
    title: string;
    thumbnail: string;
    publishedAt: string;
}

const API_KEY = process.env.YOUTUBE_API_KEY;

export async function fetchChannelData(handleOrUrl: string) {
    if (!API_KEY || API_KEY === 'your_youtube_api_key_here') {
        throw new Error('YouTube API Key is missing. Please add it to your .env.local file.');
    }

    let handle = handleOrUrl.trim();

    // Extract handle from URL if necessary
    if (handle.includes('youtube.com/')) {
        const parts = handle.split('/');
        const lastPart = parts[parts.length - 1];
        if (lastPart.startsWith('@')) {
            handle = lastPart;
        }
    }

    // Ensure handle starts with @ for forHandle parameter
    if (handle.startsWith('@')) {
        handle = handle.substring(1);
    }

    // 1. Get Channel ID and basic details using handle
    const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${handle}&key=${API_KEY}`
    );

    const channelData = await channelResponse.json();

    if (!channelData.items || channelData.items.length === 0) {
        // Fallback: search for the channel if handle lookup fails
        const searchResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${handle}&type=channel&key=${API_KEY}`
        );
        const searchData = await searchResponse.json();

        if (!searchData.items || searchData.items.length === 0) {
            throw new Error('Channel not found');
        }

        const channelId = searchData.items[0].id.channelId;
        return fetchChannelDataById(channelId);
    }

    const channel = channelData.items[0];
    const channelId = channel.id;

    // 2. Get latest 12 videos
    const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=12&order=date&type=video&key=${API_KEY}`
    );
    const videosData = await videosResponse.json();

    const videos: YouTubeVideo[] = (videosData.items || []).map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        publishedAt: item.snippet.publishedAt,
    }));

    return {
        channel: {
            id: channel.id,
            title: channel.snippet.title,
            profilePicture: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.medium?.url || channel.snippet.thumbnails.default?.url,
            subscriberCount: channel.statistics.subscriberCount,
        },
        videos,
    };
}

async function fetchChannelDataById(channelId: string) {
    const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${API_KEY}`
    );
    const channelData = await channelResponse.json();
    const channel = channelData.items[0];

    const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=12&order=date&type=video&key=${API_KEY}`
    );
    const videosData = await videosResponse.json();

    const videos: YouTubeVideo[] = (videosData.items || []).map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        publishedAt: item.snippet.publishedAt,
    }));

    return {
        channel: {
            id: channel.id,
            title: channel.snippet.title,
            profilePicture: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.medium?.url || channel.snippet.thumbnails.default?.url,
            subscriberCount: channel.statistics.subscriberCount,
        },
        videos,
    };
}
