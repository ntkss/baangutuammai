/**
 * BaanGuTuamMai — User preferences store (Zustand + localStorage)
 *
 * Stores user's home location and elevation preferences in the browser.
 * No backend/database required for user settings.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserLocation } from "@/lib/types/domain";

// ─── State shape ──────────────────────────────────────────────────────────

interface UserPrefsState {
  /** The user's saved home location, null if not yet set */
  homeLocation: UserLocation | null;

  /** Set or update home location */
  setHomeLocation: (location: UserLocation) => void;

  /** Update only the floor elevation (user can manually override DEM value) */
  setFloorElevation: (metres: number) => void;

  /** Clear the home location */
  clearHomeLocation: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────

export const useUserPrefs = create<UserPrefsState>()(
  persist(
    (set) => ({
      homeLocation: null,

      setHomeLocation: (location) => set({ homeLocation: location }),

      setFloorElevation: (metres) =>
        set((state) => ({
          homeLocation: state.homeLocation
            ? { ...state.homeLocation, floorElevationM: metres }
            : null,
        })),

      clearHomeLocation: () => set({ homeLocation: null }),
    }),
    {
      name: "baangutuammai-prefs", // localStorage key
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : (null as never)
      ),
      // Only persist the location data, not the action functions
      partialize: (state) => ({ homeLocation: state.homeLocation }),
    }
  )
);
