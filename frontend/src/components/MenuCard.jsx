import { motion } from "framer-motion";

const MenuCard = ({ item, index }) => {
  return (
    <motion.div
      data-testid={`menu-card-${item.id}`}
      initial={{ opacity: 0, y: 50, rotate: -2 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="glass-card group overflow-hidden relative"
    >
      {/* Drip effect on top */}
      <motion.div
        className="absolute top-0 left-1/4 w-1 bg-pizza-red rounded-b-full z-10"
        initial={{ height: 0 }}
        whileHover={{ height: 20 }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        className="absolute top-0 right-1/3 w-2 bg-pizza-white/30 rounded-b-full z-10"
        initial={{ height: 0 }}
        whileHover={{ height: 30 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      />

      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <motion.img
          src={item.image_url}
          alt={item.name}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.15 }}
          transition={{ duration: 0.6 }}
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=85&w=800&auto=format&fit=crop";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pizza-black/90 via-pizza-black/20 to-transparent" />
        
        {/* Featured Badge */}
        {item.is_featured && (
          <motion.div
            className="absolute top-3 right-3 bg-pizza-red px-3 py-1"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.1 }}
          >
            <span className="font-mono text-xs text-pizza-black font-bold tracking-wider">
              EMPFOHLEN
            </span>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <motion.h3
            className="font-anton text-xl tracking-wider text-pizza-white group-hover:text-pizza-red transition-colors"
            whileHover={{ x: 5 }}
          >
            {item.name}
          </motion.h3>
          <motion.span
            className="font-mono text-lg text-pizza-red font-bold"
            whileHover={{ scale: 1.2 }}
            animate={{ 
              textShadow: ["0 0 0px #FF1F1F", "0 0 8px #FF1F1F", "0 0 0px #FF1F1F"],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            €{item.price.toFixed(2)}
          </motion.span>
        </div>
        <p className="font-mono text-sm text-neutral-200 leading-relaxed">
          {item.description}
        </p>
      </div>
    </motion.div>
  );
};

export default MenuCard;
