import { useMemo, useState, useCallback } from 'react';

// Hook personnalisé pour la pagination
export function usePagination<T>(
  items: T[],
  initialPageSize: number = 20
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = Math.ceil(items.length / pageSize);
  
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [items, currentPage, pageSize]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  return {
    currentPage,
    pageSize,
    totalPages,
    paginatedItems,
    setPageSize,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}

// Hook pour la recherche et filtrage optimisés
export function useFilteredSearch<T>(
  items: T[],
  searchFields: (keyof T)[],
  filters: Record<string, any> = {}
) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    let result = items;

    // Appliquer les filtres
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        result = result.filter(item => 
          (item as any)[key] === value
        );
      }
    });

    // Appliquer la recherche textuelle
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(item =>
        searchFields.some(field => {
          const fieldValue = (item as any)[field];
          return fieldValue?.toString().toLowerCase().includes(lowerSearchTerm);
        })
      );
    }

    return result;
  }, [items, searchTerm, filters, searchFields]);

  return {
    searchTerm,
    setSearchTerm,
    filteredItems,
  };
}

// Hook pour le cache avec invalidation
export function useCache<T>(key: string, fetchFn: () => Promise<T>, ttl: number = 300000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cacheKey = `cache_${key}`;
    const timestampKey = `cache_${key}_timestamp`;
    
    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      const timestamp = localStorage.getItem(timestampKey);
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < ttl) {
          setData(JSON.parse(cached));
          return;
        }
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      localStorage.setItem(cacheKey, JSON.stringify(result));
      localStorage.setItem(timestampKey, Date.now().toString());
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn, ttl]);

  const invalidateCache = useCallback(() => {
    localStorage.removeItem(`cache_${key}`);
    localStorage.removeItem(`cache_${key}_timestamp`);
  }, [key]);

  return {
    data,
    loading,
    error,
    fetchData,
    invalidateCache,
  };
}