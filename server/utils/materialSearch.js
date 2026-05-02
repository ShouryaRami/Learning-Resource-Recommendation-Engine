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
 * Returns the top 3 scored excerpts, or top 2 as fallback when
 * no keywords match — so Gemini always has course context.
 * @param {string} query    - Student's question or search term
 * @param {string} courseId - Course ID to search within
 * @returns {Promise<Array>} Relevant excerpts:
 *   [{ materialId, title, fileName, excerpt, score }]
 */
async function searchMaterials(query, courseId) {
  try {
    const materials = await CourseMaterial.find({
      courseId,
      isActive:            true,
      isProcessed:         true,
      isVisibleToStudents: true
    })

    if (!materials.length) return []

    const tokens = tokenize(query)

    const scored = materials.map(m => {
      const text = (
        (m.title || '') + ' ' +
        (m.extractedText || '')
      ).toLowerCase()

      let score = 0
      if (tokens.length > 0) {
        score = scoreText(text, tokens)
      }
      return { material: m, score }
    })

    scored.sort((a, b) => b.score - a.score)

    // If any scored above 0 return top 3; otherwise return top 2 as fallback
    // so Gemini always has course material context to work with
    const hasMatches = scored.some(s => s.score > 0)
    const selected = hasMatches
      ? scored.filter(s => s.score > 0).slice(0, 3)
      : scored.slice(0, 2)

    return selected.map(({ material, score }) => ({
      materialId: material._id.toString(),
      title:      material.title,
      fileName:   material.fileName,
      excerpt:    (material.extractedText || '').slice(0, 1200),
      score
    }))

  } catch (err) {
    console.error('searchMaterials error:', err.message)
    return []
  }
}

/**
 * @desc Search CourseTip content using keyword scoring.
 * Scores tips by keyword frequency across title, content, and category.
 * Falls back to returning top 2 tips when no keywords match,
 * because instructor tips are always course-relevant context.
 * @param {string} query    - Search query string
 * @param {string} courseId - Course to search tips in
 * @returns {Promise<Array>} Top scored tip results (up to 3)
 */
async function searchTips(query, courseId) {
  try {
    const tips = await CourseTip.find({
      courseId,
      isActive:            true,
      isVisibleToStudents: true
    }).populate('createdBy', 'fullName')

    if (!tips.length) return []

    const tokens = tokenize(query)

    const scored = tips.map(tip => {
      const text = (
        tip.title + ' ' +
        tip.content + ' ' +
        tip.category
      ).toLowerCase()

      let score = 0
      if (tokens.length > 0) {
        score = scoreText(text, tokens)
      }
      return { tip, score }
    })

    scored.sort((a, b) => b.score - a.score)

    // If any tips scored return top 3 scored; otherwise return top 2 as fallback
    const hasMatches = scored.some(s => s.score > 0)
    const selected = hasMatches
      ? scored.filter(s => s.score > 0).slice(0, 3)
      : scored.slice(0, 2)

    return selected.map(({ tip }) => ({
      tipId:     tip._id.toString(),
      title:     tip.title,
      content:   tip.content,
      category:  tip.category,
      toolUrl:   tip.toolUrl || '',
      createdBy: tip.createdBy?.fullName || 'Instructor',
      source:    'instructor_tip'
    }))
  } catch (err) {
    console.error('searchTips error:', err.message)
    return []
  }
}

module.exports = { searchMaterials, searchTips }
