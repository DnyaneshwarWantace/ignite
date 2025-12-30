/*
 * React/TypeScript version of usePageList hook
 * Converted from Vue to React
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import qs from 'qs';

const APIHOST = process.env.NEXT_PUBLIC_MATERIAL_API || 'https://github.kuaitu.cc';

interface UsePageListOptions {
  el: string;
  apiClient: (params: string) => Promise<any>;
  filters?: Record<string, any>;
  sort?: any[];
  formatData?: (data: any[]) => any[];
  fields?: string[];
}

interface Pagination {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
}

export function usePageList({
  el,
  apiClient,
  filters = {},
  sort = [],
  formatData,
  fields = [],
}: UsePageListOptions) {
  const [showScroll, setShowScroll] = useState(false);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [pageData, setPageData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 0,
    pageCount: 0,
    pageSize: 10,
    total: 0,
  });
  const [pageLoading, setPageLoading] = useState(false);

  const isDownBottom = useMemo(() => {
    return pagination.page === page && page >= pagination.pageCount;
  }, [pagination.page, page, pagination.pageCount]);

  const addFilterParams = useCallback((query: any, filters: Record<string, any>) => {
    Object.keys(filters).forEach((key) => {
      const itemFilter: any = {};
      Object.keys(filters[key]).forEach((myKey) => {
        const skip = ['$eq', '$contains'];
        const isNone = !filters[key][myKey];
        const isSkip = skip.includes(myKey) && isNone;
        if (!isSkip) {
          itemFilter[myKey] = filters[key][myKey];
        } else {
          const isFilterEmpty = filters[key].filterEmpty;
          if (!isFilterEmpty) {
            itemFilter[myKey] = filters[key][myKey];
          }
        }
      });
      query.filters[key] = itemFilter;
    });
    return query;
  }, []);

  const getPageData = useCallback(async () => {
    setPageLoading(true);
    try {
      const query: any = {
        populate: {
          img: '*',
        },
        filters: {},
        sort: sort,
        fields,
        pagination: {
          page: page,
          pageSize: pagination.pageSize || 10,
        },
      };
      const params = addFilterParams(query, filters);
      const res = await apiClient(qs.stringify(params));
      const list = formatData ? formatData(res.data.data) : res.data.data;
      
      const newPagination: Pagination = { ...pagination };
      if (res.data.meta?.pagination) {
        Object.keys(res.data.meta.pagination).forEach((key) => {
          (newPagination as any)[key] = res.data.meta.pagination[key];
        });
      }
      setPagination(newPagination);
      // Ensure list is an array before spreading
      const listArray = Array.isArray(list) ? list : [];
      setPageData((prev) => [...prev, ...listArray]);
    } catch (error) {
      console.error(error);
    }
    setPageLoading(false);
  }, [page, pagination.pageSize, filters, sort, fields, formatData, apiClient, addFilterParams]);

  const startGetList = useCallback(() => {
    setPageData([]);
    setPage(1);
  }, []);

  useEffect(() => {
    if (page === 1 && pageData.length === 0) {
      getPageData();
    }
  }, [page, pageData.length, getPageData]);

  const nextPage = useCallback(() => {
    if (page >= pagination.pageCount) return;
    setPage((prev) => prev + 1);
    setTimeout(() => {
      getPageData();
    }, 1000);
  }, [page, pagination.pageCount, getPageData]);

  const startPage = useCallback(async () => {
    const myTemplBox = document.querySelector(el);
    if (myTemplBox) {
      setScrollHeight((myTemplBox as HTMLElement).offsetHeight);
      setShowScroll(true);
    }
    await startGetList();
  }, [el, startGetList]);

  return {
    pageData,
    showScroll,
    scrollHeight,
    pageLoading,
    isDownBottom,
    startPage,
    getPageData,
    startGetList,
    nextPage,
  };
}

export function getMaterialInfoUrl(info: any): string {
  const imgUrl = info?.data?.attributes?.url || '';
  return APIHOST + imgUrl;
}

export function getMaterialPreviewUrl(info: any): string {
  const imgUrl =
    info?.data?.attributes?.formats?.small?.url || info?.data?.attributes?.url || '';
  return APIHOST + imgUrl;
}

