'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  Heart,
  MapPin,
  ShieldCheck,
  Camera,
  Laptop,
  Bike,
  Drill,
  Sofa,
  Tent,
  Gamepad2,
  Music,
  BookOpen,
  Dumbbell,
  Wrench,
  Shirt,
  Baby,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { Product } from '@/types';

const categoryIcons: Record<string, LucideIcon> = {
  'cameras': Camera,
  'laptops': Laptop,
  'bicycles': Bike,
  'tools': Drill,
  'furniture': Sofa,
  'camping': Tent,
  'gaming': Gamepad2,
  'musical-instruments': Music,
  'books': BookOpen,
  'fitness': Dumbbell,
  'home-improvement': Wrench,
  'fashion': Shirt,
  'baby-equipment': Baby,
  'kitchen-appliances': Utensils,
};

const conditionLabels: Record<string, string> = {
  NEW: 'New',
  LIKE_NEW: 'Like New',
  GOOD: 'Good',
  FAIR: 'Fair',
  DAMAGED: 'Damaged',
};

const conditionColors: Record<string, string> = {
  NEW: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  LIKE_NEW: 'bg-sky-100 text-sky-700 border-sky-200',
  GOOD: 'bg-amber-100 text-amber-700 border-amber-200',
  FAIR: 'bg-orange-100 text-orange-700 border-orange-200',
  DAMAGED: 'bg-red-100 text-red-700 border-red-200',
};

const gradientMap: Record<string, string> = {
  'cameras': 'from-rose-400 to-orange-300',
  'laptops': 'from-violet-500 to-purple-300',
  'bicycles': 'from-emerald-400 to-teal-300',
  'tools': 'from-slate-500 to-gray-400',
  'furniture': 'from-amber-400 to-yellow-300',
  'camping': 'from-green-500 to-emerald-300',
  'gaming': 'from-indigo-500 to-blue-400',
  'musical-instruments': 'from-pink-500 to-rose-300',
  'books': 'from-yellow-500 to-amber-300',
  'fitness': 'from-lime-500 to-green-300',
  'home-improvement': 'from-zinc-500 to-stone-400',
  'fashion': 'from-fuchsia-500 to-pink-300',
  'baby-equipment': 'from-cyan-400 to-sky-300',
  'kitchen-appliances': 'from-red-400 to-orange-300',
};

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useAppStore((s) => s.navigate);
  const user = useAppStore((s) => s.user);
  const setAuthModalOpen = useAppStore((s) => s.setAuthModalOpen);
  const [isFavorited, setIsFavorited] = useState(product.isFavorited ?? false);
  const [favLoading, setFavLoading] = useState(false);

  const Icon = categoryIcons[product.category.slug] || Camera;
  const gradient = gradientMap[product.category.slug] || 'from-slate-400 to-gray-300';

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setFavLoading(true);
    try {
      const res = await api.toggleFavorite(product.id);
      setIsFavorited(res.isFavorited);
    } catch {
      // silently fail
    } finally {
      setFavLoading(false);
    }
  };

  const handleViewDetails = () => {
    navigate('product', { productId: product.id });
  };

  const handleRentNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    navigate('product', { productId: product.id });
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="h-full"
    >
      <Card className="h-full overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
        onClick={handleViewDetails}
      >
        {/* Image Area */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center transition-transform duration-500 group-hover:scale-110`}>
            <Icon className="h-16 w-16 text-white/80" strokeWidth={1.5} />
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleFavorite}
            disabled={favLoading}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                isFavorited ? 'fill-red-500 text-red-500' : 'text-slate-500'
              }`}
            />
          </button>

          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-medium border-0">
              {product.category.name}
            </Badge>
          </div>

          {/* Condition Badge */}
          <div className="absolute bottom-3 left-3">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${conditionColors[product.condition] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              {conditionLabels[product.condition] || product.condition}
            </span>
          </div>
        </div>

        <CardContent className="p-4 flex flex-col gap-3">
          {/* Title */}
          <h3 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
            {product.title}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium text-slate-700">
                {product.avgRating > 0 ? product.avgRating.toFixed(1) : 'New'}
              </span>
            </div>
            {product.totalReviews > 0 && (
              <span className="text-xs text-slate-400">
                ({product.totalReviews} review{product.totalReviews > 1 ? 's' : ''})
              </span>
            )}
          </div>

          {/* Price */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-600">₹{product.dailyPrice.toLocaleString('en-IN')}</span>
              <span className="text-xs text-slate-400">/day</span>
            </div>
            <span className="text-xs text-slate-400">
              Deposit: ₹{product.securityDeposit.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Location & Verification */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-slate-500 min-w-0">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">
                {product.city?.name}{product.state?.name ? `, ${product.state.name}` : ''}
              </span>
            </div>
            {product.owner.isVerified && (
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
              onClick={handleViewDetails}
            >
              View Details
            </Button>
            <Button
              size="sm"
              className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleRentNow}
            >
              Rent Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
