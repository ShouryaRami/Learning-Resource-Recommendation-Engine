/**
 * @desc Gemini 2.5 Flash API wrapper for UMBC Learn.
 * Used for three purposes:
 *   1. RAG chat grounded in course material text
 *   2. Project proposal analysis
 *   3. Learning path narrative generation
 * Falls back gracefully if GEMINI_API_KEY is not set
 * so the app never crashes due to missing AI key.
 */
const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/` +
  `${GEMINI_MODEL}:generateContent`

/**
 * @desc Core Gemini API call function.
 * All other functions in this module call this one.
 * Retries once on 503 (high demand) with a 2-second delay.
 * @param {string} prompt - The user message or question
 * @param {string} systemPrompt - System instruction for the model
 * @param {number} maxTokens - Max output tokens default 800
 * @returns {Promise<string>} Generated text response
 */
async function callGemini(prompt, systemPrompt = '', maxTokens = 800) {
  // Return fallback message if API key not configured
  if (!process.env.GEMINI_API_KEY) {
    return 'AI assistant is not configured. Please ask your instructor for help.'
  }
  try {
    const body = {
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.4
      }
    }
    // Only add systemInstruction if we have a system prompt
    if (systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: systemPrompt }]
      }
    }

    const response = await fetch(
      `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    )

    if (!response.ok) {
      const errData = await response.json()
      const status = errData.error?.code
      const errMsg = errData.error?.message || 'Unknown error'
      console.error(`Gemini API error ${status}: ${errMsg}`)

      // For 503 high demand errors retry once after 2 seconds
      if (status === 503 && !body._retried) {
        console.error('Gemini busy, retrying in 2 seconds...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        const retryBody = { ...body, _retried: true }
        const retryResponse = await fetch(
          `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(retryBody)
          }
        )
        if (retryResponse.ok) {
          const retryData = await retryResponse.json()
          return retryData.candidates?.[0]?.content?.parts?.[0]?.text
            || 'No response generated.'
        }
      }

      return 'AI service is temporarily busy. Please try again in a moment.'
    }

    const data = await response.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
    return reply || 'No response generated.'

  } catch (err) {
    console.error('Gemini call error:', err.message)
    return 'AI service encountered an error. Please try again.'
  }
}

/**
 * @desc Chat with student using course material as context.
 * This is the RAG implementation — relevant material excerpts and
 * instructor tips are injected into the system prompt so Gemini
 * answers based on the professor's actual content, not generic knowledge.
 * @param {string} question - Student's question
 * @param {string} courseTitle - Name of the course
 * @param {Array}  materialExcerpts - { title, fileName, excerpt, score }
 * @param {Object} projectContext - Optional { title, domain, language }
 * @param {Array}  tips - Instructor tips { category, title, content, toolUrl }
 * @returns {Promise<{ text: string, sources: Array }>}
 */
async function chatWithMaterials(
  question,
  courseTitle = '',
  materialExcerpts = [],
  projectContext = null,
  tips = []
) {
  const hasMaterials = materialExcerpts && materialExcerpts.length > 0
  const hasTips      = tips && tips.length > 0

  let contextSection = ''

  if (hasMaterials) {
    contextSection += '\n\nCOURSE MATERIALS:\n'
    contextSection += materialExcerpts.map((m, i) =>
      `[Material ${i + 1}: ${m.fileName || m.title || 'Course Material'}]\n` +
      `${m.excerpt || m.text || m.content || ''}`
    ).join('\n\n')
  }

  if (hasTips) {
    contextSection += '\n\nINSTRUCTOR TIPS FOR THIS COURSE:\n'
    contextSection += tips.map((t, i) =>
      `Tip ${i + 1} (${t.category || 'tip'}): ${t.title}\n${t.content}` +
      (t.toolUrl ? `\nTool: ${t.toolUrl}` : '')
    ).join('\n\n')
  }

  const projectLine = projectContext
    ? `Student project: ${projectContext.title || ''} | Domain: ${projectContext.domain || ''} | Language: ${projectContext.language || ''}`
    : ''

  const systemPrompt =
    `You are a helpful AI assistant for the course "${courseTitle || 'this course'}" at UMBC.\n` +
    `Help students with their project and course questions.\n` +
    `${projectLine}\n` +
    `${contextSection}\n\n` +
    `IMPORTANT INSTRUCTIONS:\n` +
    `- If the answer is found in the course materials or instructor tips above, ` +
    `use that information and mention which material or tip it came from.\n` +
    `- If the topic is NOT in the materials or tips then start with: ` +
    `"This specific topic is not covered in your course materials, but generally..."\n` +
    `- Always be helpful, specific, and practical.\n` +
    `- If an instructor tip mentions a tool, include it.`

  const text = await callGemini(question, systemPrompt, 600)
  const sources = [
    ...(materialExcerpts || [])
      .filter(m => m.score > 0)
      .map(m => ({ type: 'material', fileName: m.fileName || m.title })),
    ...(tips || [])
      .map(t => ({ type: 'tip', fileName: t.title }))
  ]

  return { text, sources }
}

/**
 * @desc Analyze a student project proposal.
 * Provides scope assessment and suggestions for the student
 * and a summary for the instructor reviewing the pitch.
 * @param {string} proposalText - The project description or proposal content
 * @param {string} courseTitle - Course the project is for
 * @returns {Promise<string>} Analysis and suggestions
 */
async function analyzeProposal(proposalText, courseTitle = '') {
  const prompt =
    `Analyze this student project proposal for the course "${courseTitle}".\n\n` +
    `PROPOSAL:\n${proposalText}\n\n` +
    `Provide a brief analysis covering:\n` +
    `1. Project scope assessment (is it feasible for one semester?)\n` +
    `2. Suggested technologies or approaches to consider\n` +
    `3. Potential challenges to watch out for\n` +
    `4. One recommendation to strengthen the proposal\n\n` +
    `Keep the response under 200 words and practical.`
  return callGemini(prompt, '', 400)
}

/**
 * @desc Generate a 2-3 paragraph learning path guide for the student.
 * Explains why the resources are in a specific order, what each
 * one covers, and how studying them will help complete the project.
 * @param {string}        projectTitle   - Student's project title
 * @param {Array<string>} materialTitles - Material names in sequence order
 * @returns {Promise<string>} Multi-paragraph learning guide
 */
async function generateLearningNarrative(projectTitle, materialTitles = []) {
  if (materialTitles.length === 0) {
    return 'Start by reviewing your course materials to build a strong foundation for your project.'
  }
  const prompt =
    `You are a helpful academic advisor for a software engineering student at UMBC.\n\n` +
    `The student is working on a project titled: "${projectTitle}"\n\n` +
    `Their available learning resources are:\n` +
    `${materialTitles.join(', ')}\n\n` +
    `Write exactly 3 paragraphs as a learning guide:\n\n` +
    `Paragraph 1: Why these resources are the right starting point and what they cover. (3-4 sentences)\n\n` +
    `Paragraph 2: What the student will learn from each resource and the recommended study order. (3-4 sentences)\n\n` +
    `Paragraph 3: How completing these resources will directly help them build this specific project. (3-4 sentences)\n\n` +
    `Write in second person. Be encouraging and specific. Do not use bullet points. Prose only. Write all 3 paragraphs completely without stopping.`
  return callGemini(prompt, '', 800)
}

module.exports = { chatWithMaterials, analyzeProposal, generateLearningNarrative }
