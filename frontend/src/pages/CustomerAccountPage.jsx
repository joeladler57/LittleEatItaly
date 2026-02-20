import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import { 
  User, Mail, Phone, ShoppingBag, Calendar, LogOut, 
  Package, Clock, Euro, UserPlus, LogIn, Gift, Star, QrCode, Sparkles,
  Wallet, Download, Smartphone, Share2, Apple, ChevronRight
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import QRCode from "react-qr-code";

const CHEF_ICON = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/845efg67_kopf.png";

const CustomerAccountPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loyalty, setLoyalty] = useState(null);
  const [activeTab, setActiveTab] = useState("bonuskarte");
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [redeeming, setRedeeming] = useState(null);
  
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
      const [profileRes, ordersRes, reservationsRes, loyaltyRes] = await Promise.all([
        axios.get(`${API}/customers/me`, { headers }),
        axios.get(`${API}/customers/me/orders`, { headers }),
        axios.get(`${API}/customers/me/reservations`, { headers }),
        axios.get(`${API}/customers/me/loyalty`, { headers })
      ]);
      setCustomer(profileRes.data);
      setOrders(ordersRes.data);
      setReservations(reservationsRes.data);
      setLoyalty(loyaltyRes.data);
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
    setLoyalty(null);
    toast.success("Erfolgreich abgemeldet");
  };

  const handleRedeem = async (reward) => {
    if (loyalty?.loyalty_points < reward.points_required) {
      toast.error("Nicht genügend Punkte");
      return;
    }
    setRedeeming(reward.id);
    try {
      const token = localStorage.getItem("customer_token");
      const res = await axios.post(`${API}/customers/me/redeem?reward_id=${reward.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message);
      // Refresh loyalty data
      const loyaltyRes = await axios.get(`${API}/customers/me/loyalty`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoyalty(loyaltyRes.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Einlösung fehlgeschlagen");
    } finally {
      setRedeeming(null);
    }
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

  const getTransactionIcon = (type) => {
    switch (type) {
      case "earned_online": return "🛒";
      case "earned_instore": return "🍽️";
      case "redeemed": return "🎁";
      case "bonus": return "🎉";
      case "expired": return "⏰";
      default: return "📝";
    }
  };

  // Wallet Functions
  const handleAddToWallet = async (walletType) => {
    try {
      const token = localStorage.getItem("customer_token");
      const response = await axios.get(`${API}/customers/me/wallet-pass?type=${walletType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.pass_url) {
        // Redirect to wallet pass URL
        window.location.href = response.data.pass_url;
      } else if (response.data.message) {
        toast.info(response.data.message);
      }
    } catch (e) {
      if (e.response?.status === 501) {
        // Feature not fully configured - show instructions
        if (walletType === 'apple') {
          toast.info(
            "Apple Wallet wird bald verfügbar sein! Nutze vorerst 'QR-Code als Bild speichern'.",
            { duration: 5000 }
          );
        } else {
          toast.info(
            "Google Wallet wird bald verfügbar sein! Nutze vorerst 'Zur Startseite hinzufügen'.",
            { duration: 5000 }
          );
        }
      } else {
        toast.error("Wallet-Funktion nicht verfügbar");
      }
    }
  };

  const handleSaveQRCode = () => {
    const qrCodeSvg = document.getElementById("loyalty-qr-code");
    if (!qrCodeSvg) {
      toast.error("QR-Code nicht gefunden");
      return;
    }

    // Create canvas from SVG
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const svgData = new XMLSerializer().serializeToString(qrCodeSvg);
    const img = new Image();
    
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      // Add padding for better visibility
      const padding = 40;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2 + 60;
      
      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw QR code
      ctx.drawImage(img, padding, padding);
      
      // Add text
      ctx.fillStyle = "#000000";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Little Eat Italy", canvas.width / 2, canvas.height - 40);
      ctx.font = "12px Arial";
      ctx.fillText(`${customer?.name || "Bonuskarte"}`, canvas.width / 2, canvas.height - 20);
      
      // Download
      const link = document.createElement("a");
      link.download = `bonuskarte-${customer?.name?.replace(/\s/g, "-") || "qr"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success("QR-Code gespeichert!");
    };
    
    img.src = url;
  };

  const handleAddToHomeScreen = () => {
    // Check if PWA install prompt is available
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      window.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          toast.success("App wird zur Startseite hinzugefügt!");
        }
        window.deferredPrompt = null;
      });
    } else {
      // Show manual instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      if (isIOS) {
        toast.info(
          <div className="space-y-2">
            <p className="font-bold">Zur Startseite hinzufügen (iOS):</p>
            <ol className="list-decimal list-inside text-sm">
              <li>Tippe auf das Teilen-Symbol ⬆️</li>
              <li>Scrolle und tippe "Zum Home-Bildschirm"</li>
              <li>Tippe "Hinzufügen"</li>
            </ol>
          </div>,
          { duration: 8000 }
        );
      } else if (isAndroid) {
        toast.info(
          <div className="space-y-2">
            <p className="font-bold">Zur Startseite hinzufügen (Android):</p>
            <ol className="list-decimal list-inside text-sm">
              <li>Tippe auf das Menü ⋮</li>
              <li>Wähle "Zum Startbildschirm hinzufügen"</li>
              <li>Tippe "Hinzufügen"</li>
            </ol>
          </div>,
          { duration: 8000 }
        );
      } else {
        toast.info(
          "Öffne diese Seite auf deinem Smartphone und füge sie zur Startseite hinzu für schnellen Zugriff!",
          { duration: 5000 }
        );
      }
    }
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
            <p className="font-mono text-sm text-neutral-400 mt-2">
              Sammle Punkte und erhalte Prämien!
            </p>
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

  // Logged in - show profile with loyalty card
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

        {/* Loyalty Points Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-pizza-red via-red-700 to-red-900 p-6 mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-mono text-xs text-white/70 uppercase tracking-wider">Bonuskarte</p>
                <h2 className="font-anton text-4xl text-white">{loyalty?.loyalty_points || 0} <span className="text-2xl">PUNKTE</span></h2>
              </div>
              <Star className="w-10 h-10 text-yellow-400" />
            </div>
            
            <div className="flex items-center gap-2 text-white/80 font-mono text-sm">
              <Sparkles className="w-4 h-4" />
              <span>{loyalty?.points_per_euro || 1} Punkt pro Euro</span>
            </div>
            
            <p className="font-mono text-xs text-white/60 mt-2">
              Gesamt gesammelt: {loyalty?.lifetime_points || 0} Punkte
            </p>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-6">
          {[
            { id: "bonuskarte", label: "Bonuskarte", icon: QrCode },
            { id: "praemien", label: "Prämien", icon: Gift },
            { id: "orders", label: "Bestellungen", icon: Package },
            { id: "profile", label: "Profil", icon: User }
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
          {/* Bonuskarte Tab - QR Code */}
          {activeTab === "bonuskarte" && (
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="font-anton text-xl text-pizza-white mb-2">DEINE DIGITALE BONUSKARTE</h3>
                <p className="font-mono text-sm text-neutral-400">
                  Zeige diesen QR-Code beim Bezahlen vor Ort
                </p>
              </div>
              
              {/* QR Code */}
              <div className="bg-white p-6 mx-auto w-fit rounded-lg mb-6" id="qr-code-container">
                {loyalty?.qr_code_data && (
                  <QRCode 
                    value={loyalty.qr_code_data} 
                    size={200}
                    level="H"
                    id="loyalty-qr-code"
                  />
                )}
              </div>
              
              <div className="text-center">
                <p className="font-mono text-xs text-neutral-500 mb-4">
                  {customer?.name} • {customer?.email}
                </p>
              </div>

              {/* Wallet Actions */}
              <div className="space-y-3 mb-6">
                <p className="font-anton text-sm text-pizza-red text-center mb-4">ZUR WALLET HINZUFÜGEN</p>
                
                {/* Apple Wallet Button */}
                <button
                  onClick={() => handleAddToWallet('apple')}
                  className="w-full flex items-center justify-between p-4 bg-black hover:bg-neutral-900 border border-neutral-700 rounded-lg transition-all group"
                  data-testid="add-to-apple-wallet"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="black">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-mono text-xs text-neutral-400">Hinzufügen zu</p>
                      <p className="font-anton text-white">Apple Wallet</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                </button>

                {/* Google Wallet Button */}
                <button
                  onClick={() => handleAddToWallet('google')}
                  className="w-full flex items-center justify-between p-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg transition-all group"
                  data-testid="add-to-google-wallet"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-6 h-6">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-mono text-xs text-neutral-400">Hinzufügen zu</p>
                      <p className="font-anton text-white">Google Wallet</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                </button>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-pizza-dark px-3 text-neutral-500 font-mono">ODER</span>
                  </div>
                </div>

                {/* Save QR as Image */}
                <button
                  onClick={handleSaveQRCode}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-pizza-dark hover:bg-neutral-800 border border-neutral-700 rounded-lg transition-all"
                  data-testid="save-qr-image"
                >
                  <Download className="w-5 h-5 text-pizza-red" />
                  <span className="font-anton text-white">QR-CODE ALS BILD SPEICHERN</span>
                </button>

                {/* Add to Home Screen (PWA) */}
                <button
                  onClick={handleAddToHomeScreen}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-pizza-dark hover:bg-neutral-800 border border-neutral-700 rounded-lg transition-all"
                  data-testid="add-to-homescreen"
                >
                  <Smartphone className="w-5 h-5 text-pizza-red" />
                  <span className="font-anton text-white">ZUR STARTSEITE HINZUFÜGEN</span>
                </button>
              </div>

              {/* Recent Transactions */}
              {loyalty?.recent_transactions?.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-anton text-sm text-pizza-red mb-3">LETZTE AKTIVITÄTEN</h4>
                  <div className="space-y-2">
                    {loyalty.recent_transactions.slice(0, 5).map((tx, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-pizza-black/50">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{getTransactionIcon(tx.type)}</span>
                          <div>
                            <p className="font-mono text-sm text-pizza-white">{tx.description}</p>
                            <p className="font-mono text-xs text-neutral-500">{formatDate(tx.created_at)}</p>
                          </div>
                        </div>
                        <span className={`font-anton text-lg ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                          {tx.amount > 0 ? "+" : ""}{tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prämien Tab */}
          {activeTab === "praemien" && (
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="font-anton text-xl text-pizza-white mb-2">VERFÜGBARE PRÄMIEN</h3>
                <p className="font-mono text-sm text-neutral-400">
                  Du hast <span className="text-pizza-red font-bold">{loyalty?.loyalty_points || 0} Punkte</span>
                </p>
              </div>

              <div className="grid gap-4">
                {loyalty?.rewards?.map((reward) => {
                  const canRedeem = (loyalty?.loyalty_points || 0) >= reward.points_required;
                  const progress = Math.min(100, ((loyalty?.loyalty_points || 0) / reward.points_required) * 100);
                  
                  return (
                    <div key={reward.id} className={`p-4 border ${canRedeem ? "border-pizza-red bg-pizza-red/10" : "border-pizza-dark bg-pizza-black/50"}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-anton text-lg text-pizza-white">{reward.name}</h4>
                          <p className="font-mono text-xs text-neutral-400">{reward.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-anton text-2xl text-pizza-red">{reward.points_required}</span>
                          <p className="font-mono text-xs text-neutral-500">Punkte</p>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="h-2 bg-pizza-dark mb-3 overflow-hidden">
                        <div 
                          className="h-full bg-pizza-red transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs text-neutral-500">
                          {canRedeem ? "Bereit zum Einlösen!" : `Noch ${reward.points_required - (loyalty?.loyalty_points || 0)} Punkte`}
                        </span>
                        <Button
                          onClick={() => handleRedeem(reward)}
                          disabled={!canRedeem || redeeming === reward.id}
                          className={`font-anton text-xs rounded-none ${
                            canRedeem 
                              ? "bg-pizza-red hover:bg-red-700 text-white" 
                              : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                          }`}
                        >
                          <Gift className="w-4 h-4 mr-1" />
                          {redeeming === reward.id ? "..." : "EINLÖSEN"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Orders Tab */}
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
                        {order.points_earned > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 font-mono text-xs">
                            +{order.points_earned} Punkte
                          </span>
                        )}
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

          {/* Profile Tab */}
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
                <ShoppingBag className="w-5 h-5 text-pizza-red" />
                <div>
                  <div className="font-mono text-xs text-neutral-400">Statistiken</div>
                  <div className="text-pizza-white">
                    {customer?.total_orders || 0} Bestellungen • {formatPrice(customer?.total_spent || 0)} Umsatz
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-pizza-black/50">
                <Clock className="w-5 h-5 text-pizza-red" />
                <div>
                  <div className="font-mono text-xs text-neutral-400">Mitglied seit</div>
                  <div className="text-pizza-white">{formatDate(customer?.created_at)}</div>
                </div>
              </div>
              <Button onClick={handleLogout} variant="outline" className="w-full mt-4 border-pizza-red text-pizza-red hover:bg-pizza-red hover:text-pizza-white rounded-none">
                <LogOut className="w-4 h-4 mr-2" />
                ABMELDEN
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerAccountPage;
