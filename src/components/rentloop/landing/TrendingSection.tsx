'use client';

import { motion } from 'framer-motion';
import { Star, MapPin, Camera, Laptop, Bike, Gamepad2, Wrench, Armchair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store';

const trendingItems = [
  {
    id: '1',
    name: 'Canon EOS R6 Mark II',
    category: 'Cameras',
    location: 'Mumbai',
    price: 1500,
    rating: 4.8,
    reviews: 23,
    gradient: 'from-amber-100 to-orange-100',
    Icon: Camera,
  },
  {
    id: '2',
    name: 'MacBook Pro M3 14″',
    category: 'Laptops',
    location: 'Bangalore',
    price: 1200,
    rating: 4.9,
    reviews: 45,
    gradient: 'from-slate-100 to-slate-200',
    Icon: Laptop,
  },
  {
    id: '3',
    name: 'Mountain Bike Pro 29er',
    category: 'Bikes',
    location: 'Pune',
    price: 450,
    rating: 4.7,
    reviews: 18,
    gradient: 'from-emerald-100 to-teal-100',
    Icon: Bike,
  },
  {
    id: '4',
    name: 'PS5 Console + 2 Controllers',
    category: 'Gaming',
    location: 'Delhi',
    price: 600,
    rating: 4.9,
    reviews: 62,
    gradient: 'from-indigo-100 to-purple-100',
    Icon: Gamepad2,
  },
  {
    id: '5',
    name: 'Professional Drill Kit Set',
    category: 'Tools',
    location: 'Chennai',
    price: 350,
    rating: 4.6,
    reviews: 12,
    gradient: 'from-rose-100 to-pink-100',
    Icon: Wrench,
  },
  {
    id: '6',
    name: 'Ergonomic Office Chair',
    category: 'Furniture',
    location: 'Hyderabad',
    price: 250,
    rating: 4.8,
    reviews: 34,
    gradient: 'from-sky-100 to-cyan-100',
    Icon: Armchair,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
        />
      ))}
    </div>
  );
}

export default function TrendingSection() {
  const navigate = useAppStore((s) => s.navigate);

  const handleRent = (id: string) => {
    navigate('product', { productId: id });
  };

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0f172a]">
            Trending Rentals
          </h2>
          <p className="mt-3 text-slate-500 text-lg max-w-xl mx-auto">
            Popular items being rented right now across India
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingItems.map((item, index) => (
            <motion.div
              key={item.id}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Image placeholder */}
              <div className={`h-48 bg-gradient-to-br ${item.gradient} flex items-center justify-center relative`}>
                <item.Icon className="h-16 w-16 text-slate-400/60" strokeWidth={1} />
                <Badge className="absolute top-3 left-3 bg-white/90 text-slate-700 hover:bg-white/90 text-xs font-medium shadow-sm">
                  {item.category}
                </Badge>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-semibold text-[#0f172a] text-base mb-2 group-hover:text-emerald-700 transition-colors">
                  {item.name}
                </h3>

                <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
                  <MapPin size={14} />
                  <span>{item.location}</span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <StarRating rating={item.rating} />
                  <span className="text-sm text-slate-500">
                    {item.rating} ({item.reviews})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-[#0f172a]">
                      ₹{item.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-slate-400 ml-1">/day</span>
                  </div>
                  <Button
                    size="sm"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
                    onClick={() => handleRent(item.id)}
                  >
                    Rent Now
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
