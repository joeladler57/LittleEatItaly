import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import {
  ShoppingBag, CalendarDays, UtensilsCrossed, Settings, LogOut,
  Check, X, Clock, Phone, User, Mail, ChevronDown, ChevronUp,
  Plus, Trash2, Edit2, GripVertical, Save, RefreshCw, Download,
  Volume2, VolumeX, Bell, BellRing, Smartphone, BellOff, Send
} from "lucide-react";
import { useNotificationSound } from "../hooks/useNotificationSound";
import { usePWA, registerServiceWorker } from "../hooks/usePWA";
import { usePushNotifications } from "../hooks/usePushNotifications";

const CHEF_ICON = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/845efg67_kopf.png";
const POLLING_INTERVAL = 4000; // 4 seconds - very fast polling

const ShopAdminPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");

  // Data states
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [menu, setMenu] = useState({ categories: [], currency: "EUR" });
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  // PWA and notification states
  const { playSound, enableAudio } = useNotificationSound();
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [lastReservationCount, setLastReservationCount] = useState(0);
  const [newNotifications, setNewNotifications] = useState(0);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const pollingRef = useRef(null);
  const isFirstLoad = useRef(true);

  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Show install banner after 5 seconds if installable
  useEffect(() => {
    if (isInstallable && !isInstalled) {
      const timer = setTimeout(() => setShowInstallBanner(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      await axios.get(`${API}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsAuthenticated(true);
      fetchAllData();
    } catch (e) {
      localStorage.removeItem("admin_token");
    } finally {
      setIsLoading(false);
    }
  };

  // Polling function for orders and reservations only
  const pollNewData = useCallback(async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [ordersRes, reservationsRes] = await Promise.all([
        axios.get(`${API}/shop/orders`, { headers }),
        axios.get(`${API}/shop/reservations`, { headers })
      ]);

      const newOrders = ordersRes.data;
      const newReservations = reservationsRes.data;

      // Count pending items
      const pendingOrders = newOrders.filter(o => o.status === "pending").length;
      const pendingReservations = newReservations.filter(r => r.status === "pending").length;

      // Check for new items (only after first load)
      if (!isFirstLoad.current) {
        const hasNewOrders = pendingOrders > lastOrderCount;
        const hasNewReservations = pendingReservations > lastReservationCount;

        if (hasNewOrders || hasNewReservations) {
          // Play notification sound
          if (soundEnabled) {
            playSound();
          }

          // Show toast notification
          if (hasNewOrders) {
            const diff = pendingOrders - lastOrderCount;
            toast.success(`🍕 ${diff} neue Bestellung${diff > 1 ? 'en' : ''}!`, {
              duration: 5000,
              icon: <BellRing className="w-5 h-5 text-pizza-red animate-bounce" />
            });
          }
          if (hasNewReservations) {
            const diff = pendingReservations - lastReservationCount;
            toast.success(`📅 ${diff} neue Reservierung${diff > 1 ? 'en' : ''}!`, {
              duration: 5000,
              icon: <BellRing className="w-5 h-5 text-blue-500 animate-bounce" />
            });
          }

          // Update notification counter
          setNewNotifications(prev => prev + (hasNewOrders ? 1 : 0) + (hasNewReservations ? 1 : 0));

          // Vibrate if supported (for mobile PWA)
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
        }
      } else {
        isFirstLoad.current = false;
      }

      // Update state
      setOrders(newOrders);
      setReservations(newReservations);
      setLastOrderCount(pendingOrders);
      setLastReservationCount(pendingReservations);

    } catch (e) {
      console.error("Polling failed:", e);
    }
  }, [lastOrderCount, lastReservationCount, soundEnabled, playSound]);

  // Start polling when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Initial poll
      pollNewData();
      
      // Set up interval
      pollingRef.current = setInterval(pollNewData, POLLING_INTERVAL);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    }
  }, [isAuthenticated, pollNewData]);

  const fetchAllData = async () => {
    const token = localStorage.getItem("admin_token");
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      const [ordersRes, reservationsRes, menuRes, settingsRes] = await Promise.all([
        axios.get(`${API}/shop/orders`, { headers }),
        axios.get(`${API}/shop/reservations`, { headers }),
        axios.get(`${API}/shop/menu`),
        axios.get(`${API}/shop/settings`)
      ]);
      
      setOrders(ordersRes.data);
      setReservations(reservationsRes.data);
      setMenu(menuRes.data);
      setSettings(settingsRes.data);

      // Set initial counts
      setLastOrderCount(ordersRes.data.filter(o => o.status === "pending").length);
      setLastReservationCount(reservationsRes.data.filter(r => r.status === "pending").length);
    } catch (e) {
      console.error("Failed to fetch data:", e);
      toast.error("Fehler beim Laden der Daten");
    }
  };

  const handleLogout = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    localStorage.removeItem("admin_token");
    navigate("/admin");
  };

  // Enable audio on first user interaction
  const handleUserInteraction = useCallback(() => {
    enableAudio();
    setNewNotifications(0);
  }, [enableAudio]);

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
        <div className="text-center">
          <h1 className="font-anton text-2xl text-pizza-white mb-4">NICHT AUTORISIERT</h1>
          <Button onClick={() => navigate("/admin")} className="bg-pizza-red hover:bg-red-700 text-pizza-white font-anton rounded-none">
            ZUM LOGIN
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pizza-black pt-20 pb-8" onClick={handleUserInteraction}>
      <div className="max-w-7xl mx-auto px-4">
        {/* PWA Install Banner */}
        <AnimatePresence>
          {showInstallBanner && isInstallable && !isInstalled && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 bg-gradient-to-r from-pizza-red to-red-700 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="w-6 h-6 text-white" />
                <div>
                  <p className="font-anton text-white">APP INSTALLIEREN</p>
                  <p className="font-mono text-xs text-white/80">Erhalte Benachrichtigungen direkt auf dein Handy!</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={installApp}
                  className="bg-white text-pizza-red hover:bg-white/90 font-anton rounded-none"
                >
                  <Download className="w-4 h-4 mr-2" /> INSTALLIEREN
                </Button>
                <button
                  onClick={() => setShowInstallBanner(false)}
                  className="text-white/80 hover:text-white p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-anton text-3xl text-pizza-white">
                SHOP <span className="text-pizza-red">VERWALTUNG</span>
              </h1>
              {/* Live Indicator */}
              <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 border border-green-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="font-mono text-xs text-green-400">LIVE</span>
              </div>
              {newNotifications > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative"
                >
                  <BellRing className="w-6 h-6 text-pizza-red animate-bounce" />
                  <span className="absolute -top-1 -right-1 bg-pizza-red text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                    {newNotifications}
                  </span>
                </motion.div>
              )}
            </div>
            <p className="font-mono text-sm text-neutral-400 mt-1">Automatische Aktualisierung alle 4 Sekunden</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sound Toggle */}
            <Button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                enableAudio();
                toast.success(soundEnabled ? "Ton deaktiviert" : "Ton aktiviert");
              }}
              variant="outline"
              className={`border-pizza-dark rounded-none ${soundEnabled ? 'text-green-400 border-green-500/50' : 'text-neutral-500'}`}
              title={soundEnabled ? "Ton an" : "Ton aus"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            
            {/* Install Button (if not installed) */}
            {isInstallable && !isInstalled && (
              <Button
                onClick={installApp}
                variant="outline"
                className="border-pizza-red text-pizza-red hover:bg-pizza-red/10 rounded-none"
              >
                <Download className="w-4 h-4 mr-2" /> Installieren
              </Button>
            )}
            
            {/* Installed Indicator */}
            {isInstalled && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30">
                <Smartphone className="w-4 h-4 text-green-400" />
                <span className="font-mono text-xs text-green-400">App installiert</span>
              </div>
            )}
            
            <Button onClick={fetchAllData} variant="outline" className="border-pizza-dark text-pizza-white hover:bg-pizza-dark rounded-none">
              <RefreshCw className="w-4 h-4 mr-2" /> Aktualisieren
            </Button>
            <Button onClick={handleLogout} variant="outline" className="border-pizza-dark text-pizza-white hover:bg-pizza-dark rounded-none">
              <LogOut className="w-4 h-4 mr-2" /> Ausloggen
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={ShoppingBag}
            label="Neue Bestellungen"
            value={orders.filter(o => o.status === "pending").length}
            color="red"
            pulse={orders.filter(o => o.status === "pending").length > 0}
          />
          <StatCard
            icon={Clock}
            label="In Zubereitung"
            value={orders.filter(o => o.status === "preparing").length}
            color="yellow"
          />
          <StatCard
            icon={CalendarDays}
            label="Offene Reservierungen"
            value={reservations.filter(r => r.status === "pending").length}
            color="blue"
            pulse={reservations.filter(r => r.status === "pending").length > 0}
          />
          <StatCard
            icon={UtensilsCrossed}
            label="Menü-Kategorien"
            value={menu.categories?.length || 0}
            color="green"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-pizza-dark border border-pizza-dark mb-6 p-1 rounded-none">
            {[
              { id: "orders", label: "BESTELLUNGEN", icon: ShoppingBag, count: orders.filter(o => o.status === "pending").length },
              { id: "reservations", label: "RESERVIERUNGEN", icon: CalendarDays, count: reservations.filter(r => r.status === "pending").length },
              { id: "menu", label: "MENÜ", icon: UtensilsCrossed },
              { id: "settings", label: "EINSTELLUNGEN", icon: Settings },
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="font-anton text-sm tracking-wider data-[state=active]:bg-pizza-red data-[state=active]:text-pizza-white text-neutral-400 rounded-none flex items-center gap-2"
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className="bg-pizza-red text-pizza-white text-xs px-1.5 py-0.5 ml-1">
                    {tab.count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <OrdersSection orders={orders} onUpdate={fetchAllData} />
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations">
            <ReservationsSection reservations={reservations} onUpdate={fetchAllData} />
          </TabsContent>

          {/* Menu Tab */}
          <TabsContent value="menu">
            <MenuSection menu={menu} onUpdate={fetchAllData} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <SettingsSection settings={settings} onUpdate={fetchAllData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color, pulse }) => {
  const colors = {
    red: "text-red-500 bg-red-500/10",
    yellow: "text-yellow-500 bg-yellow-500/10",
    blue: "text-blue-500 bg-blue-500/10",
    green: "text-green-500 bg-green-500/10"
  };

  const borderColors = {
    red: "border-red-500/50",
    yellow: "border-yellow-500/50",
    blue: "border-blue-500/50",
    green: "border-green-500/50"
  };

  return (
    <div className={`bg-pizza-dark border p-4 transition-all ${pulse ? `${borderColors[color]} animate-pulse` : 'border-pizza-dark'}`}>
      <div className={`w-10 h-10 ${colors[color]} flex items-center justify-center mb-2`}>
        <Icon className={`w-5 h-5 ${pulse ? 'animate-bounce' : ''}`} />
      </div>
      <p className="font-anton text-2xl text-pizza-white">{value}</p>
      <p className="font-mono text-xs text-neutral-400">{label}</p>
    </div>
  );
};

// Orders Section
const OrdersSection = ({ orders, onUpdate }) => {
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [showPrepTimeModal, setShowPrepTimeModal] = useState(null);
  const [prepTime, setPrepTime] = useState(30);

  const updateStatus = async (orderId, status, prepTimeMinutes = null) => {
    setUpdating(orderId);
    try {
      const token = localStorage.getItem("admin_token");
      let url = `${API}/shop/orders/${orderId}/status?status=${status}`;
      if (prepTimeMinutes) {
        url += `&prep_time_minutes=${prepTimeMinutes}`;
      }
      const response = await axios.put(url, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.pickup_time) {
        toast.success(`Bestätigt! Abholzeit: ${response.data.pickup_time}`);
      } else {
        toast.success(`Status auf "${status}" geändert`);
      }
      onUpdate();
      setShowPrepTimeModal(null);
    } catch (e) {
      toast.error("Fehler beim Aktualisieren");
    } finally {
      setUpdating(null);
    }
  };

  const handleConfirmOrder = (order) => {
    // Check if it's an ASAP order
    if (order.pickup_time === "So schnell wie möglich") {
      setShowPrepTimeModal(order);
      setPrepTime(30);
    } else {
      updateStatus(order.id, "confirmed");
    }
  };

  const statusConfig = {
    pending: { label: "Neu", color: "bg-yellow-500" },
    confirmed: { label: "Bestätigt", color: "bg-blue-500" },
    preparing: { label: "In Zubereitung", color: "bg-orange-500" },
    ready: { label: "Abholbereit", color: "bg-green-500" },
    completed: { label: "Abgeschlossen", color: "bg-neutral-500" },
    cancelled: { label: "Storniert", color: "bg-red-500" }
  };

  const formatPrice = (price) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price);

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <div className="bg-pizza-dark border border-pizza-dark p-8 text-center">
          <ShoppingBag className="w-12 h-12 text-pizza-dark mx-auto mb-2" />
          <p className="font-mono text-neutral-400">Keine Bestellungen vorhanden</p>
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="bg-pizza-dark border border-pizza-dark">
            {/* Order Header */}
            <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-pizza-black/30"
              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${statusConfig[order.status]?.color}`} />
                <div>
                  <p className="font-anton text-pizza-white">
                    #{order.order_number} • {order.customer_name}
                  </p>
                  <p className="font-mono text-xs text-neutral-400">
                    {new Date(order.created_at).toLocaleString('de-DE')} • {order.pickup_time} • {order.payment_method || "Barzahlung"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-anton text-pizza-red">{formatPrice(order.total)}</span>
                <span className={`px-2 py-1 text-xs font-mono text-white ${statusConfig[order.status]?.color}`}>
                  {statusConfig[order.status]?.label}
                </span>
                {expandedOrder === order.id ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
              </div>
            </div>

            {/* Order Details */}
            <AnimatePresence>
              {expandedOrder === order.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 border-t border-pizza-black">
                    {/* Customer Info */}
                    <div className="grid sm:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 font-mono text-sm text-neutral-400">
                        <User className="w-4 h-4" /> {order.customer_name}
                      </div>
                      <div className="flex items-center gap-2 font-mono text-sm text-neutral-400">
                        <Phone className="w-4 h-4" /> {order.customer_phone}
                      </div>
                      <div className="flex items-center gap-2 font-mono text-sm text-neutral-400">
                        <Mail className="w-4 h-4" /> {order.customer_email}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="bg-pizza-black/50 p-4 mb-4">
                      <h4 className="font-anton text-sm text-pizza-red mb-2">BESTELLUNG</h4>
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex justify-between py-2 border-b border-pizza-dark last:border-0">
                          <div>
                            <span className="font-mono text-pizza-white">{item.quantity}x {item.item_name}</span>
                            {item.size_name && <span className="font-mono text-xs text-neutral-500 ml-2">({item.size_name})</span>}
                            {item.options?.map((opt, j) => (
                              <p key={j} className="font-mono text-xs text-neutral-500">+ {opt.option_name}</p>
                            ))}
                          </div>
                          <span className="font-mono text-neutral-400">{formatPrice(item.total_price)}</span>
                        </div>
                      ))}
                      {order.notes && (
                        <p className="font-mono text-sm text-yellow-500 mt-2">📝 {order.notes}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {order.status === "pending" && (
                        <>
                          <Button
                            onClick={() => handleConfirmOrder(order)}
                            disabled={updating === order.id}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs rounded-none"
                          >
                            <Check className="w-4 h-4 mr-1" /> Bestätigen
                          </Button>
                          <Button
                            onClick={() => updateStatus(order.id, "cancelled")}
                            disabled={updating === order.id}
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-500/10 font-mono text-xs rounded-none"
                          >
                            <X className="w-4 h-4 mr-1" /> Stornieren
                          </Button>
                        </>
                      )}
                      {order.status === "confirmed" && (
                        <Button
                          onClick={() => updateStatus(order.id, "preparing")}
                          disabled={updating === order.id}
                          className="bg-orange-600 hover:bg-orange-700 text-white font-mono text-xs rounded-none"
                        >
                          In Zubereitung
                        </Button>
                      )}
                      {order.status === "preparing" && (
                        <Button
                          onClick={() => updateStatus(order.id, "ready")}
                          disabled={updating === order.id}
                          className="bg-green-600 hover:bg-green-700 text-white font-mono text-xs rounded-none"
                        >
                          Abholbereit
                        </Button>
                      )}
                      {order.status === "ready" && (
                        <Button
                          onClick={() => updateStatus(order.id, "completed")}
                          disabled={updating === order.id}
                          className="bg-neutral-600 hover:bg-neutral-700 text-white font-mono text-xs rounded-none"
                        >
                          Abgeschlossen
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))
      )}

      {/* Prep Time Modal for ASAP orders */}
      {showPrepTimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-pizza-dark border border-pizza-red p-6 max-w-md w-full">
            <h3 className="font-anton text-xl text-pizza-white mb-2">ZUBEREITUNGSZEIT</h3>
            <p className="font-mono text-sm text-neutral-400 mb-4">
              Bestellung #{showPrepTimeModal.order_number} ist eine "Schnellstmöglich" Bestellung.
              Wie viele Minuten dauert die Zubereitung?
            </p>
            
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setPrepTime(Math.max(5, prepTime - 5))}
                className="w-12 h-12 border border-pizza-dark hover:border-pizza-red text-pizza-white font-anton text-xl"
              >
                -
              </button>
              <div className="flex-1 text-center">
                <span className="font-anton text-4xl text-pizza-red">{prepTime}</span>
                <span className="font-mono text-sm text-neutral-400 block">Minuten</span>
              </div>
              <button
                onClick={() => setPrepTime(prepTime + 5)}
                className="w-12 h-12 border border-pizza-dark hover:border-pizza-red text-pizza-white font-anton text-xl"
              >
                +
              </button>
            </div>
            
            <p className="font-mono text-xs text-neutral-500 mb-4">
              Kunde erhält E-Mail mit Abholzeit: ca. {new Date(Date.now() + prepTime * 60000).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setShowPrepTimeModal(null)}
                variant="outline"
                className="flex-1 border-pizza-dark text-pizza-white rounded-none"
              >
                Abbrechen
              </Button>
              <Button
                onClick={() => updateStatus(showPrepTimeModal.id, "confirmed", prepTime)}
                disabled={updating === showPrepTimeModal.id}
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

// Reservations Section
const ReservationsSection = ({ reservations, onUpdate }) => {
  const [updating, setUpdating] = useState(null);

  const updateStatus = async (reservationId, status) => {
    setUpdating(reservationId);
    try {
      const token = localStorage.getItem("admin_token");
      await axios.put(`${API}/shop/reservations/${reservationId}/status?status=${status}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(status === "confirmed" ? "Reservierung bestätigt - E-Mail wird gesendet" : `Status auf "${status}" geändert`);
      onUpdate();
    } catch (e) {
      toast.error("Fehler beim Aktualisieren");
    } finally {
      setUpdating(null);
    }
  };

  const statusConfig = {
    pending: { label: "Offen", color: "bg-yellow-500" },
    confirmed: { label: "Bestätigt", color: "bg-green-500" },
    cancelled: { label: "Storniert", color: "bg-red-500" },
    completed: { label: "Abgeschlossen", color: "bg-neutral-500" }
  };

  // Group by date
  const groupedReservations = reservations.reduce((acc, res) => {
    const date = res.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(res);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.keys(groupedReservations).length === 0 ? (
        <div className="bg-pizza-dark border border-pizza-dark p-8 text-center">
          <CalendarDays className="w-12 h-12 text-pizza-dark mx-auto mb-2" />
          <p className="font-mono text-neutral-400">Keine Reservierungen vorhanden</p>
        </div>
      ) : (
        Object.entries(groupedReservations)
          .sort(([a], [b]) => new Date(a) - new Date(b))
          .map(([date, dateReservations]) => (
            <div key={date}>
              <h3 className="font-anton text-lg text-pizza-white mb-3">
                {new Date(date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <div className="space-y-2">
                {dateReservations
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((res) => (
                    <div key={res.id} className="bg-pizza-dark border border-pizza-dark p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="font-anton text-2xl text-pizza-red">{res.time}</p>
                          <p className="font-mono text-xs text-neutral-400">Uhr</p>
                        </div>
                        <div>
                          <p className="font-anton text-pizza-white">
                            #{res.reservation_number} • {res.customer_name}
                          </p>
                          <p className="font-mono text-xs text-neutral-400">
                            {res.guests} {res.guests === 1 ? 'Person' : 'Personen'} • {res.customer_phone}
                          </p>
                          {res.notes && <p className="font-mono text-xs text-yellow-500 mt-1">📝 {res.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-mono text-white ${statusConfig[res.status]?.color}`}>
                          {statusConfig[res.status]?.label}
                        </span>
                        {res.status === "pending" && (
                          <>
                            <Button
                              onClick={() => updateStatus(res.id, "confirmed")}
                              disabled={updating === res.id}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white rounded-none h-8"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => updateStatus(res.id, "cancelled")}
                              disabled={updating === res.id}
                              size="sm"
                              variant="outline"
                              className="border-red-500 text-red-500 hover:bg-red-500/10 rounded-none h-8"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))
      )}
    </div>
  );
};

// Menu Section
const MenuSection = ({ menu, onUpdate }) => {
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddonGroups, setShowAddonGroups] = useState(false);
  const [editingAddonGroup, setEditingAddonGroup] = useState(null);
  const [saving, setSaving] = useState(false);

  const addonGroups = menu.addon_groups || [];

  const saveMenu = async (updatedMenu) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("admin_token");
      await axios.put(`${API}/shop/menu`, updatedMenu, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Menü gespeichert");
      onUpdate();
    } catch (e) {
      toast.error("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const addCategory = async () => {
    if (!newCategory.name) return;
    
    const category = {
      id: `cat_${Date.now()}`,
      name: newCategory.name,
      description: newCategory.description,
      items: [],
      addon_group_ids: [],
      sort_order: menu.categories?.length || 0,
      available: true
    };
    
    const updatedMenu = {
      ...menu,
      categories: [...(menu.categories || []), category]
    };
    
    await saveMenu(updatedMenu);
    setNewCategory({ name: "", description: "" });
    setShowAddCategory(false);
  };

  const deleteCategory = async (categoryId) => {
    if (!confirm("Kategorie und alle Artikel löschen?")) return;
    
    const updatedMenu = {
      ...menu,
      categories: menu.categories.filter(c => c.id !== categoryId)
    };
    
    await saveMenu(updatedMenu);
  };

  const updateCategory = async (categoryId, updates) => {
    const updatedMenu = {
      ...menu,
      categories: menu.categories.map(cat => 
        cat.id === categoryId ? { ...cat, ...updates } : cat
      )
    };
    await saveMenu(updatedMenu);
    setEditingCategory(null);
  };

  const addItem = async (categoryId) => {
    const newItem = {
      id: `item_${Date.now()}`,
      name: "Neuer Artikel",
      description: "",
      price: 0,
      image_url: "",
      tags: [],
      sizes: [],
      groups: [],
      available: true,
      sort_order: 0
    };
    
    const updatedMenu = {
      ...menu,
      categories: menu.categories.map(cat => {
        if (cat.id === categoryId) {
          return { ...cat, items: [...(cat.items || []), newItem] };
        }
        return cat;
      })
    };
    
    await saveMenu(updatedMenu);
    setEditingItem({ categoryId, item: newItem });
  };

  const updateItem = async (categoryId, itemId, updates) => {
    const updatedMenu = {
      ...menu,
      categories: menu.categories.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            items: cat.items.map(item => item.id === itemId ? { ...item, ...updates } : item)
          };
        }
        return cat;
      })
    };
    
    await saveMenu(updatedMenu);
    setEditingItem(null);
  };

  const deleteItem = async (categoryId, itemId) => {
    if (!confirm("Artikel löschen?")) return;
    
    const updatedMenu = {
      ...menu,
      categories: menu.categories.map(cat => {
        if (cat.id === categoryId) {
          return { ...cat, items: cat.items.filter(item => item.id !== itemId) };
        }
        return cat;
      })
    };
    
    await saveMenu(updatedMenu);
  };

  // Addon Group Functions
  const addAddonGroup = async () => {
    const newGroup = {
      id: `addon_${Date.now()}`,
      name: "Neue Add-on Gruppe",
      required: false,
      multiple: false,
      options: []
    };
    
    const updatedMenu = {
      ...menu,
      addon_groups: [...addonGroups, newGroup]
    };
    
    await saveMenu(updatedMenu);
    setEditingAddonGroup(newGroup);
  };

  const updateAddonGroup = async (groupId, updates) => {
    const updatedMenu = {
      ...menu,
      addon_groups: addonGroups.map(g => g.id === groupId ? { ...g, ...updates } : g)
    };
    await saveMenu(updatedMenu);
    setEditingAddonGroup(null);
  };

  const deleteAddonGroup = async (groupId) => {
    if (!confirm("Add-on Gruppe löschen?")) return;
    
    const updatedMenu = {
      ...menu,
      addon_groups: addonGroups.filter(g => g.id !== groupId),
      // Remove from all categories
      categories: menu.categories.map(cat => ({
        ...cat,
        addon_group_ids: (cat.addon_group_ids || []).filter(id => id !== groupId)
      }))
    };
    
    await saveMenu(updatedMenu);
  };

  const formatPrice = (price) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price);

  return (
    <div className="space-y-6">
      {/* Top Buttons */}
      <div className="flex flex-wrap gap-2 justify-end">
        <Button
          onClick={() => setShowAddonGroups(!showAddonGroups)}
          variant={showAddonGroups ? "default" : "outline"}
          className={showAddonGroups 
            ? "bg-yellow-600 hover:bg-yellow-700 text-pizza-white font-anton rounded-none"
            : "border-yellow-600 text-yellow-500 hover:bg-yellow-600/10 font-anton rounded-none"
          }
        >
          <Settings className="w-4 h-4 mr-2" /> ADD-ONS VERWALTEN
        </Button>
        <Button
          onClick={() => setShowAddCategory(true)}
          className="bg-pizza-red hover:bg-red-700 text-pizza-white font-anton rounded-none"
        >
          <Plus className="w-4 h-4 mr-2" /> KATEGORIE HINZUFÜGEN
        </Button>
      </div>

      {/* Addon Groups Management */}
      {showAddonGroups && (
        <div className="bg-yellow-900/20 border border-yellow-600 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-anton text-lg text-yellow-500">ADD-ON GRUPPEN (GLOBAL)</h3>
            <Button onClick={addAddonGroup} size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white font-mono rounded-none">
              <Plus className="w-4 h-4 mr-1" /> Neue Gruppe
            </Button>
          </div>
          <p className="font-mono text-xs text-neutral-400 mb-4">
            Erstelle Add-on Gruppen (z.B. "Dressing", "Extras") und ordne sie dann den Kategorien zu.
          </p>
          
          {addonGroups.length === 0 ? (
            <p className="font-mono text-sm text-neutral-500 text-center py-4">Keine Add-on Gruppen vorhanden</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {addonGroups.map(group => (
                <div key={group.id} className="bg-pizza-dark p-3 border border-pizza-dark">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-anton text-pizza-white">{group.name}</span>
                    <div className="flex gap-1">
                      <Button onClick={() => setEditingAddonGroup(group)} size="sm" variant="outline" className="border-pizza-dark text-pizza-white rounded-none h-7 w-7 p-0">
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button onClick={() => deleteAddonGroup(group.id)} size="sm" variant="outline" className="border-red-500 text-red-500 rounded-none h-7 w-7 p-0">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {group.options?.map(opt => (
                      <span key={opt.id} className="text-xs font-mono bg-pizza-black px-2 py-1 text-neutral-400">
                        {opt.name} {opt.price > 0 && `+${formatPrice(opt.price)}`}
                      </span>
                    ))}
                    {(!group.options || group.options.length === 0) && (
                      <span className="text-xs font-mono text-neutral-500">Keine Optionen</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {group.required && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5">Pflicht</span>}
                    {group.multiple && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5">Mehrfach</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Category Form */}
      {showAddCategory && (
        <div className="bg-pizza-dark border border-pizza-red p-4">
          <h3 className="font-anton text-lg text-pizza-white mb-4">NEUE KATEGORIE</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="font-mono text-sm text-neutral-400">Name *</Label>
              <Input
                value={newCategory.name}
                onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="z.B. Pizza, Salate"
                className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none mt-1"
              />
            </div>
            <div>
              <Label className="font-mono text-sm text-neutral-400">Beschreibung</Label>
              <Input
                value={newCategory.description}
                onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Optional"
                className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none mt-1"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={addCategory} disabled={saving} className="bg-pizza-red hover:bg-red-700 text-pizza-white font-mono rounded-none">
              {saving ? "Speichern..." : "Hinzufügen"}
            </Button>
            <Button onClick={() => setShowAddCategory(false)} variant="outline" className="border-pizza-dark text-pizza-white rounded-none">
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      {/* Categories */}
      {menu.categories?.length === 0 ? (
        <div className="bg-pizza-dark border border-pizza-dark p-8 text-center">
          <UtensilsCrossed className="w-12 h-12 text-pizza-dark mx-auto mb-2" />
          <p className="font-mono text-neutral-400">Keine Kategorien vorhanden</p>
          <p className="font-mono text-xs text-neutral-500 mt-1">Füge eine Kategorie hinzu um zu beginnen</p>
        </div>
      ) : (
        menu.categories.map((category) => (
          <div key={category.id} className="bg-pizza-dark border border-pizza-dark">
            {/* Category Header */}
            <div className="p-4 border-b border-pizza-black">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-anton text-xl text-pizza-white">{category.name}</h3>
                  {category.description && <p className="font-mono text-sm text-neutral-400">{category.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => addItem(category.id)}
                    size="sm"
                    className="bg-pizza-red hover:bg-red-700 text-pizza-white font-mono rounded-none h-8"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Artikel
                  </Button>
                  <Button
                    onClick={() => setEditingCategory(category)}
                    size="sm"
                    variant="outline"
                    className="border-pizza-dark text-pizza-white hover:bg-pizza-dark rounded-none h-8"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => deleteCategory(category.id)}
                    size="sm"
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-500/10 rounded-none h-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Assigned Addon Groups */}
              {(category.addon_group_ids?.length > 0 || addonGroups.length > 0) && (
                <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-pizza-black/50">
                  <span className="font-mono text-xs text-yellow-500">Add-ons:</span>
                  {category.addon_group_ids?.map(groupId => {
                    const group = addonGroups.find(g => g.id === groupId);
                    return group ? (
                      <span key={groupId} className="text-xs font-mono bg-yellow-600/20 text-yellow-400 px-2 py-1">
                        {group.name}
                      </span>
                    ) : null;
                  })}
                  {(!category.addon_group_ids || category.addon_group_ids.length === 0) && (
                    <span className="text-xs font-mono text-neutral-500">Keine zugeordnet</span>
                  )}
                </div>
              )}
            </div>

            {/* Items */}
            <div className="p-4">
              {category.items?.length === 0 ? (
                <p className="font-mono text-sm text-neutral-500 text-center py-4">Keine Artikel in dieser Kategorie</p>
              ) : (
                <div className="space-y-2">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-pizza-black/50 hover:bg-pizza-black"
                    >
                      <div className="flex items-center gap-3">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover" />
                        )}
                        <div>
                          <p className="font-mono text-pizza-white">{item.name}</p>
                          <p className="font-mono text-xs text-neutral-500">{item.description?.substring(0, 50)}{item.description?.length > 50 ? "..." : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-pizza-red">
                          {item.sizes?.length > 0 
                            ? `ab ${formatPrice(Math.min(...item.sizes.map(s => s.price)))}`
                            : formatPrice(item.price)
                          }
                        </span>
                        <Button
                          onClick={() => setEditingItem({ categoryId: category.id, item })}
                          size="sm"
                          variant="outline"
                          className="border-pizza-dark text-pizza-white hover:bg-pizza-dark rounded-none h-8"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => deleteItem(category.id, item.id)}
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-500/10 rounded-none h-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <ItemEditor
          categoryId={editingItem.categoryId}
          item={editingItem.item}
          addonGroups={addonGroups}
          categoryAddonGroupIds={menu.categories.find(c => c.id === editingItem.categoryId)?.addon_group_ids || []}
          onSave={updateItem}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <CategoryEditor
          category={editingCategory}
          addonGroups={addonGroups}
          onSave={updateCategory}
          onClose={() => setEditingCategory(null)}
        />
      )}

      {/* Edit Addon Group Modal */}
      {editingAddonGroup && (
        <AddonGroupEditor
          group={editingAddonGroup}
          onSave={updateAddonGroup}
          onClose={() => setEditingAddonGroup(null)}
        />
      )}
    </div>
  );
};

// Category Editor Modal
const CategoryEditor = ({ category, addonGroups, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: category.name || "",
    description: category.description || "",
    addon_group_ids: category.addon_group_ids || [],
    available: category.available !== false
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(category.id, formData);
    setSaving(false);
  };

  const toggleAddonGroup = (groupId) => {
    const newIds = formData.addon_group_ids.includes(groupId)
      ? formData.addon_group_ids.filter(id => id !== groupId)
      : [...formData.addon_group_ids, groupId];
    setFormData({ ...formData, addon_group_ids: newIds });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-xl bg-pizza-dark border border-pizza-dark">
        <div className="p-6 border-b border-pizza-black flex justify-between items-center">
          <h2 className="font-anton text-xl text-pizza-white">KATEGORIE BEARBEITEN</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-pizza-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label className="font-mono text-sm text-neutral-400">Name *</Label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none mt-1"
            />
          </div>

          <div>
            <Label className="font-mono text-sm text-neutral-400">Beschreibung</Label>
            <Input
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none mt-1"
            />
          </div>

          {/* Addon Groups Assignment */}
          {addonGroups.length > 0 && (
            <div>
              <Label className="font-mono text-sm text-yellow-500 mb-2 block">Add-on Gruppen zuordnen</Label>
              <p className="font-mono text-xs text-neutral-500 mb-2">
                Wähle welche Add-on Gruppen für alle Artikel dieser Kategorie verfügbar sein sollen.
              </p>
              <div className="flex flex-wrap gap-2">
                {addonGroups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => toggleAddonGroup(group.id)}
                    className={`px-3 py-2 font-mono text-sm border transition-all ${
                      formData.addon_group_ids.includes(group.id)
                        ? "border-yellow-500 bg-yellow-500/20 text-yellow-400"
                        : "border-pizza-dark text-neutral-400 hover:border-neutral-600"
                    }`}
                  >
                    {group.name}
                    {formData.addon_group_ids.includes(group.id) && <Check className="w-4 h-4 inline ml-2" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.available}
              onChange={e => setFormData({ ...formData, available: e.target.checked })}
              className="w-4 h-4 accent-pizza-red"
            />
            <span className="font-mono text-sm text-neutral-300">Kategorie sichtbar</span>
          </label>
        </div>

        <div className="p-6 border-t border-pizza-black flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1 border-pizza-dark text-pizza-white rounded-none">
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-pizza-red hover:bg-red-700 text-pizza-white font-anton rounded-none">
            {saving ? "Speichern..." : "Speichern"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Addon Group Editor Modal
const AddonGroupEditor = ({ group, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: group.name || "",
    required: group.required || false,
    multiple: group.multiple || false,
    options: group.options || []
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(group.id, formData);
    setSaving(false);
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { id: `opt_${Date.now()}`, name: "", price: 0 }]
    });
  };

  const updateOption = (index, updates) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], ...updates };
    setFormData({ ...formData, options: newOptions });
  };

  const removeOption = (index) => {
    setFormData({ ...formData, options: formData.options.filter((_, i) => i !== index) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-xl bg-pizza-dark border border-yellow-600 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-pizza-black flex justify-between items-center">
          <h2 className="font-anton text-xl text-yellow-500">ADD-ON GRUPPE BEARBEITEN</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-pizza-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label className="font-mono text-sm text-neutral-400">Gruppenname *</Label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Dressing, Extras, Beilagen"
              className="bg-pizza-black border-pizza-dark focus:border-yellow-500 text-pizza-white rounded-none mt-1"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.required}
                onChange={e => setFormData({ ...formData, required: e.target.checked })}
                className="w-4 h-4 accent-yellow-500"
              />
              <span className="font-mono text-sm text-neutral-300">Pflichtauswahl</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.multiple}
                onChange={e => setFormData({ ...formData, multiple: e.target.checked })}
                className="w-4 h-4 accent-yellow-500"
              />
              <span className="font-mono text-sm text-neutral-300">Mehrfachauswahl</span>
            </label>
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="font-mono text-sm text-neutral-400">Optionen</Label>
              <Button onClick={addOption} size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white font-mono rounded-none h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Option
              </Button>
            </div>
            
            {formData.options.length === 0 ? (
              <p className="font-mono text-sm text-neutral-500 text-center py-4 bg-pizza-black/50">
                Keine Optionen. Füge Optionen hinzu (z.B. "Joghurt-Dressing", "Balsamico").
              </p>
            ) : (
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Input
                      value={option.name}
                      onChange={e => updateOption(index, { name: e.target.value })}
                      placeholder="Name (z.B. Joghurt)"
                      className="flex-1 bg-pizza-black border-pizza-dark focus:border-yellow-500 text-pizza-white rounded-none"
                    />
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs text-neutral-500">+</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={option.price}
                        onChange={e => updateOption(index, { price: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="w-20 bg-pizza-black border-pizza-dark focus:border-yellow-500 text-pizza-white rounded-none text-right"
                      />
                      <span className="font-mono text-xs text-neutral-500">€</span>
                    </div>
                    <Button onClick={() => removeOption(index)} size="sm" variant="outline" className="border-red-500 text-red-500 rounded-none h-10 w-10 p-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-pizza-black flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1 border-pizza-dark text-pizza-white rounded-none">
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-anton rounded-none">
            {saving ? "Speichern..." : "Speichern"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Item Editor Modal
const ItemEditor = ({ categoryId, item, addonGroups, categoryAddonGroupIds, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: item.name || "",
    description: item.description || "",
    price: item.price || 0,
    image_url: item.image_url || "",
    tags: item.tags || [],
    sizes: item.sizes || [],
    available: item.available !== false
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(categoryId, item.id, formData);
    setSaving(false);
  };

  const addSize = () => {
    setFormData({
      ...formData,
      sizes: [...formData.sizes, { id: `size_${Date.now()}`, name: "", price: 0, default: formData.sizes.length === 0 }]
    });
  };

  const updateSize = (index, updates) => {
    const newSizes = [...formData.sizes];
    newSizes[index] = { ...newSizes[index], ...updates };
    setFormData({ ...formData, sizes: newSizes });
  };

  const removeSize = (index) => {
    setFormData({ ...formData, sizes: formData.sizes.filter((_, i) => i !== index) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-2xl bg-pizza-dark border border-pizza-dark max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-pizza-black flex justify-between items-center">
          <h2 className="font-anton text-xl text-pizza-white">ARTIKEL BEARBEITEN</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-pizza-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label className="font-mono text-sm text-neutral-400">Name *</Label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none mt-1"
            />
          </div>

          <div>
            <Label className="font-mono text-sm text-neutral-400">Beschreibung</Label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full bg-pizza-black border border-pizza-dark focus:border-pizza-red text-pizza-white p-3 mt-1 font-mono resize-none"
            />
          </div>

          <div>
            <Label className="font-mono text-sm text-neutral-400">Bild URL</Label>
            <Input
              value={formData.image_url}
              onChange={e => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
              className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none mt-1"
            />
          </div>

          {/* Sizes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="font-mono text-sm text-neutral-400">Größen (optional)</Label>
              <Button onClick={addSize} size="sm" variant="outline" className="border-pizza-dark text-pizza-white rounded-none h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Größe
              </Button>
            </div>
            {formData.sizes.length === 0 ? (
              <div>
                <Label className="font-mono text-sm text-neutral-400">Preis *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none mt-1"
                />
              </div>
            ) : (
              <div className="space-y-2">
                {formData.sizes.map((size, index) => (
                  <div key={size.id} className="flex items-center gap-2">
                    <Input
                      value={size.name}
                      onChange={e => updateSize(index, { name: e.target.value })}
                      placeholder="Name (z.B. Klein)"
                      className="flex-1 bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={size.price}
                      onChange={e => updateSize(index, { price: parseFloat(e.target.value) || 0 })}
                      placeholder="Preis"
                      className="w-24 bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none"
                    />
                    <Button onClick={() => removeSize(index)} size="sm" variant="outline" className="border-red-500 text-red-500 rounded-none h-10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <Label className="font-mono text-sm text-neutral-400 mb-2 block">Tags</Label>
            <div className="flex flex-wrap gap-2">
              {["VEGETARIAN", "VEGAN", "HOT", "GLUTEN_FREE"].map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    const newTags = formData.tags.includes(tag)
                      ? formData.tags.filter(t => t !== tag)
                      : [...formData.tags, tag];
                    setFormData({ ...formData, tags: newTags });
                  }}
                  className={`px-3 py-1 font-mono text-xs border ${
                    formData.tags.includes(tag)
                      ? "border-pizza-red bg-pizza-red/20 text-pizza-red"
                      : "border-pizza-dark text-neutral-400"
                  }`}
                >
                  {tag === "VEGETARIAN" && "Vegetarisch"}
                  {tag === "VEGAN" && "Vegan"}
                  {tag === "HOT" && "Scharf"}
                  {tag === "GLUTEN_FREE" && "Glutenfrei"}
                </button>
              ))}
            </div>
          </div>

          {/* Assigned Addon Groups Info */}
          {categoryAddonGroupIds && categoryAddonGroupIds.length > 0 && addonGroups && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-600/50">
              <Label className="font-mono text-sm text-yellow-500 mb-2 block">Add-ons für diesen Artikel (via Kategorie)</Label>
              <div className="flex flex-wrap gap-2">
                {categoryAddonGroupIds.map(groupId => {
                  const group = addonGroups.find(g => g.id === groupId);
                  return group ? (
                    <span key={groupId} className="text-xs font-mono bg-yellow-600/20 text-yellow-400 px-2 py-1">
                      {group.name}: {group.options?.map(o => o.name).join(", ") || "Keine Optionen"}
                    </span>
                  ) : null;
                })}
              </div>
              <p className="font-mono text-xs text-neutral-500 mt-2">
                Add-ons werden über die Kategorie zugeordnet. Bearbeite die Kategorie um Add-ons zu ändern.
              </p>
            </div>
          )}

          {/* Available */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.available}
              onChange={e => setFormData({ ...formData, available: e.target.checked })}
              className="w-4 h-4 accent-pizza-red"
            />
            <span className="font-mono text-sm text-neutral-300">Verfügbar</span>
          </label>
        </div>

        <div className="p-6 border-t border-pizza-black flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1 border-pizza-dark text-pizza-white rounded-none">
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-pizza-red hover:bg-red-700 text-pizza-white font-anton rounded-none">
            {saving ? "Speichern..." : "Speichern"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Settings Section
const SettingsSection = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState(settings || {});
  const [saving, setSaving] = useState(false);
  const [newClosedDay, setNewClosedDay] = useState("");

  const dayNames = {
    monday: "Montag",
    tuesday: "Dienstag",
    wednesday: "Mittwoch",
    thursday: "Donnerstag",
    friday: "Freitag",
    saturday: "Samstag",
    sunday: "Sonntag"
  };

  useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("admin_token");
      await axios.put(`${API}/shop/settings`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Einstellungen gespeichert");
      onUpdate();
    } catch (e) {
      toast.error("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const updateOpeningHours = (day, field, value) => {
    setFormData({
      ...formData,
      opening_hours: {
        ...formData.opening_hours,
        [day]: {
          ...formData.opening_hours?.[day],
          [field]: value
        }
      }
    });
  };

  const addClosedDay = () => {
    if (!newClosedDay) return;
    const closedDays = formData.closed_days || [];
    if (!closedDays.includes(newClosedDay)) {
      setFormData({
        ...formData,
        closed_days: [...closedDays, newClosedDay].sort()
      });
    }
    setNewClosedDay("");
  };

  const removeClosedDay = (day) => {
    setFormData({
      ...formData,
      closed_days: (formData.closed_days || []).filter(d => d !== day)
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-pizza-dark border border-pizza-dark p-6">
        <h2 className="font-anton text-xl text-pizza-white mb-6">SHOP EINSTELLUNGEN</h2>

        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-4 bg-pizza-black/50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pickup_enabled !== false}
                onChange={e => setFormData({ ...formData, pickup_enabled: e.target.checked })}
                className="w-5 h-5 accent-pizza-red"
              />
              <div>
                <p className="font-mono text-pizza-white">Bestellungen aktiviert</p>
                <p className="font-mono text-xs text-neutral-500">Online-Bestellungen zur Abholung</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 bg-pizza-black/50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.reservation_enabled !== false}
                onChange={e => setFormData({ ...formData, reservation_enabled: e.target.checked })}
                className="w-5 h-5 accent-pizza-red"
              />
              <div>
                <p className="font-mono text-pizza-white">Reservierungen aktiviert</p>
                <p className="font-mono text-xs text-neutral-500">Online-Tischreservierungen</p>
              </div>
            </label>
          </div>

          {/* Timing */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-mono text-sm text-neutral-400">Mindest-Vorlaufzeit Bestellung (Minuten)</Label>
              <Input
                type="number"
                value={formData.min_pickup_time_minutes || 30}
                onChange={e => setFormData({ ...formData, min_pickup_time_minutes: parseInt(e.target.value) || 30 })}
                className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none mt-1"
              />
            </div>
            <div>
              <Label className="font-mono text-sm text-neutral-400">Max. Tage im Voraus (Reservierung)</Label>
              <Input
                type="number"
                value={formData.max_reservation_days_ahead || 30}
                onChange={e => setFormData({ ...formData, max_reservation_days_ahead: parseInt(e.target.value) || 30 })}
                className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none mt-1"
              />
            </div>
          </div>

          {/* Restaurant Info */}
          <div className="space-y-4">
            <h3 className="font-anton text-sm text-pizza-red">RESTAURANT INFO</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="font-mono text-sm text-neutral-400">Name</Label>
                <Input
                  value={formData.restaurant_name || ""}
                  onChange={e => setFormData({ ...formData, restaurant_name: e.target.value })}
                  className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none mt-1"
                />
              </div>
              <div>
                <Label className="font-mono text-sm text-neutral-400">Telefon</Label>
                <Input
                  value={formData.restaurant_phone || ""}
                  onChange={e => setFormData({ ...formData, restaurant_phone: e.target.value })}
                  className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="font-mono text-sm text-neutral-400">Adresse</Label>
              <Input
                value={formData.restaurant_address || ""}
                onChange={e => setFormData({ ...formData, restaurant_address: e.target.value })}
                className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none mt-1"
              />
            </div>
            <div>
              <Label className="font-mono text-sm text-neutral-400">E-Mail</Label>
              <Input
                value={formData.restaurant_email || ""}
                onChange={e => setFormData({ ...formData, restaurant_email: e.target.value })}
                className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none mt-1"
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="bg-pizza-red hover:bg-red-700 text-pizza-white font-anton tracking-wider rounded-none">
            <Save className="w-4 h-4 mr-2" /> {saving ? "SPEICHERN..." : "EINSTELLUNGEN SPEICHERN"}
          </Button>
        </div>
      </div>

      {/* Opening Hours */}
      <div className="bg-pizza-dark border border-pizza-dark p-6">
        <h2 className="font-anton text-xl text-pizza-white mb-6">ÖFFNUNGSZEITEN</h2>
        <p className="font-mono text-sm text-neutral-400 mb-4">Leer lassen = geschlossen an diesem Tag</p>
        
        <div className="space-y-3">
          {Object.entries(dayNames).map(([day, label]) => (
            <div key={day} className="grid grid-cols-3 gap-4 items-center">
              <span className="font-mono text-pizza-white">{label}</span>
              <div>
                <Input
                  type="time"
                  value={formData.opening_hours?.[day]?.open || ""}
                  onChange={e => updateOpeningHours(day, "open", e.target.value)}
                  placeholder="Öffnet"
                  className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none"
                />
              </div>
              <div>
                <Input
                  type="time"
                  value={formData.opening_hours?.[day]?.close || ""}
                  onChange={e => updateOpeningHours(day, "close", e.target.value)}
                  placeholder="Schließt"
                  className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none"
                />
              </div>
            </div>
          ))}
        </div>

        <Button onClick={handleSave} disabled={saving} className="mt-6 bg-pizza-red hover:bg-red-700 text-pizza-white font-anton tracking-wider rounded-none">
          <Save className="w-4 h-4 mr-2" /> {saving ? "SPEICHERN..." : "ÖFFNUNGSZEITEN SPEICHERN"}
        </Button>
      </div>

      {/* Closed Days / Holidays */}
      <div className="bg-pizza-dark border border-pizza-dark p-6">
        <h2 className="font-anton text-xl text-pizza-white mb-6">GESCHLOSSENE TAGE / FEIERTAGE</h2>
        <p className="font-mono text-sm text-neutral-400 mb-4">Tage an denen das Restaurant geschlossen ist</p>

        <div className="flex gap-2 mb-4">
          <Input
            type="date"
            value={newClosedDay}
            onChange={e => setNewClosedDay(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none flex-1"
          />
          <Button onClick={addClosedDay} className="bg-pizza-red hover:bg-red-700 text-pizza-white font-mono rounded-none">
            <Plus className="w-4 h-4 mr-1" /> Hinzufügen
          </Button>
        </div>

        {(formData.closed_days || []).length === 0 ? (
          <p className="font-mono text-sm text-neutral-500">Keine geschlossenen Tage eingetragen</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(formData.closed_days || []).map(day => (
              <div key={day} className="flex items-center gap-2 bg-pizza-black/50 px-3 py-2">
                <span className="font-mono text-sm text-pizza-white">
                  {new Date(day).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <button onClick={() => removeClosedDay(day)} className="text-red-500 hover:text-red-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Button onClick={handleSave} disabled={saving} className="mt-6 bg-pizza-red hover:bg-red-700 text-pizza-white font-anton tracking-wider rounded-none">
          <Save className="w-4 h-4 mr-2" /> {saving ? "SPEICHERN..." : "GESCHLOSSENE TAGE SPEICHERN"}
        </Button>
      </div>
    </div>
  );
};

export default ShopAdminPage;
