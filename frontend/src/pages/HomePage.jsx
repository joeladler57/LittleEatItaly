import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import DripBorder from "../components/DripBorder";
import GraffitiText from "../components/GraffitiText";
import MenuCard from "../components/MenuCard";
import { Button } from "../components/ui/button";
import { ChevronRight, Flame, Clock, MapPin } from "lucide-react";

const HomePage = () => {
  const [featuredItems, setFeaturedItems] = useState([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await axios.get(`${API}/menu/featured`);
        setFeaturedItems(response.data);
      } catch (e) {
        console.error("Failed to fetch featured items:", e);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div data-testid="home-page">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1601913463731-cfba9fd31ed3?q=85&w=1920&auto=format&fit=crop')`,
          }}
        >
          <div className="absolute inset-0 bg-pizza-black/80" />
        </div>

        {/* Graffiti Background Text */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <span className="absolute top-20 -left-10 font-anton text-[200px] text-pizza-white/[0.03] rotate-[-15deg]">
            PIZZA
          </span>
          <span className="absolute bottom-40 -right-20 font-anton text-[180px] text-pizza-red/[0.05] rotate-[10deg]">
            NAPOLI
          </span>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <GraffitiText
              text="LITTLE"
              className="font-anton text-5xl sm:text-7xl lg:text-9xl text-pizza-white tracking-wider"
            />
            <GraffitiText
              text="EAT"
              className="font-anton text-5xl sm:text-7xl lg:text-9xl text-pizza-red tracking-wider mx-2 sm:mx-4"
              delay={0.1}
            />
            <GraffitiText
              text="ITALY"
              className="font-anton text-5xl sm:text-7xl lg:text-9xl text-pizza-white tracking-wider"
              delay={0.2}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="font-mono text-base sm:text-lg text-pizza-muted mt-6 max-w-xl mx-auto"
          >
            Authentic Neapolitan pizza with urban soul. Wood-fired perfection from the streets of Naples.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/menu">
              <Button
                data-testid="view-menu-btn"
                className="bg-pizza-red hover:bg-red-700 text-pizza-white font-anton text-lg tracking-widest px-8 py-6 rounded-none glitch-hover"
              >
                VIEW MENU
                <ChevronRight className="ml-2" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                data-testid="find-us-btn"
                variant="outline"
                className="border-2 border-pizza-white text-pizza-white hover:bg-pizza-white hover:text-pizza-black font-anton text-lg tracking-widest px-8 py-6 rounded-none"
              >
                FIND US
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Drip Border */}
        <DripBorder color="#050505" className="absolute bottom-0 left-0 w-full" />
      </section>

      {/* Features Section */}
      <section className="py-24 bg-pizza-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Flame,
                title: "WOOD FIRED",
                description: "900°F oven for the perfect leopard-spotted crust",
              },
              {
                icon: Clock,
                title: "48HR DOUGH",
                description: "Slow fermented for authentic Neapolitan texture",
              },
              {
                icon: MapPin,
                title: "IMPORTED",
                description: "San Marzano tomatoes & Italian mozzarella",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="text-center p-8 border border-pizza-dark hover:border-pizza-red transition-colors group"
              >
                <feature.icon className="w-12 h-12 text-pizza-red mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-anton text-2xl tracking-wider text-pizza-white mb-2">
                  {feature.title}
                </h3>
                <p className="font-mono text-sm text-pizza-muted">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Menu Section */}
      <section className="py-24 bg-pizza-dark/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-anton text-4xl sm:text-5xl lg:text-6xl tracking-wider"
            >
              <span className="text-pizza-white">OUR</span>{" "}
              <span className="text-pizza-red">SIGNATURES</span>
            </motion.h2>
            <p className="font-mono text-base text-pizza-muted mt-4 max-w-lg mx-auto">
              Hand-picked favorites from our kitchen to your table
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredItems.map((item, index) => (
              <MenuCard key={item.id} item={item} index={index} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/menu">
              <Button
                data-testid="see-full-menu-btn"
                className="bg-transparent border-2 border-pizza-red text-pizza-red hover:bg-pizza-red hover:text-pizza-white font-anton text-lg tracking-widest px-8 py-6 rounded-none transition-all duration-300"
              >
                SEE FULL MENU
                <ChevronRight className="ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1581850518616-bcb8077a2336?q=85&w=1920&auto=format&fit=crop')`,
          }}
        >
          <div className="absolute inset-0 bg-pizza-black/90" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-anton text-4xl sm:text-5xl lg:text-6xl tracking-wider text-pizza-white mb-6">
              HUNGRY<span className="text-pizza-red">?</span>
            </h2>
            <p className="font-mono text-base sm:text-lg text-pizza-muted mb-8">
              Come visit us and taste the difference. Fresh ingredients, traditional recipes, urban vibes.
            </p>
            <Link to="/contact">
              <Button
                data-testid="visit-us-btn"
                className="bg-pizza-red hover:bg-red-700 text-pizza-white font-anton text-xl tracking-widest px-10 py-7 rounded-none glitch-hover"
              >
                VISIT US TODAY
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
