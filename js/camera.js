/**
 * EcoSort AI — Camera Module
 * Handles camera access, video stream, switching, and frame capture.
 */

const CameraManager = (() => {
  let videoElement = null;
  let canvasElement = null;
  let currentStream = null;
  let currentFacingMode = 'environment'; // 'environment' (rear) or 'user' (front)
  let isActive = false;
  let availableCameras = [];

  /**
   * Initialize camera manager with DOM element references.
   * @param {HTMLVideoElement} video
   * @param {HTMLCanvasElement} canvas
   */
  function init(video, canvas) {
    videoElement = video;
    canvasElement = canvas;
  }

  /**
   * Check if camera API is supported.
   * @returns {boolean}
   */
  function isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Enumerate available cameras.
   * @returns {Promise<Array>}
   */
  async function enumerateCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      availableCameras = devices.filter(d => d.kind === 'videoinput');
      return availableCameras;
    } catch (err) {
      console.error('[Camera] Error enumerating devices:', err);
      return [];
    }
  }

  /**
   * Check if multiple cameras are available (for switching UI).
   * @returns {boolean}
   */
  function hasMultipleCameras() {
    return availableCameras.length > 1;
  }

  /**
   * Start the camera with the specified facing mode.
   * @param {string} [facingMode='environment']
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function start(facingMode = 'environment') {
    if (!isSupported()) {
      return {
        success: false,
        error: 'Camera is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.'
      };
    }

    // Stop existing stream first
    if (currentStream) {
      stop();
    }

    const constraints = {
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      currentStream = stream;
      currentFacingMode = facingMode;
      isActive = true;

      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.setAttribute('playsinline', 'true');
        videoElement.setAttribute('autoplay', 'true');
        videoElement.muted = true;

        await new Promise((resolve, reject) => {
          videoElement.onloadedmetadata = () => {
            videoElement.play()
              .then(resolve)
              .catch(reject);
          };
          videoElement.onerror = reject;
          // Timeout in case metadata never loads
          setTimeout(reject, 10000);
        });
      }

      // Enumerate cameras after getting permission
      await enumerateCameras();

      console.log('[Camera] Started successfully with facing mode:', facingMode);
      return { success: true };

    } catch (err) {
      console.error('[Camera] Error starting camera:', err);
      isActive = false;

      let errorMessage = 'Could not access the camera.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission was denied. Please allow camera access in your browser settings and try again.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on this device. You can still classify images by uploading a photo.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'The camera is in use by another application. Please close other apps using the camera and try again.';
      } else if (err.name === 'OverconstrainedError') {
        // Try again without facing mode constraint
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          currentStream = fallbackStream;
          isActive = true;
          if (videoElement) {
            videoElement.srcObject = fallbackStream;
            await videoElement.play();
          }
          await enumerateCameras();
          return { success: true };
        } catch {
          errorMessage = 'Could not start the camera with the requested settings.';
        }
      } else if (err.name === 'SecurityError') {
        errorMessage = 'Camera access requires a secure connection (HTTPS). Please access this app over HTTPS.';
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Stop the camera and release all tracks.
   */
  function stop() {
    if (currentStream) {
      currentStream.getTracks().forEach(track => {
        track.stop();
      });
      currentStream = null;
    }

    if (videoElement) {
      videoElement.srcObject = null;
    }

    isActive = false;
    console.log('[Camera] Stopped');
  }

  /**
   * Switch between front and rear cameras.
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function switchCamera() {
    const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    return await start(newFacingMode);
  }

  /**
   * Capture the current video frame to canvas and return as data URL.
   * @param {number} [maxWidth=640] - Maximum width for the captured image.
   * @returns {string|null} Data URL of the captured frame, or null on failure.
   */
  function captureFrame(maxWidth = 640) {
    if (!isActive || !videoElement || !canvasElement) {
      console.error('[Camera] Cannot capture: camera not active');
      return null;
    }

    try {
      const videoWidth = videoElement.videoWidth;
      const videoHeight = videoElement.videoHeight;

      if (videoWidth === 0 || videoHeight === 0) {
        console.error('[Camera] Video dimensions are zero');
        return null;
      }

      // Scale down if needed
      let width = videoWidth;
      let height = videoHeight;
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = Math.round(height * ratio);
      }

      canvasElement.width = width;
      canvasElement.height = height;

      const ctx = canvasElement.getContext('2d');
      ctx.drawImage(videoElement, 0, 0, width, height);

      return canvasElement.toDataURL('image/jpeg', 0.85);
    } catch (err) {
      console.error('[Camera] Error capturing frame:', err);
      return null;
    }
  }

  /**
   * Get a small thumbnail from the current frame.
   * @returns {string|null}
   */
  function captureThumbnail() {
    if (!isActive || !videoElement) return null;

    try {
      const thumbCanvas = document.createElement('canvas');
      const size = 80;
      thumbCanvas.width = size;
      thumbCanvas.height = size;
      const ctx = thumbCanvas.getContext('2d');

      const vw = videoElement.videoWidth;
      const vh = videoElement.videoHeight;
      const cropSize = Math.min(vw, vh);
      const sx = (vw - cropSize) / 2;
      const sy = (vh - cropSize) / 2;

      ctx.drawImage(videoElement, sx, sy, cropSize, cropSize, 0, 0, size, size);
      return thumbCanvas.toDataURL('image/jpeg', 0.5);
    } catch {
      return null;
    }
  }

  /**
   * Check if the camera is currently active.
   * @returns {boolean}
   */
  function getIsActive() {
    return isActive;
  }

  /**
   * Get the current facing mode.
   * @returns {string}
   */
  function getFacingMode() {
    return currentFacingMode;
  }

  /**
   * Get the video element (for model inference).
   * @returns {HTMLVideoElement|null}
   */
  function getVideoElement() {
    return videoElement;
  }

  return {
    init,
    isSupported,
    start,
    stop,
    switchCamera,
    captureFrame,
    captureThumbnail,
    getIsActive,
    getFacingMode,
    getVideoElement,
    hasMultipleCameras,
    enumerateCameras
  };
})();
