'use client';

import { motion } from 'framer-motion';
import { Search, CreditCard, Package, RotateCcw } from 'lucide-react';

const steps = [
  {
    step: 1,
    icon: Search,
    title: 'Browse & Choose',
    description: 'Explore thousands of items available for rent in your area.',
  },
  {
    step: 2,
    icon: CreditCard,
    title: 'Book & Pay',
    description: 'Select your dates, pay securely, and get instant confirmation.',
  },
  {
    step: 3,
    icon: Package,
    title: 'Receive & Use',
    description: 'Pick up or get your item delivered. Enjoy using it!',
  },
  {
    step: 4,
    icon: RotateCcw,
    title: 'Return & Review',
    description: 'Return the item on time and share your experience.',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0f172a]">
            How RentLoop Works
          </h2>
          <p className="mt-3 text-slate-500 text-lg max-w-xl mx-auto">
            Renting is simple, secure, and hassle-free in four easy steps
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              className="relative"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              {/* Connector line (hidden on mobile and last card) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-emerald-300 to-emerald-100" />
              )}

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-100 transition-all relative z-10">
                {/* Step number circle */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-emerald-500/30">
                    {item.step}
                  </div>
                </div>

                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                  <item.icon className="h-7 w-7 text-emerald-600" />
                </div>

                <h3 className="text-lg font-semibold text-[#0f172a] mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
