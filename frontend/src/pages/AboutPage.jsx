import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import DripBorder from "../components/DripBorder";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/yn5dt6ix_l1.png";
const CHEF_ICON = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/845efg67_kopf.png";

const AboutPage = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await axios.get(`${API}/content`);
      setContent(res.data.about || {});
    } catch (e) {
      console.error("Error fetching content:", e);
    } finally {
      setLoading(false);
    }
  };

  // Default values if not set in admin
  const stats = content?.stats || [
    { number: "2015", label: "GEGRÜNDET" },
    { number: "48", label: "STUNDEN TEIG" },
    { number: "480°", label: "OFENTEMP." },
    { number: "100%", label: "IMPORTIERT" },
  ];

  const storyTitle = content?.story_title || "GEBOREN IN NEAPEL";
  const storyText = content?.story_text || `Little Eat Italy begann mit einem einfachen Traum: den authentischen Geschmack der neapolitanischen Pizza auf die urbanen Straßen zu bringen. Unser Gründer, Marco Rossi, wuchs auf und sah seiner Großmutter beim Teigkneten in ihrer Familienküche in Neapel zu.

2015 eröffnete er unser erstes Lokal in einer umgebauten Garage, ausgestattet mit nichts als einem aus Italien importierten Holzofen und Rezepten, die über vier Generationen weitergegeben wurden. Die mit Graffiti bedeckten Wände waren nicht Teil des ursprünglichen Plans – sie kamen von lokalen Straßenkünstlern, die für ihre Pizzen mit Kunst bezahlten.

Heute erzählen diese Wände unsere Geschichte. Wir sind nicht nur eine Pizzeria – wir sind eine Leinwand für urbane Kultur, ein Treffpunkt für Träumer und vor allem ein Ort, an dem jede Pizza ein Meisterwerk ist.`;
  const storyImage = content?.story_image || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=85&w=800&auto=format&fit=crop";

  const philosophy = content?.philosophy || [
    {
      title: "AUTHENTIZITÄT",
      description: "Jede Zutat stammt aus Italien. San Marzano Tomaten, Büffelmozzarella, 00-Mehl – keine Kompromisse."
    },
    {
      title: "HANDWERKSKUNST",
      description: "Unser Teig fermentiert mindestens 48 Stunden. Unser Ofen brennt bei 480°C. Das ist kein Fast Food – das ist Kunst."
    },
    {
      title: "GEMEINSCHAFT",
      description: "Wir glauben, dass Pizza Menschen zusammenbringt. Unsere Türen stehen allen offen – Künstlern, Musikern, Familien, Träumern."
    }
  ];

  const quoteText = content?.quote_text || "PIZZA IST NICHT NUR ESSEN. ES IST EINE SPRACHE.";
  const quoteAuthor = content?.quote_author || "MARCO ROSSI, GRÜNDER";

  const storyParagraphs = storyText.split('\n\n').filter(p => p.trim());

  return (
    <div data-testid="about-page" className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1607367502636-28fca0fef0d5?q=85&w=1920&auto=format&fit=crop')`,
          }}
        >
          <div className="absolute inset-0 bg-pizza-black/85" />
        </div>

        {/* Drip decorations */}
        <motion.div
          className="absolute top-0 left-1/4 w-3 bg-pizza-red rounded-b-full"
          initial={{ height: 0 }}
          animate={{ height: 100 }}
          transition={{ duration: 1, delay: 0.3 }}
        />
        <motion.div
          className="absolute top-0 right-1/3 w-2 bg-pizza-white/40 rounded-b-full"
          initial={{ height: 0 }}
          animate={{ height: 140 }}
          transition={{ duration: 1, delay: 0.5 }}
        />

        {/* Background Text */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.span
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 0.02, x: 0 }}
            transition={{ duration: 1 }}
            className="absolute top-20 -left-10 font-anton text-[200px] text-pizza-white rotate-[-10deg]"
          >
            STORY
          </motion.span>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.img
            src={CHEF_ICON}
            alt="Chef"
            className="h-20 w-auto mx-auto mb-6"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
          />
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
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
              GESCHICHTE
            </motion.span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-mono text-base sm:text-lg text-neutral-200 mt-4 max-w-xl mx-auto"
          >
            Von Neapel mit Liebe, auf die Straßen mit Leidenschaft
          </motion.p>
        </div>

        <DripBorder color="#050505" className="absolute bottom-0 left-0 w-full" />
      </section>

      {/* Story Section */}
      <section className="py-24 bg-pizza-black relative">
        {/* Drip decorations */}
        <div className="absolute top-0 right-20 w-1 h-16 bg-pizza-red/30 rounded-b-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -50, rotate: -5 }}
              whileInView={{ opacity: 1, x: 0, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative overflow-hidden">
                <motion.img
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=85&w=800&auto=format&fit=crop"
                  alt="Pizza making"
                  className="w-full h-[500px] object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                />
                <motion.div
                  className="absolute inset-0 border-2 border-pizza-red translate-x-4 translate-y-4 -z-10"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                />
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="font-anton text-4xl sm:text-5xl tracking-wider text-pizza-white mb-8">
                {storyTitle.split(' ').map((word, i) => (
                  <span key={i} className={i === storyTitle.split(' ').length - 1 ? "text-pizza-red" : ""}>
                    {word}{" "}
                  </span>
                ))}
              </h2>
              <div className="space-y-6 font-mono text-base text-neutral-200 leading-relaxed">
                {storyParagraphs.map((paragraph, index) => (
                  <motion.p
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.2 }}
                  >
                    {paragraph}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-pizza-red relative overflow-hidden">
        {/* Drip decoration from top */}
        <div className="absolute -top-1 left-1/4 w-4 h-8 bg-pizza-black rounded-b-full" />
        <div className="absolute -top-1 right-1/3 w-2 h-12 bg-pizza-black rounded-b-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                whileHover={{ scale: 1.1 }}
                className="text-center"
              >
                <motion.div
                  className="font-anton text-4xl sm:text-5xl text-pizza-black"
                  animate={{ 
                    textShadow: ["0 0 0px #000", "0 0 5px #000", "0 0 0px #000"],
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                >
                  {stat.number}
                </motion.div>
                <div className="font-mono text-xs sm:text-sm text-pizza-black/70 tracking-widest mt-2">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 bg-pizza-black relative">
        {/* Drip decorations */}
        <div className="absolute top-0 left-16 w-2 h-24 bg-pizza-red/20 rounded-b-full" />
        <div className="absolute top-0 right-1/4 w-1 h-16 bg-pizza-white/10 rounded-b-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <h2 className="font-anton text-4xl sm:text-5xl tracking-wider text-pizza-white mb-8">
                UNSERE <span className="text-pizza-red">PHILOSOPHIE</span>
              </h2>
              <div className="space-y-6">
                {[
                  {
                    title: "AUTHENTIZITÄT",
                    description: "Jede Zutat stammt aus Italien. San Marzano Tomaten, Büffelmozzarella, 00-Mehl – keine Kompromisse."
                  },
                  {
                    title: "HANDWERKSKUNST",
                    description: "Unser Teig fermentiert mindestens 48 Stunden. Unser Ofen brennt bei 480°C. Das ist kein Fast Food – das ist Kunst."
                  },
                  {
                    title: "GEMEINSCHAFT",
                    description: "Wir glauben, dass Pizza Menschen zusammenbringt. Unsere Türen stehen allen offen – Künstlern, Musikern, Familien, Träumern."
                  }
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 }}
                    whileHover={{ x: 10 }}
                    className="border-l-2 border-pizza-red pl-6 transition-all duration-300"
                  >
                    <h3 className="font-anton text-xl tracking-wider text-pizza-red mb-2">
                      {item.title}
                    </h3>
                    <p className="font-mono text-sm text-neutral-200">
                      {item.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotate: 5 }}
              whileInView={{ opacity: 1, x: 0, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative order-1 lg:order-2"
            >
              <div className="relative overflow-hidden">
                <motion.img
                  src="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=85&w=800&auto=format&fit=crop"
                  alt="Pizza oven"
                  className="w-full h-[500px] object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                />
                <motion.div
                  className="absolute inset-0 border-2 border-pizza-red -translate-x-4 translate-y-4 -z-10"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Quote */}
      <section className="py-24 bg-pizza-dark/30 relative overflow-hidden">
        {/* Drip decoration */}
        <motion.div
          className="absolute top-0 left-1/2 w-3 bg-pizza-red rounded-b-full"
          initial={{ height: 0 }}
          whileInView={{ height: 80 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="font-anton text-6xl text-pizza-red mb-8"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              "
            </motion.div>
            <blockquote className="font-anton text-2xl sm:text-3xl lg:text-4xl tracking-wider text-pizza-white leading-relaxed">
              PIZZA IST NICHT NUR ESSEN.<br />
              ES IST EINE <motion.span
                className="text-pizza-red inline-block"
                animate={{ 
                  textShadow: ["0 0 0px #FF1F1F", "0 0 20px #FF1F1F", "0 0 0px #FF1F1F"],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >SPRACHE</motion.span>.
            </blockquote>
            <cite className="block font-mono text-sm text-neutral-300 mt-8">
              — MARCO ROSSI, GRÜNDER
            </cite>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
