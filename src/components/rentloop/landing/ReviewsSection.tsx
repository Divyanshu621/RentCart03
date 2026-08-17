'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const reviews = [
  {
    id: '1',
    name: 'Priya Sharma',
    initials: 'PS',
    rating: 5,
    text: 'I rented a Canon camera for my sister\'s wedding and the experience was amazing! The camera was in excellent condition and the owner was very helpful with setup tips. Will definitely rent again.',
    product: 'Canon EOS R6 Mark II',
    date: '2 weeks ago',
  },
  {
    id: '2',
    name: 'Rahul Mehta',
    initials: 'RM',
    rating: 5,
    text: 'Needed a laptop for a 3-day hackathon. Got a MacBook Pro delivered to my doorstep. Way cheaper than buying one. The whole process was smooth from booking to return.',
    product: 'MacBook Pro M3 14″',
    date: '1 month ago',
  },
  {
    id: '3',
    name: 'Ananya Iyer',
    initials: 'AI',
    rating: 4,
    text: 'Rented camping gear for a weekend trip to Coorg. The tent and sleeping bags were clean and well-maintained. Only minor issue was the pickup location was a bit far. Otherwise great service!',
    product: 'Camping Gear Set',
    date: '3 weeks ago',
  },
  {
    id: '4',
    name: 'Vikram Singh',
    initials: 'VS',
    rating: 5,
    text: 'I\'m a freelancer who occasionally needs power tools. Renting them through RentLoop saves me so much money and storage space. The security deposit refund was processed within 24 hours.',
    product: 'Bosch Drill Kit',
    date: '1 week ago',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
        />
      ))}
    </div>
  );
}

export default function ReviewsSection() {
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
            What Our Users Say
          </h2>
          <p className="mt-3 text-slate-500 text-lg max-w-xl mx-auto">
            Real experiences from real people across India
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-sm transition-shadow relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-emerald-200" />

              <StarRating rating={review.rating} />

              <p className="mt-4 text-slate-600 text-sm leading-relaxed">
                &ldquo;{review.text}&rdquo;
              </p>

              <div className="mt-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-semibold">
                      {review.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm text-[#0f172a]">{review.name}</div>
                    <div className="text-xs text-slate-400">{review.date}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">
                  {review.product}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
