import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import {
  ShoppingBag, CalendarDays, Check, X, Clock, Phone, User, Mail,
  ChevronDown, ChevronUp, Volume2, VolumeX, Bell, BellOff, LogOut,
  RefreshCw, Utensils, CheckCircle2, CircleDashed, Send
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

  // Data states
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);

  // Notification states
  const { playSound, enableAudio } = useNotificationSound();
  const { 
    isSupported: isPushSupported, 
    isSubscribed: isPushSubscribed,
    isLoading: isPushLoading,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
    testNotification
  } = usePushNotifications();
  const [soundEnabled, setSoundEnabled] = useState(true);
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

      if (!isFirstLoad.current) {
        if (pendingOrders > lastOrderCount && soundEnabled) {
          playSound();
          toast.success(`🍕 ${pendingOrders - lastOrderCount} neue Bestellung(en)!`);
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
        }
        if (pendingReservations > lastReservationCount && soundEnabled) {
          playSound();
          toast.success(`📅 ${pendingReservations - lastReservationCount} neue Reservierung(en)!`);
        }
      } else {
        isFirstLoad.current = false;
      }

      setOrders(newOrders);
      setReservations(newReservations);
      setLastOrderCount(pendingOrders);
      setLastReservationCount(pendingReservations);
    } catch (e) {
      console.error("Fetch failed:", e);
      if (e.response?.status === 401) handleLogout();
    }
  }, [lastOrderCount, lastReservationCount, soundEnabled, playSound]);

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
      {/* Header */}
      <div className="bg-pizza-dark border-b border-pizza-black sticky top-0 z-50">
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

      {/* Stats Bar */}
      <div className="bg-pizza-black border-b border-pizza-dark">
        <div className="max-w-4xl mx-auto px-4 py-3">
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

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 rounded-none font-anton ${
              activeTab === "orders" ? 'bg-pizza-red text-white' : 'bg-pizza-dark text-neutral-400'
            }`}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            BESTELLUNGEN
            {orders.filter(o => o.status === "pending").length > 0 && (
              <span className="ml-2 bg-white text-pizza-red text-xs px-2 py-0.5 rounded-full">
                {orders.filter(o => o.status === "pending").length}
              </span>
            )}
          </Button>
          <Button
            onClick={() => setActiveTab("reservations")}
            className={`flex-1 rounded-none font-anton ${
              activeTab === "reservations" ? 'bg-blue-600 text-white' : 'bg-pizza-dark text-neutral-400'
            }`}
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            RESERVIERUNGEN
            {pendingReservations.length > 0 && (
              <span className="ml-2 bg-white text-blue-600 text-xs px-2 py-0.5 rounded-full">
                {pendingReservations.length}
              </span>
            )}
          </Button>
        </div>

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
    pending: "bg-red-500",
    confirmed: "bg-blue-500",
    preparing: "bg-yellow-500",
    ready: "bg-green-500",
    completed: "bg-neutral-500",
    cancelled: "bg-neutral-700"
  };

  const formatPrice = (p) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p);

  return (
    <div className={`bg-pizza-dark border-l-4 ${statusColors[order.status]} overflow-hidden`}>
      <div className="p-4" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-anton text-lg text-pizza-white">#{order.order_number}</span>
              <span className="font-mono text-xs text-neutral-400">• {order.customer_name}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-3 h-3 text-neutral-500" />
              <span className="font-mono text-xs text-neutral-400">
                {order.pickup_time}
                {order.confirmed_pickup_time && ` → ${order.confirmed_pickup_time} Uhr`}
              </span>
              <span className="text-neutral-600">•</span>
              <span className="font-mono text-xs text-neutral-400">{order.payment_method || "Barzahlung"}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-anton text-lg text-pizza-red">{formatPrice(order.total)}</p>
            <p className="font-mono text-xs text-neutral-500">{order.items?.length} Artikel</p>
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
            <div className="px-4 pb-4 border-t border-pizza-black pt-3">
              {/* Items */}
              <div className="bg-pizza-black/50 p-3 mb-3">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between py-1">
                    <span className="font-mono text-sm text-pizza-white">
                      {item.quantity}x {item.item_name}
                      {item.size_name && <span className="text-neutral-500"> ({item.size_name})</span>}
                    </span>
                    <span className="font-mono text-sm text-neutral-400">{formatPrice(item.total_price)}</span>
                  </div>
                ))}
                {order.notes && (
                  <p className="font-mono text-xs text-yellow-500 mt-2 pt-2 border-t border-pizza-dark">
                    📝 {order.notes}
                  </p>
                )}
              </div>

              {/* Customer Info */}
              <div className="flex flex-wrap gap-3 mb-3 text-neutral-400">
                <span className="font-mono text-xs flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {order.customer_phone}
                </span>
                <span className="font-mono text-xs flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {order.customer_email}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {order.status === "pending" && (
                  <>
                    <Button
                      onClick={handleConfirm}
                      disabled={updating}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-mono rounded-none"
                    >
                      <Check className="w-4 h-4 mr-1" /> ANNEHMEN
                    </Button>
                    <Button
                      onClick={() => updateStatus("cancelled")}
                      disabled={updating}
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-500/10 font-mono rounded-none"
                    >
                      <X className="w-4 h-4 mr-1" /> ABLEHNEN
                    </Button>
                  </>
                )}
                {order.status === "confirmed" && (
                  <Button
                    onClick={() => updateStatus("preparing")}
                    disabled={updating}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-mono rounded-none"
                  >
                    <Utensils className="w-4 h-4 mr-1" /> IN ZUBEREITUNG
                  </Button>
                )}
                {order.status === "preparing" && (
                  <Button
                    onClick={() => updateStatus("ready")}
                    disabled={updating}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-mono rounded-none"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" /> FERTIG
                  </Button>
                )}
                {order.status === "ready" && (
                  <Button
                    onClick={() => updateStatus("completed")}
                    disabled={updating}
                    className="flex-1 bg-neutral-600 hover:bg-neutral-700 text-white font-mono rounded-none"
                  >
                    <Check className="w-4 h-4 mr-1" /> ABGEHOLT
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prep Time Modal */}
      {showPrepTime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-pizza-dark border border-pizza-red p-6 max-w-sm w-full">
            <h3 className="font-anton text-xl text-pizza-white mb-2">ZUBEREITUNGSZEIT</h3>
            <p className="font-mono text-sm text-neutral-400 mb-4">
              Wie viele Minuten dauert die Zubereitung?
            </p>
            
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setPrepTime(Math.max(5, prepTime - 5))}
                className="w-14 h-14 border border-pizza-dark hover:border-pizza-red text-pizza-white font-anton text-2xl"
              >
                -
              </button>
              <div className="flex-1 text-center">
                <span className="font-anton text-5xl text-pizza-red">{prepTime}</span>
                <span className="font-mono text-sm text-neutral-400 block">Min.</span>
              </div>
              <button
                onClick={() => setPrepTime(prepTime + 5)}
                className="w-14 h-14 border border-pizza-dark hover:border-pizza-red text-pizza-white font-anton text-2xl"
              >
                +
              </button>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setShowPrepTime(false)}
                variant="outline"
                className="flex-1 border-pizza-dark text-pizza-white rounded-none"
              >
                Abbrechen
              </Button>
              <Button
                onClick={() => updateStatus("confirmed", prepTime)}
                disabled={updating}
                className="flex-1 bg-pizza-red hover:bg-red-700 text-pizza-white font-anton rounded-none"
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
    pending: "border-yellow-500",
    confirmed: "border-green-500",
    cancelled: "border-red-500",
    completed: "border-neutral-500"
  };

  return (
    <div className={`bg-pizza-dark border-l-4 ${statusColors[reservation.status]} p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-anton text-lg text-pizza-white">#{reservation.reservation_number}</span>
            <span className="font-mono text-xs text-neutral-400">• {reservation.customer_name}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <CalendarDays className="w-3 h-3 text-neutral-500" />
            <span className="font-mono text-xs text-blue-400">
              {new Date(reservation.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <span className="font-mono text-xs text-pizza-red font-bold">{reservation.time} Uhr</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <User className="w-3 h-3 text-neutral-500" />
            <span className="font-mono text-xs text-neutral-400">{reservation.guests} Personen</span>
            <span className="text-neutral-600">•</span>
            <Phone className="w-3 h-3 text-neutral-500" />
            <span className="font-mono text-xs text-neutral-400">{reservation.customer_phone}</span>
          </div>
          {reservation.notes && (
            <p className="font-mono text-xs text-yellow-500 mt-2">📝 {reservation.notes}</p>
          )}
        </div>

        {reservation.status === "pending" && (
          <div className="flex gap-1">
            <Button
              onClick={() => updateStatus("confirmed")}
              disabled={updating}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white rounded-none h-10 w-10 p-0"
            >
              <Check className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => updateStatus("cancelled")}
              disabled={updating}
              size="sm"
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500/10 rounded-none h-10 w-10 p-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}

        {reservation.status === "confirmed" && (
          <span className="px-2 py-1 bg-green-500/20 text-green-400 font-mono text-xs">
            Bestätigt
          </span>
        )}
      </div>
    </div>
  );
};

export default StaffPage;
