import { motion } from "framer-motion";

const MenuCard = ({ item, index }) => {
  return (
    <motion.div
      data-testid={`menu-card-${item.id}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="glass-card group overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=85&w=800&auto=format&fit=crop";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pizza-black/80 to-transparent" />
        
        {/* Featured Badge */}
        {item.is_featured && (
          <div className="absolute top-3 right-3 bg-pizza-red px-3 py-1">
            <span className="font-mono text-xs text-pizza-black font-bold tracking-wider">
              FEATURED
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-anton text-xl tracking-wider text-pizza-white group-hover:text-pizza-red transition-colors">
            {item.name}
          </h3>
          <span className="font-mono text-lg text-pizza-red font-bold">
            ${item.price.toFixed(2)}
          </span>
        </div>
        <p className="font-mono text-sm text-pizza-muted leading-relaxed">
          {item.description}
        </p>
      </div>
    </motion.div>
  );
};

export default MenuCard;
