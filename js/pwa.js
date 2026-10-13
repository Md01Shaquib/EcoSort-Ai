/**
 * EcoSort AI — PWA Module
 * Handles Service Worker registration and app install prompt.
 */

const PWAManager = (() => {
  let deferredPrompt = null;
  let isInstalled = false;
  let installButton = null;

  /**
   * Initialize PWA features.
   * @param {HTMLElement} [installBtn] - Optional install button element.
   */
  function init(installBtn) {
    installButton = installBtn;

    registerServiceWorker();
    listenForInstallPrompt();
    checkIfInstalled();

    if (installButton) {
      installButton.addEventListener('click', promptInstall);
      updateInstallButton();
    }
  }

  /**
   * Register the service worker.
   */
  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js', {
        scope: './'
      });
      console.log('[PWA] Service Worker registered:', registration.scope);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('[PWA] New service worker activated');
            }
          });
        }
      });
    } catch (err) {
      console.error('[PWA] Service Worker registration failed:', err);
    }
  }

  /**
   * Listen for the beforeinstallprompt event.
   */
  function listenForInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      console.log('[PWA] Install prompt captured');
      updateInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      isInstalled = true;
      deferredPrompt = null;
      console.log('[PWA] App installed successfully');
      updateInstallButton();
    });
  }

  /**
   * Check if the app is already installed (running in standalone mode).
   */
  function checkIfInstalled() {
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
      isInstalled = true;
    }
  }

  /**
   * Show the install prompt.
   * @returns {Promise<boolean>}
   */
  async function promptInstall() {
    if (!deferredPrompt) {
      console.log('[PWA] No install prompt available');
      // Show manual install instructions
      showManualInstallInstructions();
      return false;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install outcome:', outcome);

    if (outcome === 'accepted') {
      isInstalled = true;
    }

    deferredPrompt = null;
    updateInstallButton();
    return outcome === 'accepted';
  }

  /**
   * Update the install button visibility and state.
   */
  function updateInstallButton() {
    if (!installButton) return;

    if (isInstalled) {
      installButton.style.display = 'none';
    } else if (deferredPrompt) {
      installButton.style.display = 'flex';
      installButton.classList.add('animate-pulse-subtle');
    } else {
      // Show button but clicking will show manual instructions
      installButton.style.display = 'flex';
      installButton.classList.remove('animate-pulse-subtle');
    }
  }

  /**
   * Show manual install instructions when the native prompt is not available.
   */
  function showManualInstallInstructions() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    let instructions = '';

    if (isIOS) {
      instructions = 'To install EcoSort AI on iOS:\n\n1. Tap the Share button (square with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm';
    } else if (isAndroid) {
      instructions = 'To install EcoSort AI on Android:\n\n1. Tap the menu (⋮) in your browser\n2. Tap "Add to Home Screen" or "Install App"\n3. Tap "Install" to confirm';
    } else {
      instructions = 'To install EcoSort AI:\n\n1. Click the install icon in your browser\'s address bar\n2. Or use your browser\'s menu to "Install App"';
    }

    alert(instructions);
  }

  /**
   * Check if the install prompt is available.
   * @returns {boolean}
   */
  function canInstall() {
    return !!deferredPrompt;
  }

  /**
   * Check if app is installed.
   * @returns {boolean}
   */
  function getIsInstalled() {
    return isInstalled;
  }

  return {
    init,
    promptInstall,
    canInstall,
    getIsInstalled,
    updateInstallButton
  };
})();
