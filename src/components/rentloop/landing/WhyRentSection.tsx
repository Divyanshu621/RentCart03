'use client';

import { motion } from 'framer-motion';
import { PiggyBank, Sparkles, TestTube2, Crown, Leaf, Repeat } from 'lucide-react';

const benefits = [
  {
    icon: PiggyBank,
    title: 'Save Money',
    description: 'Why buy when you can rent? Save up to 80% compared to purchasing.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Sparkles,
    title: 'Declutter',
    description: "Don't store items you rarely use. Rent them when needed.",
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: TestTube2,
    title: 'Try Before Buy',
    description: 'Test products before making a purchase decision.',
    color: 'bg-sky-50 text-sky-600',
  },
  {
    icon: Crown,
    title: 'Access Premium',
    description: 'Access premium and expensive items at a fraction of the cost.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Leaf,
    title: 'Eco Friendly',
    description: 'Reduce waste by sharing resources. Better for the planet.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Repeat,
    title: 'Flexibility',
    description: 'Rent for as long or as short as you need. No commitments.',
    color: 'bg-rose-50 text-rose-600',
  },
];

export default function WhyRentSection() {
  return (
    <section className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0f172a]">
            Why Rent Instead of Buy?
          </h2>
          <p className="mt-3 text-slate-500 text-lg max-w-xl mx-auto">
            Smart people choose renting for a more flexible and sustainable lifestyle
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-md hover:border-emerald-100 transition-all"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className={`w-12 h-12 rounded-xl ${benefit.color} flex items-center justify-center mb-4`}>
                <benefit.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-[#0f172a] mb-2">
                {benefit.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
