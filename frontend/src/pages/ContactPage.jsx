import { useState, useEffect } from "react";
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
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await axios.get(`${API}/content`);
        setContent(response.data?.contact_page);
      } catch (e) {
        console.error("Failed to fetch content:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await axios.post(`${API}/contact`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      });
      toast.success(content?.form_success_message || "Nachricht gesendet! Wir melden uns bald bei dir.");
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error) {
      toast.error("Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Default values
  const c = content || {};
  const hours = c.hours || [
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
            <span className="text-pizza-white">{c.hero_title || "KONTAKTIERE"}</span>{" "}
            <motion.span
              className="text-pizza-red inline-block"
              animate={{ 
                textShadow: ["0 0 0px #FF1F1F", "0 0 15px #FF1F1F", "0 0 0px #FF1F1F"],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {c.hero_title_highlight || "UNS"}
            </motion.span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-mono text-base sm:text-lg text-neutral-200 mt-4 max-w-xl mx-auto"
          >
            {c.hero_subtitle || "Fragen, Feedback oder einfach nur Ciao sagen? Wir hören zu."}
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
                      {c.address_title || "ADRESSE"}
                    </h3>
                    <p className="font-mono text-sm text-neutral-200">
                      {c.address_line1 || "Pizzastraße 123"}<br />
                      {c.address_line2 || "Little Italy, 10001"}
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
                      {c.phone_title || "TELEFON"}
                    </h3>
                    <p className="font-mono text-sm text-neutral-200">
                      {c.phone || "+49 (0) 123 456789"}
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
                      {c.email_title || "E-MAIL"}
                    </h3>
                    <p className="font-mono text-sm text-neutral-200">
                      {c.email || "ciao@littleeatitaly.de"}
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
                      {c.hours_title || "ÖFFNUNGSZEITEN"}
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

              {/* Map */}
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
                {c.form_title || "SCHREIBE EINE"} <span className="text-pizza-red">{c.form_title_highlight || "NACHRICHT"}</span>
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5" data-testid="contact-form">
                {/* Name */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <Label htmlFor="name" className="font-mono text-sm text-neutral-300 mb-2 block">
                    {c.form_name_label || "DEIN NAME"} *
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
                    placeholder={c.form_name_placeholder || "Gib deinen Namen ein"}
                  />
                </motion.div>

                {/* Email */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 }}
                >
                  <Label htmlFor="email" className="font-mono text-sm text-neutral-300 mb-2 block">
                    {c.form_email_label || "DEINE E-MAIL"} *
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
                    placeholder={c.form_email_placeholder || "Gib deine E-Mail ein"}
                  />
                </motion.div>

                {/* Phone - Conditional */}
                {(c.form_phone_enabled !== false) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                  >
                    <Label htmlFor="phone" className="font-mono text-sm text-neutral-300 mb-2 block">
                      {c.form_phone_label || "DEINE TELEFONNUMMER"}
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      data-testid="contact-phone-input"
                      className="bg-pizza-dark/50 border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none h-12"
                      placeholder={c.form_phone_placeholder || "Gib deine Telefonnummer ein"}
                    />
                  </motion.div>
                )}

                {/* Subject - Conditional */}
                {(c.form_subject_enabled !== false) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.25 }}
                  >
                    <Label htmlFor="subject" className="font-mono text-sm text-neutral-300 mb-2 block">
                      {c.form_subject_label || "BETREFF"}
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleChange}
                      data-testid="contact-subject-input"
                      className="bg-pizza-dark/50 border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none h-12"
                      placeholder={c.form_subject_placeholder || "Worum geht es?"}
                    />
                  </motion.div>
                )}

                {/* Message */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <Label htmlFor="message" className="font-mono text-sm text-neutral-300 mb-2 block">
                    {c.form_message_label || "DEINE NACHRICHT"} *
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    data-testid="contact-message-input"
                    className="bg-pizza-dark/50 border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none min-h-[150px] resize-none"
                    placeholder={c.form_message_placeholder || "Was liegt dir auf dem Herzen?"}
                  />
                </motion.div>

                {/* Submit */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.35 }}
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
                        {c.form_submit_text || "NACHRICHT SENDEN"}
                        <Send className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>

              {/* Note */}
              <motion.div
                className="mt-8 p-6 border border-pizza-dark"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <p className="font-mono text-sm text-neutral-300">
                  <span className="text-pizza-red">*</span> {c.form_note || "Wir antworten normalerweise innerhalb von 24 Stunden."}
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
