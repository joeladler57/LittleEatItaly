import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import { Flame, Leaf, WheatOff, AlertCircle } from "lucide-react";

const CHEF_ICON = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/845efg67_kopf.png";

// Tag icons and colors
const tagConfig = {
  HOT: { icon: Flame, color: "text-orange-500", bg: "bg-orange-500/20", label: "Scharf" },
  VEGETARIAN: { icon: Leaf, color: "text-green-500", bg: "bg-green-500/20", label: "Vegetarisch" },
  VEGAN: { icon: Leaf, color: "text-green-600", bg: "bg-green-600/20", label: "Vegan" },
  GLUTEN_FREE: { icon: WheatOff, color: "text-yellow-500", bg: "bg-yellow-500/20", label: "Glutenfrei" },
  HALAL: { icon: null, color: "text-blue-400", bg: "bg-blue-400/20", label: "Halal" },
  NUT_FREE: { icon: null, color: "text-amber-500", bg: "bg-amber-500/20", label: "Nussfrei" },
  DAIRY_FREE: { icon: null, color: "text-cyan-500", bg: "bg-cyan-500/20", label: "Laktosefrei" },
};

const MenuPage = () => {
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axios.get(`${API}/globalfood/menu`);
        setMenuData(response.data);
        // Set first category as active
        if (response.data?.categories?.length > 0) {
          setActiveCategory(response.data.categories[0].id);
        }
      } catch (e) {
        console.error("Failed to fetch menu:", e);
        setError("Menü konnte nicht geladen werden. Bitte versuche es später erneut.");
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const categories = menuData?.categories || [];
  const activeItems = categories.find(c => c.id === activeCategory)?.items || [];
  const currency = menuData?.currency || "EUR";

  const formatPrice = (price) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  return (
    <div data-testid="menu-page" className="min-h-screen pt-20">
      {/* Hero Banner */}
      <section className="relative py-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1513104890138-7c749659a591?q=85&w=1920&auto=format&fit=crop')`,
          }}
        >
          <div className="absolute inset-0 bg-pizza-black/85" />
        </div>

        {/* Drip decorations */}
        <motion.div
          className="absolute top-0 left-20 w-2 bg-pizza-red rounded-b-full"
          initial={{ height: 0 }}
          animate={{ height: 80 }}
          transition={{ duration: 1, delay: 0.2 }}
        />
        <motion.div
          className="absolute top-0 right-32 w-3 bg-pizza-white/30 rounded-b-full"
          initial={{ height: 0 }}
          animate={{ height: 120 }}
          transition={{ duration: 1, delay: 0.4 }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.img
            src={CHEF_ICON}
            alt="Chef"
            className="h-16 w-auto mx-auto mb-4"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
          />
          <motion.h1
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="font-anton text-5xl sm:text-6xl lg:text-7xl tracking-wider"
          >
            <span className="text-pizza-white">UNSER</span>{" "}
            <motion.span
              className="text-pizza-red inline-block"
              animate={{ 
                textShadow: ["0 0 0px #FF1F1F", "0 0 15px #FF1F1F", "0 0 0px #FF1F1F"],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              MENÜ
            </motion.span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-mono text-base sm:text-lg text-neutral-200 mt-4 max-w-xl mx-auto"
          >
            Authentische neapolitanische Pizza & mehr
          </motion.p>
        </div>
      </section>

      {/* Menu Content */}
      <section className="py-16 bg-pizza-black relative">
        <div className="absolute top-0 left-10 w-1 h-20 bg-pizza-red/20 rounded-b-full" />
        <div className="absolute top-0 right-1/4 w-2 h-32 bg-pizza-white/10 rounded-b-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-pizza-red border-t-transparent rounded-full"
              />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <AlertCircle className="w-16 h-16 text-pizza-red mx-auto mb-4" />
              <p className="font-mono text-neutral-300">{error}</p>
            </div>
          ) : (
            <>
              {/* Category Tabs */}
              <div className="flex flex-wrap justify-center gap-2 mb-12">
                {categories.map((category, index) => (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveCategory(category.id)}
                    data-testid={`category-tab-${category.id}`}
                    className={`font-anton text-sm sm:text-base tracking-widest px-4 sm:px-6 py-3 border-2 transition-all duration-300 ${
                      activeCategory === category.id
                        ? "bg-pizza-red border-pizza-red text-pizza-white"
                        : "bg-transparent border-pizza-dark text-neutral-300 hover:border-pizza-red hover:text-pizza-white"
                    }`}
                  >
                    {category.name}
                  </motion.button>
                ))}
              </div>

              {/* Menu Items */}
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {activeItems.map((item, index) => (
                  <MenuItemCard 
                    key={item.id} 
                    item={item} 
                    index={index} 
                    formatPrice={formatPrice}
                  />
                ))}
              </motion.div>

              {activeItems.length === 0 && (
                <div className="text-center py-20">
                  <p className="font-mono text-neutral-400">Keine Artikel in dieser Kategorie.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Order CTA */}
      <section className="py-16 bg-pizza-dark/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-anton text-3xl sm:text-4xl tracking-wider text-pizza-white mb-4">
              HUNGRIG<span className="text-pizza-red">?</span>
            </h2>
            <p className="font-mono text-base text-neutral-300 mb-6">
              Bestelle jetzt und hol deine Pizza frisch bei uns ab!
            </p>
            <motion.a
              href="https://www.foodbooking.com/api/fb/_q_y4z_v"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="menu-order-btn"
              whileHover={{ scale: 1.05, skewX: -2 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-8 py-5 bg-pizza-red hover:bg-red-700 text-pizza-white font-anton text-xl tracking-widest transition-all duration-300"
            >
              <ShoppingBag className="w-6 h-6" />
              BESTELLEN ZUM ABHOLEN
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

// Menu Item Card Component
const MenuItemCard = ({ item, index, formatPrice }) => {
  const [showDetails, setShowDetails] = useState(false);
  const tags = item.tags || [];
  const sizes = item.sizes || [];
  const hasMultipleSizes = sizes.length > 0;
  const defaultPrice = hasMultipleSizes 
    ? sizes.find(s => s.default)?.price || sizes[0]?.price || item.price
    : item.price;

  return (
    <motion.div
      data-testid={`menu-item-${item.id}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="glass-card p-6 group"
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          {/* Item Name */}
          <h3 className="font-anton text-xl tracking-wider text-pizza-white group-hover:text-pizza-red transition-colors">
            {item.name}
          </h3>
          
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => {
                const config = tagConfig[tag];
                if (!config) return null;
                const IconComponent = config.icon;
                return (
                  <span 
                    key={tag}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono ${config.bg} ${config.color} rounded`}
                  >
                    {IconComponent && <IconComponent className="w-3 h-3" />}
                    {config.label}
                  </span>
                );
              })}
            </div>
          )}
          
          {/* Description */}
          {item.description && (
            <p className="font-mono text-sm text-neutral-300 mt-3 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Sizes */}
          {hasMultipleSizes && (
            <div className="mt-3 space-y-1">
              {sizes.map((size) => (
                <div key={size.id} className="flex justify-between items-center font-mono text-sm">
                  <span className="text-neutral-400">{size.name}</span>
                  <span className="text-pizza-red">{formatPrice(size.price)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Option Groups - Collapsed */}
          {item.groups && item.groups.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="font-mono text-xs text-pizza-red hover:underline"
              >
                {showDetails ? "Optionen ausblenden" : `+ ${item.groups.length} Optionen verfügbar`}
              </button>
              
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2 space-y-3"
                >
                  {item.groups.map((group) => (
                    <div key={group.id} className="border-l-2 border-pizza-dark pl-3">
                      <p className="font-mono text-xs text-neutral-400 mb-1">
                        {group.name} {group.required && <span className="text-pizza-red">*</span>}
                      </p>
                      <div className="space-y-1">
                        {group.options?.map((option) => (
                          <div key={option.id} className="flex justify-between font-mono text-xs">
                            <span className="text-neutral-300">{option.name}</span>
                            {option.price > 0 && (
                              <span className="text-neutral-400">+{formatPrice(option.price)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Price */}
        {!hasMultipleSizes && (
          <motion.div
            className="font-anton text-2xl text-pizza-red whitespace-nowrap"
            animate={{ 
              textShadow: ["0 0 0px #FF1F1F", "0 0 8px #FF1F1F", "0 0 0px #FF1F1F"],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {formatPrice(defaultPrice)}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default MenuPage;
