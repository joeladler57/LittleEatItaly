import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import {
  ShoppingBag, CalendarDays, Check, X, Clock, Phone, User, Mail,
  ChevronDown, ChevronUp, Volume2, VolumeX, Bell, BellOff, LogOut,
  RefreshCw, Utensils, CheckCircle2, CircleDashed, Send, BellRing, Plus, Users
} from "lucide-react";
import { useNotificationSound } from "../hooks/useNotificationSound";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { registerServiceWorker } from "../hooks/usePWA";

const CHEF_ICON = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/845efg67_kopf.png";
const POLLING_INTERVAL = 4000;

const StaffPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [activeTab, setActiveTab] = useState("orders");
  const [orderFilter, setOrderFilter] = useState("pending"); // pending, preparing, ready, all
  const [showPhoneReservation, setShowPhoneReservation] = useState(false);

  // Data states
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);

  // Notification states
  const { playSound, startLoopingSound, stopLoopingSound, isLooping, enableAudio } = useNotificationSound();
  const { 
    isSupported: isPushSupported, 
    isSubscribed: isPushSubscribed,
    isLoading: isPushLoading,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
    testNotification
  } = usePushNotifications();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [lastReservationCount, setLastReservationCount] = useState(0);
  const pollingRef = useRef(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    registerServiceWorker();
    const token = localStorage.getItem("staff_token");
    if (token) {
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      await axios.get(`${API}/staff/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsAuthenticated(true);
      fetchData();
    } catch (e) {
      localStorage.removeItem("staff_token");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setPinError("");
    
    try {
      const response = await axios.post(`${API}/staff/login`, { pin });
      localStorage.setItem("staff_token", response.data.access_token);
      setIsAuthenticated(true);
      setPin("");
      fetchData();
      toast.success("Angemeldet!");
    } catch (error) {
      setPinError("Falscher PIN");
      setPin("");
    }
  };

  const handleLogout = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    localStorage.removeItem("staff_token");
    setIsAuthenticated(false);
    setOrders([]);
    setReservations([]);
  };

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("staff_token");
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [ordersRes, reservationsRes] = await Promise.all([
        axios.get(`${API}/staff/orders`, { headers }),
        axios.get(`${API}/staff/reservations`, { headers })
      ]);

      const newOrders = ordersRes.data;
      const newReservations = reservationsRes.data;

      const pendingOrders = newOrders.filter(o => o.status === "pending").length;
      const pendingReservations = newReservations.filter(r => r.status === "pending").length;
      const hasPending = pendingOrders > 0 || pendingReservations > 0;

      if (!isFirstLoad.current) {
        // Check for NEW orders/reservations
        if (pendingOrders > lastOrderCount && soundEnabled) {
          toast.success(`🍕 ${pendingOrders - lastOrderCount} neue Bestellung(en)!`);
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
        }
        if (pendingReservations > lastReservationCount && soundEnabled) {
          toast.success(`📅 ${pendingReservations - lastReservationCount} neue Reservierung(en)!`);
        }
      } else {
        isFirstLoad.current = false;
      }

      // Start/stop looping alarm based on pending items
      if (hasPending && soundEnabled && !isAlarmActive) {
        startLoopingSound();
        setIsAlarmActive(true);
      } else if (!hasPending && isAlarmActive) {
        stopLoopingSound();
        setIsAlarmActive(false);
      }

      setOrders(newOrders);
      setReservations(newReservations);
      setLastOrderCount(pendingOrders);
      setLastReservationCount(pendingReservations);
    } catch (e) {
      console.error("Fetch failed:", e);
      if (e.response?.status === 401) handleLogout();
    }
  }, [lastOrderCount, lastReservationCount, soundEnabled, isAlarmActive, startLoopingSound, stopLoopingSound]);

  // Stop alarm when sound is disabled
  useEffect(() => {
    if (!soundEnabled && isAlarmActive) {
      stopLoopingSound();
      setIsAlarmActive(false);
    }
  }, [soundEnabled, isAlarmActive, stopLoopingSound]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      pollingRef.current = setInterval(fetchData, POLLING_INTERVAL);
      return () => clearInterval(pollingRef.current);
    }
  }, [isAuthenticated, fetchData]);

  const filteredOrders = orders.filter(o => {
    if (orderFilter === "all") return true;
    if (orderFilter === "pending") return o.status === "pending";
    if (orderFilter === "preparing") return ["confirmed", "preparing"].includes(o.status);
    if (orderFilter === "ready") return o.status === "ready";
    return true;
  });

  const pendingReservations = reservations.filter(r => r.status === "pending");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-pizza-black flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
          <img src={CHEF_ICON} alt="Loading" className="w-16 h-16" />
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-pizza-black flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img src={CHEF_ICON} alt="Chef" className="w-20 h-20 mx-auto mb-4" />
            <h1 className="font-anton text-3xl text-pizza-white">PERSONAL</h1>
            <p className="font-mono text-sm text-neutral-400 mt-2">PIN eingeben zum Anmelden</p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-14 h-14 border-2 flex items-center justify-center text-2xl font-anton ${
                    pin.length > i ? 'border-pizza-red bg-pizza-red/20 text-pizza-white' : 'border-pizza-dark text-neutral-600'
                  }`}
                >
                  {pin.length > i ? '•' : ''}
                </div>
              ))}
            </div>

            {pinError && (
              <p className="text-center text-red-500 font-mono text-sm">{pinError}</p>
            )}

            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((num, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (num === 'del') setPin(p => p.slice(0, -1));
                    else if (num !== '' && pin.length < 4) setPin(p => p + num);
                  }}
                  disabled={num === ''}
                  className={`h-14 font-anton text-xl rounded-none transition-all ${
                    num === '' ? 'invisible' :
                    num === 'del' ? 'bg-pizza-dark text-neutral-400 hover:bg-neutral-700' :
                    'bg-pizza-dark text-pizza-white hover:bg-pizza-red'
                  }`}
                >
                  {num === 'del' ? '←' : num}
                </button>
              ))}
            </div>

            <Button
              type="submit"
              disabled={pin.length !== 4}
              className="w-full h-14 bg-pizza-red hover:bg-red-700 text-pizza-white font-anton text-lg rounded-none disabled:opacity-50"
            >
              ANMELDEN
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pizza-black" onClick={enableAudio}>
      {/* Alarm Banner - Shows when there are pending items - Clickable */}
      {isAlarmActive && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 animate-pulse">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div 
              className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                // Navigate to the tab with pending items
                const pendingOrders = orders.filter(o => o.status === "pending").length;
                const pendingRes = reservations.filter(r => r.status === "pending").length;
                if (pendingOrders > 0) {
                  setActiveTab("orders");
                  setOrderFilter("pending");
                } else if (pendingRes > 0) {
                  setActiveTab("reservations");
                }
              }}
            >
              <BellRing className="w-6 h-6 text-white animate-bounce" />
              <div>
                <p className="font-anton text-white text-lg">NEUE BESTELLUNG / RESERVIERUNG!</p>
                <p className="font-mono text-xs text-red-100">Antippen um anzuzeigen</p>
              </div>
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                stopLoopingSound();
                setIsAlarmActive(false);
              }}
              className="bg-white text-red-600 hover:bg-red-100 font-anton rounded-none"
            >
              <VolumeX className="w-4 h-4 mr-2" /> STUMM
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`bg-pizza-dark border-b border-pizza-black sticky ${isAlarmActive ? 'top-16' : 'top-0'} z-50 transition-all`}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={CHEF_ICON} alt="Chef" className="w-8 h-8" />
              <div>
                <h1 className="font-anton text-lg text-pizza-white">LITTLE EAT ITALY</h1>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="font-mono text-xs text-green-400">LIVE</span>
                  {isPushSubscribed && (
                    <>
                      <span className="text-neutral-600">•</span>
                      <Bell className="w-3 h-3 text-blue-400" />
                      <span className="font-mono text-xs text-blue-400">PUSH</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  enableAudio();
                }}
                variant="ghost"
                size="sm"
                className={`rounded-none ${soundEnabled ? 'text-green-400' : 'text-neutral-500'}`}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
              {isPushSupported && (
                <Button
                  onClick={async () => {
                    if (isPushSubscribed) {
                      await unsubscribeFromPush();
                      toast.success('Push deaktiviert');
                    } else {
                      try {
                        await subscribeToPush('Personal Gerät');
                        toast.success('Push aktiviert!');
                      } catch (e) {
                        toast.error(e.message);
                      }
                    }
                  }}
                  disabled={isPushLoading}
                  variant="ghost"
                  size="sm"
                  className={`rounded-none ${isPushSubscribed ? 'text-blue-400' : 'text-neutral-500'}`}
                >
                  {isPushSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                </Button>
              )}
              <Button
                onClick={() => setShowPhoneReservation(true)}
                variant="ghost"
                size="sm"
                className="text-green-400 rounded-none"
                title="Telefonische Reservierung"
              >
                <Plus className="w-5 h-5" />
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-neutral-400 rounded-none"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Phone Reservation Modal */}
      {showPhoneReservation && (
        <PhoneReservationModal 
          onClose={() => setShowPhoneReservation(false)} 
          onSuccess={() => {
            setShowPhoneReservation(false);
            fetchData();
          }}
        />
      )}

      {/* Stats Bar */}
      <div className="bg-pizza-black border-b border-pizza-dark">
        <div className="max-w-4xl mx-auto px-4 py-3">
          {/* Today's Reservations Highlight */}
          {(() => {
            const today = new Date().toISOString().split('T')[0];
            const todayConfirmed = reservations.filter(r => r.date === today && r.status === "confirmed");
            const totalGuests = todayConfirmed.reduce((sum, r) => sum + r.guests, 0);
            return todayConfirmed.length > 0 ? (
              <div 
                onClick={() => setActiveTab("today")}
                className="mb-3 p-3 bg-green-600/20 border border-green-500/50 cursor-pointer hover:bg-green-600/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-green-400" />
                    <div>
                      <p className="font-anton text-lg text-white">HEUTE</p>
                      <p className="font-mono text-xs text-green-300">{new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-anton text-3xl text-green-400">{todayConfirmed.length}</p>
                    <p className="font-mono text-xs text-green-300">{totalGuests} Personen</p>
                  </div>
                </div>
              </div>
            ) : null;
          })()}
          
          {/* Order Stats */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className={`p-2 ${orders.filter(o => o.status === "pending").length > 0 ? 'bg-red-500/20 border border-red-500/50' : 'bg-pizza-dark'}`}>
              <p className="font-anton text-2xl text-pizza-white">{orders.filter(o => o.status === "pending").length}</p>
              <p className="font-mono text-xs text-neutral-400">Neu</p>
            </div>
            <div className="bg-pizza-dark p-2">
              <p className="font-anton text-2xl text-yellow-500">{orders.filter(o => ["confirmed", "preparing"].includes(o.status)).length}</p>
              <p className="font-mono text-xs text-neutral-400">Zubereitung</p>
            </div>
            <div className="bg-pizza-dark p-2">
              <p className="font-anton text-2xl text-green-500">{orders.filter(o => o.status === "ready").length}</p>
              <p className="font-mono text-xs text-neutral-400">Bereit</p>
            </div>
            <div className={`p-2 ${pendingReservations.length > 0 ? 'bg-blue-500/20 border border-blue-500/50' : 'bg-pizza-dark'}`}>
              <p className="font-anton text-2xl text-blue-400">{pendingReservations.length}</p>
              <p className="font-mono text-xs text-neutral-400">Reserv.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - Horizontal Scrolling Bar */}
      <div className={`sticky ${isAlarmActive ? 'top-[108px]' : 'top-[52px]'} z-40 bg-pizza-black border-b border-pizza-dark transition-all`}>
        <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
          <div className="flex min-w-max">
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-2 px-6 py-4 font-anton text-sm whitespace-nowrap border-b-2 transition-all ${
                activeTab === "orders" 
                  ? 'bg-pizza-red/10 text-white border-pizza-red' 
                  : 'text-neutral-400 border-transparent hover:text-white'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              BESTELLUNGEN
              {orders.filter(o => o.status === "pending").length > 0 && (
                <span className="bg-pizza-red text-white text-xs px-2 py-0.5 rounded-full">
                  {orders.filter(o => o.status === "pending").length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("reservations")}
              className={`flex items-center gap-2 px-6 py-4 font-anton text-sm whitespace-nowrap border-b-2 transition-all ${
                activeTab === "reservations" 
                  ? 'bg-blue-600/10 text-white border-blue-500' 
                  : 'text-neutral-400 border-transparent hover:text-white'
              }`}
            >
              <CalendarDays className="w-5 h-5" />
              RESERVIERUNGEN
              {pendingReservations.length > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingReservations.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("today")}
              className={`flex items-center gap-2 px-6 py-4 font-anton text-sm whitespace-nowrap border-b-2 transition-all ${
                activeTab === "today" 
                  ? 'bg-green-600/10 text-white border-green-500' 
                  : 'text-neutral-400 border-transparent hover:text-white'
              }`}
            >
              <Clock className="w-5 h-5" />
              HEUTE
              {(() => {
                const today = new Date().toISOString().split('T')[0];
                const todayCount = reservations.filter(r => r.date === today && r.status === "confirmed").length;
                return todayCount > 0 ? (
                  <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {todayCount}
                  </span>
                ) : null;
              })()}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto px-4 py-3">

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <>
            {/* Order Filter */}
            <div className="flex gap-1 mb-4 overflow-x-auto">
              {[
                { id: "pending", label: "Neu", count: orders.filter(o => o.status === "pending").length, color: "red" },
                { id: "preparing", label: "Zubereitung", count: orders.filter(o => ["confirmed", "preparing"].includes(o.status)).length, color: "yellow" },
                { id: "ready", label: "Bereit", count: orders.filter(o => o.status === "ready").length, color: "green" },
                { id: "all", label: "Alle", count: orders.length, color: "neutral" }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setOrderFilter(filter.id)}
                  className={`px-3 py-2 font-mono text-xs whitespace-nowrap transition-all ${
                    orderFilter === filter.id 
                      ? `bg-${filter.color}-500 text-white` 
                      : 'bg-pizza-dark text-neutral-400 hover:bg-pizza-dark/80'
                  }`}
                  style={orderFilter === filter.id ? {
                    backgroundColor: filter.color === 'red' ? '#ef4444' : 
                                     filter.color === 'yellow' ? '#eab308' : 
                                     filter.color === 'green' ? '#22c55e' : '#525252'
                  } : {}}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>

            {/* Orders List */}
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 bg-pizza-dark">
                  <ShoppingBag className="w-12 h-12 text-neutral-600 mx-auto mb-2" />
                  <p className="font-mono text-neutral-400">Keine Bestellungen</p>
                </div>
              ) : (
                filteredOrders.map(order => (
                  <OrderCard key={order.id} order={order} onUpdate={fetchData} />
                ))
              )}
            </div>
          </>
        )}

        {/* Reservations Tab */}
        {activeTab === "reservations" && (
          <div className="space-y-3">
            {reservations.length === 0 ? (
              <div className="text-center py-12 bg-pizza-dark">
                <CalendarDays className="w-12 h-12 text-neutral-600 mx-auto mb-2" />
                <p className="font-mono text-neutral-400">Keine Reservierungen</p>
              </div>
            ) : (
              reservations.filter(r => r.status === "pending").length > 0 ? (
                <>
                  <p className="font-mono text-xs text-neutral-500 mb-2">OFFENE RESERVIERUNGEN</p>
                  {reservations.filter(r => r.status === "pending").map(res => (
                    <ReservationCard key={res.id} reservation={res} onUpdate={fetchData} />
                  ))}
                  {reservations.filter(r => r.status === "confirmed").length > 0 && (
                    <>
                      <p className="font-mono text-xs text-neutral-500 mt-6 mb-2">BESTÄTIGT</p>
                      {reservations.filter(r => r.status === "confirmed").map(res => (
                        <ReservationCard key={res.id} reservation={res} onUpdate={fetchData} />
                      ))}
                    </>
                  )}
                </>
              ) : reservations.filter(r => r.status === "confirmed").length > 0 ? (
                <>
                  <p className="font-mono text-xs text-neutral-500 mb-2">BESTÄTIGTE RESERVIERUNGEN</p>
                  {reservations.filter(r => r.status === "confirmed").map(res => (
                    <ReservationCard key={res.id} reservation={res} onUpdate={fetchData} />
                  ))}
                </>
              ) : (
                <div className="text-center py-12 bg-pizza-dark">
                  <CalendarDays className="w-12 h-12 text-neutral-600 mx-auto mb-2" />
                  <p className="font-mono text-neutral-400">Keine offenen Reservierungen</p>
                </div>
              )
            )}
          </div>
        )}

        {/* Today's Reservations Tab - Full width */}
        {activeTab === "today" && (
          <div className="-mx-4">
            <TodayReservations reservations={reservations} onUpdate={fetchData} />
          </div>
        )}
      </div>
    </div>
  );
};

