import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import { 
  ShoppingBag, Plus, Minus, Trash2, Clock, Phone, Mail, User, 
  ChevronRight, Check, Flame, Leaf, WheatOff, X, ChevronDown
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

const CHEF_ICON = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/845efg67_kopf.png";

// Custom Dropdown Component for Safari compatibility
const CustomDropdown = ({ value, onChange, options, placeholder = "Auswählen..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const selectedOption = options.find(opt => opt.value === value);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);
  
  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-pizza-black border border-pizza-dark hover:border-pizza-red text-pizza-white p-3 font-mono text-left flex items-center justify-between"
      >
        <span className={selectedOption ? "text-pizza-white" : "text-neutral-500"}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-pizza-dark border border-pizza-dark max-h-60 overflow-y-auto shadow-xl">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full p-3 text-left font-mono text-sm hover:bg-pizza-red/20 transition-colors ${
                option.value === value ? "bg-pizza-red/30 text-pizza-white" : "text-neutral-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const tagConfig = {
  VEGETARIAN: { icon: Leaf, color: "text-green-500", bg: "bg-green-500/20", label: "Vegetarisch" },
  VEGAN: { icon: Leaf, color: "text-green-400", bg: "bg-green-400/20", label: "Vegan" },
  HOT: { icon: Flame, color: "text-orange-500", bg: "bg-orange-500/20", label: "Scharf" },
  GLUTEN_FREE: { icon: WheatOff, color: "text-yellow-500", bg: "bg-yellow-500/20", label: "Glutenfrei" },
};

const OrderPage = () => {
  const [menu, setMenu] = useState({ categories: [], currency: "EUR" });
  const [settings, setSettings] = useState(null);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [step, setStep] = useState("menu"); // menu, cart, checkout, success
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    pickupTime: "ASAP",
    paymentMethod: "cash",
    notes: ""
  });

  // Item configuration state
  const [itemConfig, setItemConfig] = useState({
    size: null,
    options: {},
    quantity: 1,
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [menuRes, settingsRes] = await Promise.all([
        axios.get(`${API}/shop/menu`),
        axios.get(`${API}/shop/settings`)
      ]);
      setMenu(menuRes.data);
      setSettings(settingsRes.data);
      if (menuRes.data.categories?.length > 0) {
        setActiveCategory(menuRes.data.categories[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch data:", e);
      toast.error("Fehler beim Laden des Menüs");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price);
  };

  const openItemModal = (item) => {
    setSelectedItem(item);
    setItemConfig({
      size: item.sizes?.find(s => s.default)?.id || item.sizes?.[0]?.id || null,
      options: {},
      quantity: 1,
      notes: ""
    });
  };

  const closeItemModal = () => {
    setSelectedItem(null);
    setItemConfig({ size: null, options: {}, quantity: 1, notes: "" });
  };

  const getItemPrice = useCallback(() => {
    if (!selectedItem) return 0;
    
    let price = selectedItem.price;
    
    // Add size price
    if (itemConfig.size) {
      const size = selectedItem.sizes?.find(s => s.id === itemConfig.size);
      if (size) price = size.price;
    }
    
    // Add options prices
    Object.values(itemConfig.options).forEach(opts => {
      if (Array.isArray(opts)) {
        opts.forEach(optId => {
          selectedItem.groups?.forEach(group => {
            const opt = group.options?.find(o => o.id === optId);
            if (opt) price += opt.price;
          });
        });
      } else if (opts) {
        selectedItem.groups?.forEach(group => {
          const opt = group.options?.find(o => o.id === opts);
          if (opt) price += opt.price;
        });
      }
    });
    
    return price * itemConfig.quantity;
  }, [selectedItem, itemConfig]);

  const addToCart = () => {
    if (!selectedItem) return;
    
    const size = selectedItem.sizes?.find(s => s.id === itemConfig.size);
    const selectedOptions = [];
    
    Object.entries(itemConfig.options).forEach(([groupId, optIds]) => {
      const group = selectedItem.groups?.find(g => g.id === groupId);
      if (group) {
        const ids = Array.isArray(optIds) ? optIds : [optIds];
        ids.forEach(optId => {
          const opt = group.options?.find(o => o.id === optId);
          if (opt) {
            selectedOptions.push({
              group_name: group.name,
              option_name: opt.name,
              price: opt.price
            });
          }
        });
      }
    });
    
    const cartItem = {
      id: `${selectedItem.id}-${Date.now()}`,
      item_id: selectedItem.id,
      item_name: selectedItem.name,
      quantity: itemConfig.quantity,
      size: itemConfig.size,
      size_name: size?.name || null,
      options: selectedOptions,
      unit_price: getItemPrice() / itemConfig.quantity,
      total_price: getItemPrice(),
      notes: itemConfig.notes
    };
    
    setCart([...cart, cartItem]);
    toast.success(`${selectedItem.name} zum Warenkorb hinzugefügt`);
    closeItemModal();
  };

  const removeFromCart = (cartItemId) => {
    setCart(cart.filter(item => item.id !== cartItemId));
  };

  const updateCartQuantity = (cartItemId, delta) => {
    setCart(cart.map(item => {
      if (item.id === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQty,
          total_price: item.unit_price * newQty
        };
      }
      return item;
    }));
  };

  const getCartTotal = () => cart.reduce((sum, item) => sum + item.total_price, 0);

  const generatePickupTimes = () => {
    if (!settings) return [];
    
    const times = [{ value: "ASAP", label: "🚀 So schnell wie möglich" }];
    const now = new Date();
    const minMinutes = settings.min_pickup_time_minutes || 30;
    
    // Get today's opening hours
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[now.getDay()];
    const hours = settings.opening_hours?.[dayName];
    
    if (!hours?.open || !hours?.close) return times;
    
    const [openHour] = hours.open.split(':').map(Number);
    let [closeHour] = hours.close.split(':').map(Number);
    
    // Handle closing after midnight
    if (closeHour === 0) closeHour = 24;
    else if (closeHour < openHour) closeHour += 24;
    
    // Calculate start time (now + minimum lead time, rounded to 15 min)
    let startTime = new Date(now);
    startTime.setMinutes(Math.ceil((startTime.getMinutes() + minMinutes) / 15) * 15);
    startTime.setSeconds(0);
    
    // If before opening, start from opening time
    const openTime = new Date(now);
    openTime.setHours(openHour, 0, 0, 0);
    if (startTime < openTime) {
      startTime = openTime;
    }
    
    // Generate times until closing (minus 30 min buffer)
    const closeTime = new Date(now);
    closeTime.setHours(closeHour >= 24 ? closeHour - 24 : closeHour, 0, 0, 0);
    if (closeHour >= 24) closeTime.setDate(closeTime.getDate() + 1);
    closeTime.setMinutes(closeTime.getMinutes() - 30);
    
    let currentTime = new Date(startTime);
    while (currentTime <= closeTime) {
      const displayHours = currentTime.getHours().toString().padStart(2, '0');
      const displayMins = currentTime.getMinutes().toString().padStart(2, '0');
      times.push({
        value: `${displayHours}:${displayMins}`,
        label: `${displayHours}:${displayMins} Uhr`
      });
      currentTime.setMinutes(currentTime.getMinutes() + 15);
    }
    
    return times;
  };

  const submitOrder = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast.error("Bitte fülle alle Pflichtfelder aus");
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await axios.post(`${API}/shop/orders`, {
        items: cart.map(({ id, ...item }) => item),
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        pickup_time: customerInfo.pickupTime === "ASAP" ? "So schnell wie möglich" : `${customerInfo.pickupTime} Uhr`,
        payment_method: customerInfo.paymentMethod === "cash" ? "Barzahlung" : "Kartenzahlung",
        notes: customerInfo.notes
      });
      
      setOrderResult(response.data);
      setStep("success");
      setCart([]);
    } catch (e) {
      console.error("Order failed:", e);
      toast.error(e.response?.data?.detail || "Bestellung fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setSubmitting(false);
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

  if (!settings?.pickup_enabled) {
    return (
      <div className="min-h-screen bg-pizza-black flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-pizza-red mx-auto mb-4" />
          <h1 className="font-anton text-3xl text-pizza-white mb-2">BESTELLUNG NICHT MÖGLICH</h1>
          <p className="font-mono text-neutral-400">Bestellungen sind derzeit leider nicht verfügbar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pizza-black pt-20 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-b from-pizza-dark to-pizza-black py-12">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <img src={CHEF_ICON} alt="Chef" className="w-12 h-12 mx-auto mb-4" />
            <h1 className="font-anton text-4xl sm:text-5xl tracking-wider text-pizza-white">
              ONLINE <span className="text-pizza-red">BESTELLEN</span>
            </h1>
            <p className="font-mono text-base text-neutral-400 mt-2">Nur Abholung • Bar oder Kartenzahlung</p>
          </motion.div>
        </div>
      </div>

      {step === "success" ? (
        <SuccessView orderResult={orderResult} settings={settings} />
      ) : (
        <div className="max-w-7xl mx-auto px-4 mt-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Menu Section - hidden on mobile during checkout */}
            <div className={`flex-1 ${step === "checkout" ? "hidden lg:block" : ""}`}>
              {/* Category Tabs */}
              <div className="flex overflow-x-auto gap-2 pb-4 mb-6 scrollbar-hide">
                {menu.categories?.filter(c => c.available !== false).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-6 py-3 font-anton text-sm tracking-wider whitespace-nowrap transition-all ${
                      activeCategory === cat.id
                        ? "bg-pizza-red text-pizza-white"
                        : "bg-pizza-dark text-neutral-400 hover:text-pizza-white"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Menu Items */}
              <div className="grid gap-4">
                {menu.categories
                  ?.find(c => c.id === activeCategory)
                  ?.items?.filter(i => i.available !== false)
                  .map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onSelect={() => openItemModal(item)}
                      formatPrice={formatPrice}
                    />
                  ))}
              </div>

              {menu.categories?.length === 0 && (
                <div className="text-center py-16">
                  <ShoppingBag className="w-16 h-16 text-pizza-dark mx-auto mb-4" />
                  <p className="font-mono text-neutral-400">Keine Artikel verfügbar</p>
                </div>
              )}
            </div>

            {/* Cart Sidebar - always visible when checkout, or when cart has items on desktop */}
            <div className={`lg:w-96 ${step === "menu" && cart.length === 0 ? "hidden lg:block" : ""}`}>
              {/* Cart Summary - NOT sticky during checkout to prevent overlap */}
              <div className={`bg-pizza-dark border border-pizza-dark ${step === "menu" ? "lg:sticky lg:top-24" : ""}`}>
                <div className="p-4 border-b border-pizza-black">
                  <h2 className="font-anton text-xl text-pizza-white flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-pizza-red" />
                    WARENKORB
                    {cart.length > 0 && (
                      <span className="bg-pizza-red text-pizza-white text-xs px-2 py-1 ml-auto">
                        {cart.length}
                      </span>
                    )}
                  </h2>
                </div>

                {cart.length === 0 ? (
                  <div className="p-8 text-center">
                    <ShoppingBag className="w-12 h-12 text-pizza-dark mx-auto mb-2" />
                    <p className="font-mono text-sm text-neutral-500">Dein Warenkorb ist leer</p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-80 overflow-y-auto">
                      {cart.map((item) => (
                        <CartItem
                          key={item.id}
                          item={item}
                          onRemove={() => removeFromCart(item.id)}
                          onUpdateQty={(delta) => updateCartQuantity(item.id, delta)}
                          formatPrice={formatPrice}
                        />
                      ))}
                    </div>

                    <div className="p-4 border-t border-pizza-black">
                      <div className="flex justify-between mb-4">
                        <span className="font-mono text-neutral-400">Gesamt</span>
                        <span className="font-anton text-2xl text-pizza-red">{formatPrice(getCartTotal())}</span>
                      </div>

                      {step === "menu" && (
                        <Button
                          onClick={() => setStep("checkout")}
                          className="w-full bg-pizza-red hover:bg-red-700 text-pizza-white font-anton tracking-wider py-6 rounded-none"
                        >
                          ZUR KASSE <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Checkout Form */}
              {step === "checkout" && (
                <CheckoutForm
                  customerInfo={customerInfo}
                  setCustomerInfo={setCustomerInfo}
                  pickupTimes={generatePickupTimes()}
                  onBack={() => setStep("menu")}
                  onSubmit={submitOrder}
                  submitting={submitting}
                  total={getCartTotal()}
                  formatPrice={formatPrice}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Cart Button */}
      {step === "menu" && cart.length > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-pizza-black border-t border-pizza-dark lg:hidden"
        >
          <Button
            onClick={() => {
              setStep("checkout");
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full bg-pizza-red hover:bg-red-700 text-pizza-white font-anton tracking-wider py-6 rounded-none"
          >
            WARENKORB ({cart.length}) • {formatPrice(getCartTotal())}
          </Button>
        </motion.div>
      )}

      {/* Item Configuration Modal */}
      <AnimatePresence>
        {selectedItem && (
          <ItemModal
            item={selectedItem}
            config={itemConfig}
            setConfig={setItemConfig}
            onClose={closeItemModal}
            onAdd={addToCart}
            getPrice={getItemPrice}
            formatPrice={formatPrice}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Menu Item Card Component
const MenuItemCard = ({ item, onSelect, formatPrice }) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    onClick={onSelect}
    className="flex gap-4 p-4 bg-pizza-dark/50 border border-pizza-dark hover:border-pizza-red cursor-pointer transition-colors"
  >
    {item.image_url && (
      <img src={item.image_url} alt={item.name} className="w-24 h-24 object-cover flex-shrink-0" />
    )}
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-anton text-lg text-pizza-white">{item.name}</h3>
        <span className="font-anton text-pizza-red whitespace-nowrap">
          {item.sizes?.length > 0 ? `ab ${formatPrice(Math.min(...item.sizes.map(s => s.price)))}` : formatPrice(item.price)}
        </span>
      </div>
      {item.description && (
        <p className="font-mono text-sm text-neutral-400 mt-1 line-clamp-2">{item.description}</p>
      )}
      {item.tags?.length > 0 && (
        <div className="flex gap-2 mt-2">
          {item.tags.map(tag => {
            const config = tagConfig[tag];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <span key={tag} className={`inline-flex items-center gap-1 px-2 py-0.5 ${config.bg} ${config.color} text-xs font-mono`}>
                <Icon className="w-3 h-3" />
                {config.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
    <Plus className="w-6 h-6 text-pizza-red flex-shrink-0" />
  </motion.div>
);

// Cart Item Component
const CartItem = ({ item, onRemove, onUpdateQty, formatPrice }) => (
  <div className="p-4 border-b border-pizza-black">
    <div className="flex justify-between items-start gap-2">
      <div className="flex-1 min-w-0">
        <p className="font-anton text-pizza-white">{item.item_name}</p>
        {item.size_name && <p className="font-mono text-xs text-neutral-500">{item.size_name}</p>}
        {item.options?.map((opt, i) => (
          <p key={i} className="font-mono text-xs text-neutral-500">+ {opt.option_name}</p>
        ))}
      </div>
      <span className="font-mono text-pizza-red">{formatPrice(item.total_price)}</span>
    </div>
    <div className="flex items-center gap-2 mt-2">
      <button onClick={() => onUpdateQty(-1)} className="p-1 text-neutral-500 hover:text-pizza-white">
        <Minus className="w-4 h-4" />
      </button>
      <span className="font-mono text-pizza-white w-8 text-center">{item.quantity}</span>
      <button onClick={() => onUpdateQty(1)} className="p-1 text-neutral-500 hover:text-pizza-white">
        <Plus className="w-4 h-4" />
      </button>
      <button onClick={onRemove} className="ml-auto p-1 text-neutral-500 hover:text-pizza-red">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// Item Configuration Modal
const ItemModal = ({ item, config, setConfig, onClose, onAdd, getPrice, formatPrice }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      onClick={e => e.stopPropagation()}
      className="w-full max-w-lg bg-pizza-dark border border-pizza-dark max-h-[90vh] overflow-y-auto"
    >
      {/* Header */}
      <div className="relative">
        {item.image_url && (
          <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover" />
        )}
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-pizza-black/80 text-pizza-white hover:text-pizza-red">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6">
        <h2 className="font-anton text-2xl text-pizza-white">{item.name}</h2>
        {item.description && <p className="font-mono text-sm text-neutral-400 mt-2">{item.description}</p>}

        {/* Sizes */}
        {item.sizes?.length > 0 && (
          <div className="mt-6">
            <h3 className="font-anton text-sm text-pizza-red mb-3">GRÖSSE WÄHLEN</h3>
            <div className="grid gap-2">
              {item.sizes.map(size => (
                <button
                  key={size.id}
                  onClick={() => setConfig({ ...config, size: size.id })}
                  className={`flex justify-between items-center p-3 border transition-colors ${
                    config.size === size.id 
                      ? "border-pizza-red bg-pizza-red/10" 
                      : "border-pizza-dark hover:border-neutral-600"
                  }`}
                >
                  <span className="font-mono text-pizza-white">{size.name}</span>
                  <span className="font-mono text-pizza-red">{formatPrice(size.price)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Option Groups */}
        {item.groups?.map(group => (
          <div key={group.id} className="mt-6">
            <h3 className="font-anton text-sm text-pizza-red mb-3">
              {group.name} {group.required && <span className="text-neutral-500">*</span>}
            </h3>
            <div className="grid gap-2">
              {group.options?.map(opt => {
                const isSelected = group.multiple
                  ? config.options[group.id]?.includes(opt.id)
                  : config.options[group.id] === opt.id;
                
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      if (group.multiple) {
                        const current = config.options[group.id] || [];
                        const updated = isSelected
                          ? current.filter(id => id !== opt.id)
                          : [...current, opt.id];
                        setConfig({ ...config, options: { ...config.options, [group.id]: updated } });
                      } else {
                        setConfig({ ...config, options: { ...config.options, [group.id]: isSelected ? null : opt.id } });
                      }
                    }}
                    className={`flex justify-between items-center p-3 border transition-colors ${
                      isSelected 
                        ? "border-pizza-red bg-pizza-red/10" 
                        : "border-pizza-dark hover:border-neutral-600"
                    }`}
                  >
                    <span className="font-mono text-pizza-white flex items-center gap-2">
                      {isSelected && <Check className="w-4 h-4 text-pizza-red" />}
                      {opt.name}
                    </span>
                    {opt.price > 0 && <span className="font-mono text-neutral-400">+{formatPrice(opt.price)}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Quantity */}
        <div className="mt-6">
          <h3 className="font-anton text-sm text-pizza-red mb-3">ANZAHL</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setConfig({ ...config, quantity: Math.max(1, config.quantity - 1) })}
              className="p-2 border border-pizza-dark hover:border-pizza-red text-pizza-white"
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="font-anton text-2xl text-pizza-white w-12 text-center">{config.quantity}</span>
            <button
              onClick={() => setConfig({ ...config, quantity: config.quantity + 1 })}
              className="p-2 border border-pizza-dark hover:border-pizza-red text-pizza-white"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Add Button */}
        <Button
          onClick={onAdd}
          className="w-full mt-8 bg-pizza-red hover:bg-red-700 text-pizza-white font-anton text-lg tracking-wider py-6 rounded-none"
        >
          HINZUFÜGEN • {formatPrice(getPrice())}
        </Button>
      </div>
    </motion.div>
  </motion.div>
);

// Checkout Form Component
const CheckoutForm = ({ customerInfo, setCustomerInfo, pickupTimes, onBack, onSubmit, submitting, total, formatPrice }) => (
  <div className="mt-6 bg-pizza-dark border border-pizza-dark p-6">
    <h2 className="font-anton text-xl text-pizza-white mb-6">DEINE DATEN</h2>
    
    <div className="space-y-4">
      <div>
        <Label className="font-mono text-sm text-neutral-400">Name *</Label>
        <Input
          value={customerInfo.name}
          onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
          placeholder="Dein Name"
          className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none mt-1"
        />
      </div>
      
      <div>
        <Label className="font-mono text-sm text-neutral-400">E-Mail *</Label>
        <Input
          type="email"
          value={customerInfo.email}
          onChange={e => setCustomerInfo({ ...customerInfo, email: e.target.value })}
          placeholder="deine@email.de"
          className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none mt-1"
        />
      </div>
      
      <div>
        <Label className="font-mono text-sm text-neutral-400">Telefon *</Label>
        <Input
          type="tel"
          value={customerInfo.phone}
          onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
          placeholder="0123 456789"
          className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none mt-1"
        />
      </div>
      
      <div>
        <Label className="font-mono text-sm text-neutral-400">Abholzeit</Label>
        <div className="relative mt-1">
          <select
            value={customerInfo.pickupTime}
            onChange={e => setCustomerInfo({ ...customerInfo, pickupTime: e.target.value })}
            className="w-full bg-pizza-black border border-pizza-dark focus:border-pizza-red text-pizza-white p-3 font-mono appearance-none cursor-pointer"
            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
          >
            {pickupTimes.map(time => (
              <option key={time.value} value={time.value}>{time.label}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      
      <div>
        <Label className="font-mono text-sm text-neutral-400">Zahlungsart bei Abholung *</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <button
            type="button"
            onClick={() => setCustomerInfo({ ...customerInfo, paymentMethod: "cash" })}
            className={`p-4 border-2 transition-all flex flex-col items-center gap-2 ${
              customerInfo.paymentMethod === "cash"
                ? "border-pizza-red bg-pizza-red/10 text-pizza-white"
                : "border-pizza-dark bg-pizza-black text-neutral-400 hover:border-neutral-600"
            }`}
          >
            <span className="text-2xl">💵</span>
            <span className="font-mono text-sm">Barzahlung</span>
          </button>
          <button
            type="button"
            onClick={() => setCustomerInfo({ ...customerInfo, paymentMethod: "card" })}
            className={`p-4 border-2 transition-all flex flex-col items-center gap-2 ${
              customerInfo.paymentMethod === "card"
                ? "border-pizza-red bg-pizza-red/10 text-pizza-white"
                : "border-pizza-dark bg-pizza-black text-neutral-400 hover:border-neutral-600"
            }`}
          >
            <span className="text-2xl">💳</span>
            <span className="font-mono text-sm">Kartenzahlung</span>
          </button>
        </div>
      </div>
      
      <div>
        <Label className="font-mono text-sm text-neutral-400">Anmerkungen</Label>
        <textarea
          value={customerInfo.notes}
          onChange={e => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
          placeholder="Besondere Wünsche..."
          rows={3}
          className="w-full bg-pizza-black border border-pizza-dark focus:border-pizza-red text-pizza-white p-3 mt-1 font-mono resize-none"
        />
      </div>
    </div>

    <div className="mt-6 p-4 bg-pizza-black/50 border border-pizza-dark">
      <div className="flex items-center gap-2 text-neutral-400 font-mono text-sm">
        <Clock className="w-4 h-4" />
        <span>Nur Abholung</span>
      </div>
      <div className="flex items-center gap-2 text-neutral-400 font-mono text-sm mt-2">
        <span className="text-lg">{customerInfo.paymentMethod === "cash" ? "💵" : "💳"}</span>
        <span>{customerInfo.paymentMethod === "cash" ? "Barzahlung" : "Kartenzahlung"} bei Abholung</span>
      </div>
    </div>

    <div className="flex gap-4 mt-6">
      <Button onClick={onBack} variant="outline" className="flex-1 border-pizza-dark text-pizza-white hover:bg-pizza-dark rounded-none">
        ZURÜCK
      </Button>
      <Button
        onClick={onSubmit}
        disabled={submitting}
        className="flex-1 bg-pizza-red hover:bg-red-700 text-pizza-white font-anton tracking-wider rounded-none"
      >
        {submitting ? "WIRD GESENDET..." : `BESTELLEN • ${formatPrice(total)}`}
      </Button>
    </div>
  </div>
);

// Success View Component
const SuccessView = ({ orderResult, settings }) => (
  <div className="max-w-lg mx-auto px-4 mt-12">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-pizza-dark border border-pizza-red p-8 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="w-20 h-20 bg-pizza-red/20 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <Check className="w-10 h-10 text-pizza-red" />
      </motion.div>
      
      <h2 className="font-anton text-3xl text-pizza-white mb-2">BESTELLUNG AUFGEGEBEN!</h2>
      <p className="font-mono text-neutral-400 mb-6">
        Bestellnummer: <span className="text-pizza-red font-bold">#{orderResult?.order_number}</span>
      </p>
      
      <div className="bg-pizza-black/50 p-4 text-left mb-6">
        <p className="font-mono text-sm text-neutral-400 mb-2">Du erhältst eine Bestätigung per E-Mail.</p>
        <p className="font-mono text-sm text-neutral-400">
          <strong className="text-pizza-white">Abholadresse:</strong><br />
          {settings?.restaurant_name || "Little Eat Italy"}<br />
          {settings?.restaurant_address || "Europastrasse 8, 57072 Siegen"}<br />
          Tel: {settings?.restaurant_phone || "0271 31924461"}
        </p>
      </div>
      
      <Button
        onClick={() => window.location.href = "/"}
        className="bg-pizza-red hover:bg-red-700 text-pizza-white font-anton tracking-wider rounded-none"
      >
        ZURÜCK ZUR STARTSEITE
      </Button>
    </motion.div>
  </div>
);

export default OrderPage;
