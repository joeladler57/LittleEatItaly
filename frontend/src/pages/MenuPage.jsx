import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import MenuCard from "../components/MenuCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const categories = [
  { id: "all", name: "ALL" },
  { id: "classic", name: "CLASSIC" },
  { id: "special", name: "SPECIAL" },
  { id: "vegetarian", name: "VEGETARIAN" },
  { id: "dessert", name: "DESSERT" },
];

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

        {/* Background Graffiti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <span className="absolute top-10 -right-20 font-anton text-[150px] text-pizza-red/[0.05] rotate-[15deg]">
            MENU
          </span>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-anton text-5xl sm:text-6xl lg:text-7xl tracking-wider"
          >
            <span className="text-pizza-white">OUR</span>{" "}
            <span className="text-pizza-red">MENU</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-mono text-base sm:text-lg text-pizza-muted mt-4 max-w-xl mx-auto"
          >
            From classic Neapolitan traditions to our signature urban creations
          </motion.p>
        </div>
      </section>

      {/* Menu Content */}
      <section className="py-16 bg-pizza-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Tabs */}
          <Tabs
            defaultValue="all"
            value={activeCategory}
            onValueChange={setActiveCategory}
            className="w-full"
          >
            <TabsList className="flex flex-wrap justify-center gap-2 mb-12 bg-transparent">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  data-testid={`category-tab-${category.id}`}
                  className={`font-anton text-sm sm:text-base tracking-widest px-4 sm:px-6 py-3 rounded-none border-2 transition-all duration-300 ${
                    activeCategory === category.id
                      ? "bg-pizza-red border-pizza-red text-pizza-white"
                      : "bg-transparent border-pizza-dark text-pizza-muted hover:border-pizza-red hover:text-pizza-white"
                  }`}
                >
                  {category.name}
                </TabsTrigger>
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
                  <p className="font-mono text-pizza-muted">No items found in this category.</p>
                </div>
              ) : (
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
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
      <section className="py-16 bg-pizza-dark/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-anton text-3xl sm:text-4xl tracking-wider text-pizza-white mb-4">
              CAN'T DECIDE<span className="text-pizza-red">?</span>
            </h2>
            <p className="font-mono text-base text-pizza-muted">
              Our staff favorites include the Margherita for purists, Diavola for heat seekers, and Funghi Porcini for the adventurous.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default MenuPage;
