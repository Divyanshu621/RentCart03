'use client';

import { motion } from 'framer-motion';
import {
  Cpu, Camera, Laptop, Gamepad2, Armchair, Wrench,
  Car, Bike, Trophy, Tent, Music, Refrigerator,
  BookOpen, Shirt, Guitar,
} from 'lucide-react';
import { useAppStore } from '@/store';

const categories = [
  { name: 'Electronics', icon: Cpu, slug: 'electronics', count: 1250 },
  { name: 'Cameras', icon: Camera, slug: 'cameras', count: 890 },
  { name: 'Laptops', icon: Laptop, slug: 'laptops', count: 760 },
  { name: 'Gaming', icon: Gamepad2, slug: 'gaming', count: 540 },
  { name: 'Furniture', icon: Armchair, slug: 'furniture', count: 920 },
  { name: 'Tools', icon: Wrench, slug: 'tools', count: 680 },
  { name: 'Vehicles', icon: Car, slug: 'vehicles', count: 430 },
  { name: 'Bikes', icon: Bike, slug: 'bikes', count: 310 },
  { name: 'Sports', icon: Trophy, slug: 'sports', count: 570 },
  { name: 'Camping', icon: Tent, slug: 'camping', count: 280 },
  { name: 'Party Equipment', icon: Music, slug: 'party-equipment', count: 350 },
  { name: 'Home Appliances', icon: Refrigerator, slug: 'home-appliances', count: 490 },
];

const iconColors: Record<string, string> = {
  'Electronics': 'bg-blue-50 text-[#1e40af] group-hover:bg-[#1e40af] group-hover:text-white',
  'Cameras': 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
  'Laptops': 'bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white',
  'Gaming': 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
  'Furniture': 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
  'Tools': 'bg-slate-100 text-slate-600 group-hover:bg-slate-600 group-hover:text-white',
  'Vehicles': 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
  'Bikes': 'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white',
  'Sports': 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white',
  'Camping': 'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white',
  'Party Equipment': 'bg-pink-50 text-pink-600 group-hover:bg-pink-600 group-hover:text-white',
  'Home Appliances': 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white',
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

export default function CategoriesSection() {
  const navigate = useAppStore((s) => s.navigate);

  const handleClick = (slug: string) => {
    navigate('marketplace', { category: slug });
  };

  return (
    <section className="py-16 sm:py-20 bg-[#f8fafc] relative">
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #1e40af 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
          <p className="mt-3 text-[#64748b] text-lg max-w-xl mx-auto">
            Explore thousands of items across all rental categories
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {categories.map((cat) => (
            <motion.div
              key={cat.slug}
              variants={cardVariants}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleClick(cat.slug)}
              className="group cursor-pointer bg-white rounded-xl border border-[#e2e8f0] p-5 sm:p-6 flex flex-col items-center gap-3 transition-all hover:shadow-lg hover:border-[#3b82f6]/30"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-200 ${iconColors[cat.name] || 'bg-blue-50 text-[#1e40af] group-hover:bg-[#1e40af] group-hover:text-white'}`}>
                <cat.icon className="h-6 w-6" />
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-[#0f172a] group-hover:text-[#1e40af] transition-colors">
                  {cat.name}
                </span>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  {cat.count.toLocaleString('en-IN')}+ items
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