// Order Card Component
const OrderCard = ({ order, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showPrepTime, setShowPrepTime] = useState(false);
  const [prepTime, setPrepTime] = useState(30);

  const updateStatus = async (status, prepTimeMinutes = null) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("staff_token");
      let url = `${API}/staff/orders/${order.id}/status?status=${status}`;
      if (prepTimeMinutes) url += `&prep_time_minutes=${prepTimeMinutes}`;
      
      const res = await axios.put(url, {}, { headers: { Authorization: `Bearer ${token}` } });
      
      if (res.data.pickup_time) {
        toast.success(`Bestätigt! Abholzeit: ${res.data.pickup_time} Uhr`);
      } else {
        toast.success(`Status: ${status}`);
      }
      onUpdate();
      setShowPrepTime(false);
    } catch (e) {
      toast.error("Fehler beim Aktualisieren");
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirm = () => {
    if (order.pickup_time === "So schnell wie möglich") {
      setShowPrepTime(true);
    } else {
      updateStatus("confirmed");
    }
  };

  const statusColors = {
    pending: "border-l-red-500 bg-neutral-900",
    confirmed: "border-l-blue-500 bg-neutral-900",
    preparing: "border-l-yellow-500 bg-neutral-900",
    ready: "border-l-green-500 bg-neutral-900",
    completed: "border-l-neutral-500 bg-neutral-800",
    cancelled: "border-l-neutral-700 bg-neutral-800"
  };

  const statusBadge = {
    pending: "bg-red-500 text-white",
    confirmed: "bg-blue-500 text-white",
    preparing: "bg-yellow-500 text-black",
    ready: "bg-green-500 text-white",
    completed: "bg-neutral-500 text-white",
    cancelled: "bg-neutral-700 text-white"
  };

  const statusText = {
    pending: "NEU",
    confirmed: "BESTÄTIGT",
    preparing: "ZUBEREITUNG",
    ready: "BEREIT",
    completed: "ABGEHOLT",
    cancelled: "STORNIERT"
  };

  const formatPrice = (p) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p);

  return (
    <div className={`border-l-4 ${statusColors[order.status]} overflow-hidden shadow-lg`}>
      <div className="p-4 cursor-pointer hover:bg-neutral-800/50 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-anton text-xl text-white">#{order.order_number}</span>
              <span className={`px-2 py-0.5 text-xs font-bold ${statusBadge[order.status]}`}>
                {statusText[order.status]}
              </span>
            </div>
            <p className="font-mono text-sm text-neutral-200 mt-1">{order.customer_name}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-sm">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-medium">
                  {order.pickup_time}
                  {order.confirmed_pickup_time && ` → ${order.confirmed_pickup_time} Uhr`}
                </span>
              </span>
              <span className="text-neutral-500">•</span>
              <span className="text-sm text-neutral-300">{order.payment_method || "Barzahlung"}</span>
            </div>
          </div>
          <div className="text-right ml-4">
            <p className="font-anton text-2xl text-green-400">{formatPrice(order.total)}</p>
            <p className="font-mono text-xs text-neutral-400">{order.items?.length} Artikel</p>
            <ChevronDown className={`w-5 h-5 text-neutral-500 ml-auto mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-neutral-700 pt-3 bg-neutral-800/50">
              {/* Items */}
              <div className="bg-black/30 p-3 mb-3 border border-neutral-700">
                <p className="font-mono text-xs text-neutral-500 mb-2 uppercase">Bestellte Artikel</p>
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-neutral-700/50 last:border-0">
                    <span className="font-mono text-sm text-white">
                      <span className="text-yellow-400 font-bold">{item.quantity}x</span> {item.item_name}
                      {item.size_name && <span className="text-neutral-400"> ({item.size_name})</span>}
                    </span>
                    <span className="font-mono text-sm text-green-400 font-medium">{formatPrice(item.total_price)}</span>
                  </div>
                ))}
                {order.notes && (
                  <div className="mt-3 pt-3 border-t border-yellow-500/30 bg-yellow-500/10 p-2 -mx-3 -mb-3">
                    <p className="font-mono text-sm text-yellow-400">
                      📝 <span className="font-bold">Hinweis:</span> {order.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div className="flex flex-wrap gap-4 mb-4 p-3 bg-black/20 border border-neutral-700">
                <span className="font-mono text-sm flex items-center gap-2 text-white">
                  <Phone className="w-4 h-4 text-blue-400" /> {order.customer_phone}
                </span>
                <span className="font-mono text-sm flex items-center gap-2 text-neutral-300">
                  <Mail className="w-4 h-4 text-blue-400" /> {order.customer_email}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {order.status === "pending" && (
                  <>
                    <Button
                      onClick={handleConfirm}
                      disabled={updating}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold text-base py-3 rounded-none shadow-lg"
                    >
                      <Check className="w-5 h-5 mr-2" /> ANNEHMEN
                    </Button>
                    <Button
                      onClick={() => updateStatus("cancelled")}
                      disabled={updating}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-none"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </>
                )}
                {order.status === "confirmed" && (
                  <Button
                    onClick={() => updateStatus("preparing")}
                    disabled={updating}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-base py-3 rounded-none shadow-lg"
                  >
                    <Utensils className="w-5 h-5 mr-2" /> IN ZUBEREITUNG
                  </Button>
                )}
                {order.status === "preparing" && (
                  <Button
                    onClick={() => updateStatus("ready")}
                    disabled={updating}
                    className="flex-1 bg-green-500 hover:bg-green-400 text-white font-bold text-base py-3 rounded-none shadow-lg"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" /> FERTIG
                  </Button>
                )}
                {order.status === "ready" && (
                  <Button
                    onClick={() => updateStatus("completed")}
                    disabled={updating}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base py-3 rounded-none shadow-lg"
                  >
                    <Check className="w-5 h-5 mr-2" /> ABGEHOLT
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prep Time Modal */}
      {showPrepTime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-neutral-900 border-2 border-green-500 p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-anton text-2xl text-white mb-2">ZUBEREITUNGSZEIT</h3>
            <p className="font-mono text-sm text-neutral-300 mb-6">
              Wie viele Minuten dauert die Zubereitung?
            </p>
            
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setPrepTime(Math.max(5, prepTime - 5))}
                className="w-16 h-16 bg-neutral-800 hover:bg-neutral-700 border-2 border-neutral-600 text-white font-anton text-3xl rounded"
              >
                -
              </button>
              <div className="flex-1 text-center">
                <span className="font-anton text-6xl text-green-400">{prepTime}</span>
                <span className="font-mono text-base text-neutral-400 block mt-1">Minuten</span>
              </div>
              <button
                onClick={() => setPrepTime(prepTime + 5)}
                className="w-16 h-16 bg-neutral-800 hover:bg-neutral-700 border-2 border-neutral-600 text-white font-anton text-3xl rounded"
              >
                +
              </button>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => setShowPrepTime(false)}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 rounded-none"
              >
                Abbrechen
              </Button>
              <Button
                onClick={() => updateStatus("confirmed", prepTime)}
                disabled={updating}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-none"
              >
                {updating ? "..." : "BESTÄTIGEN"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reservation Card Component
const ReservationCard = ({ reservation, onUpdate }) => {
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("staff_token");
      await axios.put(
        `${API}/staff/reservations/${reservation.id}/status?status=${status}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(status === "confirmed" ? "Reservierung bestätigt!" : `Status: ${status}`);
      onUpdate();
    } catch (e) {
      toast.error("Fehler beim Aktualisieren");
    } finally {
      setUpdating(false);
    }
  };

  const statusColors = {
    pending: "border-l-yellow-500 bg-neutral-900",
    confirmed: "border-l-green-500 bg-neutral-900",
    cancelled: "border-l-red-500 bg-neutral-800",
    completed: "border-l-neutral-500 bg-neutral-800"
  };

  const statusBadge = {
    pending: "bg-yellow-500 text-black",
    confirmed: "bg-green-500 text-white",
    cancelled: "bg-red-500 text-white",
    completed: "bg-neutral-500 text-white"
  };

  const statusText = {
    pending: "OFFEN",
    confirmed: "BESTÄTIGT",
    cancelled: "STORNIERT",
    completed: "ABGESCHLOSSEN"
  };

  return (
    <div className={`border-l-4 ${statusColors[reservation.status]} p-4 shadow-lg`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-anton text-xl text-white">#{reservation.reservation_number}</span>
            <span className={`px-2 py-0.5 text-xs font-bold ${statusBadge[reservation.status]}`}>
              {statusText[reservation.status]}
            </span>
          </div>
          <p className="font-mono text-sm text-neutral-200 mt-1">{reservation.customer_name}</p>
          
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="flex items-center gap-2 bg-blue-500/20 px-2 py-1">
              <CalendarDays className="w-4 h-4 text-blue-400" />
              <span className="font-mono text-sm text-blue-300 font-medium">
                {new Date(reservation.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </span>
            <span className="flex items-center gap-2 bg-red-500/20 px-2 py-1">
              <Clock className="w-4 h-4 text-red-400" />
              <span className="font-mono text-sm text-red-300 font-bold">{reservation.time} Uhr</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <span className="flex items-center gap-2 text-sm text-neutral-200">
              <User className="w-4 h-4 text-green-400" />
              <span className="font-bold text-green-400">{reservation.guests}</span> Personen
            </span>
            <span className="flex items-center gap-2 text-sm text-neutral-300">
              <Phone className="w-4 h-4 text-blue-400" />
              {reservation.customer_phone}
            </span>
          </div>
          
          {reservation.notes && (
            <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30">
              <p className="font-mono text-sm text-yellow-400">📝 {reservation.notes}</p>
            </div>
          )}
        </div>

        {reservation.status === "pending" && (
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => updateStatus("confirmed")}
              disabled={updating}
              className="bg-green-600 hover:bg-green-500 text-white rounded-none h-12 w-12 p-0 shadow-lg"
            >
              <Check className="w-6 h-6" />
            </Button>
            <Button
              onClick={() => updateStatus("cancelled")}
              disabled={updating}
              className="bg-red-600 hover:bg-red-500 text-white rounded-none h-12 w-12 p-0"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        )}

        {reservation.status === "confirmed" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/50">
            <Check className="w-5 h-5 text-green-400" />
            <span className="font-bold text-green-400 text-sm">Bestätigt</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Today's Reservations Component - Simple List View
const TodayReservations = ({ reservations, onUpdate }) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Filter today's confirmed reservations and sort by time
  const todayReservations = reservations
    .filter(r => r.date === today && r.status === "confirmed")
    .sort((a, b) => a.time.localeCompare(b.time));

  const formatDate = () => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return new Date().toLocaleDateString('de-DE', options);
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-green-600 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-anton text-2xl text-white">HEUTE</h2>
            <p className="font-mono text-sm text-green-100">{formatDate()}</p>
          </div>
          <div className="text-right">
            <p className="font-anton text-4xl text-white">{todayReservations.length}</p>
            <p className="font-mono text-xs text-green-100">Reservierungen</p>
          </div>
        </div>
      </div>

      {todayReservations.length === 0 ? (
        <div className="text-center py-16 bg-neutral-900">
          <CalendarDays className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
          <p className="font-anton text-xl text-neutral-500">Keine Reservierungen für heute</p>
          <p className="font-mono text-sm text-neutral-600 mt-2">Bestätigte Reservierungen erscheinen hier</p>
        </div>
      ) : (
        <div>
          {/* Reservation Rows - Mobile-friendly card layout */}
          <div className="space-y-1">
            {todayReservations.map((res, index) => (
              <TodayReservationRow key={res.id} reservation={res} index={index} />
            ))}
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between px-4 py-4 bg-green-600 mt-1">
            <p className="font-anton text-lg text-white">GESAMT PERSONEN</p>
            <p className="font-anton text-3xl text-white">
              {todayReservations.reduce((sum, r) => sum + r.guests, 0)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Individual Row for Today's Reservations - Ultra Simple Mobile Design
const TodayReservationRow = ({ reservation, index }) => {
  const isEven = index % 2 === 0;
  
  // Check if reservation time has passed
  const now = new Date();
  const [hours, minutes] = reservation.time.split(':');
  const resTime = new Date();
  resTime.setHours(parseInt(hours), parseInt(minutes), 0);
  const isPast = now > resTime;
  const isSoon = !isPast && (resTime - now) < 30 * 60 * 1000;

  return (
    <div 
      className={`px-4 py-3 ${isEven ? 'bg-neutral-900' : 'bg-neutral-800'} ${isPast ? 'opacity-50' : ''}`}
      data-testid={`today-reservation-${reservation.id}`}
    >
      {/* Simple grid layout: TIME on left, GUESTS on right */}
      <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center">
        {/* TIME - Large and prominent */}
        <div className={`font-anton text-2xl min-w-[70px] ${
          isPast ? 'text-neutral-500' : isSoon ? 'text-yellow-400' : 'text-green-400'
        }`}>
          {reservation.time}
        </div>
        
        {/* NAME */}
        <div className={`font-mono text-sm truncate ${
          isPast ? 'text-neutral-500' : 'text-white'
        }`}>
          {reservation.customer_name}
          {isSoon && <span className="ml-2 text-yellow-400 text-xs font-bold">BALD!</span>}
        </div>
        
        {/* GUESTS */}
        <div className="flex items-center gap-1">
          <User className={`w-4 h-4 ${isPast ? 'text-neutral-600' : 'text-green-400'}`} />
          <span className={`font-anton text-xl ${isPast ? 'text-neutral-600' : 'text-green-400'}`}>
            {reservation.guests}
          </span>
        </div>
      </div>
      
      {/* Notes below if present */}
      {reservation.notes && (
        <p className="font-mono text-xs text-yellow-500 mt-2 pl-[82px]">
          📝 {reservation.notes}
        </p>
      )}
    </div>
  );
};

// Phone Reservation Modal Component
const PhoneReservationModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    date: new Date().toISOString().split('T')[0],
    time: "19:00",
    guests: 2,
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.customer_phone) {
      toast.error("Name und Telefon sind Pflichtfelder");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("staff_token");
      await axios.post(`${API}/staff/reservations`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Reservierung eingetragen!");
      onSuccess();
    } catch (error) {
      toast.error("Fehler beim Speichern");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate time options (every 30 minutes from 11:00 to 22:00)
  const timeOptions = [];
  for (let h = 11; h <= 22; h++) {
    timeOptions.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < 22) timeOptions.push(`${h.toString().padStart(2, '0')}:30`);
  }

  // Generate date options (today + next 30 days)
  const dateOptions = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dateOptions.push({
      value: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
    });
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4">
      <div className="bg-neutral-900 border-2 border-green-500 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-green-600 p-4 flex items-center justify-between sticky top-0">
          <div className="flex items-center gap-3">
            <Phone className="w-6 h-6 text-white" />
            <h2 className="font-anton text-xl text-white">TELEFONISCHE RESERVIERUNG</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-green-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="font-mono text-xs text-neutral-400 block mb-1">NAME *</label>
            <input
              type="text"
              value={formData.customer_name}
              onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
              placeholder="z.B. Familie Müller"
              className="w-full bg-neutral-800 border border-neutral-700 text-white p-3 font-mono focus:border-green-500 outline-none"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="font-mono text-xs text-neutral-400 block mb-1">TELEFON *</label>
            <input
              type="tel"
              value={formData.customer_phone}
              onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
              placeholder="z.B. 0176 12345678"
              className="w-full bg-neutral-800 border border-neutral-700 text-white p-3 font-mono focus:border-green-500 outline-none"
              required
            />
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Date */}
            <div>
              <label className="font-mono text-xs text-neutral-400 block mb-1">DATUM</label>
              <select
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full bg-neutral-800 border border-neutral-700 text-white p-3 font-mono focus:border-green-500 outline-none"
              >
                {dateOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Time */}
            <div>
              <label className="font-mono text-xs text-neutral-400 block mb-1">UHRZEIT</label>
              <select
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                className="w-full bg-neutral-800 border border-neutral-700 text-white p-3 font-mono focus:border-green-500 outline-none"
              >
                {timeOptions.map(t => (
                  <option key={t} value={t}>{t} Uhr</option>
                ))}
              </select>
            </div>
          </div>

          {/* Guests */}
          <div>
            <label className="font-mono text-xs text-neutral-400 block mb-1">PERSONEN</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFormData({...formData, guests: Math.max(1, formData.guests - 1)})}
                className="w-12 h-12 bg-neutral-800 border border-neutral-700 text-white font-anton text-2xl hover:bg-neutral-700"
              >
                -
              </button>
              <div className="flex-1 text-center">
                <span className="font-anton text-4xl text-green-400">{formData.guests}</span>
              </div>
              <button
                type="button"
                onClick={() => setFormData({...formData, guests: Math.min(20, formData.guests + 1)})}
                className="w-12 h-12 bg-neutral-800 border border-neutral-700 text-white font-anton text-2xl hover:bg-neutral-700"
              >
                +
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-mono text-xs text-neutral-400 block mb-1">NOTIZEN (optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="z.B. Kinderstuhl, Geburtstag..."
              rows={2}
              className="w-full bg-neutral-800 border border-neutral-700 text-white p-3 font-mono focus:border-green-500 outline-none resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white font-anton py-4 rounded-none"
            >
              ABBRECHEN
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white font-anton py-4 rounded-none"
            >
              {isSubmitting ? "..." : "SPEICHERN"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffPage;
