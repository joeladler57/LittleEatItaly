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
      toast.success("Message sent! We'll get back to you soon.");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const hours = [
    { day: "Monday - Thursday", time: "11:00 AM - 10:00 PM" },
    { day: "Friday", time: "11:00 AM - 11:00 PM" },
    { day: "Saturday", time: "12:00 PM - 11:00 PM" },
    { day: "Sunday", time: "12:00 PM - 9:00 PM" },
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

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-anton text-5xl sm:text-6xl lg:text-7xl tracking-wider"
          >
            <span className="text-pizza-white">GET IN</span>{" "}
            <span className="text-pizza-red">TOUCH</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-mono text-base sm:text-lg text-pizza-muted mt-4 max-w-xl mx-auto"
          >
            Questions, feedback, or just want to say ciao? We're all ears.
          </motion.p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-24 bg-pizza-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-anton text-3xl sm:text-4xl tracking-wider text-pizza-white mb-8">
                VISIT <span className="text-pizza-red">US</span>
              </h2>

              <div className="space-y-8">
                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-pizza-red">
                    <MapPin className="w-6 h-6 text-pizza-black" />
                  </div>
                  <div>
                    <h3 className="font-anton text-lg tracking-wider text-pizza-white mb-1">
                      ADDRESS
                    </h3>
                    <p className="font-mono text-sm text-pizza-muted">
                      123 Pizza Street<br />
                      Little Italy, NY 10001
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-pizza-red">
                    <Phone className="w-6 h-6 text-pizza-black" />
                  </div>
                  <div>
                    <h3 className="font-anton text-lg tracking-wider text-pizza-white mb-1">
                      PHONE
                    </h3>
                    <p className="font-mono text-sm text-pizza-muted">
                      +1 (555) 123-4567
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-pizza-red">
                    <Mail className="w-6 h-6 text-pizza-black" />
                  </div>
                  <div>
                    <h3 className="font-anton text-lg tracking-wider text-pizza-white mb-1">
                      EMAIL
                    </h3>
                    <p className="font-mono text-sm text-pizza-muted">
                      ciao@littleeatitaly.com
                    </p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-pizza-red">
                    <Clock className="w-6 h-6 text-pizza-black" />
                  </div>
                  <div>
                    <h3 className="font-anton text-lg tracking-wider text-pizza-white mb-3">
                      HOURS
                    </h3>
                    <div className="space-y-2">
                      {hours.map((item) => (
                        <div
                          key={item.day}
                          className="flex justify-between gap-8 font-mono text-sm"
                        >
                          <span className="text-pizza-muted">{item.day}</span>
                          <span className="text-pizza-white">{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="mt-12 relative overflow-hidden border border-pizza-dark">
                <iframe
                  title="Location Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.9663095919364!2d-73.99411768459391!3d40.74881797932821!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9b3117469%3A0xd134e199a405a163!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1635959562000!5m2!1sen!2sus"
                  width="100%"
                  height="250"
                  style={{ border: 0, filter: "grayscale(100%) invert(92%)" }}
                  allowFullScreen=""
                  loading="lazy"
                />
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-anton text-3xl sm:text-4xl tracking-wider text-pizza-white mb-8">
                SEND A <span className="text-pizza-red">MESSAGE</span>
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6" data-testid="contact-form">
                <div>
                  <Label htmlFor="name" className="font-mono text-sm text-pizza-muted mb-2 block">
                    YOUR NAME
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
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="font-mono text-sm text-pizza-muted mb-2 block">
                    YOUR EMAIL
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
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="font-mono text-sm text-pizza-muted mb-2 block">
                    YOUR MESSAGE
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    data-testid="contact-message-input"
                    className="bg-pizza-dark/50 border-pizza-dark focus:border-pizza-red text-pizza-white font-mono rounded-none min-h-[150px] resize-none"
                    placeholder="What's on your mind?"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="contact-submit-btn"
                  className="w-full bg-pizza-red hover:bg-red-700 text-pizza-white font-anton text-lg tracking-widest py-6 rounded-none glitch-hover disabled:opacity-50"
                >
                  {isSubmitting ? (
                    "SENDING..."
                  ) : (
                    <>
                      SEND MESSAGE
                      <Send className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>

              {/* Additional Info */}
              <div className="mt-12 p-6 border border-pizza-dark">
                <p className="font-mono text-sm text-pizza-muted">
                  <span className="text-pizza-red">*</span> We typically respond within 24 hours. For urgent matters, give us a call or just swing by – the pizza's always hot!
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
