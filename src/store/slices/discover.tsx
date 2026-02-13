import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { showToast } from "@/lib/toastUtils";
import { getApiBaseUrl } from "@/lib/base-path";

export const discoverApi = createApi({
  reducerPath: "discoverApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getApiBaseUrl(),
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ["DiscoverAds"],
  endpoints: (builder) => ({
    fetchDiscoverAds: builder.query<any, { 
      limit?: number;
      cursorCreatedAt?: string;
      cursorId?: string;
      search?: string;
      format?: string;
      platform?: string;
      status?: string;
      language?: string;
      niche?: string;
      filterKey?: string;
    }>({
      query: ({ limit = 200, cursorCreatedAt, cursorId, search, format, platform, status, language, niche, filterKey }) => {
        const params = new URLSearchParams();
        
        // Add pagination parameters - use cursor instead of page
        params.append('limit', limit.toString());
        if (cursorCreatedAt) {
          params.append('cursorCreatedAt', cursorCreatedAt);
        }
        if (cursorId) {
          params.append('cursorId', cursorId);
        }

        // Add filter parameters
        if (search) params.append('search', search);
        if (format) params.append('format', format);
        if (platform) params.append('platform', platform);
        if (status) params.append('status', status);
        if (language) params.append('language', language);
        if (niche) params.append('niche', niche);
        if (filterKey) params.append('filterKey', filterKey);

        const url = `/discover/ads?${params.toString()}`;
        console.log('Discover API URL:', url);
        console.log('Filters:', { search, format, platform, status, language, niche, filterKey });
        return url;
      },
      // Ensure each unique combination of parameters gets its own cache entry
      serializeQueryArgs: ({ queryArgs }) => {
        const { limit, cursorCreatedAt, cursorId, search, format, platform, status, language, niche, filterKey } = queryArgs;
        return JSON.stringify({
          limit: limit || 200,
          cursor: cursorCreatedAt && cursorId ? `${cursorCreatedAt}_${cursorId}` : null,
          filters: { search, format, platform, status, language, niche },
          filterKey
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