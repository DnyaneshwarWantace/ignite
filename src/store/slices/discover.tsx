import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { showToast } from "@/lib/toastUtils";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000/api/v1";

export const discoverApi = createApi({
  reducerPath: "discoverApi",
  baseQuery: fetchBaseQuery({ 
    baseUrl: API_URL,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ["DiscoverAds"],
  endpoints: (builder) => ({
    fetchDiscoverAds: builder.query<any, { 
      page?: number; 
      limit?: number; 
      search?: string;
      format?: string[];
      platform?: string[];
      status?: string[];
      language?: string[];
      niche?: string[];
    }>({
      query: ({ page = 1, limit = 20, search, format, platform, status, language, niche }) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        
        // Only add search parameter if it's 3+ characters or empty
        if (search && search.trim().length >= 3) {
          params.append('search', search.trim());
        }
        
        // Add filter parameters
        if (format && format.length > 0) {
          params.append('format', format.join(','));
        }
        if (platform && platform.length > 0) {
          params.append('platform', platform.join(','));
        }
        if (status && status.length > 0) {
          params.append('status', status.join(','));
        }
        if (language && language.length > 0) {
          params.append('language', language.join(','));
        }
        if (niche && niche.length > 0) {
          params.append('niche', niche.join(','));
        }
        
        const url = `/discover/ads?${params.toString()}`;
        console.log('Discover API URL:', url);
        console.log('Search term length:', search?.length || 0);
        console.log('Filters:', { format, platform, status, language, niche });
        console.log('Full API URL:', API_URL + url);
        return url;
      },
      transformResponse: (response: { payload: { ads: any[]; pagination: any } }) => response.payload,
      providesTags: ["DiscoverAds"],
      transformErrorResponse: (error: any) => {
        console.error('Discover API Error:', error);
        const message = error?.data?.message || "Failed to fetch discover ads.";
        showToast(message, { variant: "error" });
        return error;
      },
    }),
  }),
});

export const {
  useFetchDiscoverAdsQuery,
} = discoverApi; 