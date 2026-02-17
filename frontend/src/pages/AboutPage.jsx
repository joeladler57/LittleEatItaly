import { motion } from "framer-motion";
import DripBorder from "../components/DripBorder";

const AboutPage = () => {
  const stats = [
    { number: "2015", label: "ESTABLISHED" },
    { number: "48", label: "HOUR DOUGH" },
    { number: "900°", label: "OVEN TEMP" },
    { number: "100%", label: "IMPORTED" },
  ];

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

        {/* Background Text */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <span className="absolute top-20 -left-10 font-anton text-[200px] text-pizza-white/[0.02] rotate-[-10deg]">
            STORY
          </span>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-anton text-5xl sm:text-6xl lg:text-7xl tracking-wider"
          >
            <span className="text-pizza-white">OUR</span>{" "}
            <span className="text-pizza-red">STORY</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-mono text-base sm:text-lg text-pizza-muted mt-4 max-w-xl mx-auto"
          >
            From Naples with love, to the streets with passion
          </motion.p>
        </div>

        <DripBorder color="#050505" className="absolute bottom-0 left-0 w-full" />
      </section>

      {/* Story Section */}
      <section className="py-24 bg-pizza-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=85&w=800&auto=format&fit=crop"
                  alt="Pizza making"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 border-2 border-pizza-red translate-x-4 translate-y-4 -z-10" />
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-anton text-4xl sm:text-5xl tracking-wider text-pizza-white mb-8">
                BORN IN <span className="text-pizza-red">NAPLES</span>
              </h2>
              <div className="space-y-6 font-mono text-base text-pizza-muted leading-relaxed">
                <p>
                  Little Eat Italy started with a simple dream: bring the authentic taste of 
                  Neapolitan pizza to the urban streets. Our founder, Marco Rossi, grew up 
                  watching his grandmother knead dough in their family kitchen in Naples.
                </p>
                <p>
                  In 2015, he opened our first location in a converted garage, armed with 
                  nothing but a wood-fired oven imported from Italy and recipes passed down 
                  through four generations. The graffiti-covered walls weren't part of the 
                  original plan – they came from local street artists who paid for their 
                  pizzas in art.
                </p>
                <p>
                  Today, those walls tell our story. We're not just a pizzeria – we're a 
                  canvas for urban culture, a meeting point for dreamers, and above all, 
                  a place where every pizza is a masterpiece.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-pizza-red">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="font-anton text-4xl sm:text-5xl text-pizza-black">
                  {stat.number}
                </div>
                <div className="font-mono text-xs sm:text-sm text-pizza-black/70 tracking-widest mt-2">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 bg-pizza-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <h2 className="font-anton text-4xl sm:text-5xl tracking-wider text-pizza-white mb-8">
                OUR <span className="text-pizza-red">PHILOSOPHY</span>
              </h2>
              <div className="space-y-6">
                {[
                  {
                    title: "AUTHENTICITY",
                    description: "Every ingredient is sourced from Italy. San Marzano tomatoes, buffalo mozzarella, 00 flour – no compromises."
                  },
                  {
                    title: "CRAFTSMANSHIP",
                    description: "Our dough ferments for 48 hours minimum. Our oven burns at 900°F. This is not fast food – it's art."
                  },
                  {
                    title: "COMMUNITY",
                    description: "We believe pizza brings people together. Our doors are open to everyone – artists, musicians, families, dreamers."
                  }
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="border-l-2 border-pizza-red pl-6"
                  >
                    <h3 className="font-anton text-xl tracking-wider text-pizza-red mb-2">
                      {item.title}
                    </h3>
                    <p className="font-mono text-sm text-pizza-muted">
                      {item.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative order-1 lg:order-2"
            >
              <div className="relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=85&w=800&auto=format&fit=crop"
                  alt="Pizza oven"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 border-2 border-pizza-red -translate-x-4 translate-y-4 -z-10" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Quote */}
      <section className="py-24 bg-pizza-dark/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="font-anton text-6xl text-pizza-red mb-8">"</div>
            <blockquote className="font-anton text-2xl sm:text-3xl lg:text-4xl tracking-wider text-pizza-white leading-relaxed">
              PIZZA IS NOT JUST FOOD.<br />
              IT'S A <span className="text-pizza-red">LANGUAGE</span>.
            </blockquote>
            <cite className="block font-mono text-sm text-pizza-muted mt-8">
              — MARCO ROSSI, FOUNDER
            </cite>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
