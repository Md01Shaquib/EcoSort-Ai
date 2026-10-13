/**
 * EcoSort AI — Classifier Module
 * Handles loading the Teachable Machine model and running predictions.
 * Uses the official @teachablemachine/image library with TensorFlow.js.
 */

const Classifier = (() => {
  // ============================================================
  // CONFIGURATION — Set your Teachable Machine model URL here
  // ============================================================
  // After training your model on https://teachablemachine.withgoogle.com/train/image
  // export it, upload to the cloud, and paste the URL below.
  //
  // Example: 'https://teachablemachine.withgoogle.com/models/YOUR_MODEL_ID/'
  //
  // The URL should point to a folder containing:
  //   - model.json
  //   - metadata.json
  //   - one or more .bin weight files
  // ============================================================

  let MODEL_URL = '';  // <-- INSERT YOUR MODEL URL HERE

  let model = null;
  let maxPredictions = 0;
  let isLoading = false;
  let isLoaded = false;
  let loadError = null;
  let modelClasses = [];

  /**
   * Set the model URL. Call before loadModel().
   * @param {string} url
   */
  function setModelUrl(url) {
    if (url && typeof url === 'string') {
      MODEL_URL = url.endsWith('/') ? url : url + '/';
      console.log('[Classifier] Model URL set to:', MODEL_URL);
    }
  }

  /**
   * Get the current model URL.
   * @returns {string}
   */
  function getModelUrl() {
    return MODEL_URL;
  }

  /**
   * Check if a model URL has been configured.
   * @returns {boolean}
   */
  function isConfigured() {
    return MODEL_URL && MODEL_URL.length > 10;
  }

  /**
   * Load the Teachable Machine model.
   * @param {function} [onProgress] - Optional callback for loading progress.
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function loadModel(onProgress) {
    if (isLoaded && model) {
      return { success: true };
    }

    if (isLoading) {
      return { success: false, error: 'Model is already loading...' };
    }

    if (!isConfigured()) {
      const errMsg = 'No model URL configured. Please train a model on Teachable Machine and set the MODEL_URL.';
      loadError = errMsg;
      return { success: false, error: errMsg };
    }

    isLoading = true;
    loadError = null;

    if (onProgress) onProgress('Initializing TensorFlow.js...');

    try {
      // Check if tmImage is available
      if (typeof tmImage === 'undefined') {
        throw new Error('Teachable Machine library not loaded. Please check your internet connection.');
      }

      if (onProgress) onProgress('Loading model from server...');

      const modelURL = MODEL_URL + 'model.json';
      const metadataURL = MODEL_URL + 'metadata.json';

      // 10-second timeout so invalid URLs fail promptly instead of hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Model request timed out after 10s. The URL may be unreachable or invalid.')), 10000)
      );

      model = await Promise.race([
        tmImage.load(modelURL, metadataURL),
        timeoutPromise
      ]);
      maxPredictions = model.getTotalClasses();
      modelClasses = model.getClassLabels ? model.getClassLabels() : [];

      isLoaded = true;
      isLoading = false;

      console.log('[Classifier] Model loaded successfully.');
      console.log('[Classifier] Classes:', maxPredictions, modelClasses);

      if (onProgress) onProgress('Model ready!');

      return { success: true, classes: modelClasses };

    } catch (err) {
      isLoading = false;
      isLoaded = false;
      model = null;

      let errorMessage = 'Failed to load the AI model.';

      if (err.message.includes('404') || err.message.includes('Not Found')) {
        errorMessage = 'Model files not found at the configured URL. Please verify your MODEL_URL points to a valid Teachable Machine export.';
      } else if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        errorMessage = 'Could not reach the model server. Please check your internet connection and model URL.';
      } else if (err.message.includes('JSON')) {
        errorMessage = 'Invalid model format. Please ensure you exported the model as "TensorFlow.js" from Teachable Machine.';
      } else if (err.message.includes('Teachable Machine library')) {
        errorMessage = err.message;
      } else {
        errorMessage = `Model loading error: ${err.message}`;
      }

      loadError = errorMessage;
      console.error('[Classifier] Model loading failed:', err);

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Classify an image element, canvas, or video frame.
   * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} imageSource
   * @returns {Promise<{success: boolean, predictions?: Array, topPrediction?: object, error?: string}>}
   */
  async function classify(imageSource) {
    if (!isLoaded || !model) {
      return {
        success: false,
        error: 'Model is not loaded. Please wait for the model to finish loading.'
      };
    }

    if (!imageSource) {
      return {
        success: false,
        error: 'No image provided for classification.'
      };
    }

    try {
      const predictions = await model.predict(imageSource);

      // Sort by probability descending
      const sorted = [...predictions].sort((a, b) => b.probability - a.probability);

      // Get top prediction
      const top = sorted[0];

      return {
        success: true,
        predictions: sorted.map(p => ({
          className: p.className,
          probability: p.probability,
          percentage: (p.probability * 100).toFixed(1)
        })),
        topPrediction: {
          className: top.className,
          probability: top.probability,
          percentage: (top.probability * 100).toFixed(1)
        }
      };

    } catch (err) {
      console.error('[Classifier] Classification error:', err);
      return {
        success: false,
        error: 'An error occurred during classification. Please try again with a different image.'
      };
    }
  }

  /**
   * Classify from a data URL by creating a temporary image.
   * @param {string} dataUrl
   * @returns {Promise<object>}
   */
  async function classifyFromDataUrl(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = async () => {
        const result = await classify(img);
        resolve(result);
      };

      img.onerror = () => {
        resolve({
          success: false,
          error: 'Failed to load the image for classification.'
        });
      };

      img.src = dataUrl;
    });
  }

  /**
   * Classify from a File object.
   * @param {File} file
   * @returns {Promise<object>}
   */
  async function classifyFromFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const result = await classifyFromDataUrl(e.target.result);
        resolve(result);
      };

      reader.onerror = () => {
        resolve({
          success: false,
          error: 'Failed to read the image file.'
        });
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Get the model loading status.
   * @returns {object}
   */
  function getStatus() {
    return {
      isConfigured: isConfigured(),
      isLoading,
      isLoaded,
      loadError,
      modelClasses,
      totalClasses: maxPredictions
    };
  }

  /**
   * Reset the classifier (unload model).
   */
  function reset() {
    model = null;
    isLoaded = false;
    isLoading = false;
    loadError = null;
    modelClasses = [];
    maxPredictions = 0;
    MODEL_URL = '';
  }

  return {
    setModelUrl,
    getModelUrl,
    isConfigured,
    loadModel,
    classify,
    classifyFromDataUrl,
    classifyFromFile,
    getStatus,
    reset
  };
})();
