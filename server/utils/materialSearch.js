/**
 * @desc Course material search utility.
 * Searches extracted text from uploaded course materials
 * to find passages relevant to a student's question or project.
 * Uses keyword frequency scoring — no vectors needed for Beta.
 * This is the retrieval step in the RAG pipeline.
 */
const CourseMaterial = require('../models/CourseMaterial')

/**
 * @desc Score a text passage based on keyword matches.
 * Counts how many times each query keyword appears in the text.
 * Case-insensitive matching.
 * @param {string}        text     - Text to search in
 * @param {Array<string>} keywords - Keywords to look for
 * @returns {number} Match score (higher = more relevant)
 */
function scoreText(text, keywords) {
  if (!text) return 0
  const lowerText = text.toLowerCase()
  let score = 0
  keywords.forEach(keyword => {
    // Count all occurrences of each keyword — more mentions = more relevant
    const regex = new RegExp(keyword.toLowerCase(), 'g')
    const matches = lowerText.match(regex)
    if (matches) score += matches.length
  })
  return score
}

/**
 * @desc Extract the most relevant excerpt from a text
 * around the first keyword match found.
 * Returns up to 500 characters of surrounding context.
 * @param {string}        text     - Full extracted text
 * @param {Array<string>} keywords - Search keywords
 * @returns {string} Relevant text excerpt with ellipsis markers
 */
function extractExcerpt(text, keywords) {
  if (!text) return ''
  const lowerText = text.toLowerCase()
  let bestIndex = -1

  // Find the position of the first keyword match in the text
  for (const keyword of keywords) {
    const idx = lowerText.indexOf(keyword.toLowerCase())
    if (idx !== -1) {
      bestIndex = idx
      break
    }
  }

  if (bestIndex === -1) {
    // No keyword found — return the opening of the text as fallback
    return text.slice(0, 500) + (text.length > 500 ? '...' : '')
  }

  // Return context window around the match (200 chars before, 300 after)
  const start = Math.max(0, bestIndex - 200)
  const end = Math.min(text.length, bestIndex + 300)
  const excerpt = text.slice(start, end)
  return (start > 0 ? '...' : '') + excerpt + (end < text.length ? '...' : '')
}

/**
 * @desc Search course materials for content relevant to a query.
 * Returns the top 3 most relevant material excerpts
 * for use as RAG context in Gemini chat responses.
 * @param {string} query    - Student's question or search term
 * @param {string} courseId - Course ID to search within
 * @returns {Promise<Array>} Top 3 relevant excerpts:
 *   [{ materialId, title, fileName, excerpt, score }]
 */
async function searchMaterials(query, courseId) {
  try {
    // Only search materials that have been fully processed
    const materials = await CourseMaterial.find({
      courseId,
      isActive:      true,
      isProcessed:   true,
      extractedText: { $exists: true, $ne: '' }
    }).select('title fileName extractedText')

    if (materials.length === 0) return []

    // Strip stop words so only meaningful keywords drive scoring
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
      'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were',
      'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'can', 'i', 'my',
      'me', 'we', 'you', 'it', 'this', 'that', 'what', 'how', 'why',
      'when', 'where', 'which', 'who'
    ])
    const keywords = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))

    if (keywords.length === 0) {
      // No meaningful keywords — return the first 3 materials as fallback
      return materials.slice(0, 3).map(m => ({
        materialId: m._id,
        title:      m.title,
        fileName:   m.fileName,
        excerpt:    m.extractedText.slice(0, 500),
        score:      0
      }))
    }

    // Score and rank all materials
    const scored = materials.map(material => ({
      materialId: material._id,
      title:      material.title,
      fileName:   material.fileName,
      score:      scoreText(material.extractedText, keywords),
      excerpt:    extractExcerpt(material.extractedText, keywords)
    }))

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      // When few materials exist include them even with zero score
      .filter(m => m.score > 0 || materials.length <= 3)

  } catch (err) {
    console.error('Material search error:', err)
    return []
  }
}

module.exports = { searchMaterials }
