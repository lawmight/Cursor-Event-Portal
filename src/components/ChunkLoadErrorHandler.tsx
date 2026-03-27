"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

/**
 * Detects ChunkLoadError (404 on Next.js route chunks) and prompts the user to refresh.
 * This happens when:
 * - User has cached HTML from a previous deploy; chunk hashes no longer exist.
 * - New deploy went live before all static files were available (e.g. on Render).
 */
export function ChunkLoadErrorHandler() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const err = event.reason;
      const message = err?.message ?? String(err);
      const isChunkLoadError =
        typeof message === "string" &&
        ((message.includes("Loading chunk") && message.includes("failed")) ||
          message.includes("ChunkLoadError"));

      if (isChunkLoadError) {
        event.preventDefault();
        toast.error(
          (t) => (
            <div className="flex flex-col gap-2">
              <span>A new version of the app is available.</span>
              <button
                type="button"
                className="text-sm font-medium underline focus:outline-hidden"
                onClick={() => {
                  toast.dismiss(t.id);
                  window.location.reload();
                }}
              >
                Refresh the page
              </button>
            </div>
          ),
          { duration: Infinity }
        );
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () =>
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  }, []);

  return null;
}
