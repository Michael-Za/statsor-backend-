import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Star, Users, BarChart3, FileText, ArrowRight, Play, Zap, Shield, Target, X, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HumanizedHelperBot } from '../components/HumanizedHelperBot';

const Index = () => {
  const { theme } = useTheme();
  const { setLanguage } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { scrollYProgress } = useScroll();
  
  // Check if mock auth is enabled
  const enableMockAuth = import.meta.env['VITE_ENABLE_MOCK_AUTH'] === 'true';
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Enhanced animations with more dynamic effects
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 1.2,
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 60, opacity: 0, scale: 0.8 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const heroVariants = {
    hidden: { opacity: 0, y: 100, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 1.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.9, rotateX: 15 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    hover: {
      y: -15,
      scale: 1.05,
      rotateX: -5,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      x: [0, 5, 0],
      rotate: [0, 2, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const magneticVariants = {
    hover: {
      scale: 1.1,
      rotate: [0, -5, 5, 0],
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const textRevealVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    })
  };

  const backgroundParticles = {
    animate: {
      y: [0, -100, 0],
      x: [0, 50, 0],
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
        repeatDelay: 2
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.main 
        className="min-h-screen transition-all duration-700 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white"
        variants={containerVariants}
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
      >


        {/* Enhanced Navigation */}
        <motion.nav 
          className="sticky top-0 z-40 backdrop-blur-md border-b transition-all duration-500 bg-black/20 border-gray-800"
          variants={itemVariants}
        >
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <motion.div 
                className="flex items-center"
                whileHover={{ scale: 1.05 }}
              >
                <img 
                  src="/lovable-uploads/01b5bf86-f2e7-42cd-9465-4d0bb347d2ea.png" 
                  alt="Statsor" 
                  className="h-12 w-auto rounded-xl object-cover"
                />
              </motion.div>
              
              <div className="hidden md:flex items-center space-x-8">
                <Link to="/" className="hover:text-green-500 transition-colors font-medium">
                  Home
                </Link>
                <a href="#features" className="hover:text-green-500 transition-colors font-medium">
                  Features
                </a>
                <Link to="/pricing" className="hover:text-green-500 transition-colors font-medium">
                  Pricing
                </Link>
                <a href="#demo" className="hover:text-green-500 transition-colors font-medium">
                  Demo
                </a>
                <a href="#contact" className="hover:text-green-500 transition-colors font-medium">
                  Contact
                </a>
                <Link to="/signup">
                  <Button className="bg-green-600 hover:bg-green-700 text-white border-2 border-green-600 px-4 py-2 rounded-md font-medium transition-all duration-300">
                    Sign Up
                  </Button>
                </Link>
                <Link to="/signin">
                  <Button className="bg-green-600 hover:bg-green-700 text-white border-2 border-green-600 px-4 py-2 rounded-md font-medium transition-all duration-300">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.nav>

        {/* Enhanced Hero Section - Cursor.com Style */}
        <motion.section 
          className="min-h-screen flex items-center justify-center relative overflow-hidden"
          variants={heroVariants}
        >
          {/* Animated Background Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-purple-400 opacity-60"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + i * 10}%`,
                }}
                variants={backgroundParticles}
                animate="animate"
                transition={{
                  delay: i * 0.5,
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
            
            {/* Enhanced Background Gradients */}
            <motion.div 
              className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl bg-purple-500"
              variants={floatingVariants}
              animate="animate"
            />
            <motion.div 
              className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-20 blur-3xl bg-blue-500"
              variants={floatingVariants}
              animate="animate"
              transition={{ delay: 1 }}
            />
          </div>

          <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
            <motion.div
              variants={itemVariants}
              className="mb-12"
            >
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold mb-8 leading-[0.9] tracking-tight">
                {[
                  { text: 'Dominate', delay: 0 },
                  { text: 'football', delay: 0.2 },
                  { text: 'analytics', delay: 0.4, gradient: true }
                ].map((word, i) => (
                  <motion.span
                    key={i}
                    className={`block ${
                      word.gradient
                        ? 'bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent'
                        : 'text-white'
                    }`}
                    variants={textRevealVariants}
                    initial="hidden"
                    animate="visible"
                    custom={i}
                    whileHover={{
                      scale: 1.05,
                      transition: { duration: 0.3 }
                    }}
                  >
                    {word.text}
                  </motion.span>
                ))}
              </h1>
              <motion.p 
                className="text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed bg-gradient-to-r from-gray-300 via-white to-gray-300 bg-clip-text text-transparent"
                variants={textRevealVariants}
                initial="hidden"
                animate="visible"
                custom={3}
              >
                The ultimate AI-powered football analytics platform. Built for elite coaches who demand data-driven dominance.
              </motion.p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20"
            >
              <motion.div 
                variants={magneticVariants}
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/signup">
                  <Button 
                    size="lg"
                    className="px-8 py-4 rounded-lg font-medium text-lg transition-all duration-300 interactive-element shadow-lg bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 hover:shadow-xl hover:scale-105"
                  >
                    Start Free Trial
                  </Button>
                </Link>
              </motion.div>
              
              {/* Removed the enableMockAuth condition to always show Watch Demo button */}
              <motion.div 
                variants={magneticVariants}
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="ghost"
                  size="lg"
                  onClick={() => setShowDemo(true)}
                  className="px-8 py-4 rounded-lg font-medium text-lg transition-all duration-300 interactive-element group text-gray-3300 hover:text-white hover:bg-gray-800/50 border border-gray-600 hover:border-gray-400"
                >
                  Watch Demo
                  <motion.div
                    className="ml-2 inline-block"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.div>
                </Button>
              </motion.div>
            </motion.div>

            {/* Minimal Stats */}
            <motion.div
              variants={itemVariants}
              className="text-sm font-medium bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 bg-clip-text text-transparent"
            >
              Trusted by 1000+ elite teams • 50K+ professional coaches • 99.9% uptime
            </motion.div>
          </div>
        </motion.section>

        {/* Enhanced Features Section */}
        <motion.section 
          id="features"
          className="py-24"
          variants={itemVariants}
        >
          <div className="max-w-7xl mx-auto px-6">
            <motion.div 
              className="text-center mb-16"
              variants={itemVariants}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Elite Performance Features
              </h2>
              <p className="text-xl opacity-80 max-w-3xl mx-auto">
                Cutting-edge tools designed for coaches who refuse to settle for average
              </p>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {[
                {
                  icon: Users,
                  title: 'Advanced Training',
                  description: 'AI-powered session planning with real-time player feedback and load optimization.',
                  color: 'from-blue-500 to-blue-600',
                  accent: 'blue'
                },
                {
                  icon: BarChart3,
                  title: 'Real-Time Analytics',
                  description: 'Live performance tracking with predictive modeling and tactical insights.',
                  color: 'from-green-500 to-green-600',
                  accent: 'green'
                },
                {
                  icon: Target,
                  title: 'Player Development',
                  description: 'Comprehensive individual analysis with personalized growth recommendations.',
                  color: 'from-yellow-500 to-orange-500',
                  accent: 'orange'
                },
                {
                  icon: FileText,
                  title: 'Executive Reports',
                  description: 'Professional-grade reports with one-click export to any format.',
                  color: 'from-red-500 to-red-600',
                  accent: 'red'
                }
              ].map((feature, index) => {
                const FeatureCard = () => {
                  const [isHovered, setIsHovered] = useState(false);
                  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

                  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    setMousePosition({ x, y });
                  };

                  const handleMouseEnter = () => setIsHovered(true);
                  const handleMouseLeave = () => {
                    setIsHovered(false);
                    setMousePosition({ x: 0, y: 0 });
                  };

                  const tiltX = isHovered ? (mousePosition.y - 150) / 10 : 0;
                  const tiltY = isHovered ? (mousePosition.x - 150) / -10 : 0;

                  return (
                    <motion.div
                      className="group relative p-8 rounded-2xl border-2 transition-all duration-500 cursor-pointer overflow-hidden bg-gray-900/50 border-gray-800 hover:border-gray-600 hover:bg-gray-800/70"
                      variants={cardVariants}
                      initial="hidden"
                      whileInView="visible"
                      whileHover={{
                        scale: 1.05,
                        rotateX: tiltX,
                        rotateY: tiltY,
                        z: 50
                      }}
                      viewport={{ once: true }}
                      transition={{ 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 300,
                        damping: 20
                      }}
                      style={{
                        transformStyle: 'preserve-3d',
                        perspective: 1000
                      }}
                      onMouseMove={handleMouseMove}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      {/* 3D Cursor Follower */}
                      <motion.div
                        className="absolute pointer-events-none z-10"
                        animate={{
                          x: mousePosition.x - 10,
                          y: mousePosition.y - 10,
                          opacity: isHovered ? 1 : 0
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 28 }}
                      >
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${feature.color} blur-sm`} />
                      </motion.div>

                      {/* Interactive Light Effect */}
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: isHovered 
                            ? `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.1), transparent 40%)`
                            : 'none'
                        }}
                      />

                      {/* Animated background glow */}
                      <motion.div
                        className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-r ${feature.color} blur-xl`}
                        initial={{ scale: 0 }}
                        whileHover={{ scale: 1.2 }}
                        transition={{ duration: 0.5 }}
                      />
                      
                      <motion.div 
                        className={`relative w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 shadow-lg`}
                        animate={{
                          rotateX: isHovered ? tiltX * 0.5 : 0,
                          rotateY: isHovered ? tiltY * 0.5 : 0,
                          scale: isHovered ? 1.1 : 1,
                          z: isHovered ? 30 : 0
                        }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 400, 
                          damping: 25 
                        }}
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        <motion.div
                          animate={{
                            rotate: isHovered ? [0, -10, 10, 0] : 0
                          }}
                          transition={{ duration: 0.6, repeat: isHovered ? Infinity : 0 }}
                        >
                          <feature.icon className="h-8 w-8 text-white drop-shadow-lg" />
                        </motion.div>
                      </motion.div>
                      
                      <motion.h3 
                        className="text-xl font-bold mb-4 text-white"
                        animate={{
                          x: isHovered ? 5 : 0,
                          z: isHovered ? 20 : 0
                        }}
                        transition={{ duration: 0.3 }}
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        {feature.title}
                      </motion.h3>
                      
                      <motion.p 
                        className="leading-relaxed text-gray-400"
                        animate={{
                          x: isHovered ? 5 : 0,
                          z: isHovered ? 15 : 0
                        }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        {feature.description}
                      </motion.p>
                      
                      {/* Enhanced 3D Hover arrow indicator */}
                      <motion.div
                        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        animate={{
                          x: isHovered ? 0 : -10,
                          z: isHovered ? 25 : 0,
                          rotateZ: isHovered ? 360 : 0
                        }}
                        transition={{ 
                          duration: 0.5,
                          rotateZ: { duration: 2, repeat: isHovered ? Infinity : 0, ease: "linear" }
                        }}
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        <ArrowRight className="h-5 w-5 text-gray-400 drop-shadow-lg" />
                      </motion.div>

                      {/* 3D Floating Particles */}
                      {isHovered && [
                        { x: 20, y: 30, delay: 0 },
                        { x: 80, y: 50, delay: 0.2 },
                        { x: 150, y: 40, delay: 0.4 },
                        { x: 200, y: 60, delay: 0.6 }
                      ].map((particle, i) => (
                        <motion.div
                          key={i}
                          className={`absolute w-2 h-2 rounded-full bg-gradient-to-r ${feature.color} opacity-60`}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                            y: [particle.y, particle.y - 20, particle.y],
                            x: particle.x
                          }}
                          transition={{
                            duration: 2,
                            delay: particle.delay,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                    </motion.div>
                  );
                };

                return <FeatureCard key={index} />;
              })}
            </motion.div>
          </div>
        </motion.section>

        {/* Enhanced Modality Section */}
        <motion.section 
          className="py-24"
          variants={itemVariants}
        >
          <div className="max-w-7xl mx-auto px-6">
            <motion.div 
              className="text-center mb-16"
              variants={itemVariants}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Perfect for Every Modality
              </h2>
              <p className="text-xl opacity-80 max-w-3xl mx-auto">
                Statsor adapts perfectly to both soccer 11 and futsal, with specific functionalities for each modality.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Soccer 11 */}
              <motion.div
                className="p-8 rounded-2xl bg-gradient-to-br from-green-600 to-green-700 text-white"
                variants={cardVariants}
                whileHover="hover"
              >
                <h3 className="text-2xl font-bold mb-6">Soccer 11</h3>
                <ul className="space-y-4">
                  {[
                    'Extensive squad management (up to 25 players)',
                    'Tactical analysis for 11vs11 formations',
                    'Specific position tracking',
                    'Full match statistics (90 min)',
                    'Complete season planning'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-white rounded-full mr-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Futsal */}
              <motion.div
                className="p-8 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-white"
                variants={cardVariants}
                whileHover="hover"
              >
                <h3 className="text-2xl font-bold mb-6">Futsal</h3>
                <ul className="space-y-4">
                  {[
                    'Intensive rotation control',
                    'Small space game analysis',
                    'Intensity and rhythm metrics',
                    'Match statistics (40 min)',
                    'Double competition management'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-white rounded-full mr-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Testimonials Section - Cursor.com Style */}
        <motion.section 
          className="py-32"
          variants={itemVariants}
        >
          <div className="max-w-6xl mx-auto px-6">
            <motion.div 
              className="text-center mb-20"
              variants={itemVariants}
            >
              <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-blue-300 to-slate-300 bg-clip-text text-transparent">
                Trusted by coaches worldwide
              </h2>
              <p className="text-xl max-w-2xl mx-auto text-gray-400">
                Real feedback from coaches using Statsor every day
              </p>
            </motion.div>

            {/* Enhanced Rolling Testimonials */}
            <div className="relative overflow-hidden">
              {/* Enhanced gradient overlays for seamless edge blending */}
              <div className="absolute left-0 top-0 bottom-0 w-48 z-20 pointer-events-none bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent" />
              <div className="absolute right-0 top-0 bottom-0 w-48 z-20 pointer-events-none bg-gradient-to-l from-gray-900 via-gray-900/80 to-transparent" />
              {/* Additional subtle inner gradients for ultra-smooth blending */}
              <div className="absolute left-48 top-0 bottom-0 w-24 z-10 pointer-events-none bg-gradient-to-r from-gray-900/20 to-transparent" />
              <div className="absolute right-48 top-0 bottom-0 w-24 z-10 pointer-events-none bg-gradient-to-l from-gray-900/20 to-transparent" />
              
              <motion.div
                className="flex space-x-8"
                animate={{
                  x: [0, -2016] // Move by exact width of 6 testimonials (6 * 336px)
                }}
                transition={{
                  duration: 40,
                  repeat: Infinity,
                  ease: "linear",
                  repeatType: "loop"
                }}
                style={{
                  width: 'calc(200% + 64px)' // Ensure enough width for seamless loop
                }}
              >
                {/* Duplicate testimonials for seamless loop */}
                {[...Array(2)].map((_, duplicateIndex) => [
                  {
                    name: 'Coach Martinez',
                    role: 'Youth Academy Director',
                    quote: 'Statsor helped us track player development more effectively. The analytics are straightforward and actionable.',
                    avatar: 'CM',
                    gradient: 'from-blue-500 to-purple-500',
                    verified: true
                  },
                  {
                    name: 'James Wilson',
                    role: 'Semi-Pro Coach',
                    quote: 'Great tool for organizing match data and training sessions. Makes my job much easier.',
                    avatar: 'JW',
                    gradient: 'from-green-500 to-blue-500',
                    verified: true
                  },
                  {
                    name: 'Ana Silva',
                    role: 'Performance Analyst',
                    quote: 'The reporting features save me hours every week. Clean interface and reliable data.',
                    avatar: 'AS',
                    gradient: 'from-purple-500 to-pink-500',
                    verified: true
                  },
                  {
                    name: 'Tom Richards',
                    role: 'Grassroots Coach',
                    quote: 'Easy to use even for someone not tech-savvy. My players love seeing their progress.',
                    avatar: 'TR',
                    gradient: 'from-orange-500 to-red-500',
                    verified: true
                  },
                  {
                    name: 'Sophie Chen',
                    role: 'Assistant Coach',
                    quote: 'Solid platform for match analysis. The AI suggestions are surprisingly helpful.',
                    avatar: 'SC',
                    gradient: 'from-teal-500 to-green-500',
                    verified: true
                  },
                  {
                    name: 'Carlos Mendez',
                    role: 'Technical Director',
                    quote: 'We switched to Statsor last season and haven\'t looked back. Worth every penny.',
                    avatar: 'CM',
                    gradient: 'from-indigo-500 to-purple-500',
                    verified: true
                  }
                ].map((testimonial, index) => (
                  <motion.div
                    key={`${duplicateIndex}-${index}`}
                    className="group flex-shrink-0 w-96 p-8 rounded-2xl border transition-all duration-700 interactive-element relative overflow-hidden bg-gray-900/80 border-gray-700/50 hover:border-gray-500/70 hover:bg-gray-800/90 shadow-xl hover:shadow-2xl backdrop-blur-sm"
                    whileHover={{ 
                      y: -12, 
                      scale: 1.03,
                      rotateY: 3,
                      transition: { duration: 0.5, ease: "easeOut" }
                    }}
                    style={{
                      transformStyle: 'preserve-3d',
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(59, 130, 246, 0.1)'
                    }}
                  >
                    {/* Animated background gradient */}
                    <motion.div
                      className={`absolute inset-0 opacity-0 group-hover:opacity-8 transition-opacity duration-700 bg-gradient-to-br ${testimonial.gradient} blur-3xl`}
                      initial={{ scale: 0.8, rotate: -5 }}
                      whileHover={{ scale: 1.1, rotate: 2 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                    {/* Subtle glow effect */}
                    <div className={`absolute inset-0 opacity-5 bg-gradient-to-t ${testimonial.gradient} rounded-2xl`} />
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center">
                          <motion.div 
                            className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 bg-gradient-to-r ${testimonial.gradient} shadow-lg`}
                            whileHover={{ 
                              rotate: 360,
                              scale: 1.1
                            }}
                            transition={{ duration: 0.6 }}
                          >
                            <span className="font-bold text-white text-base">{testimonial.avatar}</span>
                          </motion.div>
                          <div>
                            <div className="flex items-center gap-2">
                              <motion.h4 
                                className="font-semibold text-base text-white"
                                whileHover={{ x: 5 }}
                                transition={{ duration: 0.3 }}
                              >
                                {testimonial.name}
                              </motion.h4>
                              {testimonial.verified && (
                                <motion.div
                                  className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-500"
                                  whileHover={{ scale: 1.2, rotate: 360 }}
                                  transition={{ duration: 0.3 }}
                                  title="Verified User"
                                >
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </motion.div>
                              )}
                            </div>
                            <motion.p 
                              className="text-xs text-gray-400 mt-0.5"
                              whileHover={{ x: 5 }}
                              transition={{ duration: 0.3, delay: 0.1 }}
                            >
                              {testimonial.role}
                            </motion.p>
                          </div>
                        </div>
                        
                        <motion.div 
                          className="flex gap-0.5"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.3 }}
                        >
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                          ))}
                        </motion.div>
                      </div>
                      
                      <motion.p 
                        className="leading-relaxed text-base mb-4 text-gray-300"
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        "{testimonial.quote}"
                      </motion.p>
                      
                      <motion.div 
                        className="flex items-center gap-2 text-xs text-gray-500"
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <span>Verified Statsor User</span>
                        <span>•</span>
                        <span>Active Coach</span>
                      </motion.div>
                    </div>
                    
                    {/* Floating quote decoration */}
                    <motion.div
                      className="absolute top-4 right-4 text-6xl opacity-10 text-white"
                      animate={{ 
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      "
                    </motion.div>
                  </motion.div>
                )))}
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Enhanced Final CTA Section - Cursor.com Style */}
        <motion.section 
          className="py-32 relative overflow-hidden"
          variants={itemVariants}
        >
          {/* Animated Background Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-green-400 opacity-40"
                style={{
                  left: `${10 + i * 12}%`,
                  top: `${20 + i * 8}%`,
                }}
                variants={backgroundParticles}
                animate="animate"
                transition={{
                  delay: i * 0.3,
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
            
            {/* Central Gradient Orb */}
            <motion.div
              className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500"
              style={{
                transform: 'translate(-50%, -50%)'
              }}
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>

          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <motion.div 
              variants={itemVariants}
            >
              {/* Text Reveal Animation for Headline */}
              <div className="overflow-hidden mb-8">
                <motion.h2 
                  className="text-5xl md:text-7xl font-bold leading-tight bg-gradient-to-r from-white via-blue-100 to-gray-200 bg-clip-text text-transparent"
                  variants={textRevealVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={0}
                >
                  Dominate with Statsor
                </motion.h2>
              </div>
              
              <motion.p 
                className="text-xl md:text-2xl max-w-2xl mx-auto mb-12 text-gray-400"
                variants={textRevealVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={1}
              >
                Join elite coaches already using AI to dominate their competition.
              </motion.p>
              
              {/* Magnetic Button Effects */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
                variants={itemVariants}
              >
                <Link to="/signup">
                  <motion.div
                    variants={magneticVariants}
                    whileHover="hover"
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      size="lg"
                      className="px-8 py-4 rounded-lg font-medium text-lg transition-all duration-300 interactive-element relative overflow-hidden bg-white text-black hover:bg-gray-100"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500 opacity-0 hover:opacity-20 transition-opacity duration-300"
                        whileHover={{ opacity: 0.2 }}
                      />
                      <span className="relative z-10">
                        Start free trial
                      </span>
                    </Button>
                  </motion.div>
                </Link>
                
                <motion.div
                  variants={magneticVariants}
                  whileHover="hover"
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="ghost"
                    size="lg"
                    onClick={() => setShowDemo(true)}
                    className="px-8 py-4 rounded-lg font-medium text-lg transition-all duration-300 interactive-element group text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    Book a demo
                    <motion.div
                      className="ml-2"
                      animate={{ x: [0, 5, 0] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <ArrowRight className="h-5 w-5" />
                    </motion.div>
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Humanized Helper Bot */}
        <HumanizedHelperBot />

        {/* Enhanced Footer */}
        <motion.footer 
          className="py-16 border-t transition-all duration-500 bg-gray-900/95 border-gray-700"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <motion.div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-500"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Target className="h-5 w-5 text-white" />
                   </motion.div>
                  <span className="text-xl font-bold">Statsor</span>
                </div>
                <p className="opacity-80">
                  The ultimate football analytics platform for elite coaches
                </p>
              </div>
              
              <div>
                <h4 className="font-bold mb-4">Product</h4>
                <ul className="space-y-2 opacity-80">
                  <motion.li whileHover={{ x: 5, scale: 1.05 }} transition={{ duration: 0.2 }}>
                    <Link to="/" className="hover:text-green-400 transition-all duration-300 hover:drop-shadow-sm">Home</Link>
                  </motion.li>
                  <motion.li whileHover={{ x: 5, scale: 1.05 }} transition={{ duration: 0.2 }}>
                    <a href="#features" className="hover:text-green-400 transition-all duration-300 hover:drop-shadow-sm">Features</a>
                  </motion.li>
                  <motion.li whileHover={{ x: 5, scale: 1.05 }} transition={{ duration: 0.2 }}>
                    <Link to="/pricing" className="hover:text-green-400 transition-all duration-300 hover:drop-shadow-sm">Pricing</Link>
                  </motion.li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-4">Resources</h4>
                <ul className="space-y-2 opacity-80">
                  <motion.li whileHover={{ x: 5, scale: 1.05 }} transition={{ duration: 0.2 }}>
                    <a href="#" className="hover:text-green-400 transition-all duration-300 hover:drop-shadow-sm">Documentation</a>
                  </motion.li>
                  <motion.li whileHover={{ x: 5, scale: 1.05 }} transition={{ duration: 0.2 }}>
                    <a href="#" className="hover:text-green-400 transition-all duration-300 hover:drop-shadow-sm">API</a>
                  </motion.li>
                  <motion.li whileHover={{ x: 5, scale: 1.05 }} transition={{ duration: 0.2 }}>
                    <a href="#" className="hover:text-green-400 transition-all duration-300 hover:drop-shadow-sm">Support</a>
                  </motion.li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-4">Company</h4>
                <ul className="space-y-2 opacity-80">
                  <motion.li whileHover={{ x: 5, scale: 1.05 }} transition={{ duration: 0.2 }}>
                    <a href="#" className="hover:text-green-400 transition-all duration-300 hover:drop-shadow-sm">About Us</a>
                  </motion.li>
                  <motion.li whileHover={{ x: 5, scale: 1.05 }} transition={{ duration: 0.2 }}>
                    <a href="#" className="hover:text-green-400 transition-all duration-300 hover:drop-shadow-sm">Contact</a>
                  </motion.li>
                  <motion.li whileHover={{ x: 5, scale: 1.05 }} transition={{ duration: 0.2 }}>
                    <a href="#" className="hover:text-green-400 transition-all duration-300 hover:drop-shadow-sm">Privacy</a>
                  </motion.li>
                </ul>
              </div>
            </div>
            
            <div className="border-t mt-8 pt-8 text-center opacity-60">
              <p>&copy; 2024 Statsor. All rights reserved.</p>
            </div>
          </div>
        </motion.footer>

        {/* Powerful Demo Modal */}
        <AnimatePresence>
          {showDemo && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Backdrop */}
              <motion.div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDemo(false)}
              />
              
              {/* Modal Content */}
              <motion.div
                className="relative w-full max-w-6xl max-h-[90vh] rounded-2xl overflow-hidden bg-gray-900 shadow-2xl"
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                        <Play className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">
                          Statsor Demo
                        </h2>
                        <p className="text-sm opacity-70">
                          See how Statsor transforms football coaching
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDemo(false)}
                      className="hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Video Player */}
                <div className="relative bg-black">
                  <div className="aspect-video relative">
                    {/* Placeholder for video - you can replace with actual video */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-4 mx-auto">
                          <Play className="h-12 w-12 text-green-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Interactive Demo Coming Soon
                        </h3>
                        <p className="text-gray-400 max-w-md">
                          Experience the full power of Statsor with our interactive demo. See real-time analytics, player tracking, and AI insights in action.
                        </p>
                      </div>
                    </div>
                    
                    {/* Video Controls */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="bg-black/50 hover:bg-black/70 text-white"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsMuted(!isMuted)}
                          className="bg-black/50 hover:bg-black/70 text-white"
                        >
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="bg-black/50 hover:bg-black/70 text-white"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Demo Features */}
                <div className="p-6 bg-gray-900">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                        <BarChart3 className="h-6 w-6 text-blue-500" />
                      </div>
                      <h4 className="font-semibold mb-2">
                        Real-time Analytics
                      </h4>
                      <p className="text-sm opacity-70">
                        Live match statistics and performance insights
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                        <Users className="h-6 w-6 text-green-500" />
                      </div>
                      <h4 className="font-semibold mb-2">
                        Player Tracking
                      </h4>
                      <p className="text-sm opacity-70">
                        Individual performance monitoring and analysis
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                        <Zap className="h-6 w-6 text-purple-500" />
                      </div>
                      <h4 className="font-semibold mb-2">
                        AI Insights
                      </h4>
                      <p className="text-sm opacity-70">
                        Smart tactical recommendations and predictions
                      </p>
                    </div>
                  </div>
                  
                  {/* CTA Buttons */}
                  <div className="flex justify-center space-x-4 mt-8">
                    <Button
                      size="lg"
                      className="bg-green-500 hover:bg-green-600 text-white px-8"
                      onClick={() => setShowDemo(false)}
                    >
                      Start Free Trial
                    </Button>
                    {enableMockAuth && (
                      <Button
                        variant="outline"
                        size="lg"
                        className="px-8"
                        onClick={() => setShowDemo(false)}
                      >
                        Schedule Demo
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>
    </AnimatePresence>
  );
};

export default Index;
