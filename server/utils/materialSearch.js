/**
 * @desc Course material search utility.
 * Searches extracted text from uploaded course materials
 * to find passages relevant to a student's question or project.
 * Uses keyword frequency scoring — no vectors needed for Beta.
 * This is the retrieval step in the RAG pipeline.
 */
const CourseMaterial = require('../models/CourseMaterial')
const CourseTip = require('../models/CourseTip')

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

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
  'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were',
  'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'can', 'i', 'my',
  'me', 'we', 'you', 'it', 'this', 'that', 'what', 'how', 'why',
  'when', 'where', 'which', 'who'
])

/**
 * @desc Extract meaningful keywords from a query string.
 * Strips stop words and very short tokens.
 * @param {string} query - Raw search query
 * @returns {Array<string>} Filtered keyword list
 */
function tokenize(query) {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
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

    const keywords = tokenize(query)

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

/**
 * @desc Search CourseTip content using keyword scoring.
 * Works the same as searchMaterials but queries the CourseTip
 * collection. Only returns tips visible to students.
 * @param {string} query    - Search query string
 * @param {string} courseId - Course to search tips in
 * @returns {Promise<Array>} Top 2 scored tip results
 */
async function searchTips(query, courseId) {
  try {
    const tips = await CourseTip.find({
      courseId,
      isActive:            true,
      isVisibleToStudents: true
    }).populate('createdBy', 'fullName')

    if (!tips.length) return []

    const keywords = tokenize(query)
    if (!keywords.length) return []

    const scored = tips
      .map(tip => {
        const text = (tip.title + ' ' + tip.content).toLowerCase()
        const score = scoreText(text, keywords)
        return { tip, score }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)

    return scored.map(({ tip }) => ({
      tipId:     tip._id.toString(),
      title:     tip.title,
      content:   tip.content,
      category:  tip.category,
      toolUrl:   tip.toolUrl || '',
      createdBy: tip.createdBy?.fullName || 'Instructor',
      source:    'instructor_tip'
    }))
  } catch (err) {
    console.error('searchTips error:', err)
    return []
  }
}

module.exports = { searchMaterials, searchTips }
