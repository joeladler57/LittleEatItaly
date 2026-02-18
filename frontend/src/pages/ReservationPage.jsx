import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import { CalendarDays, Clock, Users, User, Mail, Phone, Check, MessageSquare } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

const CHEF_ICON = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/845efg67_kopf.png";

const ReservationPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState(null);

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
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormData(prev => ({
      ...prev,
      date: tomorrow.toISOString().split('T')[0]
    }));
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/shop/settings`);
      setSettings(response.data);
    } catch (e) {
      console.error("Failed to fetch settings:", e);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableDates = () => {
    const dates = [];
    const maxDays = settings?.max_reservation_days_ahead || 30;
    const today = new Date();
    
    for (let i = 1; i <= maxDays; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Check if date is in closed_days
      if (!settings?.closed_days?.includes(dateStr)) {
        dates.push({
          value: dateStr,
          label: date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
        });
      }
    }
    
    return dates;
  };

  const getAvailableTimes = () => {
    if (!formData.date || !settings?.opening_hours) return [];
    
    const date = new Date(formData.date);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    const hours = settings.opening_hours[dayName];
    
    if (!hours?.open || !hours?.close) return [];
    
    const times = [];
    const [openHour, openMin] = hours.open.split(':').map(Number);
    const [closeHour, closeMin] = hours.close.split(':').map(Number);
    
    let currentHour = openHour;
    let currentMin = openMin;
    
    // Handle closing after midnight
    const effectiveCloseHour = closeHour < openHour ? closeHour + 24 : closeHour;
    
    while (currentHour < effectiveCloseHour || (currentHour === effectiveCloseHour && currentMin < closeMin)) {
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
              <Label className="font-mono text-sm text-neutral-400 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-pizza-red" />
                Datum *
              </Label>
              <select
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value, time: "" })}
                className="w-full bg-pizza-black border border-pizza-dark focus:border-pizza-red text-pizza-white p-3 mt-1 font-mono"
              >
                <option value="">Datum wählen</option>
                {getAvailableDates().map(date => (
                  <option key={date.value} value={date.value}>{date.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label className="font-mono text-sm text-neutral-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-pizza-red" />
                Uhrzeit *
              </Label>
              <select
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
                disabled={!formData.date}
                className="w-full bg-pizza-black border border-pizza-dark focus:border-pizza-red text-pizza-white p-3 mt-1 font-mono disabled:opacity-50"
              >
                <option value="">Uhrzeit wählen</option>
                {getAvailableTimes().map(time => (
                  <option key={time.value} value={time.value}>{time.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Guests */}
          <div className="mb-6">
            <Label className="font-mono text-sm text-neutral-400 flex items-center gap-2">
              <Users className="w-4 h-4 text-pizza-red" />
              Anzahl Personen *
            </Label>
            <div className="flex items-center gap-4 mt-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, guests: Math.max(1, formData.guests - 1) })}
                className="w-12 h-12 border border-pizza-dark hover:border-pizza-red text-pizza-white font-anton text-xl"
              >
                -
              </button>
              <span className="font-anton text-3xl text-pizza-white w-16 text-center">{formData.guests}</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, guests: Math.min(20, formData.guests + 1) })}
                className="w-12 h-12 border border-pizza-dark hover:border-pizza-red text-pizza-white font-anton text-xl"
              >
                +
              </button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 mb-6">
            <div>
              <Label className="font-mono text-sm text-neutral-400 flex items-center gap-2">
                <User className="w-4 h-4 text-pizza-red" />
                Name *
              </Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Dein Name"
                className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none mt-1"
              />
            </div>
            
            <div>
              <Label className="font-mono text-sm text-neutral-400 flex items-center gap-2">
                <Mail className="w-4 h-4 text-pizza-red" />
                E-Mail *
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="deine@email.de"
                className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none mt-1"
              />
            </div>
            
            <div>
              <Label className="font-mono text-sm text-neutral-400 flex items-center gap-2">
                <Phone className="w-4 h-4 text-pizza-red" />
                Telefon *
              </Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0123 456789"
                className="bg-pizza-black border-pizza-dark focus:border-pizza-red text-pizza-white rounded-none mt-1"
              />
            </div>
            
            <div>
              <Label className="font-mono text-sm text-neutral-400 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-pizza-red" />
                Anmerkungen
              </Label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Besondere Wünsche, Allergien, Anlass..."
                rows={3}
                className="w-full bg-pizza-black border border-pizza-dark focus:border-pizza-red text-pizza-white p-3 mt-1 font-mono resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-pizza-red hover:bg-red-700 text-pizza-white font-anton text-lg tracking-wider py-6 rounded-none"
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
