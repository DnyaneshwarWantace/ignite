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
      search?: string;
      format?: string[];
      platform?: string[];
      status?: string[];
      language?: string[];
      niche?: string[];
      limit?: number;
      cursorCreatedAt?: string;
      cursorId?: string;
    }>({
      query: ({ search, format, platform, status, language, niche, limit = 30, cursorCreatedAt, cursorId }) => {
        const params = new URLSearchParams();
        
        // Add pagination parameters - use cursor instead of page
        params.append('limit', limit.toString());
        if (cursorCreatedAt) {
          params.append('cursorCreatedAt', cursorCreatedAt);
        }
        if (cursorId) {
          params.append('cursorId', cursorId);
        }
        
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
        console.log('Pagination:', { limit, cursorCreatedAt, cursorId });
        console.log('Search term length:', search?.length || 0);
        console.log('Filters:', { format, platform, status, language, niche });
        return url;
      },
      // Ensure each unique combination of parameters gets its own cache entry
      serializeQueryArgs: ({ queryArgs }) => {
        const { search, format, platform, status, language, niche, limit, cursorCreatedAt, cursorId } = queryArgs;
        return JSON.stringify({
          search: search || '',
          format: format?.sort() || [],
          platform: platform?.sort() || [],
          status: status?.sort() || [],
          language: language?.sort() || [],
          niche: niche?.sort() || [],
          limit: limit || 30,
          cursor: cursorCreatedAt && cursorId ? `${cursorCreatedAt}_${cursorId}` : null
        });
      },
      transformResponse: (response: { payload: { ads: any[]; pagination: any } }) => response.payload,
      // Force fresh data for each request, keep cache briefly for UX
      keepUnusedDataFor: 30, // Keep for 30 seconds only
      providesTags: (result, error, arg) => [
        { type: 'DiscoverAds', id: arg.cursorCreatedAt ? `cursor-${arg.cursorCreatedAt}_${arg.cursorId}` : 'first-page' },
        { type: 'DiscoverAds', id: 'LIST' }
      ],
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