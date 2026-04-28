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
        console.log('Gemini busy, retrying in 2 seconds...')
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
  let systemPrompt =
    `You are a helpful course assistant for ${courseTitle || 'this course'}.\n` +
    `Answer the student's question using ONLY the course material excerpts ` +
    `and instructor tips provided below.\n` +
    `Always cite which material you are referencing by its file name.\n` +
    `If the answer is not covered, say: "This topic is not in your uploaded ` +
    `course materials, but generally..." and provide brief guidance.\n` +
    `Keep responses concise and practical.\n\n`

  if (projectContext) {
    systemPrompt +=
      `STUDENT PROJECT CONTEXT:\n` +
      `Title: "${projectContext.title}" | Language: ${projectContext.language} ` +
      `| Domain: ${projectContext.domain}\n\n`
  }

  systemPrompt += `COURSE MATERIAL EXCERPTS:\n`
  if (materialExcerpts.length > 0) {
    materialExcerpts.forEach((m, i) => {
      systemPrompt += `[${i + 1}] From "${m.title}" (${m.fileName}):\n${m.excerpt}\n\n`
    })
  } else {
    systemPrompt +=
      `No materials have been uploaded yet. Provide helpful general guidance ` +
      `and encourage the student to check back once materials are uploaded.\n\n`
  }

  if (tips.length > 0) {
    systemPrompt += `INSTRUCTOR TIPS FOR THIS COURSE:\n`
    tips.forEach((t, i) => {
      systemPrompt +=
        `[Tip ${i + 1}] ${t.category} — ${t.title}: ${t.content}` +
        (t.toolUrl ? ` (Tool: ${t.toolUrl})` : '') + '\n'
    })
  }

  const text = await callGemini(question, systemPrompt, 600)
  const sources = materialExcerpts
    .filter(m => m.score > 0)
    .map(m => ({ title: m.title, fileName: m.fileName }))

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
    `You are a helpful academic advisor for a software engineering student.\n\n` +
    `The student is working on a project titled "${projectTitle}".\n\n` +
    `They have the following learning resources available in this order:\n` +
    `${materialTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\n` +
    `Write EXACTLY three paragraphs:\n` +
    `Paragraph 1: Explain why studying these resources in this specific order ` +
    `builds the right foundation and what prior knowledge each step assumes.\n` +
    `Paragraph 2: Describe what the student will learn from each resource ` +
    `and how the concepts connect and build on each other.\n` +
    `Paragraph 3: Explain specifically how completing all of these resources ` +
    `will help the student succeed in their "${projectTitle}" project.\n\n` +
    `Rules:\n` +
    `- Write in second person (you/your)\n` +
    `- Keep each paragraph to 3-4 sentences\n` +
    `- Be encouraging, specific, and practical\n` +
    `- Do not add headers or labels to the paragraphs`
  return callGemini(prompt, '', 700)
}

module.exports = { chatWithMaterials, analyzeProposal, generateLearningNarrative }
