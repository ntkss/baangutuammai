/**
 * Google Maps SDK Singleton Loader with Error & gm_authFailure Detection
 */

type AuthFailureCallback = () => void;

const SCRIPT_ID = "google-maps-js-sdk";
const authFailureListeners = new Set<AuthFailureCallback>();
let isAuthFailed = false;
let loadPromise: Promise<boolean> | null = null;

// Initialize global gm_authFailure hook if in browser
if (typeof window !== "undefined") {
  const existingGmAuthFailure = (window as unknown as { gm_authFailure?: () => void }).gm_authFailure;
  
  (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
    console.warn("[GoogleMapsLoader] gm_authFailure triggered. Google Maps authentication failed.");
    isAuthFailed = true;
    if (existingGmAuthFailure) {
      try {
        existingGmAuthFailure();
      } catch (err) {
        console.error(err);
      }
    }
    for (const callback of authFailureListeners) {
      try {
        callback();
      } catch (e) {
        console.error("[GoogleMapsLoader] Error in auth failure listener:", e);
      }
    }
  };
}

/**
 * Register a callback when Google Maps authentication fails (e.g. RefererNotAllowed, BillingNotEnabled)
 */
export function onGoogleMapsAuthError(callback: AuthFailureCallback): () => void {
  authFailureListeners.add(callback);
  if (isAuthFailed) {
    // Notify immediately if already failed
    callback();
  }
  return () => {
    authFailureListeners.delete(callback);
  };
}

/**
 * Check if Google Maps has encountered an authentication error
 */
export function hasGoogleMapsAuthFailed(): boolean {
  return isAuthFailed;
}

/**
 * Mark Google Maps as failed manually (e.g., if Places API throws legacy error)
 */
export function markGoogleMapsFailed(): void {
  isAuthFailed = true;
  for (const callback of authFailureListeners) {
    try {
      callback();
    } catch (e) {
      console.error(e);
    }
  }
}

/**
 * Loads the Google Maps JavaScript SDK safely.
 * Returns true if loaded successfully, or false if failed/timed out.
 */
export function loadGoogleMaps(apiKey?: string): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (isAuthFailed) {
    return Promise.resolve(false);
  }

  // If already loaded and available on window
  const g = (window as unknown as { google?: { maps?: unknown } }).google;
  if (g?.maps) {
    return Promise.resolve(true);
  }

  if (!apiKey) {
    return Promise.resolve(false);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise<boolean>((resolve) => {
    // Check if script element already exists
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if ((window as unknown as { google?: { maps?: unknown } }).google?.maps) {
        resolve(true);
        return;
      }
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => {
        isAuthFailed = true;
        resolve(false);
      }, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=th&region=TH&loading=async`;
    script.async = true;
    script.defer = true;

    // Timeout guard in case Google is unreachable or blocked
    const timeoutTimer = setTimeout(() => {
      console.warn("[GoogleMapsLoader] Google Maps load timed out after 7s");
      resolve(false);
    }, 7000);

    script.onload = () => {
      clearTimeout(timeoutTimer);
      // Wait a microtick to ensure google.maps is defined
      setTimeout(() => {
        const hasMaps = Boolean((window as unknown as { google?: { maps?: unknown } }).google?.maps);
        resolve(hasMaps && !isAuthFailed);
      }, 50);
    };

    script.onerror = () => {
      clearTimeout(timeoutTimer);
      console.warn("[GoogleMapsLoader] Google Maps script failed to load");
      isAuthFailed = true;
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
