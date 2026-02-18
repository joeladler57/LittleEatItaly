import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import { 
  Bell, BellRing, ShoppingBag, Calendar, Check, X, Clock, 
  Phone, Mail, User, ChevronDown, ChevronUp, Volume2, VolumeX,
  RefreshCw, Settings, LogOut, Utensils
} from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

// Notification sound (base64 encoded short beep)
const NOTIFICATION_SOUND = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQF9SZPUxq17LQ4mfMS0sIVbMCx0qtvgjmMkGFqKx9i5o31RQVCBn8XarqF+P0xYfKS4wLulkXJgZXyVqbK0rKOYjIJ8eHh7goqSnJ+ioqCcl5CPj5CRk5aZm5ycnJubmpqZmJeWlZSTkpGQj46NjIuKiYiHhoWEg4KBgH9+fXx7enl4d3Z1dHNycXBvbm1sa2ppaGdmZWRjYmFgX15dXFtaWVhXVlVUU1JRUE9OTUxLSklIR0ZFRENCQUA/Pj08Ozo5ODc2NTQzMjEwLy4tLCsqKSgnJiUkIyIhIB8eHRwbGhkYFxYVFBMSERAPDg0MCwoJCAcGBQQDAgEA";

const RestaurantApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [expandedReservation, setExpandedReservation] = useState(null);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [lastReservationCount, setLastReservationCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const audioRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [soundEnabled]);

  // Fetch data
  const fetchData = useCallback(async (showToast = false) => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    try {
      setIsRefreshing(true);
      const headers = { Authorization: `Bearer ${token}` };
      
      const [ordersRes, reservationsRes] = await Promise.all([
        axios.get(`${API}/shop/orders`, { headers }),
        axios.get(`${API}/shop/reservations`, { headers })
      ]);

      const newOrders = ordersRes.data.filter(o => o.status === "pending");
      const newReservations = reservationsRes.data.filter(r => r.status === "pending");

      // Check for new items and play sound
      if (newOrders.length > lastOrderCount && lastOrderCount > 0) {
        playNotificationSound();
        toast.success(`${newOrders.length - lastOrderCount} neue Bestellung(en)!`, {
          icon: <ShoppingBag className="w-5 h-5" />
        });
      }
      
      if (newReservations.length > lastReservationCount && lastReservationCount > 0) {
        playNotificationSound();
        toast.success(`${newReservations.length - lastReservationCount} neue Reservierung(en)!`, {
          icon: <Calendar className="w-5 h-5" />
        });
      }

      setOrders(ordersRes.data);
      setReservations(reservationsRes.data);
      setLastOrderCount(newOrders.length);
      setLastReservationCount(newReservations.length);
      
      if (showToast) {
        toast.success("Aktualisiert");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("admin_token");
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [lastOrderCount, lastReservationCount, playNotificationSound]);

  // Poll for updates every 10 seconds
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      pollIntervalRef.current = setInterval(() => fetchData(), 10000);
      
      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [isAuthenticated, fetchData]);

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const response = await axios.post(`${API}/auth/login`, {
        username: formData.get("username"),
        password: formData.get("password")
      });
      
      localStorage.setItem("admin_token", response.data.access_token);
      setIsAuthenticated(true);
      toast.success("Angemeldet!");
    } catch (error) {
      toast.error("Anmeldung fehlgeschlagen");
    }
  };

  // Order actions
  const updateOrderStatus = async (orderId, status, prepTime = null) => {
    const token = localStorage.getItem("admin_token");
    try {
      if (status === "confirmed" && prepTime) {
        await axios.put(`${API}/shop/orders/${orderId}/confirm_asap`, 
          { prep_time_minutes: prepTime },
          { headers: { Authorization: `Bearer ${token}` }}
        );
      } else {
        await axios.put(`${API}/shop/orders/${orderId}/status`,
          { status },
          { headers: { Authorization: `Bearer ${token}` }}
        );
      }
      toast.success(status === "confirmed" ? "Bestellung bestätigt!" : "Bestellung storniert");
      fetchData();
    } catch (error) {
      toast.error("Fehler beim Aktualisieren");
    }
  };

  // Reservation actions
  const updateReservationStatus = async (reservationId, status) => {
    const token = localStorage.getItem("admin_token");
    try {
      await axios.put(`${API}/shop/reservations/${reservationId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success(status === "confirmed" ? "Reservierung bestätigt!" : "Reservierung storniert");
      fetchData();
    } catch (error) {
      toast.error("Fehler beim Aktualisieren");
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price);
  const formatDate = (dateStr) => new Date(dateStr).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });

  const pendingOrders = orders.filter(o => o.status === "pending");
  const confirmedOrders = orders.filter(o => o.status === "confirmed");
  const pendingReservations = reservations.filter(r => r.status === "pending");

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-900 to-black flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-pizza-red rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Restaurant App</h1>
            <p className="text-neutral-400 text-sm mt-1">Little Eat Italy</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              name="username"
              type="text"
              placeholder="Benutzername"
              className="w-full bg-neutral-800 border border-neutral-700 text-white p-4 rounded-xl"
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Passwort"
              className="w-full bg-neutral-800 border border-neutral-700 text-white p-4 rounded-xl"
              required
            />
            <Button type="submit" className="w-full bg-pizza-red hover:bg-red-700 text-white py-6 rounded-xl text-lg font-semibold">
              Anmelden
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Main App
  return (
    <div className="min-h-screen bg-neutral-900 pb-20">
      {/* Audio element for notifications */}
      <audio ref={audioRef} src={NOTIFICATION_SOUND} preload="auto" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pizza-red rounded-xl flex items-center justify-center">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold">Little Eat Italy</h1>
              <p className="text-xs text-neutral-400">Restaurant App</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg ${soundEnabled ? "bg-green-500/20 text-green-400" : "bg-neutral-800 text-neutral-400"}`}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={() => fetchData(true)}
              className={`p-2 rounded-lg bg-neutral-800 text-neutral-400 ${isRefreshing ? "animate-spin" : ""}`}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("admin_token");
                setIsAuthenticated(false);
              }}
              className="p-2 rounded-lg bg-neutral-800 text-neutral-400"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <motion.div 
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab("orders")}
          className={`p-4 rounded-2xl ${activeTab === "orders" ? "bg-pizza-red" : "bg-neutral-800"}`}
        >
          <div className="flex items-center justify-between">
            <ShoppingBag className="w-6 h-6 text-white" />
            {pendingOrders.length > 0 && (
              <span className="bg-white text-pizza-red text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                {pendingOrders.length} NEU
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-white mt-2">{pendingOrders.length}</p>
          <p className="text-sm text-white/70">Neue Bestellungen</p>
        </motion.div>
        
        <motion.div 
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab("reservations")}
          className={`p-4 rounded-2xl ${activeTab === "reservations" ? "bg-orange-500" : "bg-neutral-800"}`}
        >
          <div className="flex items-center justify-between">
            <Calendar className="w-6 h-6 text-white" />
            {pendingReservations.length > 0 && (
              <span className="bg-white text-orange-500 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                {pendingReservations.length} NEU
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-white mt-2">{pendingReservations.length}</p>
          <p className="text-sm text-white/70">Neue Reservierungen</p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="px-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-pizza-red animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "orders" ? (
              <motion.div
                key="orders"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-pizza-red" />
                  Neue Bestellungen ({pendingOrders.length})
                </h2>
                
                {pendingOrders.length === 0 ? (
                  <div className="text-center py-12 bg-neutral-800/50 rounded-2xl">
                    <ShoppingBag className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-400">Keine neuen Bestellungen</p>
                  </div>
                ) : (
                  pendingOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      expanded={expandedOrder === order.id}
                      onToggle={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      onConfirm={(prepTime) => updateOrderStatus(order.id, "confirmed", prepTime)}
                      onCancel={() => updateOrderStatus(order.id, "cancelled")}
                      formatPrice={formatPrice}
                      formatDate={formatDate}
                    />
                  ))
                )}

                {confirmedOrders.length > 0 && (
                  <>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 mt-6 pt-4 border-t border-neutral-800">
                      <Check className="w-5 h-5 text-green-500" />
                      Bestätigte Bestellungen ({confirmedOrders.length})
                    </h2>
                    {confirmedOrders.slice(0, 5).map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        expanded={expandedOrder === order.id}
                        onToggle={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        formatPrice={formatPrice}
                        formatDate={formatDate}
                        confirmed
                      />
                    ))}
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="reservations"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-orange-500" />
                  Neue Reservierungen ({pendingReservations.length})
                </h2>
                
                {pendingReservations.length === 0 ? (
                  <div className="text-center py-12 bg-neutral-800/50 rounded-2xl">
                    <Calendar className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-400">Keine neuen Reservierungen</p>
                  </div>
                ) : (
                  pendingReservations.map(reservation => (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
                      expanded={expandedReservation === reservation.id}
                      onToggle={() => setExpandedReservation(expandedReservation === reservation.id ? null : reservation.id)}
                      onConfirm={() => updateReservationStatus(reservation.id, "confirmed")}
                      onCancel={() => updateReservationStatus(reservation.id, "cancelled")}
                      formatDate={formatDate}
                    />
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-neutral-900/95 backdrop-blur border-t border-neutral-800 px-4 py-2 safe-area-pb">
        <div className="flex justify-around">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex flex-col items-center py-2 px-6 rounded-xl ${
              activeTab === "orders" ? "text-pizza-red" : "text-neutral-400"
            }`}
          >
            <ShoppingBag className="w-6 h-6" />
            <span className="text-xs mt-1">Bestellungen</span>
            {pendingOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-pizza-red rounded-full text-white text-xs flex items-center justify-center">
                {pendingOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("reservations")}
            className={`flex flex-col items-center py-2 px-6 rounded-xl ${
              activeTab === "reservations" ? "text-orange-500" : "text-neutral-400"
            }`}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs mt-1">Reservierungen</span>
            {pendingReservations.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-white text-xs flex items-center justify-center">
                {pendingReservations.length}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
};

// Order Card Component
const OrderCard = ({ order, expanded, onToggle, onConfirm, onCancel, formatPrice, formatDate, confirmed }) => {
  const [prepTime, setPrepTime] = useState(20);
  const [showPrepTimeInput, setShowPrepTimeInput] = useState(false);
  const isAsap = order.pickup_time?.includes("schnell") || order.pickup_time === "ASAP";

  return (
    <motion.div
      layout
      className={`rounded-2xl overflow-hidden ${
        confirmed ? "bg-green-900/20 border border-green-800" : "bg-neutral-800 border-2 border-pizza-red"
      }`}
    >
      <div onClick={onToggle} className="p-4 cursor-pointer">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${confirmed ? "text-green-400" : "text-pizza-red"}`}>
                #{order.order_number}
              </span>
              {isAsap && !confirmed && (
                <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  ASAP
                </span>
              )}
            </div>
            <p className="text-white font-semibold">{order.customer_name}</p>
            <p className="text-neutral-400 text-sm">{formatDate(order.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-white">{formatPrice(order.total)}</p>
            <p className="text-sm text-neutral-400">{order.items?.length} Artikel</p>
            {expanded ? <ChevronUp className="w-5 h-5 text-neutral-400 ml-auto mt-1" /> : <ChevronDown className="w-5 h-5 text-neutral-400 ml-auto mt-1" />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-neutral-700"
          >
            <div className="p-4 space-y-3">
              {/* Customer Info */}
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="flex items-center gap-1 text-neutral-300">
                  <Phone className="w-4 h-4" /> {order.customer_phone}
                </span>
                <span className="flex items-center gap-1 text-neutral-300">
                  <Mail className="w-4 h-4" /> {order.customer_email}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-400 font-medium">{order.pickup_time}</span>
              </div>

              {order.payment_method && (
                <div className="text-sm text-neutral-300">
                  Zahlung: <span className="text-white">{order.payment_method}</span>
                </div>
              )}

              {/* Items */}
              <div className="bg-neutral-900 rounded-xl p-3">
                <p className="text-xs text-neutral-500 mb-2">BESTELLUNG</p>
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1">
                    <span className="text-white">
                      {item.quantity}x {item.item_name}
                      {item.size_name && <span className="text-neutral-400"> ({item.size_name})</span>}
                      {item.options?.length > 0 && (
                        <span className="text-yellow-400 text-xs block">
                          + {item.options.map(o => o.option_name).join(", ")}
                        </span>
                      )}
                    </span>
                    <span className="text-neutral-400">{formatPrice(item.total_price)}</span>
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                  <p className="text-xs text-yellow-500 mb-1">ANMERKUNGEN</p>
                  <p className="text-white text-sm">{order.notes}</p>
                </div>
              )}

              {/* Actions */}
              {!confirmed && (
                <>
                  {isAsap && showPrepTimeInput ? (
                    <div className="space-y-3">
                      <p className="text-sm text-neutral-300">Zubereitungszeit in Minuten:</p>
                      <div className="flex items-center gap-3">
                        {[15, 20, 30, 45].map(mins => (
                          <button
                            key={mins}
                            onClick={() => setPrepTime(mins)}
                            className={`px-4 py-2 rounded-xl font-bold ${
                              prepTime === mins ? "bg-pizza-red text-white" : "bg-neutral-700 text-white"
                            }`}
                          >
                            {mins} Min
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => onConfirm(prepTime)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl"
                        >
                          <Check className="w-5 h-5 mr-2" /> Bestätigen ({prepTime} Min)
                        </Button>
                        <Button
                          onClick={() => setShowPrepTimeInput(false)}
                          variant="outline"
                          className="border-neutral-600 text-white rounded-xl"
                        >
                          Zurück
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => isAsap ? setShowPrepTimeInput(true) : onConfirm()}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl"
                      >
                        <Check className="w-5 h-5 mr-2" /> Annehmen
                      </Button>
                      <Button
                        onClick={onCancel}
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-500/10 rounded-xl px-4"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Reservation Card Component
const ReservationCard = ({ reservation, expanded, onToggle, onConfirm, onCancel, formatDate }) => {
  return (
    <motion.div
      layout
      className="bg-neutral-800 border-2 border-orange-500 rounded-2xl overflow-hidden"
    >
      <div onClick={onToggle} className="p-4 cursor-pointer">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white font-semibold text-lg">{reservation.customer_name}</p>
            <p className="text-orange-400 font-medium">
              {reservation.date} • {reservation.time}
            </p>
            <p className="text-neutral-400 text-sm">{formatDate(reservation.created_at)}</p>
          </div>
          <div className="text-right">
            <div className="bg-orange-500 text-white font-bold px-3 py-1 rounded-full">
              {reservation.party_size} Pers.
            </div>
            {expanded ? <ChevronUp className="w-5 h-5 text-neutral-400 ml-auto mt-2" /> : <ChevronDown className="w-5 h-5 text-neutral-400 ml-auto mt-2" />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-neutral-700"
          >
            <div className="p-4 space-y-3">
              {/* Customer Info */}
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="flex items-center gap-1 text-neutral-300">
                  <Phone className="w-4 h-4" /> {reservation.customer_phone}
                </span>
                <span className="flex items-center gap-1 text-neutral-300">
                  <Mail className="w-4 h-4" /> {reservation.customer_email}
                </span>
              </div>

              {reservation.notes && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
                  <p className="text-xs text-orange-500 mb-1">ANMERKUNGEN</p>
                  <p className="text-white text-sm">{reservation.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={onConfirm}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl"
                >
                  <Check className="w-5 h-5 mr-2" /> Bestätigen
                </Button>
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-500/10 rounded-xl px-4"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RestaurantApp;
