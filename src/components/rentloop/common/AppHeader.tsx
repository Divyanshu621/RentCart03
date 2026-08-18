'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Bell,
  Menu,
  User,
  LogOut,
  LayoutDashboard,
  Package,
  Heart,
  MessageCircle,
  Shield,
  Plus,
  MapPin,
  Store,
} from 'lucide-react';
import type { State, City, Area, Notification } from '@/types';
import { toast } from 'sonner';

export default function AppHeader() {
  const {
    user, setUser, currentView, navigate, setAuthModalOpen, setAuthModalView,
    selectedState, setSelectedState,
    selectedCity, setSelectedCity,
    selectedArea, setSelectedArea,
    states, setStates,
    notifications, setNotifications, unreadCount, setUnreadCount,
  } = useAppStore();
  const [showNotif, setShowNotif] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const [showLocationMobile, setShowLocationMobile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Fetch states on mount
  useEffect(() => {
    api.getStates().then((data) => {
      const s = data as unknown as State[];
      setStates(s);
    }).catch(() => {});
  }, [setStates]);

  // Fetch notifications for logged-in users
  useEffect(() => {
    if (!user) return;
    api.getNotifications().then((data) => {
      const notifs = data as unknown as Notification[];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    }).catch(() => {});
  }, [user, setNotifications, setUnreadCount]);

  // Close notifications on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
      setUser(null);
      navigate('landing');
      toast.success('Logged out successfully');
    } catch {
      toast.error('Failed to logout');
    }
  };

  const requireAuth = (action: () => void) => {
    if (!user) {
      setAuthModalView('login');
      setAuthModalOpen(true);
      return;
    }
    action();
  };

  const isLanding = currentView === 'landing';

  // Derived lists
  const cities = useMemo(() => {
    if (!selectedState) return [];
    return selectedState.cities?.filter((c: City) => c.isActive) ?? [];
  }, [selectedState]);

  const areas = useMemo(() => {
    if (!selectedCity) return [];
    return selectedCity.areas?.filter((a: Area) => a.isActive) ?? [];
  }, [selectedCity]);

  // Location label (most specific)
  const locationLabel = useMemo(() => {
    if (selectedArea) return selectedArea.name;
    if (selectedCity) return selectedCity.name;
    if (selectedState) return selectedState.name;
    return 'Location';
  }, [selectedState, selectedCity, selectedArea]);

  const hasLocationSelection = !!(selectedState || selectedCity || selectedArea);

  const handleStateChange = (stateId: string) => {
    if (!stateId) {
      setSelectedState(null);
      setSelectedCity(null);
      setSelectedArea(null);
    } else {
      const st = states.find((s) => s.id === stateId);
      if (st) setSelectedState(st);
      setSelectedCity(null);
      setSelectedArea(null);
    }
    navigate('marketplace');
  };

  const handleCityChange = (cityId: string) => {
    if (!cityId) {
      setSelectedCity(null);
      setSelectedArea(null);
    } else {
      const c = cities.find((c) => c.id === cityId);
      if (c) setSelectedCity(c);
      setSelectedArea(null);
    }
    navigate('marketplace');
  };

  const handleAreaChange = (areaId: string) => {
    if (!areaId) {
      setSelectedArea(null);
    } else {
      const a = areas.find((a) => a.id === areaId);
      if (a) setSelectedArea(a);
    }
    navigate('marketplace');
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isLanding
            ? 'bg-transparent absolute'
            : 'bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => navigate('landing')}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className={`text-xl font-bold tracking-tight ${isLanding ? 'text-white' : 'text-[#0f172a]'}`}>
                Rent<span className="text-emerald-500">Loop</span>
              </span>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => navigate('landing')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'landing'
                    ? 'text-emerald-600 bg-emerald-50'
                    : isLanding ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => navigate('marketplace')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'marketplace'
                    ? 'text-emerald-600 bg-emerald-50'
                    : isLanding ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Explore
              </button>
              {!isLanding && user && (
                <button
                  onClick={() => navigate('dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'dashboard'
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </button>
              )}
            </nav>

            {/* Right section */}
            <div className="flex items-center gap-2">
              {/* Desktop Cascading Location Pickers */}
              {!isLanding && (
                <div className="hidden lg:flex items-center gap-1.5">
                  <Select value={selectedState?.id ?? ''} onValueChange={handleStateChange}>
                    <SelectTrigger className="h-8 w-[130px] text-xs border-emerald-200 bg-emerald-50/50 focus:ring-emerald-500/20 focus:border-emerald-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                        <SelectValue placeholder="State" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedState && cities.length > 0 && (
                    <Select value={selectedCity?.id ?? ''} onValueChange={handleCityChange}>
                      <SelectTrigger className="h-8 w-[130px] text-xs border-emerald-200 bg-emerald-50/50 focus:ring-emerald-500/20 focus:border-emerald-500">
                        <SelectValue placeholder="City" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {selectedCity && areas.length > 0 && (
                    <Select value={selectedArea?.id ?? ''} onValueChange={handleAreaChange}>
                      <SelectTrigger className="h-8 w-[130px] text-xs border-emerald-200 bg-emerald-50/50 focus:ring-emerald-500/20 focus:border-emerald-500">
                        <SelectValue placeholder="Area" />
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Mobile Location Button */}
              {!isLanding && (
                <button
                  onClick={() => setShowLocationMobile(true)}
                  className={`lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
                    hasLocationSelection
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  <span className="max-w-[80px] truncate">{locationLabel}</span>
                </button>
              )}

              {/* Search (navigate to marketplace) */}
              {!isLanding && (
                <button
                  onClick={() => navigate('marketplace')}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors md:hidden"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}

              {user ? (
                <>
                  {/* List Item Button */}
                  <Button
                    size="sm"
                    onClick={() => navigate('list-item')}
                    className="hidden sm:flex bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>List Item</span>
                  </Button>

                  {/* Notifications */}
                  <div ref={notifRef} className="relative">
                    <button
                      onClick={() => setShowNotif(!showNotif)}
                      className={`p-2 rounded-lg transition-colors relative ${
                        isLanding
                          ? 'text-white/80 hover:text-white hover:bg-white/10'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                    {showNotif && (
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                          <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={async () => {
                                try {
                                  await api.markNotificationsRead(undefined, true);
                                  setNotifications(notifications.map(n => ({ ...n, isRead: true })));
                                  setUnreadCount(0);
                                } catch {}
                              }}
                              className="text-xs text-emerald-600 hover:text-emerald-700"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        <ScrollArea className="max-h-80">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-sm text-gray-400">No notifications</div>
                          ) : (
                            notifications.slice(0, 10).map(n => (
                              <button
                                key={n.id}
                                onClick={() => setShowNotif(false)}
                                className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0 ${!n.isRead ? 'bg-emerald-50/50' : ''}`}
                              >
                                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.message}</p>
                              </button>
                            ))
                          )}
                        </ScrollArea>
                        <button
                          onClick={() => { setShowNotif(false); navigate('notifications'); }}
                          className="w-full p-2.5 text-center text-xs font-medium text-emerald-600 hover:bg-emerald-50 border-t border-gray-100"
                        >
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>

                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                        <Avatar className="h-8 w-8 border-2 border-emerald-200">
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-semibold">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                          {user.name?.split(' ')[0]}
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        {user.state && (
                          <p className="text-xs text-gray-400 mt-0.5">📍 {user.state.name}</p>
                        )}
                      </div>
                      <DropdownMenuItem onClick={() => navigate('dashboard')}>
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('my-rentals')}>
                        <Package className="w-4 h-4 mr-2" />
                        My Rentals
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('my-listings')}>
                        <Store className="w-4 h-4 mr-2" />
                        My Listings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('favorites')}>
                        <Heart className="w-4 h-4 mr-2" />
                        Favorites
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('messages')}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Messages
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate('admin-dashboard')}>
                            <Shield className="w-4 h-4 mr-2" />
                            Admin Panel
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setAuthModalView('login'); setAuthModalOpen(true); }}
                    className={isLanding ? 'text-white hover:text-white hover:bg-white/10' : ''}
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => { setAuthModalView('register'); setAuthModalOpen(true); }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    Sign Up
                  </Button>
                </div>
              )}

              {/* Mobile menu */}
              <button
                onClick={() => setShowMobile(true)}
                className={`p-2 rounded-lg md:hidden ${
                  isLanding
                    ? 'text-white hover:bg-white/10'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Location Picker Sheet */}
      <Sheet open={showLocationMobile} onOpenChange={setShowLocationMobile}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="p-4 pb-2">
            <SheetTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-4 h-4 text-emerald-500" />
              Select Location
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">State</label>
              <Select value={selectedState?.id ?? ''} onValueChange={(val) => { handleStateChange(val); }}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedState && cities.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">City</label>
                <Select value={selectedCity?.id ?? ''} onValueChange={(val) => { handleCityChange(val); }}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedCity && areas.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">Area</label>
                <Select value={selectedArea?.id ?? ''} onValueChange={(val) => { handleAreaChange(val); setShowLocationMobile(false); }}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Select an area" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(selectedState || selectedCity || selectedArea) && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-sm text-gray-500"
                onClick={() => {
                  setSelectedState(null);
                  setSelectedCity(null);
                  setSelectedArea(null);
                  navigate('marketplace');
                  setShowLocationMobile(false);
                }}
              >
                Clear location selection
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Side Sheet */}
      <Sheet open={showMobile} onOpenChange={setShowMobile}>
        <SheetContent side="right" className="w-72 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
              Rent<span className="text-emerald-500">Loop</span>
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1">
              <MobileNavItem icon={<Search className="w-4 h-4" />} label="Explore" onClick={() => { navigate('marketplace'); setShowMobile(false); }} />
              {user ? (
                <>
                  <MobileNavItem icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" onClick={() => { navigate('dashboard'); setShowMobile(false); }} />
                  <MobileNavItem icon={<Package className="w-4 h-4" />} label="My Rentals" onClick={() => { navigate('my-rentals'); setShowMobile(false); }} />
                  <MobileNavItem icon={<Store className="w-4 h-4" />} label="My Listings" onClick={() => { navigate('my-listings'); setShowMobile(false); }} />
                  <MobileNavItem icon={<Plus className="w-4 h-4" />} label="List Item" onClick={() => { navigate('list-item'); setShowMobile(false); }} />
                  <MobileNavItem icon={<Heart className="w-4 h-4" />} label="Favorites" onClick={() => { navigate('favorites'); setShowMobile(false); }} />
                  <MobileNavItem icon={<MessageCircle className="w-4 h-4" />} label="Messages" onClick={() => { navigate('messages'); setShowMobile(false); }} />
                  {isAdmin && (
                    <MobileNavItem icon={<Shield className="w-4 h-4" />} label="Admin Panel" onClick={() => { navigate('admin-dashboard'); setShowMobile(false); }} />
                  )}
                </>
              ) : (
                <>
                  <MobileNavItem icon={<User className="w-4 h-4" />} label="Login" onClick={() => { setAuthModalView('login'); setAuthModalOpen(true); setShowMobile(false); }} />
                  <MobileNavItem icon={<User className="w-4 h-4" />} label="Sign Up" onClick={() => { setAuthModalView('register'); setAuthModalOpen(true); setShowMobile(false); }} />
                </>
              )}
            </div>
          </ScrollArea>
          {user && (
            <div className="p-3 border-t">
              <button
                onClick={() => { handleLogout(); setShowMobile(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function MobileNavItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
    >
      {icon}
      {label}
    </button>
  );
}
