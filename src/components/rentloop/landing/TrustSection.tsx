'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Headphones, ThumbsUp } from 'lucide-react';

const trustItems = [
  {
    icon: ShieldCheck,
    label: 'Verified Owners',
    displayValue: '500+',
    numericValue: 500,
    suffix: '+',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Lock,
    label: 'Secure Payments',
    displayValue: '100%',
    numericValue: 100,
    suffix: '%',
    color: 'bg-sky-50 text-sky-600',
  },
  {
    icon: Headphones,
    label: 'Customer Support',
    displayValue: '24/7',
    numericValue: 24,
    suffix: '/7',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: ThumbsUp,
    label: 'Satisfaction Rate',
    displayValue: '98%',
    numericValue: 98,
    suffix: '%',
    color: 'bg-amber-50 text-amber-600',
  },
];

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
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
          const duration = 1800;
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
      {count}{suffix}
    </span>
  );
}

export default function TrustSection() {
  return (
    <section className="py-20 sm:py-28 bg-[#0f172a] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Trusted by Thousands
          </h2>
          <p className="mt-3 text-slate-400 text-lg max-w-xl mx-auto">
            Our platform is built on trust, security, and customer satisfaction
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {trustItems.map((item, index) => (
            <motion.div
              key={item.label}
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
            >
              <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-4`}>
                <item.icon className="h-8 w-8" />
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
                <AnimatedCounter target={item.numericValue} suffix={item.suffix} />
              </div>
              <div className="text-slate-400 text-sm">{item.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
