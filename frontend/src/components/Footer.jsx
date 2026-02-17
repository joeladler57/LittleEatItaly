import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Instagram, Facebook, Lock } from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/yn5dt6ix_l1.png";
const CHEF_ICON = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/845efg67_kopf.png";

const Footer = () => {
  const marqueeText = "AUTHENTISCH NEAPOLITANISCH • STREET VIBES • LITTLE EAT ITALY • HOLZOFEN • HANDGEMACHTER TEIG • ";

  return (
    <footer data-testid="footer" className="bg-pizza-black border-t border-pizza-dark">
      {/* Marquee */}
      <div className="overflow-hidden py-4 bg-pizza-red">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap"
        >
          {[...Array(4)].map((_, i) => (
            <span key={i} className="font-anton text-xl text-pizza-black mx-4">
              {marqueeText}
            </span>
          ))}
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <motion.img
                src={CHEF_ICON}
                alt="Little Eat Italy"
                className="h-14 w-auto"
                whileHover={{ rotate: 10 }}
              />
              <motion.img
                src={LOGO_URL}
                alt="Little Eat Italy"
                className="h-12 w-auto"
                whileHover={{ scale: 1.05 }}
              />
            </Link>
            <p className="font-mono text-sm text-neutral-300 leading-relaxed">
              Geboren auf den Straßen von Neapel, aufgewachsen im Herzen der Stadt.
              Authentische neapolitanische Pizza mit urbanem Twist.
            </p>
            <div className="flex space-x-4 mt-6">
              <motion.a
                href="#"
                data-testid="social-instagram"
                className="p-2 border border-pizza-dark hover:border-pizza-red hover:text-pizza-red transition-colors"
                whileHover={{ scale: 1.2, rotate: 5 }}
              >
                <Instagram size={20} />
              </motion.a>
              <motion.a
                href="#"
                data-testid="social-facebook"
                className="p-2 border border-pizza-dark hover:border-pizza-red hover:text-pizza-red transition-colors"
                whileHover={{ scale: 1.2, rotate: -5 }}
              >
                <Facebook size={20} />
              </motion.a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-anton text-xl tracking-wider text-pizza-red mb-6">
              NAVIGATION
            </h4>
            <ul className="space-y-3">
              {[
                { name: "Start", path: "/" },
                { name: "Menü", path: "/menu" },
                { name: "Über Uns", path: "/about" },
                { name: "Kontakt", path: "/contact" },
                { name: "Impressum", path: "/impressum" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="font-mono text-sm text-neutral-300 hover:text-pizza-red transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-anton text-xl tracking-wider text-pizza-red mb-6">
              HIER FINDEST DU UNS
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-pizza-red mt-1 flex-shrink-0" />
                <span className="font-mono text-sm text-neutral-300">
                  Pizzastraße 123, Little Italy, 10001
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-pizza-red flex-shrink-0" />
                <span className="font-mono text-sm text-neutral-300">
                  +49 (0) 123 456789
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-pizza-red flex-shrink-0" />
                <span className="font-mono text-sm text-neutral-300">
                  ciao@littleeatitaly.de
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-pizza-dark flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-mono text-xs text-neutral-400">
            © 2024 Little Eat Italy. Alle Rechte vorbehalten.
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              data-testid="admin-login-link"
              className="flex items-center gap-1 font-mono text-xs text-neutral-500 hover:text-pizza-red transition-colors"
            >
              <Lock className="w-3 h-3" />
              Admin
            </Link>
            <p className="font-mono text-xs text-neutral-400">
              Mit <span className="text-pizza-red">♥</span> gemacht
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
