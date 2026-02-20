import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check, Pizza } from "lucide-react";
import { useCustomerPushNotifications } from "../hooks/useCustomerPushNotifications";
import { toast } from "sonner";

const PushOptInModal = ({ isOpen, onClose, trigger = "order" }) => {
  const { isSupported, permission, subscribe, isLoading } = useCustomerPushNotifications();
  const [step, setStep] = useState("ask"); // "ask", "success", "denied"

  const getTriggerText = () => {
    switch (trigger) {
      case "registration":
        return "Willkommen bei Little Eat Italy!";
      case "order":
        return "Danke für deine Bestellung!";
      case "reservation":
        return "Danke für deine Reservierung!";
      default:
        return "Bleib informiert!";
    }
  };

  const handleSubscribe = async () => {
    try {
      await subscribe();
      setStep("success");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      if (error.message?.includes("nicht erlaubt")) {
        setStep("denied");
      } else {
        toast.error("Benachrichtigungen konnten nicht aktiviert werden");
        onClose();
      }
    }
  };

  const handleDecline = () => {
    // Store preference to not ask again for this session
    sessionStorage.setItem("push_opt_in_declined", "true");
    onClose();
  };

  if (!isSupported || permission === "denied") {
    return null;
  }

  // Don't show if already subscribed or declined this session
  if (permission === "granted" || sessionStorage.getItem("push_opt_in_declined")) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={handleDecline}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-pizza-dark border-2 border-pizza-red w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="bg-pizza-red p-4 relative">
              <button
                onClick={handleDecline}
                className="absolute top-3 right-3 text-pizza-white/70 hover:text-pizza-white"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-pizza-white/20 rounded-full flex items-center justify-center">
                  {step === "success" ? (
                    <Check className="w-7 h-7 text-pizza-white" />
                  ) : (
                    <Bell className="w-7 h-7 text-pizza-white" />
                  )}
                </div>
                <div>
                  <h2 className="font-anton text-xl text-pizza-white">
                    {step === "success" ? "AKTIVIERT!" : getTriggerText()}
                  </h2>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {step === "ask" && (
                <>
                  <div className="text-center mb-6">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="inline-block mb-4"
                    >
                      <Pizza className="w-16 h-16 text-pizza-red" />
                    </motion.div>
                    <h3 className="font-anton text-2xl text-pizza-white mb-2">
                      VERPASSE NICHTS!
                    </h3>
                    <p className="font-mono text-sm text-neutral-400">
                      Erhalte exklusive Angebote, Rabattaktionen und Updates direkt auf dein Handy.
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {[
                      "🍕 Exklusive Rabatte nur für Abonnenten",
                      "🔥 Neue Menü-Items als Erstes erfahren",
                      "🎁 Geburtstags-Überraschungen",
                      "⚡ Blitz-Angebote & Happy Hours"
                    ].map((item, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="font-mono text-sm text-neutral-300 flex items-center gap-2"
                      >
                        {item}
                      </motion.li>
                    ))}
                  </ul>

                  <div className="space-y-3">
                    <button
                      onClick={handleSubscribe}
                      disabled={isLoading}
                      className="w-full py-4 bg-pizza-red hover:bg-red-700 text-pizza-white font-anton text-lg tracking-wider transition-all flex items-center justify-center gap-2"
                      data-testid="push-opt-in-accept"
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Bell className="w-5 h-5" />
                          </motion.div>
                          WIRD AKTIVIERT...
                        </>
                      ) : (
                        <>
                          <Bell className="w-5 h-5" />
                          JA, BENACHRICHTIGE MICH!
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDecline}
                      className="w-full py-3 text-neutral-500 hover:text-neutral-300 font-mono text-sm transition-all"
                      data-testid="push-opt-in-decline"
                    >
                      Nein danke, vielleicht später
                    </button>
                  </div>
                </>
              )}

              {step === "success" && (
                <div className="text-center py-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Check className="w-10 h-10 text-green-500" />
                  </motion.div>
                  <h3 className="font-anton text-2xl text-pizza-white mb-2">
                    PERFEKT!
                  </h3>
                  <p className="font-mono text-sm text-neutral-400">
                    Du erhältst jetzt exklusive Angebote und Updates.
                  </p>
                </div>
              )}

              {step === "denied" && (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-10 h-10 text-yellow-500" />
                  </div>
                  <h3 className="font-anton text-xl text-pizza-white mb-2">
                    BENACHRICHTIGUNGEN BLOCKIERT
                  </h3>
                  <p className="font-mono text-sm text-neutral-400 mb-4">
                    Du kannst Benachrichtigungen in deinen Browser-Einstellungen aktivieren.
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-pizza-dark border border-neutral-700 text-pizza-white font-mono text-sm hover:border-neutral-500 transition-all"
                  >
                    Verstanden
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PushOptInModal;
