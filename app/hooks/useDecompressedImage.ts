import { useEffect, useState } from "react";
import pako from "pako";

interface UseDecompressedImageResult {
  error: Error | null;
  image: string | null;
  loading: boolean;
}

/**
 * Transforms a jetstream-cloud URL to use the dev proxy when in development mode.
 * In production, returns the original URL (assumes backend proxy is configured).
 *
 * @param url - Original jetstream-cloud URL
 * @returns Transformed URL for proxy or original URL
 */
const getProxiedUrl = (url: string): string => {
  console.log("[getProxiedUrl] NODE_ENV:", process.env.NODE_ENV);
  console.log("[getProxiedUrl] Original URL:", url);

  // Check if we're in development (check both NODE_ENV and window.location)
  const isDev =
    process.env.NODE_ENV === "development" ||
    (typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"));

  console.log("[getProxiedUrl] isDev:", isDev);

  if (isDev) {
    // Extract the path after "genomeark/"
    const match = url.match(/genomeark\/(.*)/);
    if (match) {
      // Use Next.js rewrite proxy path (works with static export)
      const proxiedUrl = `/dev-proxy/genomeark/${match[1]}`;
      console.log("[getProxiedUrl] Returning proxied URL:", proxiedUrl);
      return proxiedUrl;
    }
  }

  // In production, return original URL
  console.log("[getProxiedUrl] Returning original URL (no proxy)");
  return url;
};

/**
 * Custom hook to decompress a gzipped image file and create an object URL for display.
 * Handles fetching, decompression, and cleanup of object URLs.
 * Automatically uses dev proxy in development mode to bypass CORS restrictions.
 *
 * @param gzUrl - URL to the gzipped image file (e.g., .png.gz)
 * @returns Object containing the decompressed image URL, loading state, and error state
 */
export const useDecompressedImage = (
  gzUrl: string | undefined
): UseDecompressedImageResult => {
  const [error, setError] = useState<Error | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!gzUrl) {
      setImage(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    const decompressImage = async (): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        // Transform URL to use proxy in development mode
        const fetchUrl = getProxiedUrl(gzUrl);

        // Fetch the gzipped file
        const response = await fetch(fetchUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        // Get as array buffer
        const arrayBuffer = await response.arrayBuffer();

        // Decompress using pako
        const decompressed = pako.ungzip(new Uint8Array(arrayBuffer));

        if (cancelled) return;

        // Create blob and object URL
        const blob = new Blob([decompressed], { type: "image/png" });
        objectUrl = URL.createObjectURL(blob);

        setImage(objectUrl);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error("Decompression failed")
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    decompressImage();

    // Cleanup function - revoke object URL to prevent memory leaks
    return (): void => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [gzUrl]);

  return { error, image, loading };
};
