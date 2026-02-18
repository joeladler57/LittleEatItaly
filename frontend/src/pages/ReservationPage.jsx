import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import { CalendarDays, Clock, Users, User, Mail, Phone, Check, MessageSquare, ChevronDown } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

const CHEF_ICON = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/845efg67_kopf.png";

// Custom Dropdown Component for Safari compatibility
const CustomDropdown = ({ value, onChange, options, placeholder = "Auswählen...", disabled = false, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const selectedOption = options.find(opt => opt.value === value);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);
  
  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full bg-pizza-black border border-pizza-dark text-pizza-white p-3 font-mono text-left flex items-center justify-between ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-pizza-red cursor-pointer"
        }`}
      >
        <span className={selectedOption ? "text-pizza-white" : "text-neutral-500"}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-pizza-dark border border-pizza-dark max-h-60 overflow-y-auto shadow-xl">
          {options.length === 0 ? (
            <div className="p-3 text-neutral-500 font-mono text-sm">Keine Optionen verfügbar</div>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full p-3 text-left font-mono text-sm hover:bg-pizza-red/20 transition-colors ${
                  option.value === value ? "bg-pizza-red/30 text-pizza-white" : "text-neutral-300"
                }`}
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const ReservationPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: 2,
    notes: ""
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      const dates = generateAvailableDates();
      setAvailableDates(dates);
      if (dates.length > 0 && !formData.date) {
        setFormData(prev => ({ ...prev, date: dates[0].value }));
      }
    }
  }, [settings]);

  useEffect(() => {
    if (formData.date && settings) {
      const times = generateAvailableTimes(formData.date);
      setAvailableTimes(times);
      if (times.length > 0 && !formData.time) {
        setFormData(prev => ({ ...prev, time: times[0].value }));
      }
    }
  }, [formData.date, settings]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/shop/settings`);
      setSettings(response.data);
    } catch (e) {
      console.error("Failed to fetch settings:", e);
      toast.error("Fehler beim Laden der Einstellungen");
    } finally {
      setLoading(false);
    }
  };

  const generateAvailableDates = () => {
    if (!settings) return [];
    
    const dates = [];
    const maxDays = settings.max_reservation_days_ahead || 30;
    const today = new Date();
    const closedDays = settings.closed_days || [];
    
    for (let i = 1; i <= maxDays; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Check if date is a closed day
      if (closedDays.includes(dateStr)) continue;
      
      // Check if day of week has opening hours
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[date.getDay()];
      const hours = settings.opening_hours?.[dayName];
      
      if (hours?.open && hours?.close) {
        dates.push({
          value: dateStr,
          label: date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
        });
      }
    }
    
    return dates;
  };

  const generateAvailableTimes = (dateStr) => {
    if (!dateStr || !settings?.opening_hours) return [];
    
    const date = new Date(dateStr);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    const hours = settings.opening_hours[dayName];
    
    if (!hours?.open || !hours?.close) return [];
    
    const times = [];
    const [openHour, openMin] = hours.open.split(':').map(Number);
    let [closeHour, closeMin] = hours.close.split(':').map(Number);
    
    // Handle closing after midnight (e.g., 00:00 means midnight)
    if (closeHour === 0 && closeMin === 0) {
      closeHour = 24;
    } else if (closeHour < openHour) {
      closeHour += 24;
    }
    
    let currentHour = openHour;
    let currentMin = openMin;
    
    // Stop 1 hour before closing for reservations
    const lastReservationHour = closeHour - 1;
    
    while (currentHour < lastReservationHour || (currentHour === lastReservationHour && currentMin <= closeMin)) {
      const displayHour = currentHour >= 24 ? currentHour - 24 : currentHour;
      const timeStr = `${displayHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
      times.push({
        value: timeStr,
        label: `${timeStr} Uhr`
      });
      
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }
    
    return times;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.date || !formData.time) {
      toast.error("Bitte fülle alle Pflichtfelder aus");
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${API}/shop/reservations`, {
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        date: formData.date,
        time: formData.time,
        guests: formData.guests,
        notes: formData.notes
      });
      
      setResult(response.data);
      setSuccess(true);
    } catch (e) {
      console.error("Reservation failed:", e);
      toast.error(e.response?.data?.detail || "Reservierung fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pizza-black flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
          <img src={CHEF_ICON} alt="Loading" className="w-16 h-16" />
        </motion.div>
      </div>
    );
  }

  if (!settings?.reservation_enabled) {
    return (
      <div className="min-h-screen bg-pizza-black flex items-center justify-center px-4">
        <div className="text-center">
          <CalendarDays className="w-16 h-16 text-pizza-red mx-auto mb-4" />
          <h1 className="font-anton text-3xl text-pizza-white mb-2">RESERVIERUNG NICHT MÖGLICH</h1>
          <p className="font-mono text-neutral-400">Reservierungen sind derzeit leider nicht verfügbar.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-pizza-black pt-20">
        <div className="max-w-lg mx-auto px-4 mt-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-pizza-dark border border-pizza-red p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 bg-pizza-red/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-10 h-10 text-pizza-red" />
            </motion.div>
            
            <h2 className="font-anton text-3xl text-pizza-white mb-2">RESERVIERUNG EINGEGANGEN!</h2>
            <p className="font-mono text-neutral-400 mb-6">
              Reservierungsnummer: <span className="text-pizza-red font-bold">#{result?.reservation_number}</span>
            </p>
            
            <div className="bg-pizza-black/50 p-4 text-left mb-6">
              <p className="font-mono text-sm text-neutral-300 mb-4">
                Deine Reservierung wird geprüft. Du erhältst eine E-Mail sobald sie bestätigt wurde.
              </p>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex items-center gap-2 text-neutral-400">
                  <CalendarDays className="w-4 h-4 text-pizza-red" />
                  <span>{new Date(formData.date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-400">
                  <Clock className="w-4 h-4 text-pizza-red" />
                  <span>{formData.time} Uhr</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-400">
                  <Users className="w-4 h-4 text-pizza-red" />
                  <span>{formData.guests} {formData.guests === 1 ? 'Person' : 'Personen'}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-pizza-black/50 p-4 text-left mb-6">
              <p className="font-mono text-sm text-neutral-400">
                <strong className="text-pizza-white">Adresse:</strong><br />
                {settings?.restaurant_name || "Little Eat Italy"}<br />
                {settings?.restaurant_address || "Europastrasse 8, 57072 Siegen"}<br />
                Tel: {settings?.restaurant_phone || "0271 31924461"}
              </p>
            </div>
            
            <Button
              onClick={() => window.location.href = "/"}
              className="bg-pizza-red hover:bg-red-700 text-pizza-white font-anton tracking-wider rounded-none"
            >
              ZURÜCK ZUR STARTSEITE
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pizza-black pt-20 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-b from-pizza-dark to-pizza-black py-12">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <img src={CHEF_ICON} alt="Chef" className="w-12 h-12 mx-auto mb-4" />
            <h1 className="font-anton text-4xl sm:text-5xl tracking-wider text-pizza-white">
              TISCH <span className="text-pizza-red">RESERVIEREN</span>
            </h1>
            <p className="font-mono text-base text-neutral-400 mt-2">Sichere dir deinen Platz bei uns</p>
          </motion.div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-xl mx-auto px-4 mt-8">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-pizza-dark border border-pizza-dark p-6 sm:p-8"
        >
          {/* Date & Time */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div>
              <Label className="font-mono text-sm text-neutral-400 flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 text-pizza-red" />
                Datum *
              </Label>
              <CustomDropdown
                value={formData.date}
                onChange={(val) => {
                  setFormData({ ...formData, date: val, time: "" });
                }}
                options={availableDates}
                placeholder="Datum wählen..."
              />
            </div>
            
            <div>
              <Label className="font-mono text-sm text-neutral-400 flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-pizza-red" />
                Uhrzeit *
              </Label>
              <CustomDropdown
                value={formData.time}
                onChange={(val) => setFormData({ ...formData, time: val })}
                options={availableTimes}
                placeholder="Uhrzeit wählen..."
                disabled={!formData.date || availableTimes.length === 0}
              />
            </div>
          </div>

          {/* Guests */}
          <div className="mb-6">
            <Label className="font-mono text-sm text-neutral-400 flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-pizza-red" />
              Anzahl Personen *
            </Label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, guests: Math.max(1, formData.guests - 1) })}
                className="w-12 h-12 border border-pizza-dark hover:border-pizza-red text-pizza-white font-anton text-xl transition-colors"
              >
                -
              </button>
              <span className="font-anton text-3xl text-pizza-white w-16 text-center">{formData.guests}</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, guests: Math.min(20, formData.guests + 1) })}
                className="w-12 h-12 border border-pizza-dark hover:border-pizza-red text-pizza-white font-anton text-xl transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 mb-6">
            <div>
              <Label className="font-mono text-sm text-neutral-400 flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-pizza-red" />
                Name *
              </Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Dein Name"
                className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none"
              />
            </div>
            
            <div>
              <Label className="font-mono text-sm text-neutral-400 flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-pizza-red" />
                E-Mail *
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="deine@email.de"
                className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none"
              />
            </div>
            
            <div>
              <Label className="font-mono text-sm text-neutral-400 flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-pizza-red" />
                Telefon *
              </Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0123 456789"
                className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none"
              />
            </div>
            
            <div>
              <Label className="font-mono text-sm text-neutral-400 flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-pizza-red" />
                Anmerkungen
              </Label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Besondere Wünsche, Allergien, Anlass..."
                rows={3}
                className="w-full bg-pizza-black border border-pizza-dark focus:border-pizza-red text-pizza-white p-3 font-mono resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={submitting || !formData.date || !formData.time}
            className="w-full bg-pizza-red hover:bg-red-700 text-pizza-white font-anton text-lg tracking-wider py-6 rounded-none disabled:opacity-50"
          >
            {submitting ? "WIRD GESENDET..." : "RESERVIERUNG ANFRAGEN"}
          </Button>
          
          <p className="font-mono text-xs text-neutral-500 text-center mt-4">
            Du erhältst eine E-Mail sobald deine Reservierung bestätigt wurde.
          </p>
        </motion.form>
      </div>
    </div>
  );
};

export default ReservationPage;
