'use client';

import { motion } from 'framer-motion';
import {
  Cpu, Camera, Laptop, Gamepad2, Armchair, Wrench,
  Car, Bike, Trophy, Tent, Music, Refrigerator,
  BookOpen, Shirt, Guitar,
} from 'lucide-react';
import { useAppStore } from '@/store';

const categories = [
  { name: 'Electronics', icon: Cpu, slug: 'electronics' },
  { name: 'Cameras', icon: Camera, slug: 'cameras' },
  { name: 'Laptops', icon: Laptop, slug: 'laptops' },
  { name: 'Gaming', icon: Gamepad2, slug: 'gaming' },
  { name: 'Furniture', icon: Armchair, slug: 'furniture' },
  { name: 'Tools', icon: Wrench, slug: 'tools' },
  { name: 'Vehicles', icon: Car, slug: 'vehicles' },
  { name: 'Bikes', icon: Bike, slug: 'bikes' },
  { name: 'Sports', icon: Trophy, slug: 'sports' },
  { name: 'Camping', icon: Tent, slug: 'camping' },
  { name: 'Party Equipment', icon: Music, slug: 'party-equipment' },
  { name: 'Home Appliances', icon: Refrigerator, slug: 'home-appliances' },
  { name: 'Books', icon: BookOpen, slug: 'books' },
  { name: 'Fashion', icon: Shirt, slug: 'fashion' },
  { name: 'Musical Instruments', icon: Guitar, slug: 'musical-instruments' },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function CategoriesSection() {
  const navigate = useAppStore((s) => s.navigate);

  const handleClick = (slug: string) => {
    navigate('marketplace', { category: slug });
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
            Browse by Category
          </h2>
          <p className="mt-3 text-slate-500 text-lg max-w-xl mx-auto">
            Find exactly what you need from our wide range of rental categories
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {categories.map((cat) => (
            <motion.div
              key={cat.slug}
              variants={cardVariants}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleClick(cat.slug)}
              className="cursor-pointer group bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 flex flex-col items-center gap-3 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-white group-hover:bg-emerald-100 flex items-center justify-center shadow-sm transition-colors">
                <cat.icon className="h-6 w-6 text-slate-600 group-hover:text-emerald-600 transition-colors" />
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-emerald-700 text-center transition-colors">
                {cat.name}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
