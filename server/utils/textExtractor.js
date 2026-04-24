/**
 * @desc Text extraction utilities for course materials.
 * Extracts readable text from PDF, Word, PowerPoint,
 * and ZIP files for use in the RAG recommendation system.
 * Extracted text is stored in CourseMaterial.extractedText
 * and searched when generating recommendations.
 */
const pdfParse = require('pdf-parse')
const mammoth = require('mammoth')

/**
 * @desc Extract text from a PDF buffer
 * @param {Buffer} buffer - PDF file content
 * @returns {Promise<string>} Extracted text
 */
async function extractFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer)
    return data.text || ''
  } catch (err) {
    console.error('PDF extraction error:', err.message)
    return ''
  }
}

/**
 * @desc Extract text from a Word document buffer.
 * Supports both .docx and .doc formats via mammoth.
 * @param {Buffer} buffer - Word file content
 * @returns {Promise<string>} Extracted text
 */
async function extractFromDocx(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer })
    return result.value || ''
  } catch (err) {
    console.error('Word extraction error:', err.message)
    return ''
  }
}

/**
 * @desc Extract text from a PowerPoint file buffer.
 * PPTX files are ZIP archives containing XML files.
 * We extract text from the slide XML files directly.
 * @param {Buffer} buffer - PPTX file content
 * @returns {Promise<string>} Extracted text
 */
async function extractFromPptx(buffer) {
  try {
    const JSZip = require('jszip')
    const zip = await JSZip.loadAsync(buffer)
    const slideTexts = []

    // PPTX slide content lives in ppt/slides/slide*.xml
    const slideFiles = Object.keys(zip.files).filter(
      name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
    ).sort()

    for (const slideFile of slideFiles) {
      const content = await zip.files[slideFile].async('string')
      // Extract text between XML tags using regex
      // <a:t> tags contain the actual slide text
      const matches = content.match(/<a:t[^>]*>([^<]+)<\/a:t>/g)
      if (matches) {
        const slideText = matches
          .map(m => m.replace(/<[^>]+>/g, ''))
          .join(' ')
        slideTexts.push(slideText)
      }
    }
    return slideTexts.join('\n')
  } catch (err) {
    console.error('PPTX extraction error:', err.message)
    return ''
  }
}

/**
 * @desc Extract text from a ZIP archive buffer.
 * Processes each supported file inside the ZIP.
 * @param {Buffer} buffer - ZIP file content
 * @returns {Promise<string>} Combined extracted text
 */
async function extractFromZip(buffer) {
  try {
    const JSZip = require('jszip')
    const zip = await JSZip.loadAsync(buffer)
    const texts = []

    for (const [filename, file] of Object.entries(zip.files)) {
      // Skip directories and macOS metadata folders
      if (file.dir || filename.startsWith('__MACOSX')) continue

      const ext = filename.split('.').pop().toLowerCase()
      const supported = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'txt']
      if (!supported.includes(ext)) continue

      try {
        const fileBuffer = await file.async('nodebuffer')
        let text = ''
        if (ext === 'pdf') {
          text = await extractFromPDF(fileBuffer)
        } else if (['docx', 'doc'].includes(ext)) {
          text = await extractFromDocx(fileBuffer)
        } else if (['pptx', 'ppt'].includes(ext)) {
          text = await extractFromPptx(fileBuffer)
        } else if (ext === 'txt') {
          text = fileBuffer.toString('utf8')
        }
        if (text) {
          // Label each file's content with its name for traceability
          texts.push(`=== ${filename} ===\n${text}`)
        }
      } catch (fileErr) {
        console.error(`Error extracting ${filename}:`, fileErr.message)
      }
    }
    return texts.join('\n\n')
  } catch (err) {
    console.error('ZIP extraction error:', err.message)
    return ''
  }
}

/**
 * @desc Extract text from any supported file type.
 * Routes to the correct extractor based on file extension.
 * @param {Buffer} buffer - File content as buffer
 * @param {string} fileType - Extension: pdf/docx/pptx/zip/txt
 * @returns {Promise<string>} Extracted text (max 100000 chars)
 */
async function extractText(buffer, fileType) {
  let text = ''
  const ext = fileType.toLowerCase().replace('.', '')

  if (ext === 'pdf') {
    text = await extractFromPDF(buffer)
  } else if (['docx', 'doc'].includes(ext)) {
    text = await extractFromDocx(buffer)
  } else if (['pptx', 'ppt'].includes(ext)) {
    text = await extractFromPptx(buffer)
  } else if (ext === 'zip') {
    text = await extractFromZip(buffer)
  } else if (ext === 'txt') {
    text = buffer.toString('utf8')
  }

  // Limit stored text to 100000 characters to keep documents manageable
  return text.slice(0, 100000)
}

module.exports = {
  extractText,
  extractFromPDF,
  extractFromDocx,
  extractFromPptx,
  extractFromZip
}
