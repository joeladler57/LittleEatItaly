import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import ReactMarkdown from "react-markdown";

const ImpressumPage = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await axios.get(`${API}/impressum`);
        setContent(response.data);
      } catch (e) {
        console.error("Failed to fetch impressum:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-pizza-black flex items-center justify-center pt-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-pizza-red border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div data-testid="impressum-page" className="min-h-screen pt-20 bg-pizza-black">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-pizza-dark/30" />
        
        {/* Drip decorations */}
        <motion.div
          className="absolute top-0 left-1/4 w-2 bg-pizza-red rounded-b-full"
          initial={{ height: 0 }}
          animate={{ height: 60 }}
          transition={{ duration: 1, delay: 0.2 }}
        />
        <motion.div
          className="absolute top-0 right-1/3 w-1 bg-pizza-white/30 rounded-b-full"
          initial={{ height: 0 }}
          animate={{ height: 90 }}
          transition={{ duration: 1, delay: 0.4 }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-anton text-5xl sm:text-6xl lg:text-7xl tracking-wider"
          >
            <span className="text-pizza-red">{content?.title || "IMPRESSUM"}</span>
          </motion.h1>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-pizza-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="prose prose-invert max-w-none"
          >
            <div className="font-mono text-sm sm:text-base text-neutral-200 leading-relaxed space-y-6 impressum-content">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="font-anton text-3xl text-pizza-red tracking-wider mt-8 mb-4">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="font-anton text-2xl text-pizza-red tracking-wider mt-8 mb-4">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="font-anton text-xl text-pizza-white tracking-wider mt-6 mb-3">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="font-mono text-neutral-200 mb-4 leading-relaxed">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold text-pizza-red">{children}</strong>
                  ),
                  a: ({ href, children }) => (
                    <a href={href} className="text-pizza-red hover:underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-2 mb-4">{children}</ul>
                  ),
                  li: ({ children }) => (
                    <li className="text-neutral-200">{children}</li>
                  ),
                }}
              >
                {content?.content || ""}
              </ReactMarkdown>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ImpressumPage;
