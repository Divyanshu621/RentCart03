'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Laptop, Bike, Drill, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store';

const floatingIcons = [
  { Icon: Camera, x: '10%', y: '20%', size: 28, delay: 0, duration: 6 },
  { Icon: Laptop, x: '80%', y: '15%', size: 32, delay: 1.2, duration: 7 },
  { Icon: Bike, x: '15%', y: '70%', size: 26, delay: 0.6, duration: 5.5 },
  { Icon: Drill, x: '75%', y: '65%', size: 30, delay: 1.8, duration: 6.5 },
  { Icon: Sparkles, x: '50%', y: '10%', size: 22, delay: 2.4, duration: 5 },
  { Icon: Camera, x: '88%', y: '45%', size: 24, delay: 3, duration: 7.5 },
  { Icon: Laptop, x: '25%', y: '85%', size: 20, delay: 0.3, duration: 6 },
  { Icon: Sparkles, x: '60%', y: '80%', size: 26, delay: 1.5, duration: 5.8 },
];

function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 2000;
          const startTime = performance.now();
          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

const stats = [
  { label: 'Items', value: 10000, suffix: '+', prefix: '' },
  { label: 'Owners', value: 500, suffix: '+', prefix: '' },
  { label: 'Rentals', value: 25000, suffix: '+', prefix: '' },
  { label: 'Rating', value: 4.9, suffix: '', prefix: '' },
];

export default function HeroSection() {
  const navigate = useAppStore((s) => s.navigate);
  const user = useAppStore((s) => s.user);

  const handleListClick = () => {
    if (user) {
      navigate('list-item');
    } else {
      const store = useAppStore.getState();
      store.setReturnUrl('list-item');
      store.setAuthModalView('login');
      store.setAuthModalOpen(true);
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#0f172a]">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#0f172a]/95 to-[#1a2744]" />

      {/* Subtle radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[400px] bg-emerald-600/5 rounded-full blur-3xl" />

      {/* Floating icons */}
      <AnimatePresence>
        {floatingIcons.map((item, i) => (
          <motion.div
            key={i}
            className="absolute text-emerald-400/20 pointer-events-none"
            style={{ left: item.x, top: item.y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: [0, -20, 0, 15, 0],
              rotate: [0, 5, -3, 4, 0],
            }}
            transition={{
              duration: item.duration,
              delay: item.delay,
              repeat: Infinity,
              repeatType: 'loop',
              ease: 'easeInOut',
            }}
          >
            <item.Icon size={item.size} strokeWidth={1.5} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium">
            <Sparkles size={14} />
            <span>India&apos;s #1 Rental Marketplace</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-white via-white to-emerald-400 bg-clip-text text-transparent">
              Rent Anything
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              You Need.
            </span>
          </h1>

          <motion.p
            className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          >
            Get the things you need for a few days without buying them permanently.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          >
            <Button
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-base font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40"
              onClick={() => navigate('marketplace')}
            >
              Explore Rentals
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-6 text-base font-semibold rounded-xl transition-all"
              onClick={handleListClick}
            >
              List Your Item
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Stats bar */}
      <motion.div
        className="relative z-10 mt-auto"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
      >
        <div className="border-t border-slate-700/50 bg-[#0f172a]/80 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white">
                    {stat.value === 4.9 ? (
                      <>
                        <AnimatedCounter target={stat.value * 10} />
                        <span className="text-lg text-slate-400">/10</span>
                      </>
                    ) : (
                      <AnimatedCounter
                        target={stat.value}
                        suffix={stat.suffix}
                        prefix={stat.prefix}
                      />
                    )}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
