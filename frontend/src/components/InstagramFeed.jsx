import { useState, useEffect, useRef } from "react";
import { motion, useAnimation, useMotionValue } from "framer-motion";
import { Instagram, Heart, MessageCircle, ExternalLink } from "lucide-react";

const InstagramFeed = ({ posts = [], username = "" }) => {
  const [width, setWidth] = useState(0);
  const carousel = useRef(null);
  const x = useMotionValue(0);
  const controls = useAnimation();

  useEffect(() => {
    if (carousel.current) {
      setWidth(carousel.current.scrollWidth - carousel.current.offsetWidth);
    }
  }, [posts]);

  // Auto-scroll animation
  useEffect(() => {
    if (posts.length < 4) return;
    
    const animate = async () => {
      await controls.start({
        x: -width,
        transition: { duration: 30, ease: "linear" }
      });
      controls.set({ x: 0 });
      animate();
    };
    
    animate();
    
    return () => controls.stop();
  }, [width, posts.length, controls]);

  if (!posts || posts.length === 0) return null;

  return (
    <section className="py-16 bg-pizza-black overflow-hidden relative">
      {/* Drip decorations */}
      <motion.div
        className="absolute top-0 left-[15%] w-2 bg-gradient-to-b from-pizza-red to-transparent"
        initial={{ height: 0 }}
        whileInView={{ height: 60 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        style={{ borderRadius: "0 0 100px 100px" }}
      />
      <motion.div
        className="absolute top-0 right-[25%] w-3 bg-gradient-to-b from-pizza-white/20 to-transparent"
        initial={{ height: 0 }}
        whileInView={{ height: 100 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{ borderRadius: "0 0 100px 100px" }}
      />
      <motion.div
        className="absolute top-0 right-[10%] w-1.5 bg-gradient-to-b from-pizza-red/50 to-transparent"
        initial={{ height: 0 }}
        whileInView={{ height: 40 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.4 }}
        style={{ borderRadius: "0 0 100px 100px" }}
      />

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <motion.div
            className="inline-flex items-center gap-3 mb-4"
            whileHover={{ scale: 1.05 }}
          >
            <Instagram className="w-8 h-8 text-pizza-red" />
            <h2 className="font-anton text-3xl sm:text-4xl tracking-wider text-pizza-white">
              FOLGE <span className="text-pizza-red">UNS</span>
            </h2>
          </motion.div>
          {username && (
            <a 
              href={`https://instagram.com/${username.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-base text-neutral-300 hover:text-pizza-red transition-colors inline-flex items-center gap-1"
            >
              {username} <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </motion.div>
      </div>

      {/* Carousel */}
      <motion.div 
        ref={carousel} 
        className="cursor-grab overflow-hidden"
        whileTap={{ cursor: "grabbing" }}
      >
        <motion.div 
          drag="x"
          dragConstraints={{ right: 0, left: -width }}
          animate={controls}
          onHoverStart={() => controls.stop()}
          onHoverEnd={() => {
            if (posts.length >= 4) {
              const animate = async () => {
                const currentX = x.get();
                await controls.start({
                  x: -width,
                  transition: { duration: 30 * (1 - Math.abs(currentX) / width), ease: "linear" }
                });
                controls.set({ x: 0 });
              };
              animate();
            }
          }}
          style={{ x }}
          className="flex gap-4 px-4"
        >
          {/* Double the posts for infinite scroll effect */}
          {[...posts, ...posts].map((post, index) => (
            <InstagramCard key={index} post={post} />
          ))}
        </motion.div>
      </motion.div>

      {/* Bottom drips */}
      <motion.div
        className="absolute bottom-0 left-[30%] w-2 bg-gradient-to-t from-pizza-red to-transparent"
        initial={{ height: 0 }}
        whileInView={{ height: 50 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        style={{ borderRadius: "100px 100px 0 0" }}
      />
    </section>
  );
};

const InstagramCard = ({ post }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.a
      href={post.link || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="relative min-w-[280px] sm:min-w-[320px] h-[320px] sm:h-[380px] flex-shrink-0 group"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Image */}
      <div className="absolute inset-0 overflow-hidden border-2 border-pizza-dark group-hover:border-pizza-red transition-colors duration-300">
        <img 
          src={post.image_url} 
          alt={post.caption || "Instagram post"}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Drip overlay effect */}
        <motion.div
          className="absolute top-0 left-4 w-1 bg-pizza-red rounded-b-full"
          initial={{ height: 0 }}
          animate={{ height: isHovered ? 30 : 0 }}
          transition={{ duration: 0.3 }}
        />
        <motion.div
          className="absolute top-0 right-8 w-0.5 bg-pizza-white rounded-b-full"
          initial={{ height: 0 }}
          animate={{ height: isHovered ? 20 : 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        />
        
        {/* Overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-pizza-black via-pizza-black/50 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Content overlay */}
        <motion.div
          className="absolute inset-0 flex flex-col justify-end p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Caption */}
          {post.caption && (
            <p className="font-mono text-sm text-pizza-white line-clamp-2 mb-3">
              {post.caption}
            </p>
          )}
          
          {/* Fake engagement */}
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-pizza-white font-mono text-xs">
              <Heart className="w-4 h-4 text-pizza-red fill-pizza-red" />
              {Math.floor(Math.random() * 500) + 100}
            </span>
            <span className="flex items-center gap-1 text-pizza-white font-mono text-xs">
              <MessageCircle className="w-4 h-4" />
              {Math.floor(Math.random() * 50) + 5}
            </span>
          </div>
        </motion.div>
      </div>
      
      {/* Instagram icon corner */}
      <motion.div
        className="absolute top-3 right-3 p-2 bg-pizza-black/70 backdrop-blur-sm border border-pizza-dark"
        animate={{ scale: isHovered ? 1.1 : 1 }}
      >
        <Instagram className="w-5 h-5 text-pizza-white" />
      </motion.div>
    </motion.a>
  );
};

export default InstagramFeed;
