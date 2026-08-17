'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PackageOpen,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { Product, State, Category } from '@/types';
import ProductCard from './ProductCard';

type SortOption = 'recommended' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'most_rented';
type ConditionFilter = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | '';

const sortLabels: Record<SortOption, string> = {
  recommended: 'Recommended',
  price_asc: 'Price Low → High',
  price_desc: 'Price High → Low',
  rating: 'Highest Rated',
  newest: 'Newest',
  most_rented: 'Most Rented',
};

const conditionOptions: { value: ConditionFilter; label: string }[] = [
  { value: '', label: 'All Conditions' },
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
];

export default function MarketplacePage() {
  const navigate = useAppStore((s) => s.navigate);
  const states = useAppStore((s) => s.states);
  const categories = useAppStore((s) => s.categories);
  const selectedState = useAppStore((s) => s.selectedState);
  const setSelectedState = useAppStore((s) => s.setSelectedState);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('recommended');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [condition, setCondition] = useState<ConditionFilter>('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [deliveryOnly, setDeliveryOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const ITEMS_PER_PAGE = 12;

  // Sync selected state from store on mount
  useEffect(() => {
    if (selectedState) {
      // already set
    }
  }, [selectedState]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch states & categories if empty
  const { data: statesData } = useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const data = await api.getStates();
      return data as unknown as State[];
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const data = await api.getCategories();
      return data as unknown as Category[];
    },
    staleTime: 1000 * 60 * 10,
  });

  // Fetch products
  const { data: productsResponse, isLoading, isError, error } = useQuery({
    queryKey: ['products', debouncedSearch, selectedCategory, condition, minPrice, maxPrice, deliveryOnly, selectedState?.id, sort, page],
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = {
        page,
        limit: ITEMS_PER_PAGE,
        sort,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (condition) params.condition = condition;
      if (minPrice) params.minPrice = Number(minPrice);
      if (maxPrice) params.maxPrice = Number(maxPrice);
      if (deliveryOnly) params.deliveryAvailable = 'true';
      if (selectedState) params.stateId = selectedState.id;
      return api.getProducts(params);
    },
  });

  const products = (productsResponse?.products ?? []) as unknown as Product[];
  const totalPages = productsResponse?.totalPages ?? 1;
  const total = productsResponse?.total ?? 0;

  const clearFilters = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedCategory('');
    setCondition('');
    setMinPrice('');
    setMaxPrice('');
    setDeliveryOnly(false);
    setSort('recommended');
    setPage(1);
    setSelectedState(null);
  }, [setSelectedState]);

  const hasActiveFilters = selectedCategory || condition || minPrice || maxPrice || deliveryOnly || selectedState;

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory((prev) => (prev === catId ? '' : catId));
    setPage(1);
  };

  const handleStateChange = (stateId: string) => {
    if (!stateId) {
      setSelectedState(null);
    } else {
      const st = (statesData ?? states).find((s) => s.id === stateId);
      if (st) setSelectedState(st);
    }
    setPage(1);
  };

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Search skeleton */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Skeleton className="h-11 flex-1 rounded-lg" />
            <Skeleton className="h-11 w-full sm:w-52 rounded-lg" />
            <Skeleton className="h-11 w-full sm:w-48 rounded-lg" />
          </div>
          {/* Category pills skeleton */}
          <div className="flex gap-2 mb-6 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />
            ))}
          </div>
          {/* Grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-5 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 max-w-md"
        >
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-500 mb-6">{(error as Error)?.message || 'Failed to load products. Please try again.'}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="border-slate-200">
            Try Again
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Location Restriction Message */}
        {selectedState && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700"
          >
            <MapPin className="h-4 w-4 shrink-0" />
            <span>
              Showing rentals in <strong>{selectedState.name}</strong>{' '}
              <button
                onClick={() => { setSelectedState(null); setPage(1); }}
                className="ml-1 underline hover:text-blue-900"
              >
                Change location
              </button>
            </span>
          </motion.div>
        )}

        {/* Search Bar & Controls Row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search for cameras, laptops, bikes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-white border-slate-200 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setDebouncedSearch(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* State Selector */}
          <Select value={selectedState?.id ?? ''} onValueChange={handleStateChange}>
            <SelectTrigger className="h-11 w-full sm:w-52 bg-white border-slate-200">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Select your location" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {((statesData ?? states) as State[]).map((st) => (
                <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Dropdown */}
          <Select value={sort} onValueChange={(v) => { setSort(v as SortOption); setPage(1); }}>
            <SelectTrigger className="h-11 w-full sm:w-52 bg-white border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(sortLabels) as [SortOption, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter Toggle (mobile-friendly popover) */}
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`h-11 gap-2 border-slate-200 ${hasActiveFilters ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : ''}`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="h-5 w-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">!</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-5" align="end">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Filters</h3>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                      Clear all
                    </button>
                  )}
                </div>

                {/* Condition Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Condition</Label>
                  <div className="flex flex-wrap gap-2">
                    {conditionOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setCondition(opt.value); setPage(1); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          condition === opt.value
                            ? 'bg-[#0f172a] text-white border-[#0f172a]'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Price Range (₹/day)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Min"
                      type="number"
                      min={0}
                      value={minPrice}
                      onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                      className="h-9 text-sm"
                    />
                    <span className="text-slate-400 text-sm">—</span>
                    <Input
                      placeholder="Max"
                      type="number"
                      min={0}
                      value={maxPrice}
                      onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Delivery Only Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Delivery Available</Label>
                    <p className="text-xs text-slate-400">Only show items with delivery</p>
                  </div>
                  <Switch
                    checked={deliveryOnly}
                    onCheckedChange={(v) => { setDeliveryOnly(v); setPage(1); }}
                  />
                </div>

                <Button
                  className="w-full bg-[#0f172a] hover:bg-[#0f172a]/90 text-white"
                  onClick={() => setFiltersOpen(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Category Pills - Horizontal Scrollable */}
        <div className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button
              onClick={() => { setSelectedCategory(''); setPage(1); }}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-[#0f172a] text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              All
            </button>
            {((categoriesData ?? categories) as Category[]).filter((c) => c.isActive).map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-[#0f172a] text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results info */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{total}</span>{' '}
            {total === 1 ? 'item' : 'items'} found
            {selectedCategory && (
              <>
                {' '}in <Badge variant="secondary" className="ml-1 text-xs">
                  {(categoriesData ?? (categories as Category[])).find((c) => c.id === selectedCategory)?.name ?? 'Category'}
                </Badge>
              </>
            )}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          )}
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <PackageOpen className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No items found</h3>
            <p className="text-slate-500 text-sm max-w-sm mb-6">
              Try adjusting your filters or search to find what you&apos;re looking for.
            </p>
            <Button variant="outline" onClick={clearFilters} className="border-slate-200">
              Clear All Filters
            </Button>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="border-slate-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, idx) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = idx + 1;
                    } else if (page <= 4) {
                      pageNum = idx + 1;
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + idx;
                    } else {
                      pageNum = page - 3 + idx;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className={
                          page === pageNum
                            ? 'bg-[#0f172a] hover:bg-[#0f172a]/90 text-white'
                            : 'border-slate-200'
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="border-slate-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
