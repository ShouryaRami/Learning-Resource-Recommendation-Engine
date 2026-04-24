/**
 * @desc GitHub Search API utilities for UMBC Learn.
 * Fetches relevant open-source repositories based on project
 * domain and language. No API key required — uses public
 * search endpoint (60 requests/hr unauthenticated).
 * Domain topics are mapped to commonly used GitHub topics.
 */

/**
 * Maps broad project domains to specific GitHub topic tags.
 * GitHub topics are community-driven labels on repositories.
 * Using established topics improves relevance of results.
 */
const domainTopics = {
  web:      'web-development',
  ml:       'machine-learning',
  mobile:   'mobile',
  data:     'data-science',
  security: 'cybersecurity',
  general:  'programming',
  backend:  'backend',
  frontend: 'frontend',
  api:      'rest-api',
  database: 'database'
}

/**
 * @desc Fetch relevant GitHub repositories for a project context.
 * Searches by language and domain topic with a minimum star
 * threshold of 50 to surface quality, maintained repositories.
 * Results are sorted by stars descending.
 * @param {string} domain   - Project domain e.g. web, ml, mobile
 * @param {string} language - Programming language e.g. javascript
 * @returns {Promise<Array>} Array of repo objects:
 *   [{ name, url, stars, description, language, owner }]
 */
async function fetchGitHubRepos(domain, language) {
  try {
    // Map domain to the closest GitHub topic label
    const topic = domainTopics[domain?.toLowerCase()] || 'programming'

    // Build GitHub Search query: topic + language filter + star threshold
    const query = `topic:${topic} language:${language} stars:>50`

    const url = new URL('https://api.github.com/search/repositories')
    url.searchParams.set('q',        query)
    url.searchParams.set('sort',     'stars')
    url.searchParams.set('order',    'desc')
    url.searchParams.set('per_page', '5')

    // GitHub requires a User-Agent header for all API requests
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'UMBC-Learn-App',
        'Accept':     'application/vnd.github.v3+json'
      }
    })

    if (!response.ok) {
      console.error('GitHub API error status:', response.status)
      return []
    }

    const data = await response.json()
    if (!data.items || data.items.length === 0) return []

    // Filter out tooling repos (validators, linters, etc.) that are
    // not useful as learning resources for the project topic
    const skipKeywords = [
      'validator', 'checker', 'linter', 'formatter', 'parser',
      'vnu', 'spec', 'benchmark', 'test-suite', 'boilerplate-generator'
    ]
    const filtered = data.items.filter(repo => {
      const combined = ((repo.name || '') + ' ' + (repo.description || '')).toLowerCase()
      return !skipKeywords.some(kw => combined.includes(kw))
    })

    // Map GitHub API response fields to our internal format
    return filtered.map(repo => ({
      name:        repo.name,
      url:         repo.html_url,
      stars:       repo.stargazers_count,
      description: repo.description?.slice(0, 150) || '',
      language:    repo.language || language,
      owner:       repo.owner?.login || ''
    }))

  } catch (err) {
    console.error('GitHub fetch error:', err.message)
    return []
  }
}

module.exports = { fetchGitHubRepos }
