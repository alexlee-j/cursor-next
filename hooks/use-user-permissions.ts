"use client";

import { useEffect, useState } from "react";

export function useUserPermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPermissions() {
      try {
        const response = await fetch("/api/auth/permissions");
        if (!response.ok) {
          throw new Error("Failed to fetch permissions");
        }
        const data = await response.json();
        setPermissions(data.permissions || []);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch permissions")
        );
        setPermissions([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPermissions();
  }, []);

  return {
    permissions,
    isLoading,
    error,
  };
}
