export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'YOUTUBE_API_KEY is not configured' });
  }

  try {
    const queries = [
      'ライブ配信 最新ニュース',
      'ライバー VTuber',
      'ライブコマース',
      'ゲーム実況 配信',
    ];

    const allItems = [];

    for (const q of queries) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&order=date&relevanceLanguage=ja&q=${encodeURIComponent(q)}&key=${apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.error(`YouTube API error for query "${q}": ${response.status}`);
        continue;
      }

      const data = await response.json();
      if (data.items) {
        allItems.push(...data.items);
      }
    }

    // Remove duplicates by videoId
    const seen = new Set();
    const unique = allItems.filter(item => {
      const id = item.id.videoId;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    // Format response
    const videos = unique.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }));

    return res.status(200).json({ videos });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
