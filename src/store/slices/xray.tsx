import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { showToast } from "@/lib/toastUtils";
import { createSlice } from "@reduxjs/toolkit";
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL! + "/x-ray";

export const xrayApi = createApi({
  reducerPath: "xrayApi",
  baseQuery: fetchBaseQuery({ 
    baseUrl: API_URL,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ["Folders"],
  endpoints: (builder) => ({
    fetchAllBrands: builder.query<any[], void>({
      query: () => "/brands",
      transformResponse: (response: { payload: { brands: any[] } }) => response.payload.brands,

      transformErrorResponse: (error: any) => {
        console.error(error);
        showToast("Failed to fetch brands.", { variant: "error" });
      },
    }),
    fetchBrand: builder.query<any, { id: string }>({
      query: ({ id }) => `/brands/${id}`,
      transformResponse: (response: { payload: { brand: any } }) => response.payload.brand,

      transformErrorResponse: (error: any) => {
        console.error(error);
        showToast("Failed to fetch brand details.", { variant: "error" });
      },
    }),
    fetchBrandAds: builder.query<any, { id: string; type?: string; status?: string; search?: string; page?: number; limit?: number }>({
      query: ({ id, type, status, search, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        if (status) params.append('status', status);
        if (search) params.append('search', search);
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        
        return `/brands/${id}/ads?${params.toString()}`;
      },
      transformResponse: (response: { payload: { ads: any[]; pagination: any } }) => response.payload,

      transformErrorResponse: (error: any) => {
        console.error(error);
        showToast("Failed to fetch brand ads.", { variant: "error" });
      },
    }),
    fetchBrandAnalytics: builder.query<any, { id: string }>({
      query: ({ id }) => `/brands/${id}/analytics`,
      transformResponse: (response: { payload: { brand: any; analytics: any } }) => response.payload,

      transformErrorResponse: (error: any) => {
        console.error(error);
        showToast("Failed to fetch brand analytics.", { variant: "error" });
      },
    }),
    fetchAllBrandAds: builder.query<any, { id: string }>({
      query: ({ id }) => `/brands/${id}/all-ads`,
      transformResponse: (response: { payload: { ads: any[]; totalCount: number; activeCount: number; inactiveCount: number } }) => response.payload,
      transformErrorResponse: (error: any) => {
        console.error(error);
        showToast("Failed to fetch all brand ads.", { variant: "error" });
      },
    }),

    refreshBrandAnalytics: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({
        url: `/brands/${id}/refresh`,
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
        url: "/brands/add-to-folder-directly",
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
        url: "/brands/add-to-folder-manually",
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
      query: () => "/folders",
      transformResponse: (response: { payload: { folders: any[] } }) => response.payload.folders,
      providesTags: ["Folders"],
      transformErrorResponse: (error: any) => {
        console.error(error);
        showToast("Failed to fetch folders.", { variant: "error" });
      },
    }),
    fetchFolder: builder.query<any[], { id: string }>({
      query: ({ id }) => `/folders/${id}`,
      transformResponse: (response: { payload: { folder: any } }) => response.payload.folder,

      transformErrorResponse: (error: any) => {
        console.error(error);
        showToast("Failed to fetch folder.", { variant: "error" });
      },
    }),
    createFolder: builder.mutation<any, any>({
      query: (name) => ({
        url: "/folders",
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
        url: `/folders/${id}`,
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
        url: `/folders/${id}`,
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
