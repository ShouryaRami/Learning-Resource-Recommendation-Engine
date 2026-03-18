/**
 * getRecommendations — pure recommendation engine function.
 * No database calls, no Express. Accepts pre-fetched resources and
 * project input, returns ranked results and a sequenced learning path.
 *
 * @param {Array} resources - Full array of Resource documents from MongoDB
 * @param {Object} input - Project input from the student
 * @param {string} input.domain - e.g. 'web', 'ml', 'mobile'
 * @param {string} input.language - e.g. 'javascript', 'python', 'any'
 * @param {string} input.skillLevel - 'beginner', 'intermediate', or 'advanced'
 * @param {string} [input.timeline] - optional, e.g. '1week', 'semester'
 * @param {string} [input.description] - optional free text for tag matching
 *
 * @returns {{ ranked: Array, learningPath: Array, totalFound: number }}
 *   ranked      — top 10 resources sorted by relevanceScore descending
 *   learningPath — same 10 resources sorted by resource type learning order
 *   totalFound  — count of resources that passed the hard filter
 *
 * Steps:
 *   1. Hard filter by domain, language, skillLevel, isActive
 *   2. Score each resource using baseScore, averageRating,
 *      normalised usageCount, and optional tag match bonus
 *   3. Sort descending by relevanceScore
 *   4. Slice top 10
 *   5. Build learningPath by re-sorting top 10 by resource type order:
 *      documentation → tutorial → github → video → article → other
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

  // Step 1 — Hard filter
  const filtered = resources.filter((r) => {
    return (
      r.isActive === true &&
      r.domain === domain &&
      (r.language === language || r.language === 'any' || language === 'any') &&
      r.skillLevel === skillLevel
    );
  });

  const totalFound = filtered.length;

  // Step 2 — Score
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

  // Step 3 — Sort descending by relevanceScore
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Step 4 — Top 10
  const ranked = scored.slice(0, 10);

  // Step 5 — Learning path: re-sort top 10 by resource type order
  const learningPath = [...ranked].sort((a, b) => {
    const orderA = TYPE_ORDER[a.resourceType] ?? 6;
    const orderB = TYPE_ORDER[b.resourceType] ?? 6;
    if (orderA !== orderB) return orderA - orderB;
    return b.relevanceScore - a.relevanceScore;
  });

  return { ranked, learningPath, totalFound };
};

module.exports = { getRecommendations };
