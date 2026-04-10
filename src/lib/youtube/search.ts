export type YouTubeVideo = {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  videoUrl: string;
};

type YouTubeSearchItem = {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      medium?: { url: string };
      default?: { url: string };
    };
  };
};

type YouTubeSearchResponse = {
  items?: YouTubeSearchItem[];
};

export async function searchYouTube(
  query: string,
  maxResults = 3,
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error("[YouTube] YOUTUBE_API_KEY is not set in environment");
    return [];
  }
  if (apiKey.length < 10) {
    console.error("[YouTube] YOUTUBE_API_KEY looks invalid (too short)");
    return [];
  }

  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    q: query,
    maxResults: String(maxResults),
    key: apiKey,
  });

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[YouTube] API error ${res.status}:`, errText.slice(0, 500));
      return [];
    }

    const data: YouTubeSearchResponse = await res.json();
    if (!data.items?.length) return [];

    return data.items.map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelName: item.snippet.channelTitle,
      thumbnailUrl:
        item.snippet.thumbnails.medium?.url ??
        item.snippet.thumbnails.default?.url ??
        "",
      videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));
  } catch (err) {
    console.error("[YouTube] Search failed:", err);
    return [];
  }
}
