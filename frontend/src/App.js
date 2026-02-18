import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster } from "./components/ui/sonner";
import { motion, AnimatePresence } from "framer-motion";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import NoiseOverlay from "./components/NoiseOverlay";

// Pages
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import ImpressumPage from "./pages/ImpressumPage";
import AdminPage from "./pages/AdminPage";
import OrderPage from "./pages/OrderPage";
import ReservationPage from "./pages/ReservationPage";
import ShopAdminPage from "./pages/ShopAdminPage";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Page transition wrapper
const PageWrapper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
};

// Animated routes component
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
        <Route path="/menu" element={<PageWrapper><MenuPage /></PageWrapper>} />
        <Route path="/about" element={<PageWrapper><AboutPage /></PageWrapper>} />
        <Route path="/contact" element={<PageWrapper><ContactPage /></PageWrapper>} />
        <Route path="/impressum" element={<PageWrapper><ImpressumPage /></PageWrapper>} />
        <Route path="/admin" element={<PageWrapper><AdminPage /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Seed data on first load
    const seedData = async () => {
      try {
        await axios.post(`${API}/seed`);
      } catch (e) {
        console.log("Seed endpoint called");
      }
      setIsLoaded(true);
    };
    seedData();
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-pizza-black flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-pizza-red font-anton text-4xl"
        >
          LOADING...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="App min-h-screen bg-pizza-black text-pizza-white">
      <NoiseOverlay />
      <BrowserRouter>
        <Navbar />
        <main>
          <AnimatedRoutes />
        </main>
        <Footer />
      </BrowserRouter>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#262626',
            color: '#FAFAFA',
            border: '1px solid #FF1F1F',
          },
        }}
      />
    </div>
  );
}

export default App;
