/**
 * EcoSort AI — Location Module
 * Handles geolocation and manual city selection for localized waste disposal guidance.
 */

const LocationManager = (() => {
  const PREFS_KEY = 'ecosort_location_prefs';
  let currentCity = null;
  let locationPermissionState = 'unknown'; // 'unknown', 'granted', 'denied', 'unavailable'

  /**
   * Initialize location module, loading saved preferences.
   */
  function init() {
    const saved = loadPreferences();
    if (saved && saved.city) {
      currentCity = saved.city;
      console.log('[Location] Loaded saved city:', currentCity);
    }
  }

  /**
   * Request the user's location via Geolocation API.
   * @returns {Promise<{lat: number, lon: number}|null>}
   */
  async function requestGeolocation() {
    if (!('geolocation' in navigator)) {
      locationPermissionState = 'unavailable';
      console.warn('[Location] Geolocation API not available');
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          locationPermissionState = 'granted';
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          locationPermissionState = 'denied';
          console.warn('[Location] Geolocation error:', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 600000 // 10 minutes cache
        }
      );
    });
  }

  /**
   * Attempt to determine the city from coordinates using reverse geocoding.
   * Uses a simple distance-based lookup against known Indian cities.
   * @param {number} lat
   * @param {number} lon
   * @returns {string|null} City name
   */
  function estimateCityFromCoords(lat, lon) {
    // Known city coordinates
    const cities = [
      { name: 'Mumbai', lat: 19.076, lon: 72.8777 },
      { name: 'Delhi', lat: 28.6139, lon: 77.209 },
      { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
      { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
      { name: 'Pune', lat: 18.5204, lon: 73.8567 },
      { name: 'Hyderabad', lat: 17.385, lon: 78.4867 },
      { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
      { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
      { name: 'Jaipur', lat: 26.9124, lon: 75.7873 },
      { name: 'Lucknow', lat: 26.8467, lon: 80.9462 },
      { name: 'Kochi', lat: 9.9312, lon: 76.2673 },
      { name: 'Chandigarh', lat: 30.7333, lon: 76.7794 },
      { name: 'Indore', lat: 22.7196, lon: 75.8577 },
      { name: 'Bhopal', lat: 23.2599, lon: 77.4126 },
      { name: 'Surat', lat: 21.1702, lon: 72.8311 }
    ];

    let nearest = null;
    let minDist = Infinity;

    for (const city of cities) {
      const dist = haversineDistance(lat, lon, city.lat, city.lon);
      if (dist < minDist) {
        minDist = dist;
        nearest = city;
      }
    }

    // Only match if within 50 km
    if (nearest && minDist < 50) {
      return nearest.name;
    }
    return null;
  }

  /**
   * Calculate haversine distance between two coordinates in km.
   */
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function toRad(deg) { return deg * (Math.PI / 180); }

  /**
   * Set city manually.
   * @param {string} cityName
   */
  function setCity(cityName) {
    currentCity = cityName;
    savePreferences({ city: cityName, method: 'manual' });
    console.log('[Location] City set manually:', cityName);
  }

  /**
   * Auto-detect city using geolocation.
   * @returns {Promise<string|null>}
   */
  async function autoDetectCity() {
    const coords = await requestGeolocation();
    if (!coords) return null;

    const city = estimateCityFromCoords(coords.lat, coords.lon);
    if (city) {
      currentCity = city;
      savePreferences({ city, method: 'auto', lat: coords.lat, lon: coords.lon });
      console.log('[Location] Auto-detected city:', city);
    }
    return city;
  }

  /**
   * Get the current city.
   * @returns {string|null}
   */
  function getCurrentCity() {
    return currentCity;
  }

  /**
   * Get the location permission state.
   * @returns {string}
   */
  function getPermissionState() {
    return locationPermissionState;
  }

  /**
   * Save location preferences to LocalStorage.
   * @param {object} prefs
   */
  function savePreferences(prefs) {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (err) {
      console.error('[Location] Error saving preferences:', err);
    }
  }

  /**
   * Load location preferences from LocalStorage.
   * @returns {object|null}
   */
  function loadPreferences() {
    try {
      const data = localStorage.getItem(PREFS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Clear saved location.
   */
  function clearLocation() {
    currentCity = null;
    try {
      localStorage.removeItem(PREFS_KEY);
    } catch (err) {
      console.error('[Location] Error clearing location:', err);
    }
  }

  return {
    init,
    requestGeolocation,
    autoDetectCity,
    setCity,
    getCurrentCity,
    getPermissionState,
    clearLocation,
    estimateCityFromCoords
  };
})();
