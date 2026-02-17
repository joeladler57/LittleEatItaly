import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Instagram, Facebook, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../App";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/yn5dt6ix_l1.png";
const CHEF_ICON = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/845efg67_kopf.png";

// TikTok icon component
const TikTok = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const Footer = () => {
  const [content, setContent] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await axios.get(`${API}/content`);
        setContent(response.data);
      } catch (e) {
        console.error("Failed to fetch content:", e);
      }
    };
    fetchContent();
  }, []);

  const footer = content?.footer || {};
  const marqueeText = footer.marquee_text || "AUTHENTISCH NEAPOLITANISCH • STREET VIBES • LITTLE EAT ITALY • HOLZOFEN • HANDGEMACHTER TEIG • ";
  const socialLinks = footer.social_links || [];

  const getSocialIcon = (platform) => {
    switch (platform) {
      case "instagram": return Instagram;
      case "facebook": return Facebook;
      case "tiktok": return TikTok;
      default: return Instagram;
    }
  };

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
              {socialLinks.filter(link => link.is_active && link.url).map((link) => {
                const IconComponent = getSocialIcon(link.platform);
                return (
                  <motion.a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`social-${link.platform}`}
                    className="p-2 border border-pizza-dark hover:border-pizza-red hover:text-pizza-red transition-colors"
                    whileHover={{ scale: 1.2, rotate: 5 }}
                  >
                    <IconComponent size={20} />
                  </motion.a>
                );
              })}
              {socialLinks.filter(link => link.is_active && link.url).length === 0 && (
                <>
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
                </>
              )}
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
