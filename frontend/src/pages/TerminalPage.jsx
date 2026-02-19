import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { 
  Plus, Minus, Send, X, UtensilsCrossed, ChefHat, 
  Coffee, IceCream, MessageSquare, Check, ArrowLeft,
  Users
} from "lucide-react";

const CHEF_ICON = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/845efg67_kopf.png";

const TerminalPage = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [waiterId, setWaiterId] = useState("");
  const [waiterName, setWaiterName] = useState("");
  
  // Data State
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [addonGroups, setAddonGroups] = useState([]);
  
  // Order State
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Item Detail State
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("Hauptspeise");
  const [itemNote, setItemNote] = useState("");
  
  // View State
  const [view, setView] = useState("tables"); // tables, menu, cart, success

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem("terminal_token");
    const name = localStorage.getItem("terminal_waiter_name");
    const id = localStorage.getItem("terminal_waiter_id");
    if (token && name) {
      setIsAuthenticated(true);
      setWaiterName(name);
      setWaiterId(id);
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      const [tablesRes, menuRes, categoriesRes, addonGroupsRes] = await Promise.all([
        axios.get(`${API}/terminal/tables`),
        axios.get(`${API}/terminal/menu`),
        axios.get(`${API}/terminal/categories`),
        axios.get(`${API}/terminal/addon-groups`)
      ]);
      setTables(tablesRes.data);
      setMenuItems(menuRes.data);
      setCategories(categoriesRes.data);
      setAddonGroups(addonGroupsRes.data);
    } catch (e) {
      console.error("Failed to fetch data:", e);
    }
  };

  const handleLogin = async () => {
    if (pin.length !== 4) {
      setPinError("PIN muss 4 Ziffern haben");
      return;
    }
    try {
      const response = await axios.post(`${API}/terminal/login`, { pin });
      localStorage.setItem("terminal_token", response.data.access_token);
      localStorage.setItem("terminal_waiter_name", response.data.waiter_name);
      localStorage.setItem("terminal_waiter_id", response.data.waiter_id);
      setIsAuthenticated(true);
      setWaiterName(response.data.waiter_name);
      setWaiterId(response.data.waiter_id);
      setPinError("");
      fetchData();
      toast.success(`Hallo ${response.data.waiter_name}!`);
    } catch (e) {
      setPinError("Ungültiger PIN");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("terminal_token");
    localStorage.removeItem("terminal_waiter_name");
    localStorage.removeItem("terminal_waiter_id");
    setIsAuthenticated(false);
    setWaiterName("");
    setWaiterId("");
    setPin("");
    resetOrder();
  };

  const resetOrder = () => {
    setSelectedTable(null);
    setCart([]);
    setView("tables");
    setSelectedCategory(null);
    setSelectedItem(null);
  };

  const selectTable = (table) => {
    setSelectedTable(table);
    setView("menu");
    if (categories.length > 0) {
      setSelectedCategory(categories[0]);
    }
  };

  const openItemDetail = (item) => {
    setSelectedItem(item);
    setItemQuantity(1);
    setSelectedAddons([]);
    setSelectedCourse("Hauptspeise");
    setItemNote("");
  };

  const toggleAddon = (addon) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.name === addon.name);
      if (exists) {
        return prev.filter(a => a.name !== addon.name);
      }
      return [...prev, addon];
    });
  };

  const addToCart = () => {
    if (!selectedItem) return;
    
    const cartItem = {
      id: `${selectedItem.id}-${Date.now()}`,
      item_id: selectedItem.id,
      item_name: selectedItem.name,
      price: selectedItem.price,
      quantity: itemQuantity,
      addons: selectedAddons,
      course: selectedCourse,
      note: itemNote.trim() || null
    };
    
    setCart(prev => [...prev, cartItem]);
    setSelectedItem(null);
    toast.success(`${itemQuantity}x ${selectedItem.name} hinzugefügt`);
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  const updateCartItemQuantity = (cartItemId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      let itemTotal = item.price * item.quantity;
      item.addons.forEach(addon => {
        itemTotal += addon.price * item.quantity;
      });
      return sum + itemTotal;
    }, 0);
  };

  const submitOrder = async () => {
    if (cart.length === 0 || !selectedTable) return;
    
    setSending(true);
    try {
      const orderData = {
        table_number: selectedTable.number,
        waiter_id: waiterId,
        waiter_name: waiterName,
        items: cart.map(item => ({
          item_id: item.item_id,
          item_name: item.item_name,
          quantity: item.quantity,
          price: item.price,
          addons: item.addons,
          course: item.course,
          note: item.note
        }))
      };
      
      const response = await axios.post(`${API}/terminal/orders`, orderData);
      
      toast.success(`Bestellung #${response.data.order_number} gesendet!`);
      setView("success");
      
      // Reset after delay
      setTimeout(() => {
        resetOrder();
      }, 3000);
      
    } catch (e) {
      toast.error("Fehler beim Senden der Bestellung");
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const filteredItems = menuItems.filter(item => 
    !selectedCategory || item.category === selectedCategory
  );

  const courseIcons = {
    "Vorspeise": UtensilsCrossed,
    "Hauptspeise": ChefHat,
    "Nachspeise": IceCream,
    "Getränke": Coffee
  };

  // PIN Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img src={CHEF_ICON} alt="Logo" className="w-20 h-20 mx-auto mb-4" />
            <h1 className="font-anton text-2xl text-white">KELLNER-TERMINAL</h1>
            <p className="font-mono text-sm text-neutral-400 mt-2">PIN eingeben</p>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            {[0,1,2,3].map(i => (
              <div key={i} className={`w-12 h-12 border-2 ${pin[i] ? 'border-green-500 bg-green-500/20' : 'border-neutral-700'} flex items-center justify-center`}>
                {pin[i] && <span className="text-green-500 text-2xl">•</span>}
              </div>
            ))}
          </div>

          {pinError && <p className="text-red-500 text-center mb-4 font-mono text-sm">{pinError}</p>}

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[1,2,3,4,5,6,7,8,9].map(num => (
              <button
                key={num}
                onClick={() => pin.length < 4 && setPin(pin + num)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-anton text-2xl py-4 active:scale-95 transition-transform"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              onClick={() => pin.length < 4 && setPin(pin + '0')}
              className="bg-neutral-800 hover:bg-neutral-700 text-white font-anton text-2xl py-4 active:scale-95 transition-transform"
            >
              0
            </button>
            <button
              onClick={() => setPin(pin.slice(0, -1))}
              className="bg-neutral-700 hover:bg-neutral-600 text-white font-mono py-4 active:scale-95 transition-transform"
            >
              ←
            </button>
          </div>

          <button
            onClick={handleLogin}
            disabled={pin.length !== 4}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-anton text-lg py-4 active:scale-98 transition-transform"
          >
            ANMELDEN
          </button>
        </div>
      </div>
    );
  }

  // Success Screen
  if (view === "success") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-green-500/20 border-4 border-green-500 flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="font-anton text-3xl text-green-500 mb-2">GESENDET!</h1>
          <p className="font-mono text-neutral-400">Bon wird gedruckt...</p>
        </div>
      </div>
    );
  }

  // Item Detail Modal
  if (selectedItem) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => setSelectedItem(null)}
              className="p-2 bg-neutral-800 hover:bg-neutral-700"
            >
              <X className="w-6 h-6" />
            </button>
            <h1 className="font-anton text-xl">{selectedItem.name}</h1>
          </div>

          {/* Quantity */}
          <div className="bg-neutral-900 border border-neutral-700 p-4 mb-4">
            <p className="font-mono text-xs text-neutral-400 mb-3">ANZAHL</p>
            <div className="flex items-center justify-center gap-6">
              <button 
                onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                className="w-12 h-12 bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center"
              >
                <Minus className="w-6 h-6" />
              </button>
              <span className="font-anton text-4xl w-16 text-center">{itemQuantity}</span>
              <button 
                onClick={() => setItemQuantity(itemQuantity + 1)}
                className="w-12 h-12 bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Course Selection */}
          <div className="bg-neutral-900 border border-neutral-700 p-4 mb-4">
            <p className="font-mono text-xs text-neutral-400 mb-3">GANG</p>
            <div className="grid grid-cols-2 gap-2">
              {["Vorspeise", "Hauptspeise", "Nachspeise", "Getränke"].map(course => {
                const Icon = courseIcons[course] || ChefHat;
                return (
                  <button
                    key={course}
                    onClick={() => setSelectedCourse(course)}
                    className={`p-3 border flex items-center gap-2 ${
                      selectedCourse === course 
                        ? 'border-green-500 bg-green-500/10 text-green-400' 
                        : 'border-neutral-700 hover:border-neutral-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-mono text-sm">{course}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Addons */}
          {selectedItem.addons && selectedItem.addons.length > 0 && (
            <div className="bg-neutral-900 border border-neutral-700 p-4 mb-4">
              <p className="font-mono text-xs text-neutral-400 mb-3">EXTRAS</p>
              <div className="space-y-2">
                {selectedItem.addons.map((addon, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleAddon(addon)}
                    className={`w-full p-3 border flex items-center justify-between ${
                      selectedAddons.find(a => a.name === addon.name)
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-neutral-700 hover:border-neutral-500'
                    }`}
                  >
                    <span className="font-mono text-sm">{addon.name}</span>
                    <span className="font-mono text-sm text-green-400">+{addon.price.toFixed(2)}€</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          <div className="bg-neutral-900 border border-neutral-700 p-4 mb-4">
            <p className="font-mono text-xs text-neutral-400 mb-3">NOTIZ (optional)</p>
            <textarea
              value={itemNote}
              onChange={(e) => setItemNote(e.target.value)}
              placeholder="z.B. ohne Zwiebeln, extra scharf..."
              className="w-full bg-black border border-neutral-700 p-3 font-mono text-sm resize-none h-20"
            />
          </div>

          {/* Add Button */}
          <button
            onClick={addToCart}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-anton text-lg py-4 flex items-center justify-center gap-3"
          >
            <Plus className="w-6 h-6" />
            HINZUFÜGEN
          </button>
        </div>
      </div>
    );
  }

  // Table Selection
  if (view === "tables") {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-green-500" />
              <div>
                <h1 className="font-anton text-xl">TISCH WÄHLEN</h1>
                <p className="font-mono text-xs text-neutral-400">{waiterName}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="font-mono text-xs text-red-400 hover:text-red-300"
            >
              Abmelden
            </button>
          </div>

          {/* Tables Grid */}
          {tables.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-400 font-mono">Keine Tische vorhanden</p>
              <p className="text-neutral-500 font-mono text-sm mt-2">Tische im Admin-Bereich anlegen</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => selectTable(table)}
                  className="aspect-square bg-neutral-900 border-2 border-neutral-700 hover:border-green-500 hover:bg-green-500/10 flex flex-col items-center justify-center transition-colors"
                >
                  <span className="font-anton text-2xl">{table.number}</span>
                  {table.description && (
                    <span className="font-mono text-xs text-neutral-400 mt-1">{table.description}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Menu View
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={resetOrder}
              className="p-2 bg-neutral-800 hover:bg-neutral-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-anton text-lg">TISCH {selectedTable?.number}</h1>
              <p className="font-mono text-xs text-neutral-400">{waiterName}</p>
            </div>
          </div>
          
          {/* Cart Button */}
          <button
            onClick={() => setShowCart(true)}
            className="relative bg-green-600 hover:bg-green-500 px-4 py-2 flex items-center gap-2"
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span className="font-anton">{cart.length}</span>
            {cart.length > 0 && (
              <span className="font-mono text-sm">({calculateTotal().toFixed(2)}€)</span>
            )}
          </button>
        </div>
        
        {/* Categories */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 font-mono text-sm whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-green-600 text-white'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-auto p-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-400 font-mono">Keine Artikel in dieser Kategorie</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => openItemDetail(item)}
                className="bg-neutral-900 border border-neutral-700 p-4 text-left hover:border-green-500 transition-colors"
              >
                <p className="font-anton text-lg leading-tight">{item.name}</p>
                <p className="font-mono text-sm text-green-400 mt-2">{item.price.toFixed(2)}€</p>
                {item.addons && item.addons.length > 0 && (
                  <p className="font-mono text-xs text-neutral-500 mt-1">
                    +{item.addons.length} Extras
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 bg-black/80 z-50" onClick={() => setShowCart(false)}>
          <div 
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-neutral-900 border-l border-neutral-700 overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-neutral-700 flex items-center justify-between">
              <h2 className="font-anton text-xl">BESTELLUNG</h2>
              <button onClick={() => setShowCart(false)} className="p-2">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4">
              {cart.length === 0 ? (
                <p className="text-neutral-400 font-mono text-center py-8">Warenkorb leer</p>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="bg-neutral-800 border border-neutral-700 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-anton">{item.item_name}</p>
                          <p className="font-mono text-xs text-neutral-400">{item.course}</p>
                          {item.addons.length > 0 && (
                            <p className="font-mono text-xs text-green-400 mt-1">
                              +{item.addons.map(a => a.name).join(', ')}
                            </p>
                          )}
                          {item.note && (
                            <p className="font-mono text-xs text-yellow-400 mt-1">
                              *{item.note}
                            </p>
                          )}
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateCartItemQuantity(item.id, -1)}
                            className="w-8 h-8 bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-anton w-8 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartItemQuantity(item.id, 1)}
                            className="w-8 h-8 bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="font-mono text-green-400">
                          {((item.price + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity).toFixed(2)}€
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-neutral-700 bg-neutral-900 sticky bottom-0">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-anton text-lg">GESAMT</span>
                  <span className="font-anton text-2xl text-green-400">{calculateTotal().toFixed(2)}€</span>
                </div>
                <button
                  onClick={submitOrder}
                  disabled={sending}
                  className="w-full bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 text-white font-anton text-lg py-4 flex items-center justify-center gap-3"
                >
                  {sending ? (
                    <span className="animate-pulse">SENDE...</span>
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      BON DRUCKEN
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TerminalPage;
