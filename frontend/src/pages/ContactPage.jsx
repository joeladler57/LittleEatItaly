import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";

const CHEF_ICON = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/845efg67_kopf.png";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await axios.post(`${API}/contact`, formData);
      toast.success("Nachricht gesendet! Wir melden uns bald bei dir.");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      toast.error("Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const hours = [
    { day: "Montag - Donnerstag", time: "11:00 - 22:00" },
    { day: "Freitag", time: "11:00 - 23:00" },
    { day: "Samstag", time: "12:00 - 23:00" },
    { day: "Sonntag", time: "12:00 - 21:00" },
  ];

  return (
    <div data-testid="contact-page" className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1581850518616-bcb8077a2336?q=85&w=1920&auto=format&fit=crop')`,
          }}
        >
          <div className="absolute inset-0 bg-pizza-black/90" />
        </div>

        {/* Drip decorations */}
        <motion.div
          className="absolute top-0 left-1/3 w-3 bg-pizza-red rounded-b-full"
          initial={{ height: 0 }}
          animate={{ height: 90 }}
          transition={{ duration: 1, delay: 0.2 }}
        />
        <motion.div
          className="absolute top-0 right-1/4 w-2 bg-pizza-white/30 rounded-b-full"
          initial={{ height: 0 }}
          animate={{ height: 130 }}
          transition={{ duration: 1, delay: 0.4 }}
        />
        <motion.div
          className="absolute top-0 left-20 w-1 bg-pizza-red/50 rounded-b-full"
          initial={{ height: 0 }}
          animate={{ height: 60 }}
          transition={{ duration: 1, delay: 0.6 }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.img
            src={CHEF_ICON}
            alt="Chef"
            className="h-16 w-auto mx-auto mb-4"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
          />
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-anton text-5xl sm:text-6xl lg:text-7xl tracking-wider"
          >
            <span className="text-pizza-white">KONTAKTIERE</span>{" "}
            <motion.span
              className="text-pizza-red inline-block"
              animate={{ 
                textShadow: ["0 0 0px #FF1F1F", "0 0 15px #FF1F1F", "0 0 0px #FF1F1F"],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              UNS
            </motion.span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-mono text-base sm:text-lg text-neutral-200 mt-4 max-w-xl mx-auto"
          >
            Fragen, Feedback oder einfach nur Ciao sagen? Wir hören zu.
          </motion.p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-24 bg-pizza-black relative">
        {/* Drip decorations */}
        <div className="absolute top-0 left-10 w-1 h-20 bg-pizza-red/20 rounded-b-full" />
        <div className="absolute top-0 right-16 w-2 h-32 bg-pizza-white/10 rounded-b-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-anton text-3xl sm:text-4xl tracking-wider text-pizza-white mb-8">
                BESUCHE <span className="text-pizza-red">UNS</span>
              </h2>

              <div className="space-y-8">
                {/* Address */}
                <motion.div
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ x: 10 }}
                >
                  <motion.div
                    className="p-3 bg-pizza-red"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <MapPin className="w-6 h-6 text-pizza-black" />
                  </motion.div>
                  <div>
                    <h3 className="font-anton text-lg tracking-wider text-pizza-white mb-1">
                      ADRESSE
                    </h3>
                    <p className="font-mono text-sm text-neutral-200">
                      Pizzastraße 123<br />
                      Little Italy, 10001
                    </p>
                  </div>
                </motion.div>

                {/* Phone */}
                <motion.div
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ x: 10 }}
                >
                  <motion.div
                    className="p-3 bg-pizza-red"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                  >
                    <Phone className="w-6 h-6 text-pizza-black" />
                  </motion.div>
                  <div>
                    <h3 className="font-anton text-lg tracking-wider text-pizza-white mb-1">
                      TELEFON
                    </h3>
                    <p className="font-mono text-sm text-neutral-200">
                      +49 (0) 123 456789
                    </p>
                  </div>
                </motion.div>

                {/* Email */}
                <motion.div
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ x: 10 }}
                >
                  <motion.div
                    className="p-3 bg-pizza-red"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Mail className="w-6 h-6 text-pizza-black" />
                  </motion.div>
                  <div>
                    <h3 className="font-anton text-lg tracking-wider text-pizza-white mb-1">
                      E-MAIL
                    </h3>
                    <p className="font-mono text-sm text-neutral-200">
                      ciao@littleeatitaly.de
                    </p>
                  </div>
                </motion.div>

                {/* Hours */}
                <motion.div
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.div
                    className="p-3 bg-pizza-red"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                  >
                    <Clock className="w-6 h-6 text-pizza-black" />
                  </motion.div>
                  <div>
                    <h3 className="font-anton text-lg tracking-wider text-pizza-white mb-3">
                      ÖFFNUNGSZEITEN
                    </h3>
                    <div className="space-y-2">
                      {hours.map((item, index) => (
                        <motion.div
                          key={item.day}
                          className="flex justify-between gap-8 font-mono text-sm"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                        >
                          <span className="text-neutral-300">{item.day}</span>
                          <span className="text-pizza-white">{item.time}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Map Placeholder */}
              <motion.div
                className="mt-12 relative overflow-hidden border border-pizza-dark"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <iframe
                  title="Standortkarte"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.9663095919364!2d-73.99411768459391!3d40.74881797932821!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9b3117469%3A0xd134e199a405a163!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1635959562000!5m2!1sen!2sus"
                  width="100%"
                  height="250"
                  style={{ border: 0, filter: "grayscale(100%) invert(92%)" }}
                  allowFullScreen=""
                  loading="lazy"
                />
              </motion.div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-anton text-3xl sm:text-4xl tracking-wider text-pizza-white mb-8">
                SCHREIBE EINE <span className="text-pizza-red">NACHRICHT</span>
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6" data-testid="contact-form">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <Label htmlFor="name" className="font-mono text-sm text-neutral-300 mb-2 block">
                    DEIN NAME
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    data-testid="contact-name-input"
                    className="bg-pizza-dark/50 border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none h-12"
                    placeholder="Gib deinen Namen ein"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <Label htmlFor="email" className="font-mono text-sm text-neutral-300 mb-2 block">
                    DEINE E-MAIL
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    data-testid="contact-email-input"
                    className="bg-pizza-dark/50 border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none h-12"
                    placeholder="Gib deine E-Mail ein"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <Label htmlFor="message" className="font-mono text-sm text-neutral-300 mb-2 block">
                    DEINE NACHRICHT
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    data-testid="contact-message-input"
                    className="bg-pizza-dark/50 border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none min-h-[150px] resize-none"
                    placeholder="Was liegt dir auf dem Herzen?"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    data-testid="contact-submit-btn"
                    className="w-full bg-pizza-red hover:bg-red-700 text-pizza-white font-anton text-lg tracking-widest py-6 rounded-none disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <motion.span
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        WIRD GESENDET...
                      </motion.span>
                    ) : (
                      <>
                        NACHRICHT SENDEN
                        <Send className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>

              {/* Additional Info */}
              <motion.div
                className="mt-12 p-6 border border-pizza-dark"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <p className="font-mono text-sm text-neutral-300">
                  <span className="text-pizza-red">*</span> Wir antworten normalerweise innerhalb von 24 Stunden. Für dringende Angelegenheiten ruf uns an oder komm einfach vorbei – die Pizza ist immer heiß!
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
