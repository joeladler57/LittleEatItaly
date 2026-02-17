import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import DripBorder from "../components/DripBorder";
import InstagramFeed from "../components/InstagramFeed";
import { Button } from "../components/ui/button";
import { Flame, Clock, MapPin, Utensils, Bike, ShoppingBag, CalendarDays, ExternalLink } from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/yn5dt6ix_l1.png";
const CHEF_ICON = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/845efg67_kopf.png";

// Default Maradona graffiti background
const DEFAULT_HERO_BG = "https://images.unsplash.com/photo-1760001484733-61cd5917f5c3?q=85&w=1920&auto=format&fit=crop";

// Icon mapping for buttons
const iconMap = {
  utensils: Utensils,
  bike: Bike,
  "shopping-bag": ShoppingBag,
  calendar: CalendarDays,
  flame: Flame,
  clock: Clock,
  "map-pin": MapPin,
};

const floatAnimation = {
  y: [0, -15, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

const HomePage = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/content`);
        setContent(response.data);
      } catch (e) {
        console.error("Failed to fetch data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get hero content with defaults
  const hero = content?.hero || {};
  const heroBackground = hero.background_image || DEFAULT_HERO_BG;
  const heroSubtitle = hero.subtitle || "Authentische neapolitanische Pizza mit urbaner Seele. Holzofenperfektion aus den Straßen von Neapel.";
  const heroButtons = hero.buttons || [];
  
  // Get features content with defaults
  const features = content?.features?.items || [
    { icon: "flame", title: "HOLZOFEN", description: "480°C Ofen für die perfekte, gefleckte Kruste" },
    { icon: "clock", title: "48 STD. TEIG", description: "Langsam fermentiert für authentische neapolitanische Textur" },
    { icon: "map-pin", title: "IMPORTIERT", description: "San Marzano Tomaten & italienischer Mozzarella" },
  ];

  // Get Instagram feed data
  const instagramFeed = content?.footer?.instagram_feed || { enabled: false, posts: [] };
  const instagramEnabled = instagramFeed.enabled !== false;
  const instagramPosts = instagramFeed.posts || [];
  const instagramUsername = instagramFeed.username || "";

  return (
    <div data-testid="home-page">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image - Maradona Graffiti */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${heroBackground}')`,
          }}
        >
          <div className="absolute inset-0 bg-pizza-black/75" />
        </div>

        {/* Animated Graffiti Background Text */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.span
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 0.03, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="absolute top-20 -left-10 font-anton text-[200px] text-pizza-white rotate-[-15deg]"
          >
            PIZZA
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 0.05, x: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="absolute bottom-40 -right-20 font-anton text-[180px] text-pizza-red rotate-[10deg]"
          >
            NAPOLI
          </motion.span>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Chef Icon with drip animation */}
          <motion.img
            src={CHEF_ICON}
            alt="Chef"
            className="h-24 sm:h-32 w-auto mx-auto mb-6"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            whileHover={{ scale: 1.1, rotate: 10 }}
          />

          {/* Main Logo */}
          <motion.img
            src={LOGO_URL}
            alt="Little Eat Italy"
            className="h-32 sm:h-48 lg:h-56 w-auto mx-auto mb-8"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="font-mono text-base sm:text-lg text-neutral-200 mt-6 max-w-xl mx-auto"
          >
            {heroSubtitle}
          </motion.p>

          {/* Action Buttons - Delivery Services */}
          {heroButtons.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-10 flex flex-wrap gap-3 justify-center"
            >
              {heroButtons.filter(btn => btn.is_active).map((button, index) => {
                const IconComponent = iconMap[button.icon] || ExternalLink;
                return (
                  <motion.a
                    key={button.id}
                    href={button.url}
                    target={button.url.startsWith('http') ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    data-testid={`action-btn-${button.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ scale: 1.05, skewX: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`inline-flex items-center gap-2 px-6 py-4 font-anton text-sm tracking-widest rounded-none transition-all duration-300 ${
                      button.id === 'reservation' 
                        ? 'bg-transparent border-2 border-pizza-white text-pizza-white hover:bg-pizza-white hover:text-pizza-black'
                        : 'bg-pizza-red hover:bg-red-700 text-pizza-white border-2 border-pizza-red'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    {button.label}
                  </motion.a>
                );
              })}
            </motion.div>
          )}

          {/* Floating drips decoration */}
          <div className="absolute bottom-20 left-1/4 hidden lg:block">
            <motion.div
              animate={floatAnimation}
              className="w-2 h-16 bg-pizza-red rounded-b-full opacity-60"
            />
          </div>
          <div className="absolute bottom-32 right-1/3 hidden lg:block">
            <motion.div
              animate={{ ...floatAnimation, transition: { ...floatAnimation.transition, delay: 0.5 } }}
              className="w-3 h-24 bg-pizza-white rounded-b-full opacity-40"
            />
          </div>
        </div>

        {/* Drip Border */}
        <DripBorder color="#050505" className="absolute bottom-0 left-0 w-full" />
      </section>

      {/* Features Section */}
      <section className="py-24 bg-pizza-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = iconMap[feature.icon] || Flame;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 50, rotate: -5 }}
                  whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="text-center p-8 border border-pizza-dark hover:border-pizza-red transition-all duration-300 group relative overflow-hidden"
                >
                  <motion.div
                    className="absolute top-0 left-1/2 w-1 bg-pizza-red"
                    initial={{ height: 0 }}
                    whileHover={{ height: "30px" }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <IconComponent className="w-12 h-12 text-pizza-red mx-auto mb-4" />
                  </motion.div>
                  <h3 className="font-anton text-2xl tracking-wider text-pizza-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="font-mono text-sm text-neutral-300">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Instagram Feed Section */}
      {instagramEnabled && instagramPosts.length > 0 && (
        <InstagramFeed posts={instagramPosts} username={instagramUsername} />
      )}

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

        <motion.div
          className="absolute top-0 left-1/4 w-3 bg-pizza-red rounded-b-full"
          initial={{ height: 0 }}
          whileInView={{ height: 100 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
        />
        <motion.div
          className="absolute top-0 right-1/3 w-2 bg-pizza-white/50 rounded-b-full"
          initial={{ height: 0 }}
          whileInView={{ height: 150 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.4 }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2
              className="font-anton text-4xl sm:text-5xl lg:text-6xl tracking-wider text-pizza-white mb-6"
              animate={{ 
                textShadow: ["0 0 0px #fff", "0 0 10px #fff", "0 0 0px #fff"],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              HUNGRIG<span className="text-pizza-red">?</span>
            </motion.h2>
            <p className="font-mono text-base sm:text-lg text-neutral-200 mb-8">
              Besuche uns und schmecke den Unterschied. Frische Zutaten, traditionelle Rezepte, urbane Vibes.
            </p>
            <motion.a
              href="https://www.foodbooking.com/api/res/_q_y4z_v"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, skewX: -3 }} 
              whileTap={{ scale: 0.95 }}
            >
              <Button
                data-testid="visit-us-btn"
                className="bg-pizza-red hover:bg-red-700 text-pizza-white font-anton text-xl tracking-widest px-10 py-7 rounded-none"
              >
                BESUCHE UNS HEUTE
              </Button>
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
