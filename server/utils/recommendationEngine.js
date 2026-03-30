/**
 * Generates personalized resource recommendations
 * based on student project input.
 *
 * @param {Array} resources - Array of Resource
 *   documents from MongoDB
 * @param {Object} input - Student project input
 * @param {string} input.domain - Project domain
 *   e.g. web, ml, mobile, data, security
 * @param {string} input.language - Programming
 *   language e.g. javascript, python, any
 * @param {string} input.skillLevel - Student level
 *   e.g. beginner, intermediate, advanced
 * @param {string} input.timeline - Project timeline
 * @param {string} input.description - Optional
 *   project description for tag matching
 * @returns {Object} result
 * @returns {Array} result.ranked - Top 10 resources
 *   sorted by relevance score descending
 * @returns {Array} result.learningPath - Same 10
 *   resources sorted by type order for sequencing
 * @returns {number} result.totalFound - Count of
 *   resources after hard filter before slicing
 */

const TYPE_ORDER = {
  documentation: 1,
  tutorial: 2,
  github: 3,
  video: 4,
  article: 5,
};

const getRecommendations = (resources, input) => {
  const { domain, language, skillLevel, description } = input;

  // Step 1 — Hard filter by domain, language,
  // skill level and active status
  const filtered = resources.filter((r) => {
    return (
      r.isActive === true &&
      r.domain === domain &&
      (r.language === language || r.language === 'any' || language === 'any') &&
      r.skillLevel === skillLevel
    );
  });

  const totalFound = filtered.length;

  // Step 2 — Score each resource using weighted
  // formula: baseScore(40%) + rating(30%) +
  // usage(20%) + tagMatch(10%)
  const maxUsage = Math.max(...filtered.map((r) => r.usageCount), 1);

  const scored = filtered.map((r) => {
    const normalizedUsage = (r.usageCount / maxUsage) * 100;

    let tagBonus = 0;
    if (description && description.trim().length > 0) {
      const words = description.toLowerCase().split(/\s+/);
      const matchingTags = (r.tags || []).filter((tag) => words.includes(tag));
      tagBonus = Math.min(matchingTags.length * 25, 100);
    }

    const relevanceScore =
      r.baseScore * 0.4 +
      (r.averageRating / 5) * 30 +
      normalizedUsage * 0.2 +
      tagBonus * 0.1;

    return { ...r.toObject ? r.toObject() : r, relevanceScore };
  });

  // Step 3 — Sort descending by relevance score
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Step 4 — Take top 10 results
  const ranked = scored.slice(0, 10);

  // Step 5 — Build learning path by sorting top 10
  // by resource type: docs → tutorial → github →
  // video → article
  const learningPath = [...ranked].sort((a, b) => {
    const orderA = TYPE_ORDER[a.resourceType] ?? 6;
    const orderB = TYPE_ORDER[b.resourceType] ?? 6;
    if (orderA !== orderB) return orderA - orderB;
    return b.relevanceScore - a.relevanceScore;
  });

  return { ranked, learningPath, totalFound };
};

module.exports = { getRecommendations };
