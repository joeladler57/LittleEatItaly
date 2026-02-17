import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Instagram, Facebook } from "lucide-react";

const Footer = () => {
  const marqueeText = "AUTHENTIC NAPOLETAN • STREET VIBES • LITTLE EAT ITALY • WOOD FIRED • HANDMADE DOUGH • ";

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
            <Link to="/" className="inline-block">
              <h3 className="font-anton text-3xl tracking-wider mb-4">
                <span className="text-pizza-white">LITTLE</span>
                <span className="text-pizza-red">EAT</span>
                <span className="text-pizza-white">ITALY</span>
              </h3>
            </Link>
            <p className="font-mono text-sm text-pizza-muted leading-relaxed">
              Born in the streets of Naples, raised in the heart of the city.
              Authentic Neapolitan pizza with an urban twist.
            </p>
            <div className="flex space-x-4 mt-6">
              <a
                href="#"
                data-testid="social-instagram"
                className="p-2 border border-pizza-dark hover:border-pizza-red hover:text-pizza-red transition-colors"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                data-testid="social-facebook"
                className="p-2 border border-pizza-dark hover:border-pizza-red hover:text-pizza-red transition-colors"
              >
                <Facebook size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-anton text-xl tracking-wider text-pizza-red mb-6">
              NAVIGATE
            </h4>
            <ul className="space-y-3">
              {[
                { name: "Home", path: "/" },
                { name: "Menu", path: "/menu" },
                { name: "About Us", path: "/about" },
                { name: "Contact", path: "/contact" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="font-mono text-sm text-pizza-muted hover:text-pizza-red transition-colors"
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
              FIND US
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-pizza-red mt-1 flex-shrink-0" />
                <span className="font-mono text-sm text-pizza-muted">
                  123 Pizza Street, Little Italy, NY 10001
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-pizza-red flex-shrink-0" />
                <span className="font-mono text-sm text-pizza-muted">
                  +1 (555) 123-4567
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-pizza-red flex-shrink-0" />
                <span className="font-mono text-sm text-pizza-muted">
                  ciao@littleeatitaly.com
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-pizza-dark flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-mono text-xs text-pizza-muted">
            © 2024 Little Eat Italy. All rights reserved.
          </p>
          <p className="font-mono text-xs text-pizza-muted">
            Made with <span className="text-pizza-red">♥</span> in NYC
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
