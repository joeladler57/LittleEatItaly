import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import MenuCard from "../components/MenuCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const categories = [
  { id: "all", name: "ALLE" },
  { id: "classic", name: "KLASSISCH" },
  { id: "special", name: "SPEZIAL" },
  { id: "vegetarian", name: "VEGETARISCH" },
  { id: "dessert", name: "DESSERT" },
];

const LOGO_URL = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/yn5dt6ix_l1.png";

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axios.get(`${API}/menu`);
        setMenuItems(response.data);
      } catch (e) {
        console.error("Failed to fetch menu:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const filteredItems =
    activeCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory);

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

        {/* Background Graffiti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.span
            initial={{ opacity: 0, rotate: 20 }}
            animate={{ opacity: 0.05, rotate: 15 }}
            transition={{ duration: 1 }}
            className="absolute top-10 -right-20 font-anton text-[150px] text-pizza-red"
          >
            MENÜ
          </motion.span>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="font-anton text-5xl sm:text-6xl lg:text-7xl tracking-wider"
          >
            <span className="text-pizza-white">UNSERE</span>{" "}
            <motion.span
              className="text-pizza-red inline-block"
              animate={{ 
                textShadow: ["0 0 0px #FF1F1F", "0 0 15px #FF1F1F", "0 0 0px #FF1F1F"],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              SPEISEKARTE
            </motion.span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-mono text-base sm:text-lg text-neutral-200 mt-4 max-w-xl mx-auto"
          >
            Von klassischen neapolitanischen Traditionen bis zu unseren einzigartigen urbanen Kreationen
          </motion.p>
        </div>
      </section>

      {/* Menu Content */}
      <section className="py-16 bg-pizza-black relative">
        {/* Background drips */}
        <div className="absolute top-0 left-10 w-1 h-20 bg-pizza-red/20 rounded-b-full" />
        <div className="absolute top-0 right-1/4 w-2 h-32 bg-pizza-white/10 rounded-b-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Tabs */}
          <Tabs
            defaultValue="all"
            value={activeCategory}
            onValueChange={setActiveCategory}
            className="w-full"
          >
            <TabsList className="flex flex-wrap justify-center gap-2 mb-12 bg-transparent">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <TabsTrigger
                    value={category.id}
                    data-testid={`category-tab-${category.id}`}
                    className={`font-anton text-sm sm:text-base tracking-widest px-4 sm:px-6 py-3 rounded-none border-2 transition-all duration-300 ${
                      activeCategory === category.id
                        ? "bg-pizza-red border-pizza-red text-pizza-white"
                        : "bg-transparent border-pizza-dark text-neutral-300 hover:border-pizza-red hover:text-pizza-white"
                    }`}
                  >
                    {category.name}
                  </TabsTrigger>
                </motion.div>
              ))}
            </TabsList>

            <TabsContent value={activeCategory} className="mt-0">
              {loading ? (
                <div className="flex justify-center py-20">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-pizza-red border-t-transparent rounded-full"
                  />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-20">
                  <p className="font-mono text-neutral-300">Keine Artikel in dieser Kategorie gefunden.</p>
                </div>
              ) : (
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {filteredItems.map((item, index) => (
                    <MenuCard key={item.id} item={item} index={index} />
                  ))}
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-pizza-dark/30 relative overflow-hidden">
        {/* Drip decoration */}
        <motion.div
          className="absolute top-0 left-1/2 w-2 bg-pizza-red rounded-b-full"
          initial={{ height: 0 }}
          whileInView={{ height: 60 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-anton text-3xl sm:text-4xl tracking-wider text-pizza-white mb-4">
              KANNST DICH NICHT ENTSCHEIDEN<span className="text-pizza-red">?</span>
            </h2>
            <p className="font-mono text-base text-neutral-300">
              Unsere Favoriten sind die Margherita für Puristen, Diavola für Schärfe-Fans und Funghi Porcini für Abenteurer.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default MenuPage;
