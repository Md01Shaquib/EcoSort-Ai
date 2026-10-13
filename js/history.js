/**
 * EcoSort AI — Scan History Module
 * Manages classification history using LocalStorage.
 */

const ScanHistory = (() => {
  const STORAGE_KEY = 'ecosort_scan_history';
  const MAX_HISTORY_ITEMS = 50;
  const STATS_KEY = 'ecosort_scan_stats';

  /**
   * Get all history entries.
   * @returns {Array}
   */
  function getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('[ScanHistory] Error reading history:', err);
      return [];
    }
  }

  /**
   * Save a scan result to history.
   * @param {object} result - Classification result.
   * @param {string} [thumbnailDataUrl] - Optional base64 thumbnail.
   * @returns {object} The saved entry.
   */
  function save(result, thumbnailDataUrl = null) {
    const history = getAll();

    const entry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      predictedClass: result.predictedClass || 'Unknown',
      category: result.category || 'unknown',
      confidence: result.confidence || 0,
      itemName: result.itemName || result.predictedClass || 'Unknown',
      isManual: result.isManual || false,
      thumbnail: thumbnailDataUrl ? compressThumbnail(thumbnailDataUrl) : null
    };

    history.unshift(entry);

    // Enforce max history limit
    if (history.length > MAX_HISTORY_ITEMS) {
      history.splice(MAX_HISTORY_ITEMS);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      updateStats(entry.category);
    } catch (err) {
      console.error('[ScanHistory] Error saving history:', err);
      // If quota exceeded, remove thumbnails from older entries
      if (err.name === 'QuotaExceededError') {
        clearThumbnails();
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        } catch (e) {
          console.error('[ScanHistory] Still cannot save after clearing thumbnails:', e);
        }
      }
    }

    return entry;
  }

  /**
   * Delete a single history entry by ID.
   * @param {string} id
   * @returns {boolean}
   */
  function deleteEntry(id) {
    const history = getAll();
    const filtered = history.filter(entry => entry.id !== id);
    if (filtered.length === history.length) return false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (err) {
      console.error('[ScanHistory] Error deleting entry:', err);
      return false;
    }
  }

  /**
   * Clear all history.
   */
  function clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STATS_KEY);
    } catch (err) {
      console.error('[ScanHistory] Error clearing history:', err);
    }
  }

  /**
   * Get scan statistics.
   * @returns {object}
   */
  function getStats() {
    try {
      const data = localStorage.getItem(STATS_KEY);
      const defaults = {
        totalScans: 0,
        recyclable: 0,
        organic: 0,
        ewaste: 0,
        non_recyclable: 0,
        unknown: 0
      };
      return data ? { ...defaults, ...JSON.parse(data) } : defaults;
    } catch (err) {
      return { totalScans: 0, recyclable: 0, organic: 0, ewaste: 0, non_recyclable: 0, unknown: 0 };
    }
  }

  /**
   * Update stats after a scan.
   * @param {string} category
   */
  function updateStats(category) {
    const stats = getStats();
    stats.totalScans = (stats.totalScans || 0) + 1;
    if (stats.hasOwnProperty(category)) {
      stats[category] = (stats[category] || 0) + 1;
    } else {
      stats.unknown = (stats.unknown || 0) + 1;
    }
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (err) {
      console.error('[ScanHistory] Error updating stats:', err);
    }
  }

  /**
   * Get the count of history entries.
   * @returns {number}
   */
  function getCount() {
    return getAll().length;
  }

  /**
   * Get recent entries (limited count).
   * @param {number} count
   * @returns {Array}
   */
  function getRecent(count = 5) {
    return getAll().slice(0, count);
  }

  /**
   * Generate a unique ID.
   * @returns {string}
   */
  function generateId() {
    return 'scan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Compress thumbnail to reduce storage size.
   * @param {string} dataUrl
   * @returns {string}
   */
  function compressThumbnail(dataUrl) {
    // Create a small canvas for compression
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      // For synchronous usage, we just return the data URL
      // Compression happens at capture time via canvas
      // Here we just truncate if too long
      if (dataUrl.length > 50000) {
        return null; // Skip storing very large thumbnails
      }
      return dataUrl;
    } catch {
      return null;
    }
  }

  /**
   * Remove all thumbnails from history to save space.
   */
  function clearThumbnails() {
    const history = getAll();
    for (const entry of history) {
      entry.thumbnail = null;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      console.error('[ScanHistory] Error clearing thumbnails:', err);
    }
  }

  return {
    getAll,
    save,
    deleteEntry,
    clearAll,
    getStats,
    getCount,
    getRecent
  };
})();
