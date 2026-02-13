import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { showToast } from "@/lib/toastUtils";
import { createSlice } from "@reduxjs/toolkit";
import { getApiBaseUrl } from "@/lib/base-path";

export const xrayApi = createApi({
  reducerPath: "xrayApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getApiBaseUrl(),
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ["Folders", "SavedAds", "SavedAdFolders", "CreatedAds"],
  endpoints: (builder) => ({
    fetchAllBrands: builder.query<any[], void>({
      query: () => "/x-ray/brands",
      transformResponse: (response: { payload: { brands: any[] } }) => response.payload.brands,

      transformErrorResponse: (error: any) => {
        console.error(error);
        showToast("Failed to fetch brands.", { variant: "error" });
      },
    }),
    fetchBrand: builder.query<any, { id: string }>({
      query: ({ id }) => `/x-ray/brands/${id}`,
      transformResponse: (response: { payload: { brand: any } }) => response.payload.brand,

      transformErrorResponse: (error: any) => {
        console.error(error);
        showToast("Failed to fetch brand details.", { variant: "error" });
      },
    }),
    fetchBrandAds: builder.query<any, { id: string; type?: string; status?: string; search?: string; page?: number; limit?: number }>({
      query: ({ id, type, status, search, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        // Note: We still pass filter parameters to the API for UI compatibility
        // but the API no longer uses them for filtering (they're kept for future implementation)
        if (type) params.append('type', type);
        if (status) params.append('status', status);
        if (search) params.append('search', search);
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        
        return `/x-ray/brands/${id}/ads?${params.toString()}`;
      },
      transformResponse: (response: { payload: { ads: any[]; pagination: any } }) => response.payload,

      transformErrorResponse: (error: any) => {
        console.error(error);
        showToast("Failed to fetch brand ads.", { variant: "error" });
      },
    }),
    fetchBrandAnalytics: builder.query<any, { id: string }>({
      query: ({ id }) => `/x-ray/brands/${id}/analytics`,
      transformResponse: (response: { payload: { brand: any; analytics: any } }) => response.payload,

      transformErrorResponse: (error: any) => {
        console.error(error);
        showToast("Failed to fetch brand analytics.", { variant: "error" });
      },
    }),
    fetchAllBrandAds: builder.query<any, { id: string }>({
      query: ({ id }) => `/x-ray/brands/${id}/all-ads`,
      transformResponse: (response: { payload: { ads: any[]; totalCount: number; activeCount: number; inactiveCount: number } }) => response.payload,
      transformErrorResponse: (error: any) => {
        console.error(error);
        showToast("Failed to fetch all brand ads.", { variant: "error" });
      },
    }),

    refreshBrandAnalytics: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({
        url: `/x-ray/brands/${id}/refresh`,
        method: "POST",
      }),
      invalidatesTags: ["Folders"],

      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;

          if (data.message === "success") {
            showToast(`Analytics refreshed! Found ${data.payload.totalAdsScraped} ads`, { variant: "success" });
          }
        } catch (err) {
          showToast("Failed to refresh analytics", { variant: "error" });
        }
      },
    }),
    add2folderDirectly: builder.mutation<any, any>({
      query: (brands) => ({
        url: "/x-ray/brands/add-to-folder-directly",
        method: "POST",
        body: brands,
      }),
      invalidatesTags: ["Folders"],

      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;

          if (data.message === "success") {
            showToast("Brands added successfully", { variant: "success" });
          }
        } catch (err) {
          showToast("Failed to add brands", { variant: "error" });
        }
      },
    }),
    add2folderManually: builder.mutation<any, any>({
      query: (brands) => ({
        url: "/x-ray/brands/add-to-folder-manually",
        method: "POST",
        body: brands,
      }),
      invalidatesTags: ["Folders"],

      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;

          if (data.message === "success") {
            showToast("Brands added successfully", { variant: "success" });
          }
        } catch (err) {
          showToast("Failed to add brands", { variant: "error" });
        }
      },
    }),
    fetchAllFolders: builder.query<any[], void>({
      query: () => "/x-ray/folders",
      transformResponse: (response: { payload: { folders: any[] } }) => response.payload.folders,
      providesTags: ["Folders"],
      transformErrorResponse: (error: any) => {
        console.error(error);
        showToast("Failed to fetch folders.", { variant: "error" });
      },
    }),
    fetchFolder: builder.query<any[], { id: string }>({
      query: ({ id }) => `/x-ray/folders/${id}`,
      transformResponse: (response: { payload: { folder: any } }) => response.payload.folder,

      transformErrorResponse: (error: any) => {
        console.error(error);
        showToast("Failed to fetch folder.", { variant: "error" });
      },
    }),
    fetchSavedAds: builder.query<any, { folderId?: string; page?: number; limit?: number }>({
      query: ({ folderId, page = 1, limit = 20 }) => ({
        url: `/x-ray/saved-ads?folderId=${folderId || '0'}&page=${page}&limit=${limit}`,
      }),
      transformResponse: (response: { payload: any }) => response.payload,
      providesTags: ["SavedAds"],
      transformErrorResponse: (error: any) => {
        console.error(error);
        showToast("Failed to fetch saved ads.", { variant: "error" });
      },
    }),
    saveAd: builder.mutation<any, { adId: string; folderId?: string; adData?: string }>({
      query: ({ adId, folderId, adData }) => ({
        url: "/x-ray/saved-ads",
        method: "POST",
        body: { adId, folderId, adData },
      }),
      invalidatesTags: ["SavedAds", "SavedAdFolders"],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;

          if (data.message === "success") {
            showToast("Ad saved successfully", { variant: "success" });
          }
        } catch (err) {
          showToast("Failed to save ad", { variant: "error" });
        }
      },
    }),
    fetchSavedAdFolders: builder.query<any[], void>({
      query: () => "/x-ray/saved-ad-folders",
      transformResponse: (response: { payload: { folders: any[] } }) => response.payload.folders,
      providesTags: ["SavedAdFolders"],
      transformErrorResponse: (error: any) => {
        console.error(error);
        showToast("Failed to fetch saved ad folders.", { variant: "error" });
      },
    }),
    checkIfAdSaved: builder.query<boolean, string>({
      query: (adId) => `/x-ray/saved-ads/check/${adId}`,
      transformResponse: (response: { payload: { isSaved: boolean } }) => response.payload.isSaved,
      providesTags: (result, error, adId) => [{ type: "SavedAds", id: adId }],
    }),
    createSavedAdFolder: builder.mutation<any, string>({
      query: (name) => ({
        url: "/x-ray/saved-ad-folders",
        method: "POST",
        body: { name },
      }),
      invalidatesTags: ["SavedAdFolders"],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          console.log('Create folder response:', data);

          if (data.message === "success") {
            showToast("Folder created successfully", { variant: "success" });
          } else {
            showToast(data.message || "Failed to create folder", { variant: "error" });
          }
        } catch (err) {
          console.error('Create folder error:', err);
          showToast("Failed to create folder", { variant: "error" });
        }
      },
    }),
    analyzeAds: builder.mutation<any, any[]>({
      query: (ads) => ({
        url: "/writer/analyze-ads",
        method: "POST",
        body: { ads },
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;

          if (data.message === "success") {
            showToast(`Analyzed ${data.payload.analyzedAdsCount} ads successfully`, { variant: "success" });
          }
        } catch (err) {
          showToast("Failed to analyze ads", { variant: "error" });
        }
      },
    }),
    generateConcepts: builder.mutation<any, any>({
      query: (briefData) => ({
        url: "/writer/generate-concepts",
        method: "POST",
        body: { briefData },
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;

          if (data.message === "success") {
            showToast(`Generated ${data.payload.concepts.length} unique concepts successfully`, { variant: "success" });
          }
        } catch (err) {
          showToast("Failed to generate concepts", { variant: "error" });
        }
      },
    }),
    generateHooks: builder.mutation<any, any>({
      query: ({ concepts, briefData }) => ({
        url: "/writer/generate-hooks",
        method: "POST",
        body: { concepts, briefData },
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;

          if (data.message === "success") {
            showToast(`Generated hooks for ${data.payload.hooksData.length} concepts successfully`, { variant: "success" });
          }
        } catch (err) {
          showToast("Failed to generate hooks", { variant: "error" });
        }
      },
    }),
    buildAd: builder.mutation<any, any>({
      query: ({ briefData, concepts, hooks }) => ({
        url: "/writer/build-ad",
        method: "POST",
        body: { briefData, concepts, hooks },
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;

          if (data.message === "success") {
            showToast(`${data.payload.count} ads generated and saved successfully!`, { variant: "success" });
          }
        } catch (err) {
          showToast("Failed to generate ads", { variant: "error" });
        }
      },
    }),
    fetchCreatedAds: builder.query<any, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 }) => ({
        url: `/writer/save-created-ad?page=${page}&limit=${limit}`,
      }),
      transformResponse: (response: { payload: any }) => response.payload,
      providesTags: ["CreatedAds"],
      transformErrorResponse: (error: any) => {
        console.error(error);
        showToast("Failed to fetch created ads.", { variant: "error" });
      },
    }),
    updateCreatedAd: builder.mutation<any, any>({
      query: ({ id, ...adData }) => ({
        url: `/writer/save-created-ad/${id}`,
        method: "PATCH",
        body: adData,
      }),
      invalidatesTags: ["CreatedAds"],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;

          if (data.message === "success") {
            showToast("Ad updated successfully", { variant: "success" });
          }
        } catch (err) {
          showToast("Failed to update ad", { variant: "error" });
        }
      },
    }),
    deleteCreatedAd: builder.mutation<any, string>({
      query: (id) => ({
        url: `/writer/save-created-ad/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CreatedAds"],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;

          if (data.message === "success") {
            showToast("Ad deleted successfully", { variant: "success" });
          }
        } catch (err) {
          showToast("Failed to delete ad", { variant: "error" });
        }
      },
    }),
    createFolder: builder.mutation<any, any>({
      query: (name) => ({
        url: "/x-ray/folders",
        method: "POST",
        body: { name },
      }),
      invalidatesTags: ["Folders"],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;

          if (data.message === "success") {
            showToast("Folder created successfully", { variant: "success" });
          }
        } catch (err) {
          showToast("Failed to create folder", { variant: "error" });
        }
      },
    }),
    editFolder: builder.mutation<any, any>({
      query: ({ name, id }: { name: string; id: string }) => ({
        url: `/x-ray/folders/${id}`,
        method: "PATCH",
        body: { name },
      }),
      invalidatesTags: ["Folders"],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;

          if (data.message === "success") {
            showToast("Folder updated successfully", { variant: "success" });
          }
        } catch (err) {
          showToast("Failed to update folder", { variant: "error" });
        }
      },
    }),
    deleteFolder: builder.mutation<any, any>({
      query: ({ id }) => ({
        url: `/x-ray/folders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Folders"],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;

          if (data.message === "success") {
            showToast("Folder deleted successfully", { variant: "success" });
          }
        } catch (err) {
          showToast("Failed to delete folder", { variant: "error" });
        }
      },
    }),
  }),
});

