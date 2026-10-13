/**
 * EcoSort AI — Main Application Module
 * Orchestrates all modules and handles the primary user workflows.
 */

const App = (() => {
  // State
  let currentMode = 'idle'; // 'idle', 'camera', 'upload', 'result'
  let capturedImageData = null;
  let lastClassificationResult = null;
  let currentThumbnail = null;

  /**
   * Initialize the entire application.
   */
  async function init() {
    console.log('[App] Initializing EcoSort AI...');

    // Initialize UI (theme, animations)
    UIManager.init();

    // Initialize location module
    LocationManager.init();

    // Initialize PWA
    const installBtn = document.getElementById('install-btn');
    PWAManager.init(installBtn);

    // Load disposal rules
    const rulesLoaded = await DisposalRules.loadRules();
    if (!rulesLoaded) {
      UIManager.showToast('Could not load disposal rules. Some features may be limited.', 'warning');
    }

    // Initialize camera
    const videoEl = document.getElementById('camera-video');
    const canvasEl = document.getElementById('camera-canvas');
    CameraManager.init(videoEl, canvasEl);

    // Check URL parameters for reset/clear command
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('reset') || urlParams.has('clear')) {
      try {
        localStorage.removeItem('ecosort_model_url');
      } catch { /* ignore */ }
      Classifier.reset();
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check for saved model URL
    loadModelUrlFromStorage();

    // Bind all event listeners
    bindEventListeners();

    // Render initial UI state
    renderHistorySection();
    renderStatsSection();
    renderCitySelector();
    renderDisposalGuide();
    updateModelStatus();

    // Try loading model if URL is configured
    if (Classifier.isConfigured()) {
      loadModelWithUI();
    }

    console.log('[App] Initialization complete');
  }

  /**
   * Load model URL from localStorage.
   */
  function loadModelUrlFromStorage() {
    try {
      const savedUrl = localStorage.getItem('ecosort_model_url');
      if (savedUrl) {
        Classifier.setModelUrl(savedUrl);
        const input = document.getElementById('model-url-input');
        if (input) input.value = savedUrl;
      }
    } catch { /* ignore */ }
  }

  /**
   * Save model URL to localStorage.
   * @param {string} url
   */
  function saveModelUrl(url) {
    try {
      localStorage.setItem('ecosort_model_url', url);
    } catch { /* ignore */ }
  }

  /**
   * Load the model with UI feedback.
   */
  async function loadModelWithUI() {
    const statusEl = document.getElementById('model-status');
    const statusText = document.getElementById('model-status-text');
    const statusIcon = document.getElementById('model-status-icon');

    if (statusEl) statusEl.classList.remove('hidden');
    if (statusText) statusText.textContent = 'Loading AI model...';
    if (statusIcon) {
      statusIcon.setAttribute('data-lucide', 'loader-2');
      statusIcon.className = 'w-4 h-4 animate-spin';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    const result = await Classifier.loadModel((msg) => {
      if (statusText) statusText.textContent = msg;
    });

    if (result.success) {
      if (statusText) statusText.textContent = 'AI model ready';
      if (statusIcon) {
        statusIcon.setAttribute('data-lucide', 'check-circle');
        statusIcon.className = 'w-4 h-4 text-emerald-500';
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
      UIManager.showToast('AI model loaded successfully!', 'success');
      setTimeout(() => {
        if (statusEl) statusEl.classList.add('opacity-0');
        setTimeout(() => { if (statusEl) statusEl.classList.add('hidden'); }, 500);
      }, 3000);
    } else {
      if (statusText) statusText.textContent = result.error || 'Model failed to load';
      if (statusIcon) {
        statusIcon.setAttribute('data-lucide', 'alert-circle');
        statusIcon.className = 'w-4 h-4 text-red-500';
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
      UIManager.showToast(result.error || 'Failed to load AI model', 'error', 5000);
    }

    updateModelStatus();
  }

  /**
   * Update the model status display.
   */
  function updateModelStatus() {
    const status = Classifier.getStatus();
    const setupPanel = document.getElementById('model-setup-panel');

    // Keep setup panel open if model is not configured or not loaded
    if (!status.isConfigured || !status.isLoaded) {
      if (setupPanel) setupPanel.classList.remove('hidden');
    } else {
      if (setupPanel) setupPanel.classList.add('hidden');
    }
  }

  // =====================================================
  // EVENT LISTENERS
  // =====================================================

  function bindEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => UIManager.toggleTheme());
    }

    // Toggle model setup panel from navbar
    const toggleModelBtn = document.getElementById('toggle-model-panel-btn');
    if (toggleModelBtn) {
      toggleModelBtn.addEventListener('click', handleToggleModelPanel);
    }

    // Model URL form
    const modelForm = document.getElementById('model-url-form');
    if (modelForm) {
      modelForm.addEventListener('submit', handleModelUrlSubmit);
    }

    // Reset Model URL button
    const resetModelBtn = document.getElementById('reset-model-btn');
    if (resetModelBtn) {
      resetModelBtn.addEventListener('click', handleResetModel);
    }

    // Open Camera button
    const openCameraBtn = document.getElementById('open-camera-btn');
    if (openCameraBtn) {
      openCameraBtn.addEventListener('click', handleOpenCamera);
    }

    // Upload Image button
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        document.getElementById('file-input')?.click();
      });
    }

    // File input
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
      fileInput.addEventListener('change', handleFileUpload);
    }

    // Camera controls
    const captureBtn = document.getElementById('capture-btn');
    if (captureBtn) captureBtn.addEventListener('click', handleCapture);

    const switchCameraBtn = document.getElementById('switch-camera-btn');
    if (switchCameraBtn) switchCameraBtn.addEventListener('click', handleSwitchCamera);

    const closeCameraBtn = document.getElementById('close-camera-btn');
    if (closeCameraBtn) closeCameraBtn.addEventListener('click', handleCloseCamera);

    // Upload preview controls
    const classifyUploadBtn = document.getElementById('classify-upload-btn');
    if (classifyUploadBtn) classifyUploadBtn.addEventListener('click', handleClassifyUpload);

    const clearUploadBtn = document.getElementById('clear-upload-btn');
    if (clearUploadBtn) clearUploadBtn.addEventListener('click', handleClearUpload);

    // Result controls
    const scanAnotherBtn = document.getElementById('scan-another-btn');
    if (scanAnotherBtn) scanAnotherBtn.addEventListener('click', handleScanAnother);

    const saveResultBtn = document.getElementById('save-result-btn');
    if (saveResultBtn) saveResultBtn.addEventListener('click', handleSaveResult);

    // History clear
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', handleClearHistory);

    // Manual classification buttons
    document.querySelectorAll('[data-manual-category]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.currentTarget.dataset.manualCategory;
        handleManualClassify(category);
      });
    });

    // City selector
    const citySelect = document.getElementById('city-select');
    if (citySelect) {
      citySelect.addEventListener('change', handleCityChange);
    }

    // Detect location button
    const detectLocationBtn = document.getElementById('detect-location-btn');
    if (detectLocationBtn) {
      detectLocationBtn.addEventListener('click', handleDetectLocation);
    }

    // Quick category cards
    document.querySelectorAll('[data-category-info]').forEach(card => {
      card.addEventListener('click', (e) => {
        const category = e.currentTarget.dataset.categoryInfo;
        showCategoryDetail(category);
      });
    });

    // Close camera on page unload
    window.addEventListener('beforeunload', () => {
      if (CameraManager.getIsActive()) {
        CameraManager.stop();
      }
    });

    // Handle visibility change — pause/stop camera
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && CameraManager.getIsActive()) {
        // Don't stop, just let the browser handle it
        console.log('[App] Page hidden, camera still active');
      }
    });
  }

  // =====================================================
  // MODEL URL HANDLING
  // =====================================================

  function handleModelUrlSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('model-url-input');
    if (!input) return;

    const url = input.value.trim();
    if (!url) {
      UIManager.showToast('Please enter a valid Teachable Machine model URL.', 'warning');
      return;
    }

    Classifier.setModelUrl(url);
    saveModelUrl(url);
    loadModelWithUI();
  }

  function handleResetModel() {
    Classifier.reset();
    try {
      localStorage.removeItem('ecosort_model_url');
    } catch { /* ignore */ }

    const input = document.getElementById('model-url-input');
    if (input) input.value = '';

    const statusEl = document.getElementById('model-status');
    if (statusEl) statusEl.classList.add('hidden');

    const setupPanel = document.getElementById('model-setup-panel');
    if (setupPanel) setupPanel.classList.remove('hidden');

    UIManager.showToast('Model URL cleared. You can enter a new URL or use the app manually.', 'info');
    updateModelStatus();
  }

  function handleToggleModelPanel() {
    const setupPanel = document.getElementById('model-setup-panel');
    if (setupPanel) {
      setupPanel.classList.toggle('hidden');
      if (!setupPanel.classList.contains('hidden')) {
        setupPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  // =====================================================
  // CAMERA WORKFLOW
  // =====================================================

  async function handleOpenCamera() {
    if (!CameraManager.isSupported()) {
      UIManager.showToast('Camera is not supported in this browser. Try uploading an image instead.', 'error');
      return;
    }

    if (!Classifier.isConfigured()) {
      UIManager.showToast('Please configure your AI model URL first before scanning.', 'warning');
      UIManager.scrollTo('#model-setup-panel');
      return;
    }

    // Show camera view
    showSection('camera');
    const cameraView = document.getElementById('camera-view');
    if (cameraView) {
      UIManager.setLoading(cameraView, true, 'Requesting camera access...');
    }

    const result = await CameraManager.start('environment');

    if (cameraView) {
      UIManager.setLoading(cameraView, false);
    }

    if (result.success) {
      currentMode = 'camera';
      // Show/hide switch button based on available cameras
      const switchBtn = document.getElementById('switch-camera-btn');
      if (switchBtn) {
        switchBtn.style.display = CameraManager.hasMultipleCameras() ? 'flex' : 'none';
      }
    } else {
      UIManager.showToast(result.error, 'error', 5000);
      showSection('scanner');
    }
  }

  async function handleSwitchCamera() {
    const result = await CameraManager.switchCamera();
    if (!result.success) {
      UIManager.showToast(result.error || 'Could not switch camera.', 'error');
    }
  }

  function handleCloseCamera() {
    CameraManager.stop();
    currentMode = 'idle';
    showSection('scanner');
  }

  async function handleCapture() {
    if (!CameraManager.getIsActive()) return;

    // Check if model is loaded
    const status = Classifier.getStatus();
    if (!status.isLoaded) {
      if (!status.isConfigured) {
        UIManager.showToast('Please configure your AI model URL first.', 'warning');
        return;
      }
      UIManager.showToast('AI model is still loading. Please wait...', 'info');
      return;
    }

    // Capture frame
    capturedImageData = CameraManager.captureFrame(640);
    currentThumbnail = CameraManager.captureThumbnail();

    if (!capturedImageData) {
      UIManager.showToast('Could not capture image. Please try again.', 'error');
      return;
    }

    // Stop camera
    CameraManager.stop();

    // Show captured image
    const capturedPreview = document.getElementById('captured-preview');
    if (capturedPreview) {
      capturedPreview.src = capturedImageData;
      capturedPreview.classList.remove('hidden');
    }

    // Start classification
    await classifyImage(capturedImageData);
  }

  // =====================================================
  // UPLOAD WORKFLOW
  // =====================================================

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      UIManager.showToast('Please upload a JPG, PNG, or WebP image.', 'warning');
      e.target.value = '';
      return;
    }

    // Validate file size (max 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      UIManager.showToast('Image is too large. Please upload an image under 10 MB.', 'warning');
      e.target.value = '';
      return;
    }

    // Read and preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      capturedImageData = ev.target.result;
      showUploadPreview(capturedImageData);
      // Generate thumbnail
      generateThumbnail(capturedImageData);
    };

    reader.onerror = () => {
      UIManager.showToast('Could not read the image file. It may be corrupted.', 'error');
    };

    reader.readAsDataURL(file);
    e.target.value = ''; // Reset for re-upload
  }

  function showUploadPreview(dataUrl) {
    showSection('upload-preview');
    const previewImg = document.getElementById('upload-preview-img');
    if (previewImg) {
      previewImg.src = dataUrl;
    }
    currentMode = 'upload';
  }

  async function handleClassifyUpload() {
    if (!capturedImageData) {
      UIManager.showToast('No image to classify.', 'warning');
      return;
    }

    if (!Classifier.isConfigured()) {
      UIManager.showToast('Please configure your AI model URL first.', 'warning');
      UIManager.scrollTo('#model-setup-panel');
      return;
    }

    const status = Classifier.getStatus();
    if (!status.isLoaded) {
      UIManager.showToast('AI model is still loading. Please wait...', 'info');
      return;
    }

    await classifyImage(capturedImageData);
  }

  function handleClearUpload() {
    capturedImageData = null;
    currentThumbnail = null;
    currentMode = 'idle';
    showSection('scanner');
  }

  /**
   * Generate a small thumbnail from a data URL.
   * @param {string} dataUrl
   */
  function generateThumbnail(dataUrl) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 80;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      const cropSize = Math.min(img.width, img.height);
      const sx = (img.width - cropSize) / 2;
      const sy = (img.height - cropSize) / 2;

      ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, size, size);
      currentThumbnail = canvas.toDataURL('image/jpeg', 0.5);
    };
    img.src = dataUrl;
  }

  // =====================================================
  // CLASSIFICATION
  // =====================================================

  async function classifyImage(imageDataUrl) {
    showSection('result');
    const resultCard = document.getElementById('result-card');

    if (resultCard) {
      UIManager.setLoading(resultCard, true, 'Analyzing image with AI...');
    }

    const result = await Classifier.classifyFromDataUrl(imageDataUrl);

    if (resultCard) {
      UIManager.setLoading(resultCard, false);
    }

    if (!result.success) {
      UIManager.showToast(result.error, 'error');
      displayUnknownResult(result.error);
      return;
    }

    // Get confidence threshold
    const threshold = DisposalRules.getConfidenceThreshold();
    const topPrediction = result.topPrediction;

    // Check confidence
    if (topPrediction.probability < threshold) {
      displayLowConfidenceResult(topPrediction, result.predictions);
      return;
    }

    // Get disposal info
    const city = LocationManager.getCurrentCity();
    const disposalInfo = DisposalRules.getDisposalInfo(topPrediction.className, city);

    lastClassificationResult = {
      predictedClass: topPrediction.className,
      confidence: topPrediction.probability,
      category: disposalInfo.category,
      itemName: disposalInfo.itemName,
      disposalInfo,
      predictions: result.predictions,
      isManual: false,
      imageData: imageDataUrl,
      thumbnail: currentThumbnail
    };

    displayResult(lastClassificationResult);
    currentMode = 'result';
  }

  // =====================================================
  // RESULT DISPLAY
  // =====================================================

  function displayResult(classResult) {
    const container = document.getElementById('result-content');
    if (!container) return;

    const info = classResult.disposalInfo;
    const catInfo = info.categoryInfo || DisposalRules.getCategoryInfo(info.category);
    const confidence = (classResult.confidence * 100).toFixed(1);

    const categoryColorClass = getCategoryTailwindClasses(info.category);

    container.innerHTML = `
      <div class="result-header ${categoryColorClass.bg} rounded-xl p-5 mb-4 border ${categoryColorClass.border}">
        <div class="flex items-start gap-4">
          ${classResult.imageData ? `
            <img src="${classResult.imageData}" alt="Classified item" 
                 class="w-20 h-20 rounded-lg object-cover border-2 ${categoryColorClass.imgBorder} flex-shrink-0" />
          ` : ''}
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <i data-lucide="${catInfo?.icon || 'help-circle'}" class="w-5 h-5 ${categoryColorClass.text}"></i>
              <span class="text-xs font-semibold uppercase tracking-wider ${categoryColorClass.text}">
                ${catInfo?.label || 'Unknown'}
              </span>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white truncate">${info.itemName}</h3>
            ${classResult.isManual ? `
              <span class="inline-flex items-center gap-1 mt-1 text-xs text-amber-600 dark:text-amber-400">
                <i data-lucide="hand" class="w-3 h-3"></i> Manually classified
              </span>
            ` : `
              <div class="mt-2">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs text-gray-600 dark:text-gray-400">Model prediction score:</span>
                  <span class="text-sm font-bold ${categoryColorClass.text}">${confidence}%</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div class="h-2 rounded-full transition-all duration-1000 ease-out ${categoryColorClass.barBg}" 
                       style="width: 0%" id="confidence-bar"></div>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
                  This is an AI prediction, not a guarantee of correctness.
                </p>
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- Disposal Instructions -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-5 mb-4 border border-gray-100 dark:border-gray-700 shadow-sm">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <i data-lucide="info" class="w-4 h-4 text-emerald-500"></i> Disposal Instructions
        </h4>
        <p class="text-gray-700 dark:text-gray-300 text-sm mb-3">${info.disposalMethod}</p>
        
        ${info.preparation.length > 0 ? `
          <h5 class="font-medium text-gray-800 dark:text-gray-200 text-sm mb-2">How to prepare:</h5>
          <ol class="space-y-1.5 mb-3">
            ${info.preparation.map((step, i) => `
              <li class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span class="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 
                             text-xs font-bold flex items-center justify-center mt-0.5">${i + 1}</span>
                <span>${step}</span>
              </li>
            `).join('')}
          </ol>
        ` : ''}
      </div>

      <!-- Warnings -->
      ${info.warnings.length > 0 ? `
        <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
          <h5 class="font-semibold text-amber-800 dark:text-amber-300 text-sm mb-2 flex items-center gap-2">
            <i data-lucide="alert-triangle" class="w-4 h-4"></i> Important Warnings
          </h5>
          <ul class="space-y-1.5">
            ${info.warnings.map(w => `
              <li class="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <span class="text-amber-500 mt-1">•</span>
                <span>${w}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- Special Notes -->
      ${info.specialNotes ? `
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
          <p class="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <i data-lucide="lightbulb" class="w-4 h-4 flex-shrink-0 mt-0.5"></i>
            <span>${info.specialNotes}</span>
          </p>
        </div>
      ` : ''}

      <!-- Regional Info -->
      ${info.regionalInfo ? `
        <div class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-4">
          <h5 class="font-semibold text-emerald-800 dark:text-emerald-300 text-sm mb-2 flex items-center gap-2">
            <i data-lucide="map-pin" class="w-4 h-4"></i> 
            Local Info${LocationManager.getCurrentCity() ? ' — ' + LocationManager.getCurrentCity() : ''}
          </h5>
          <p class="text-sm text-emerald-700 dark:text-emerald-400">${info.regionalInfo}</p>
        </div>
      ` : ''}

      <!-- Sources -->
      ${info.sources.length > 0 ? `
        <div class="mb-4">
          <h5 class="text-xs font-medium text-gray-500 dark:text-gray-500 mb-1">References:</h5>
          <div class="flex flex-wrap gap-2">
            ${info.sources.map(s => `
              <a href="${s.url}" target="_blank" rel="noopener noreferrer" 
                 class="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                <i data-lucide="external-link" class="w-3 h-3"></i> ${s.name}
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- All Predictions -->
      ${!classResult.isManual && classResult.predictions ? `
        <details class="mb-4">
          <summary class="text-xs font-medium text-gray-500 dark:text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            View all predictions
          </summary>
          <div class="mt-2 space-y-1.5">
            ${classResult.predictions.map(p => `
              <div class="flex items-center gap-2 text-sm">
                <span class="flex-1 text-gray-600 dark:text-gray-400 truncate">${p.className}</span>
                <span class="text-xs font-mono text-gray-500">${p.percentage}%</span>
                <div class="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div class="h-1.5 rounded-full bg-emerald-500" style="width: ${p.percentage}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </details>
      ` : ''}

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-3 mt-4">
        <button id="scan-another-btn" 
                class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 
                       text-white rounded-xl font-medium transition-colors">
          <i data-lucide="scan" class="w-4 h-4"></i> Scan Another Item
        </button>
        <button id="save-result-btn"
                class="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-emerald-300 dark:border-emerald-700
                       text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 
                       rounded-xl font-medium transition-colors">
          <i data-lucide="bookmark" class="w-4 h-4"></i> Save to History
        </button>
      </div>
    `;

    // Re-bind buttons
    const scanBtn = document.getElementById('scan-another-btn');
    if (scanBtn) scanBtn.addEventListener('click', handleScanAnother);

    const saveBtn = document.getElementById('save-result-btn');
    if (saveBtn) saveBtn.addEventListener('click', handleSaveResult);

    // Animate confidence bar
    setTimeout(() => {
      const bar = document.getElementById('confidence-bar');
      if (bar) bar.style.width = confidence + '%';
    }, 100);

    // Refresh icons
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Scroll to result
    UIManager.scrollTo('#result-section');
  }

  function displayLowConfidenceResult(topPrediction, allPredictions) {
    const container = document.getElementById('result-content');
    if (!container) return;

    const confidence = (topPrediction.probability * 100).toFixed(1);

    container.innerHTML = `
      <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 mb-4 border border-gray-200 dark:border-gray-700 text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <i data-lucide="help-circle" class="w-8 h-8 text-amber-500"></i>
        </div>
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Low Confidence Result</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
          We're not confident about this item. The best guess is 
          <strong>"${topPrediction.className}"</strong> at ${confidence}% confidence.
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-500 mb-4">
          Try a clearer photo with better lighting, or select the category manually below.
        </p>
      </div>

      <!-- Manual Classification -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-5 mb-4 border border-gray-100 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Classify manually:</h4>
        <div class="grid grid-cols-2 gap-2">
          <button data-manual-category="recyclable" 
                  class="p-3 rounded-lg border-2 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20 
                         transition-colors text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <i data-lucide="recycle" class="w-4 h-4"></i> Recyclable
          </button>
          <button data-manual-category="organic"
                  class="p-3 rounded-lg border-2 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/20 
                         transition-colors text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <i data-lucide="leaf" class="w-4 h-4"></i> Organic
          </button>
          <button data-manual-category="ewaste"
                  class="p-3 rounded-lg border-2 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20 
                         transition-colors text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
            <i data-lucide="cpu" class="w-4 h-4"></i> E-Waste
          </button>
          <button data-manual-category="non_recyclable"
                  class="p-3 rounded-lg border-2 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 
                         transition-colors text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
            <i data-lucide="trash-2" class="w-4 h-4"></i> Non-Recyclable
          </button>
        </div>
      </div>

      ${allPredictions ? `
        <details class="mb-4">
          <summary class="text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            View all predictions
          </summary>
          <div class="mt-2 space-y-1.5">
            ${allPredictions.map(p => `
              <div class="flex items-center gap-2 text-sm">
                <span class="flex-1 text-gray-600 dark:text-gray-400 truncate">${p.className}</span>
                <span class="text-xs font-mono text-gray-500">${p.percentage}%</span>
                <div class="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div class="h-1.5 rounded-full bg-gray-400" style="width: ${p.percentage}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </details>
      ` : ''}

      <button id="scan-another-btn" 
              class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 
                     text-white rounded-xl font-medium transition-colors">
        <i data-lucide="scan" class="w-4 h-4"></i> Try Again
      </button>
    `;

    // Bind manual classification buttons
    container.querySelectorAll('[data-manual-category]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.currentTarget.dataset.manualCategory;
        handleManualClassify(category);
      });
    });

    const scanBtn = container.querySelector('#scan-another-btn');
    if (scanBtn) scanBtn.addEventListener('click', handleScanAnother);

    if (typeof lucide !== 'undefined') lucide.createIcons();
    UIManager.scrollTo('#result-section');
  }

  function displayUnknownResult(errorMsg) {
    const container = document.getElementById('result-content');
    if (!container) return;

    container.innerHTML = `
      <div class="bg-red-50 dark:bg-red-900/20 rounded-xl p-5 mb-4 border border-red-200 dark:border-red-800 text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <i data-lucide="alert-circle" class="w-8 h-8 text-red-500"></i>
        </div>
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Classification Error</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">${errorMsg || 'An error occurred during classification.'}</p>
      </div>
      <button id="scan-another-btn" 
              class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 
                     text-white rounded-xl font-medium transition-colors">
        <i data-lucide="scan" class="w-4 h-4"></i> Try Again
      </button>
    `;

    const scanBtn = container.querySelector('#scan-another-btn');
    if (scanBtn) scanBtn.addEventListener('click', handleScanAnother);

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // =====================================================
  // MANUAL CLASSIFICATION
  // =====================================================

  function handleManualClassify(category) {
    const catInfo = DisposalRules.getCategoryInfo(category);
    if (!catInfo) return;

    const city = LocationManager.getCurrentCity();

    lastClassificationResult = {
      predictedClass: catInfo.label,
      confidence: 1.0,
      category: category,
      itemName: catInfo.label,
      disposalInfo: {
        found: true,
        itemName: catInfo.label,
        category: category,
        categoryInfo: catInfo,
        disposalMethod: catInfo.description,
        preparation: [],
        warnings: [],
        specialNotes: 'This item was classified manually. Disposal instructions shown are general guidelines for this category.',
        regionalInfo: null,
        sources: []
      },
      predictions: null,
      isManual: true,
      imageData: capturedImageData,
      thumbnail: currentThumbnail
    };

    displayResult(lastClassificationResult);
  }

  // =====================================================
  // RESULT ACTIONS
  // =====================================================

  function handleScanAnother() {
    lastClassificationResult = null;
    capturedImageData = null;
    currentThumbnail = null;
    currentMode = 'idle';
    showSection('scanner');
    UIManager.scrollTo('#scanner-section');
  }

  function handleSaveResult() {
    if (!lastClassificationResult) {
      UIManager.showToast('No result to save.', 'warning');
      return;
    }

    ScanHistory.save(lastClassificationResult, currentThumbnail);
    UIManager.showToast('Result saved to history!', 'success');
    renderHistorySection();
    renderStatsSection();

    // Disable the save button
    const saveBtn = document.getElementById('save-result-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Saved';
      saveBtn.classList.add('opacity-50', 'cursor-not-allowed');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  // =====================================================
  // HISTORY
  // =====================================================

  function renderHistorySection() {
    const container = document.getElementById('history-list');
    const emptyState = document.getElementById('history-empty');
    const clearBtn = document.getElementById('clear-history-btn');

    if (!container) return;

    const history = ScanHistory.getRecent(10);

    if (history.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      if (clearBtn) clearBtn.classList.add('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (clearBtn) clearBtn.classList.remove('hidden');

    container.innerHTML = history.map(entry => {
      const catClasses = getCategoryTailwindClasses(entry.category);
      const catInfo = DisposalRules.getCategoryInfo(entry.category);
      return `
        <div class="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 
                    hover:shadow-md transition-shadow group">
          ${entry.thumbnail ? `
            <img src="${entry.thumbnail}" alt="" class="w-12 h-12 rounded-lg object-cover flex-shrink-0 border ${catClasses.border}" />
          ` : `
            <div class="w-12 h-12 rounded-lg ${catClasses.bg} flex items-center justify-center flex-shrink-0">
              <i data-lucide="${catInfo?.icon || 'help-circle'}" class="w-5 h-5 ${catClasses.text}"></i>
            </div>
          `}
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">${entry.itemName}</p>
            <div class="flex items-center gap-2">
              <span class="text-xs ${catClasses.text} font-medium">${catInfo?.label || entry.category}</span>
              ${entry.isManual ? '<span class="text-xs text-gray-400">(manual)</span>' : 
                `<span class="text-xs text-gray-400">${(entry.confidence * 100).toFixed(0)}%</span>`}
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <span class="text-xs text-gray-400">${UIManager.formatDate(entry.timestamp)}</span>
            <button onclick="App.deleteHistoryEntry('${entry.id}')" 
                    class="block ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                    aria-label="Delete this entry">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function deleteHistoryEntry(id) {
    ScanHistory.deleteEntry(id);
    renderHistorySection();
    renderStatsSection();
    UIManager.showToast('Entry removed.', 'info');
  }

  function handleClearHistory() {
    if (confirm('Clear all scan history? This cannot be undone.')) {
      ScanHistory.clearAll();
      renderHistorySection();
      renderStatsSection();
      UIManager.showToast('History cleared.', 'info');
    }
  }

  // =====================================================
  // STATISTICS
  // =====================================================

  function renderStatsSection() {
    const stats = ScanHistory.getStats();
    const container = document.getElementById('stats-content');
    if (!container) return;

    const total = stats.totalScans || 0;

    // Update total count
    const totalEl = document.getElementById('stats-total');
    if (totalEl) UIManager.animateNumber(totalEl, total);

    // Chart data
    const categories = [
      { key: 'recyclable', label: 'Recyclable', color: '#10b981', count: stats.recyclable || 0 },
      { key: 'organic', label: 'Organic', color: '#d97706', count: stats.organic || 0 },
      { key: 'ewaste', label: 'E-Waste', color: '#8b5cf6', count: stats.ewaste || 0 },
      { key: 'non_recyclable', label: 'Non-Recyclable', color: '#ef4444', count: stats.non_recyclable || 0 },
      { key: 'unknown', label: 'Unknown', color: '#6b7280', count: stats.unknown || 0 }
    ];

    container.innerHTML = categories.map(cat => {
      const pct = total > 0 ? ((cat.count / total) * 100).toFixed(0) : 0;
      return `
        <div class="flex items-center gap-3">
          <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${cat.color}"></div>
          <span class="text-sm text-gray-600 dark:text-gray-400 flex-1">${cat.label}</span>
          <span class="text-sm font-medium text-gray-900 dark:text-white">${cat.count}</span>
          <div class="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div class="h-2 rounded-full transition-all duration-700" 
                 style="width: ${pct}%; background-color: ${cat.color}"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // =====================================================
  // LOCATION & CITY
  // =====================================================

  function renderCitySelector() {
    const select = document.getElementById('city-select');
    if (!select) return;

    const cities = DisposalRules.getCities();
    const currentCity = LocationManager.getCurrentCity();

    select.innerHTML = '<option value="">Select your city</option>';
    cities.forEach(city => {
      const opt = document.createElement('option');
      opt.value = city.name;
      opt.textContent = `${city.name}, ${city.state}`;
      if (currentCity && currentCity === city.name) opt.selected = true;
      select.appendChild(opt);
    });

    // Show current city info
    if (currentCity) {
      renderCityInfo(currentCity);
    }
  }

  function handleCityChange(e) {
    const city = e.target.value;
    if (city) {
      LocationManager.setCity(city);
      renderCityInfo(city);
      UIManager.showToast(`Location set to ${city}`, 'success');
    }
  }

  async function handleDetectLocation() {
    UIManager.showToast('Detecting your location...', 'info');
    const city = await LocationManager.autoDetectCity();
    if (city) {
      const select = document.getElementById('city-select');
      if (select) select.value = city;
      renderCityInfo(city);
      UIManager.showToast(`Location detected: ${city}`, 'success');
    } else {
      UIManager.showToast(
        'Could not detect your city. Please select manually.',
        'warning'
      );
    }
  }

  function renderCityInfo(cityName) {
    const container = document.getElementById('city-info');
    if (!container) return;

    const info = DisposalRules.getCityInfo(cityName);
    if (!info) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
        <h5 class="font-semibold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2">
          <i data-lucide="building-2" class="w-4 h-4"></i> ${info.authority}
        </h5>
        <p class="text-sm text-emerald-700 dark:text-emerald-400 mb-2">${info.segregationRules}</p>
        <p class="text-xs text-emerald-600 dark:text-emerald-500 mb-2"><strong>Collection:</strong> ${info.collectionSchedule}</p>
        ${info.notes ? `<p class="text-xs text-gray-500 dark:text-gray-500 italic">${info.notes}</p>` : ''}
        ${info.website ? `
          <a href="${info.website}" target="_blank" rel="noopener noreferrer" 
             class="inline-flex items-center gap-1 mt-2 text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
            <i data-lucide="external-link" class="w-3 h-3"></i> Official Website
          </a>
        ` : ''}
      </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // =====================================================
  // DISPOSAL GUIDE
  // =====================================================

  function renderDisposalGuide() {
    const container = document.getElementById('disposal-guide-content');
    if (!container) return;

    const guidance = DisposalRules.getGeneralGuidance();
    if (!guidance || Object.keys(guidance).length === 0) return;

    container.innerHTML = Object.entries(guidance).map(([key, guide]) => `
      <details class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <summary class="p-4 cursor-pointer font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-750 
                        flex items-center gap-3 transition-colors">
          <i data-lucide="${key === 'composting' ? 'sprout' : key === 'ewasteDisposal' ? 'cpu' : 'leaf'}" 
             class="w-5 h-5 text-emerald-500 flex-shrink-0"></i>
          <span class="flex-1">${guide.title}</span>
          <i data-lucide="chevron-down" class="w-4 h-4 text-gray-400 transition-transform"></i>
        </summary>
        <div class="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">${guide.description}</p>
          <ol class="space-y-2">
            ${guide.steps.map((step, i) => `
              <li class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span class="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 
                             text-xs font-bold flex items-center justify-center mt-0.5">${i + 1}</span>
                <span>${step}</span>
              </li>
            `).join('')}
          </ol>
          ${guide.referenceUrl ? `
            <a href="${guide.referenceUrl}" target="_blank" rel="noopener noreferrer" 
               class="inline-flex items-center gap-1 mt-3 text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
              <i data-lucide="external-link" class="w-3 h-3"></i> Learn more
            </a>
          ` : ''}
        </div>
      </details>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // =====================================================
  // CATEGORY DETAIL
  // =====================================================

  function showCategoryDetail(category) {
    const items = DisposalRules.getItemsByCategory(category);
    const catInfo = DisposalRules.getCategoryInfo(category);
    if (!catInfo) return;

    const modal = document.getElementById('category-modal');
    const content = document.getElementById('category-modal-content');
    if (!modal || !content) return;

    const catClasses = getCategoryTailwindClasses(category);

    content.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full ${catClasses.bg} flex items-center justify-center">
            <i data-lucide="${catInfo.icon}" class="w-5 h-5 ${catClasses.text}"></i>
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">${catInfo.label}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">${items.length} items in database</p>
          </div>
        </div>
        <button id="close-modal-btn" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close modal">
          <i data-lucide="x" class="w-5 h-5 text-gray-500"></i>
        </button>
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">${catInfo.description}</p>
      <div class="space-y-2 max-h-80 overflow-y-auto pr-1">
        ${items.map(item => `
          <div class="p-3 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-100 dark:border-gray-700">
            <p class="font-medium text-sm text-gray-900 dark:text-white">${item.names[0]}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${item.disposalMethod}</p>
          </div>
        `).join('')}
        ${items.length === 0 ? '<p class="text-sm text-gray-400 text-center py-4">No items in database for this category yet.</p>' : ''}
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const closeBtn = content.querySelector('#close-modal-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      });
    }

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // =====================================================
  // SECTION VISIBILITY
  // =====================================================

  function showSection(section) {
    const scannerSection = document.getElementById('scanner-section');
    const cameraView = document.getElementById('camera-view');
    const uploadPreview = document.getElementById('upload-preview-section');
    const resultSection = document.getElementById('result-section');

    // Hide all
    if (cameraView) cameraView.classList.add('hidden');
    if (uploadPreview) uploadPreview.classList.add('hidden');
    if (resultSection) resultSection.classList.add('hidden');
    if (scannerSection) scannerSection.classList.remove('hidden');

    switch (section) {
      case 'camera':
        if (cameraView) cameraView.classList.remove('hidden');
        if (scannerSection) scannerSection.classList.add('hidden');
        break;
      case 'upload-preview':
        if (uploadPreview) uploadPreview.classList.remove('hidden');
        if (scannerSection) scannerSection.classList.add('hidden');
        break;
      case 'result':
        if (resultSection) resultSection.classList.remove('hidden');
        if (scannerSection) scannerSection.classList.add('hidden');
        break;
      case 'scanner':
      default:
        // Scanner is visible by default
        break;
    }
  }

  // =====================================================
  // HELPERS
  // =====================================================

  function getCategoryTailwindClasses(category) {
    const map = {
      recyclable: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
        imgBorder: 'border-emerald-300',
        barBg: 'bg-emerald-500'
      },
      organic: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800',
        imgBorder: 'border-amber-300',
        barBg: 'bg-amber-500'
      },
      ewaste: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800',
        imgBorder: 'border-purple-300',
        barBg: 'bg-purple-500'
      },
      non_recyclable: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
        imgBorder: 'border-red-300',
        barBg: 'bg-red-500'
      },
      unknown: {
        bg: 'bg-gray-50 dark:bg-gray-800',
        text: 'text-gray-500 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-700',
        imgBorder: 'border-gray-300',
        barBg: 'bg-gray-400'
      }
    };
    return map[category] || map.unknown;
  }

  // Public API
  return {
    init,
    deleteHistoryEntry
  };
})();

// =====================================================
// BOOT
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
