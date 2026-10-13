/**
 * EcoSort AI — UI Module
 * Handles theme toggling, animations, toasts, and UI utility functions.
 */

const UIManager = (() => {
  const THEME_KEY = 'ecosort_theme';
  let currentTheme = 'light';

  /**
   * Initialize UI — load saved theme, set up reduced motion.
   */
  function init() {
    loadSavedTheme();
    applyTheme(currentTheme);
    respectReducedMotion();
  }

  /**
   * Load saved theme preference.
   */
  function loadSavedTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') {
        currentTheme = saved;
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        currentTheme = 'dark';
      }
    } catch {
      currentTheme = 'light';
    }
  }

  /**
   * Apply theme to document.
   * @param {string} theme
   */
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch { /* ignore */ }

    // Update theme-color meta
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.content = theme === 'dark' ? '#1a1a2e' : '#059669';
    }

    // Update toggle button icon
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      const icon = toggleBtn.querySelector('[data-lucide]');
      if (icon) {
        icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }
  }

  /**
   * Toggle between light and dark themes.
   */
  function toggleTheme() {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }

  /**
   * Get current theme.
   * @returns {string}
   */
  function getTheme() {
    return currentTheme;
  }

  /**
   * Respect user's reduced motion preferences.
   */
  function respectReducedMotion() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('reduce-motion');
    }
  }

  /**
   * Show a toast notification.
   * @param {string} message
   * @param {string} [type='info'] - 'info', 'success', 'warning', 'error'
   * @param {number} [duration=3500]
   */
  function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconName = {
      info: 'info',
      success: 'check-circle',
      warning: 'alert-triangle',
      error: 'alert-circle'
    }[type] || 'info';

    toast.innerHTML = `
      <i data-lucide="${iconName}" class="w-5 h-5 flex-shrink-0"></i>
      <span class="flex-1">${escapeHtml(message)}</span>
      <button onclick="this.parentElement.remove()" class="ml-2 opacity-60 hover:opacity-100" aria-label="Dismiss">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    `;

    container.appendChild(toast);
    if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [toast] });

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('toast-visible');
    });

    // Auto-remove
    setTimeout(() => {
      toast.classList.remove('toast-visible');
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 350);
    }, duration);
  }

  /**
   * Show or hide a loading overlay on an element.
   * @param {HTMLElement} element
   * @param {boolean} show
   * @param {string} [message='Processing...']
   */
  function setLoading(element, show, message = 'Processing...') {
    if (!element) return;

    const existingOverlay = element.querySelector('.loading-overlay');

    if (show && !existingOverlay) {
      const overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `
        <div class="loading-spinner"></div>
        <p class="mt-3 text-sm font-medium loading-text">${escapeHtml(message)}</p>
      `;
      element.style.position = 'relative';
      element.appendChild(overlay);
    } else if (!show && existingOverlay) {
      existingOverlay.remove();
    } else if (show && existingOverlay) {
      const text = existingOverlay.querySelector('.loading-text');
      if (text) text.textContent = message;
    }
  }

  /**
   * Update loading message text.
   * @param {HTMLElement} element
   * @param {string} message
   */
  function updateLoadingMessage(element, message) {
    if (!element) return;
    const text = element.querySelector('.loading-text');
    if (text) text.textContent = message;
  }

  /**
   * Smooth scroll to an element.
   * @param {string|HTMLElement} target
   */
  function scrollTo(target) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * Escape HTML entities.
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Format a date for display.
   * @param {string} isoString
   * @returns {string}
   */
  function formatDate(isoString) {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return '';
    }
  }

  /**
   * Animate a number counting up.
   * @param {HTMLElement} element
   * @param {number} target
   * @param {number} [duration=800]
   */
  function animateNumber(element, target, duration = 800) {
    if (!element) return;
    const start = parseInt(element.textContent) || 0;
    const range = target - start;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      element.textContent = Math.round(start + range * eased);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  /**
   * Create a confidence bar element.
   * @param {number} percentage
   * @param {string} color
   * @returns {HTMLElement}
   */
  function createConfidenceBar(percentage, color) {
    const container = document.createElement('div');
    container.className = 'confidence-bar-container';

    const bar = document.createElement('div');
    bar.className = 'confidence-bar';
    bar.style.backgroundColor = color;
    bar.style.width = '0%';

    container.appendChild(bar);

    // Animate after insertion
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.width = percentage + '%';
      });
    });

    return container;
  }

  return {
    init,
    toggleTheme,
    getTheme,
    applyTheme,
    showToast,
    setLoading,
    updateLoadingMessage,
    scrollTo,
    escapeHtml,
    formatDate,
    animateNumber,
    createConfidenceBar
  };
})();
