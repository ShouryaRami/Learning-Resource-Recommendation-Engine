/**
 * @desc YouTube Data API v3 utilities for UMBC Learn.
 * Fetches relevant tutorial videos based on project domain
 * and language. Results are cached in MongoDB for 24 hours
 * to avoid redundant API calls and quota usage.
 */
const mongoose = require('mongoose')

/**
 * @desc Simple cache schema for YouTube search results.
 * Stored in MongoDB as a dedicated collection.
 * TTL index auto-deletes entries after 24 hours.
 * Model is defined lazily to avoid re-definition errors
 * when this module is required multiple times.
 */
let YouTubeCache
try {
  YouTubeCache = mongoose.model('YouTubeCache')
} catch {
  const youtubeCacheSchema = new mongoose.Schema({
    query: { type: String, required: true, unique: true },
    results: [{
      title:        String,
      url:          String,
      thumbnail:    String,
      channelTitle: String,
      description:  String,
      videoId:      String
    }],
    // expires: 86400 seconds = 24 hours TTL index
    cachedAt: { type: Date, default: Date.now, expires: 86400 }
  })
  YouTubeCache = mongoose.model('YouTubeCache', youtubeCacheSchema)
}

/**
 * @desc Fetch YouTube tutorial videos for a project context.
 * Checks MongoDB cache first. Only calls the YouTube API
 * if no valid cached entry exists for this query combination.
 * @param {string} domain     - Project domain e.g. web, ml, mobile
 * @param {string} language   - Programming language e.g. javascript
 * @param {string} skillLevel - beginner/intermediate/advanced
 * @returns {Promise<Array>} Array of video objects:
 *   [{ title, url, thumbnail, channelTitle, description, videoId }]
 */
async function fetchYouTubeVideos(domain, language, skillLevel) {
  if (!process.env.YOUTUBE_API_KEY) {
    console.log('YouTube API key not configured — skipping')
    return []
  }

  // Build a consistent, lowercase cache key from the three params
  const cacheKey = `${domain}_${language}_${skillLevel}`.toLowerCase()

  // Check MongoDB cache before hitting the API
  try {
    const cached = await YouTubeCache.findOne({ query: cacheKey })
    if (cached && cached.results.length > 0) {
      console.log(`YouTube cache hit for: ${cacheKey}`)
      return cached.results
    }
  } catch (cacheErr) {
    console.error('YouTube cache check error:', cacheErr.message)
  }

  // Build a natural-language search query for YouTube
  const searchQuery =
    `${language} ${domain} tutorial ${skillLevel === 'beginner' ? 'for beginners' : ''}`.trim()

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search')
    url.searchParams.set('key',              process.env.YOUTUBE_API_KEY)
    url.searchParams.set('q',               searchQuery)
    url.searchParams.set('part',            'snippet')
    url.searchParams.set('type',            'video')
    url.searchParams.set('maxResults',      '5')
    url.searchParams.set('relevanceLanguage', 'en')
    url.searchParams.set('videoDuration',   'medium')
    url.searchParams.set('order',           'relevance')

    const response = await fetch(url.toString())
    if (!response.ok) {
      console.error('YouTube API error status:', response.status)
      return []
    }

    const data = await response.json()
    if (!data.items || data.items.length === 0) return []

    // Map YouTube API response fields to our internal format
    const results = data.items.map(item => ({
      videoId:      item.id.videoId,
      title:        item.snippet.title,
      url:          `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail:    item.snippet.thumbnails?.medium?.url || '',
      channelTitle: item.snippet.channelTitle,
      description:  item.snippet.description?.slice(0, 150) || ''
    }))

    // Persist to MongoDB cache for 24 hours
    try {
      await YouTubeCache.findOneAndUpdate(
        { query: cacheKey },
        { query: cacheKey, results, cachedAt: new Date() },
        { upsert: true, new: true }
      )
      console.log(`YouTube results cached for: ${cacheKey}`)
    } catch (saveErr) {
      console.error('YouTube cache save error:', saveErr.message)
    }

    return results

  } catch (err) {
    console.error('YouTube fetch error:', err.message)
    return []
  }
}

module.exports = { fetchYouTubeVideos }
