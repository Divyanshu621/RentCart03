'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store';

export default function CTASection() {
  const navigate = useAppStore((s) => s.navigate);

  return (
    <section className="py-20 sm:py-28 bg-[#0f172a] relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-emerald-600/10 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium">
            <Sparkles size={14} />
            <span>Join 25,000+ happy renters</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
            Ready to Start
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent"> Renting?</span>
          </h2>

          <p className="mt-4 text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            Join thousands of users who are saving money and reducing waste.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-base font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40"
              onClick={() => navigate('register')}
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-6 text-base font-semibold rounded-xl transition-all"
              onClick={() => navigate('list-item')}
            >
              List Your First Item
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
