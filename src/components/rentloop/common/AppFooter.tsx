'use client';

import { useAppStore } from '@/store';
import { Store, Mail, Phone, MapPin } from 'lucide-react';

export default function AppFooter() {
  const navigate = useAppStore(s => s.navigate);
  const currentView = useAppStore(s => s.currentView);

  if (currentView === 'landing') return null;

  return (
    <footer className="bg-[#0f172a] text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Rent<span className="text-emerald-400">Loop</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Rent it. Use it. Return it. The smarter way to access the things you need.
            </p>
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>India</span>
            </div>
          </div>

          {/* For Renters */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">For Renters</h3>
            <ul className="space-y-2.5">
              <li>
                <button onClick={() => navigate('marketplace')} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                  Browse Rentals
                </button>
              </li>
              <li>
                <button onClick={() => navigate('marketplace')} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => navigate('marketplace')} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                  Safety Guide
                </button>
              </li>
              <li>
                <button onClick={() => navigate('marketplace')} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                  Pricing
                </button>
              </li>
            </ul>
          </div>

          {/* For Owners */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">For Owners</h3>
            <ul className="space-y-2.5">
              <li>
                <button onClick={() => navigate('list-item')} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                  List Your Item
                </button>
              </li>
              <li>
                <button onClick={() => navigate('dashboard')} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                  Owner Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => navigate('dashboard')} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                  Earnings
                </button>
              </li>
              <li>
                <button onClick={() => navigate('dashboard')} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                  Trust & Verification
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="w-4 h-4" />
                support@rentloop.in
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="w-4 h-4" />
                +91 1800-RENT-LOOP
              </li>
              <li>
                <button className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                  Help Center
                </button>
              </li>
              <li>
                <button className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} RentLoop. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <button className="hover:text-gray-300 transition-colors">Privacy</button>
            <button className="hover:text-gray-300 transition-colors">Terms</button>
            <button className="hover:text-gray-300 transition-colors">Cookies</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
