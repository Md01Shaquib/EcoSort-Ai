/**
 * EcoSort AI — Disposal Rules Module
 * Loads and queries waste disposal rules from the JSON data file.
 */

const DisposalRules = (() => {
  let rulesData = null;
  let isLoaded = false;

  /**
   * Load waste rules from the JSON file.
   * @returns {Promise<boolean>} True if loaded successfully.
   */
  async function loadRules() {
    if (isLoaded && rulesData) return true;
    try {
      const response = await fetch('./data/waste-rules.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      rulesData = await response.json();
      isLoaded = true;
      console.log('[DisposalRules] Loaded', rulesData.items.length, 'waste items');
      return true;
    } catch (err) {
      console.error('[DisposalRules] Failed to load waste rules:', err);
      return false;
    }
  }

  /**
   * Get category metadata (color, icon, label, description).
   * @param {string} categoryId - e.g., "recyclable", "organic", "ewaste"
   * @returns {object|null}
   */
  function getCategoryInfo(categoryId) {
    if (!rulesData || !rulesData.categories) return null;
    return rulesData.categories[categoryId] || rulesData.categories['unknown'];
  }

  /**
   * Find the best matching waste item for a model prediction class.
   * @param {string} predictedClass - The class name from the model prediction.
   * @returns {object|null} The matching waste item, or null.
   */
  function findItemByModelClass(predictedClass) {
    if (!rulesData || !rulesData.items) return null;
    const normalized = predictedClass.toLowerCase().trim();

    // Direct match on modelClasses
    for (const item of rulesData.items) {
      for (const mc of item.modelClasses) {
        if (mc.toLowerCase() === normalized) return item;
      }
    }

    // Fuzzy match on names
    for (const item of rulesData.items) {
      for (const name of item.names) {
        if (name.toLowerCase() === normalized) return item;
      }
    }

    // Partial match
    for (const item of rulesData.items) {
      for (const mc of item.modelClasses) {
        if (normalized.includes(mc.toLowerCase()) || mc.toLowerCase().includes(normalized)) {
          return item;
        }
      }
      for (const name of item.names) {
        if (normalized.includes(name.toLowerCase()) || name.toLowerCase().includes(normalized)) {
          return item;
        }
      }
    }

    return null;
  }

  /**
   * Get disposal instructions for a predicted class.
   * @param {string} predictedClass - The class from model prediction.
   * @param {string} [city] - Optional city for regional rules.
   * @returns {object} Structured disposal information.
   */
  function getDisposalInfo(predictedClass, city = null) {
    const item = findItemByModelClass(predictedClass);

    if (!item) {
      return {
        found: false,
        itemName: predictedClass,
        category: 'unknown',
        categoryInfo: getCategoryInfo('unknown'),
        disposalMethod: 'We could not find specific disposal instructions for this item. Please check local waste management guidelines.',
        preparation: [],
        warnings: ['When in doubt, contact your local municipal authority for guidance.'],
        specialNotes: '',
        regionalInfo: null,
        sources: []
      };
    }

    const categoryInfo = getCategoryInfo(item.category);

    // Get regional rule
    let regionalInfo = null;
    if (city && item.regionalRules) {
      regionalInfo = item.regionalRules[city] || item.regionalRules['default'] || null;
    } else if (item.regionalRules) {
      regionalInfo = item.regionalRules['default'] || null;
    }

    return {
      found: true,
      itemId: item.id,
      itemName: item.names[0],
      category: item.category,
      categoryInfo,
      disposalMethod: item.disposalMethod,
      preparation: item.preparation || [],
      warnings: item.warnings || [],
      specialNotes: item.specialNotes || '',
      regionalInfo,
      sources: item.sources || [],
      lastVerified: item.lastVerified
    };
  }

  /**
   * Get all categories.
   * @returns {object}
   */
  function getAllCategories() {
    if (!rulesData) return {};
    return rulesData.categories;
  }

  /**
   * Get city list.
   * @returns {Array}
   */
  function getCities() {
    if (!rulesData) return [];
    return rulesData.cities || [];
  }

  /**
   * Get city info by name.
   * @param {string} cityName
   * @returns {object|null}
   */
  function getCityInfo(cityName) {
    if (!rulesData || !rulesData.cities) return null;
    return rulesData.cities.find(c => c.name.toLowerCase() === cityName.toLowerCase()) || null;
  }

  /**
   * Get general guidance (composting, e-waste, etc.)
   * @returns {object}
   */
  function getGeneralGuidance() {
    if (!rulesData) return {};
    return rulesData.generalGuidance || {};
  }

  /**
   * Get all waste items.
   * @returns {Array}
   */
  function getAllItems() {
    if (!rulesData) return [];
    return rulesData.items;
  }

  /**
   * Get items by category.
   * @param {string} category
   * @returns {Array}
   */
  function getItemsByCategory(category) {
    if (!rulesData) return [];
    return rulesData.items.filter(item => item.category === category);
  }

  /**
   * Get the confidence threshold from rules config.
   * @returns {number}
   */
  function getConfidenceThreshold() {
    if (!rulesData) return 0.65;
    return rulesData.confidenceThreshold || 0.65;
  }

  return {
    loadRules,
    getCategoryInfo,
    findItemByModelClass,
    getDisposalInfo,
    getAllCategories,
    getCities,
    getCityInfo,
    getGeneralGuidance,
    getAllItems,
    getItemsByCategory,
    getConfidenceThreshold
  };
})();