export const {
  useFetchAllBrandsQuery,
  useFetchBrandQuery,
  useFetchBrandAdsQuery,
  useFetchBrandAnalyticsQuery,
  useFetchAllBrandAdsQuery,
  useRefreshBrandAnalyticsMutation,
  useFetchAllFoldersQuery,
  useAdd2folderDirectlyMutation,
  useAdd2folderManuallyMutation,
  useCreateFolderMutation,
  useDeleteFolderMutation,
  useEditFolderMutation,
  useFetchFolderQuery,
  useFetchSavedAdsQuery,
  useSaveAdMutation,
  useFetchSavedAdFoldersQuery,
  useCreateSavedAdFolderMutation,
  useCheckIfAdSavedQuery,
  useAnalyzeAdsMutation,
  useGenerateConceptsMutation,
  useGenerateHooksMutation,
  useBuildAdMutation,
  useFetchCreatedAdsQuery,
  useUpdateCreatedAdMutation,
  useDeleteCreatedAdMutation,
} = xrayApi;

export const xray_slice = createSlice({
  name: "xray",
  initialState: {
    selectedBrand: null,
    selectedFolder: null,
  },
  reducers: {
    updateSelectedBrand: (state, action) => {
      state.selectedBrand = action.payload;
    },
    updateSelectedFolder: (state, action) => {
      state.selectedFolder = action.payload;
    },
  },
});

export const { updateSelectedBrand, updateSelectedFolder } = xray_slice.actions;
