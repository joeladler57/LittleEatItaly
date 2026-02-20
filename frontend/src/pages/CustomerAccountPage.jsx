import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import { 
  User, Mail, Phone, ShoppingBag, Calendar, LogOut, 
  Package, Clock, Euro, ChevronRight, UserPlus, LogIn
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

const CHEF_ICON = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/845efg67_kopf.png";

const CustomerAccountPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login"); // login or register
  
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ 
    email: "", password: "", confirmPassword: "", name: "", phone: "" 
  });

  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    if (token) {
      fetchCustomerData(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCustomerData = async (token) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [profileRes, ordersRes, reservationsRes] = await Promise.all([
        axios.get(`${API}/customers/me`, { headers }),
        axios.get(`${API}/customers/me/orders`, { headers }),
        axios.get(`${API}/customers/me/reservations`, { headers })
      ]);
      setCustomer(profileRes.data);
      setOrders(ordersRes.data);
      setReservations(reservationsRes.data);
      setIsLoggedIn(true);
    } catch (e) {
      console.error("Auth error:", e);
      localStorage.removeItem("customer_token");
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/customers/login`, loginForm);
      localStorage.setItem("customer_token", res.data.access_token);
      toast.success("Erfolgreich angemeldet!");
      fetchCustomerData(res.data.access_token);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Anmeldung fehlgeschlagen");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error("Passwörter stimmen nicht überein");
      return;
    }
    if (registerForm.password.length < 6) {
      toast.error("Passwort muss mindestens 6 Zeichen haben");
      return;
    }
    try {
      const res = await axios.post(`${API}/customers/register`, {
        email: registerForm.email,
        password: registerForm.password,
        name: registerForm.name,
        phone: registerForm.phone
      });
      localStorage.setItem("customer_token", res.data.access_token);
      toast.success("Konto erfolgreich erstellt!");
      fetchCustomerData(res.data.access_token);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Registrierung fehlgeschlagen");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("customer_token");
    setIsLoggedIn(false);
    setCustomer(null);
    setOrders([]);
    setReservations([]);
    toast.success("Erfolgreich abgemeldet");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("de-DE", { 
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" 
    });
  };

  const formatPrice = (price) => `${price.toFixed(2)} €`;

  const getStatusBadge = (status) => {
    const colors = {
      pending: "bg-yellow-500/20 text-yellow-500",
      confirmed: "bg-green-500/20 text-green-500",
      preparing: "bg-blue-500/20 text-blue-500",
      ready: "bg-purple-500/20 text-purple-500",
      completed: "bg-neutral-500/20 text-neutral-400",
      cancelled: "bg-red-500/20 text-red-500"
    };
    const labels = {
      pending: "Offen",
      confirmed: "Bestätigt",
      preparing: "In Zubereitung",
      ready: "Bereit",
      completed: "Abgeschlossen",
      cancelled: "Storniert"
    };
    return (
      <span className={`px-2 py-1 text-xs font-mono ${colors[status] || colors.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pizza-black flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
          <img src={CHEF_ICON} alt="Loading" className="w-16 h-16" />
        </motion.div>
      </div>
    );
  }

  // Not logged in - show login/register form
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-pizza-black pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <img src={CHEF_ICON} alt="Chef" className="w-12 h-12 mx-auto mb-4" />
            <h1 className="font-anton text-3xl text-pizza-white">
              MEIN <span className="text-pizza-red">KONTO</span>
            </h1>
          </motion.div>

          {/* Auth Tabs */}
          <div className="flex mb-6">
            <button
              onClick={() => setAuthMode("login")}
              className={`flex-1 py-3 font-anton text-sm tracking-wider transition-all ${
                authMode === "login" ? "bg-pizza-red text-pizza-white" : "bg-pizza-dark text-neutral-400"
              }`}
            >
              <LogIn className="w-4 h-4 inline mr-2" />
              ANMELDEN
            </button>
            <button
              onClick={() => setAuthMode("register")}
              className={`flex-1 py-3 font-anton text-sm tracking-wider transition-all ${
                authMode === "register" ? "bg-pizza-red text-pizza-white" : "bg-pizza-dark text-neutral-400"
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              REGISTRIEREN
            </button>
          </div>

          <div className="bg-pizza-dark border border-pizza-dark p-6">
            {authMode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label className="text-pizza-white font-mono text-sm">E-Mail</Label>
                  <Input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="mt-1 bg-pizza-black border-pizza-dark text-pizza-white"
                    placeholder="deine@email.de"
                  />
                </div>
                <div>
                  <Label className="text-pizza-white font-mono text-sm">Passwort</Label>
                  <Input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="mt-1 bg-pizza-black border-pizza-dark text-pizza-white"
                    placeholder="••••••••"
                  />
                </div>
                <Button type="submit" className="w-full bg-pizza-red hover:bg-red-700 text-pizza-white font-anton tracking-wider py-6 rounded-none">
                  ANMELDEN
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label className="text-pizza-white font-mono text-sm">Name</Label>
                  <Input
                    type="text"
                    required
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    className="mt-1 bg-pizza-black border-pizza-dark text-pizza-white"
                    placeholder="Max Mustermann"
                  />
                </div>
                <div>
                  <Label className="text-pizza-white font-mono text-sm">E-Mail</Label>
                  <Input
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="mt-1 bg-pizza-black border-pizza-dark text-pizza-white"
                    placeholder="deine@email.de"
                  />
                </div>
                <div>
                  <Label className="text-pizza-white font-mono text-sm">Telefon</Label>
                  <Input
                    type="tel"
                    required
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    className="mt-1 bg-pizza-black border-pizza-dark text-pizza-white"
                    placeholder="0123 456789"
                  />
                </div>
                <div>
                  <Label className="text-pizza-white font-mono text-sm">Passwort</Label>
                  <Input
                    type="password"
                    required
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="mt-1 bg-pizza-black border-pizza-dark text-pizza-white"
                    placeholder="Min. 6 Zeichen"
                  />
                </div>
                <div>
                  <Label className="text-pizza-white font-mono text-sm">Passwort bestätigen</Label>
                  <Input
                    type="password"
                    required
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    className="mt-1 bg-pizza-black border-pizza-dark text-pizza-white"
                    placeholder="Passwort wiederholen"
                  />
                </div>
                <Button type="submit" className="w-full bg-pizza-red hover:bg-red-700 text-pizza-white font-anton tracking-wider py-6 rounded-none">
                  KONTO ERSTELLEN
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Logged in - show profile
  return (
    <div className="min-h-screen bg-pizza-black pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <img src={CHEF_ICON} alt="Chef" className="w-12 h-12 mx-auto mb-4" />
          <h1 className="font-anton text-3xl text-pizza-white">
            HALLO, <span className="text-pizza-red">{customer?.name?.split(" ")[0]}</span>!
          </h1>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-pizza-dark border border-pizza-dark p-4 text-center">
            <ShoppingBag className="w-6 h-6 text-pizza-red mx-auto mb-2" />
            <div className="font-anton text-2xl text-pizza-white">{customer?.total_orders || 0}</div>
            <div className="font-mono text-xs text-neutral-400">Bestellungen</div>
          </div>
          <div className="bg-pizza-dark border border-pizza-dark p-4 text-center">
            <Calendar className="w-6 h-6 text-pizza-red mx-auto mb-2" />
            <div className="font-anton text-2xl text-pizza-white">{customer?.total_reservations || 0}</div>
            <div className="font-mono text-xs text-neutral-400">Reservierungen</div>
          </div>
          <div className="bg-pizza-dark border border-pizza-dark p-4 text-center">
            <Euro className="w-6 h-6 text-pizza-red mx-auto mb-2" />
            <div className="font-anton text-2xl text-pizza-white">{(customer?.total_spent || 0).toFixed(0)}€</div>
            <div className="font-mono text-xs text-neutral-400">Gesamtumsatz</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-6">
          {[
            { id: "profile", label: "Profil", icon: User },
            { id: "orders", label: "Bestellungen", icon: Package },
            { id: "reservations", label: "Reservierungen", icon: Calendar }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-anton text-sm tracking-wider whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-pizza-red text-pizza-white"
                  : "bg-pizza-dark text-neutral-400 hover:text-pizza-white"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-pizza-dark border border-pizza-dark">
          {activeTab === "profile" && (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-pizza-black/50">
                <User className="w-5 h-5 text-pizza-red" />
                <div>
                  <div className="font-mono text-xs text-neutral-400">Name</div>
                  <div className="text-pizza-white">{customer?.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-pizza-black/50">
                <Mail className="w-5 h-5 text-pizza-red" />
                <div>
                  <div className="font-mono text-xs text-neutral-400">E-Mail</div>
                  <div className="text-pizza-white">{customer?.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-pizza-black/50">
                <Phone className="w-5 h-5 text-pizza-red" />
                <div>
                  <div className="font-mono text-xs text-neutral-400">Telefon</div>
                  <div className="text-pizza-white">{customer?.phone}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-pizza-black/50">
                <Clock className="w-5 h-5 text-pizza-red" />
                <div>
                  <div className="font-mono text-xs text-neutral-400">Mitglied seit</div>
                  <div className="text-pizza-white">{formatDate(customer?.created_at)}</div>
                </div>
              </div>
              <Button onClick={handleLogout} variant="outline" className="w-full mt-4 border-pizza-red text-pizza-red hover:bg-pizza-red hover:text-pizza-white">
                <LogOut className="w-4 h-4 mr-2" />
                ABMELDEN
              </Button>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="divide-y divide-pizza-black">
              {orders.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 text-pizza-dark mx-auto mb-2" />
                  <p className="font-mono text-sm text-neutral-500">Noch keine Bestellungen</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-pizza-black/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-anton text-pizza-red">#{order.order_number}</span>
                        <span className="font-mono text-sm text-neutral-400 ml-2">{formatDate(order.created_at)}</span>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="font-mono text-sm text-neutral-300">
                      {order.items?.map((item, i) => (
                        <span key={i}>
                          {item.quantity}x {item.item_name}
                          {i < order.items.length - 1 && ", "}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-mono text-xs text-neutral-500">
                        Abholung: {order.pickup_time}
                      </span>
                      <span className="font-anton text-pizza-white">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "reservations" && (
            <div className="divide-y divide-pizza-black">
              {reservations.length === 0 ? (
                <div className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-pizza-dark mx-auto mb-2" />
                  <p className="font-mono text-sm text-neutral-500">Noch keine Reservierungen</p>
                </div>
              ) : (
                reservations.map((res) => (
                  <div key={res.id} className="p-4 hover:bg-pizza-black/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-anton text-pizza-red">#{res.reservation_number}</span>
                        <span className="font-mono text-sm text-neutral-400 ml-2">{res.date} um {res.time} Uhr</span>
                      </div>
                      {getStatusBadge(res.status)}
                    </div>
                    <div className="font-mono text-sm text-neutral-300">
                      {res.guests} {res.guests === 1 ? "Person" : "Personen"}
                    </div>
                    {res.notes && (
                      <div className="font-mono text-xs text-neutral-500 mt-1">
                        Notiz: {res.notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerAccountPage;
