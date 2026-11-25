"use client";

import { useState, useCallback, useEffect } from "react";
import apiClient from "./api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";

export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; description?: string; variant?: "default" | "destructive" | "success" }>>([]);

  const toast = useCallback(
    ({ title, description, variant = "default" }: { title: string; description?: string; variant?: "default" | "destructive" | "success" }) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  return { toasts, toast };
}

// Generic fetch hook for lists with pagination
export function useApiList<T>(
  url: string,
  queryParams?: Record<string, string | number | undefined>
) {
  const [data, setData] = useState<PaginatedResponse<T> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (queryParams) {
        Object.entries(queryParams).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            params.append(key, String(value));
          }
        });
      }
      const queryString = params.toString();
      const fullUrl = queryString ? `${url}?${queryString}` : url;
      const { data: response } = await apiClient.get<ApiResponse<PaginatedResponse<T>>>(fullUrl);
      setData(response.data);
    } catch {
      setError("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, JSON.stringify(queryParams)]);

  // Auto-fetch on mount and whenever url/queryParams change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// Generic fetch hook for single items
export function useApiGet<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) {
      setData(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data: response } = await apiClient.get<ApiResponse<T>>(url);
      setData(response.data);
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(axiosMsg || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  // Auto-fetch on mount and url change
  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

