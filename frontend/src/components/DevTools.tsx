"use client";

import { useEffect } from "react";

/**
 * Development tools component that loads testing utilities
 * Only active in development environment
 */
export function DevTools() {
  useEffect(() => {
    // Only load in development environment
    if (process.env.NODE_ENV === "development") {
      // Dynamically import test functions to make them globally available
      import("@/lib/__tests__/storage.test")
        .then(() => {
          console.log("🛠️ Development tools loaded");
        })
        .catch((error) => {
          console.warn("Failed to load development tools:", error);
        });
    }
  }, []);

  // This component renders nothing
  return null;
}
