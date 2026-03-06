import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DottedBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let dots = [];
    let ripples = [];
    let idleTimer;
    const spacing = 35;
    const mouse = { x: null, y: null, radius: 180, isIdle: false };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    class Dot {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.originX = x;
        this.originY = y;
        this.vx = 0;
        this.vy = 0;
        this.size = 2.5;
        this.friction = 0.92; // Higher value = more fluid movement
        this.springStrength = 0.02; // Lower value = less "rubbery" snapping
      }

      draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }

      update() {
        // 1. Mouse Interaction Physics
        if (mouse.x !== null && !mouse.isIdle) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < mouse.radius) {
            // Geometrical/Exponential falloff: squared for steeper curve
            const force = Math.pow((mouse.radius - distance) / mouse.radius, 2);
            const angle = Math.atan2(dy, dx);
            // Significantly reduced strength for a subtle gathering effect
            const moveX = Math.cos(angle) * force * 3;
            const moveY = Math.sin(angle) * force * 3;

            this.vx += moveX;
            this.vy += moveY;
          }
        }

        // 2. Click Ripple Physics
        ripples.forEach(ripple => {
          const dx = this.x - ripple.x;
          const dy = this.y - ripple.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const waveWidth = 80;
          if (Math.abs(distance - ripple.currentRadius) < waveWidth) {
            const force = (1 - Math.abs(distance - ripple.currentRadius) / waveWidth) * ripple.strength;
            const angle = Math.atan2(dy, dx);
            this.vx += Math.cos(angle) * force;
            this.vy += Math.sin(angle) * force;
          }
        });

        // 3. Return-to-Origin (Spring Physics)
        const dxOrig = this.originX - this.x;
        const dyOrig = this.originY - this.y;

        const ax = dxOrig * this.springStrength;
        const ay = dyOrig * this.springStrength;

        this.vx += ax;
        this.vy += ay;

        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;
      }
    }

    const init = () => {
      dots = [];
      const cols = Math.ceil(canvas.width / spacing) + 1;
      const rows = Math.ceil(canvas.height / spacing) + 1;

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          dots.push(new Dot(j * spacing, i * spacing));
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and Draw dots
      dots.forEach(dot => {
        dot.update();
        dot.draw();
      });

      // Update ripples
      ripples.forEach((ripple, index) => {
        ripple.currentRadius += ripple.speed;
        ripple.strength *= 0.97; // Slower decay for water feel
        if (ripple.strength < 0.1 || ripple.currentRadius > Math.max(canvas.width, canvas.height) * 2) {
          ripples.splice(index, 1);
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.isIdle = false;

      // Reset idle timer
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        mouse.isIdle = true;
      }, 500);
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
      mouse.isIdle = false;
      if (idleTimer) clearTimeout(idleTimer);
    };

    const handleClick = (e) => {
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        currentRadius: 0,
        speed: 6, // Slower ripple for water effect
        strength: 15
      });
    };

    window.addEventListener('resize', resize);
    window.addEventListener('blur', handleMouseLeave);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mousedown', handleClick);

    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('blur', handleMouseLeave);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousedown', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" />;
};

const Login = () => {
  const { login: setAuthUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showHeroText, setShowHeroText] = useState(false);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  // Hover tracking for top bar
  const navRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHoveringNav, setIsHoveringNav] = useState(false);

  const handleMouseMoveNav = (e) => {
    if (navRef.current) {
      const rect = navRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const accessToken = tokenResponse.access_token;

        // AUTHENTICATE WITH BACKEND
        const backendResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ access_token: accessToken }),
        });

        if (!backendResponse.ok) {
          const errorData = await backendResponse.json().catch(() => ({}));
          console.error('Backend Auth Failed:', backendResponse.status, backendResponse.statusText, errorData);
          throw new Error(errorData.msg || 'Backend authentication failed');
        }

        const user = await backendResponse.json();

        // Save user to context (include accessToken for future API calls)
        setAuthUser({
          ...user, // This now includes the 5-day JWT accessToken from backend
        });

        toast.success(`Welcome back, ${user.name}!`);
        setIsLoginModalOpen(false);
        navigate('/');
      } catch (error) {
        console.error('Login Error:', error);

        let errorMessage = 'Authentication failed. Please try again.';
        if (error.message && error.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to server. Is the backend running?';
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);
        setAuthUser(null);
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      toast.error('Sign in failed. Please try again.');
      setLoading(false);
    }
  });

  return (
    <div className="min-h-screen w-full bg-black relative overflow-hidden font-sans text-white select-none">
      <DottedBackground />
      <style>{`
        .glass-card {
            width: 240px;
            height: 360px;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.5),
            inset 0 -1px 0 rgba(255, 255, 255, 0.1),
            inset 0 0 20px 10px rgba(255, 255, 255, 1);
            position: relative;
            overflow: hidden;
        }
        
        .glass-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.8),
            transparent
            );
        }
        
        .glass-card::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 1px;
            height: 100%;
            background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.8),
            transparent,
            rgba(255, 255, 255, 0.3)
            );
        }

        .floating-nav {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>

      {/* Top Floating Bar */}
      <nav
        ref={navRef}
        onMouseMove={handleMouseMoveNav}
        onMouseEnter={() => setIsHoveringNav(true)}
        onMouseLeave={() => setIsHoveringNav(false)}
        className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-7xl floating-nav rounded-2xl flex items-center justify-between px-6 py-4 z-50 shadow-2xl overflow-hidden"
      >
        {/* Interactive Gradient Glow */}
        <div
          className="absolute pointer-events-none transition-opacity duration-500 rounded-full blur-[40px]"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
            opacity: isHoveringNav ? 1 : 0,
          }}
        />

        <div className="flex items-center space-x-3 relative z-10">
          <img src="/logo2.png" alt="Logo" className="w-8 h-8 object-contain" />
          <div className="text-xl font-bold tracking-wide text-white font-sans">
            Poket Snippet
          </div>
        </div>
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="px-6 py-2 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] transform hover:-translate-y-0.5"
        >
          Login
        </button>
      </nav>

      {/* Hero Section Content */}
      <div className="relative z-10 w-[90%] max-w-7xl mx-auto h-screen flex items-center overflow-visible">
        <motion.div
          layout
          className="w-full grid grid-cols-1 md:grid-cols-2 items-center justify-center relative overflow-visible h-full"
          style={{
            gridTemplateColumns: showHeroText ? "1fr 1fr" : "1fr 0fr",
            transition: "grid-template-columns 1.5s cubic-bezier(0.22, 1, 0.36, 1)"
          }}
        >
          {/* Logo Side */}
          <motion.div
            layout
            className="flex justify-center items-center z-20 relative h-full w-full"
          >
            <motion.div
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              transition={{
                duration: 1.2,
                ease: "easeOut",
                delay: 0.5
              }}
              onAnimationComplete={() => {
                if (!showHeroText) {
                  setTimeout(() => setShowHeroText(true), 1500);
                }
              }}
              className="relative p-8 flex justify-center items-center"
            >
              {/* Purple Glow behind logo - Increased size and intensity */}
              <AnimatePresence mode="wait">
                {!showHeroText && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1.2 }}
                    exit={{ opacity: 0, scale: 2.5 }}
                    transition={{ duration: 1.5 }}
                    className="absolute -inset-16 bg-purple-600/40 blur-[100px] rounded-full -z-10 animate-pulse"
                  />
                )}
              </AnimatePresence>

              <motion.img
                layout
                src="/logo2.png"
                alt="Pocket Snippet Logo"
                draggable="false"
                className="w-72 h-72 md:w-96 md:h-96 object-contain drop-shadow-2xl select-none pointer-events-none"
              />
            </motion.div>
          </motion.div>

          {/* Text Content Side - Animates width to push logo smoothly */}
          <div className="flex items-center justify-start h-full w-full overflow-hidden">
            <AnimatePresence>
              {showHeroText && (
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                  className="w-full pl-0 md:pl-16 flex flex-col justify-center items-start text-left"
                >
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="text-6xl md:text-8xl font-black tracking-tighter mb-4 text-white font-sans"
                  >
                    Pocket <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Snippet</span>
                  </motion.h1>

                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-xl md:text-2xl font-medium text-gray-300 mb-6 tracking-wide"
                  >
                    The Smart Notebook for Programmers.
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="text-gray-400 text-lg leading-relaxed max-w-xl md:mx-0"
                  >
                    Pocket Snippet helps in organizing and accessing code snippets and allows you to retrieve them from anywhere.
                    It also includes AI-powered features that help refine and improve your code.
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Main Landing Page Content Area */}
      <main className="min-h-screen flex flex-col items-center justify-center">
        {/* Future Modules will go here */}
      </main>

      {/* Login Modal */}
      {
        isLoginModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setIsLoginModalOpen(false)}></div>

            {/* We maintain the user's old styling for the popup to look consistent, overriding the fixed dimensions if we used the .glass-card class directly. Given .glass-card has width 240px and height 360px which might explicitly crop content, let's keep the existing UI for the popup but inside the modal context */}
            <div className="relative z-10 w-full max-w-md p-8 rounded-2xl bg-[#191919] border border-white/10 shadow-2xl flex flex-col items-center">
              {/* Close Button */}
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              {/* Logo/Icon */}
              <div className="mb-8 p-4 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 shadow-lg shadow-purple-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2 font-sans tracking-tight">
                Welcome Back
              </h1>
              <p className="text-gray-400 mb-10 text-center text-sm">
                Sign in to access your snippets and folders
              </p>

              {/* Custom Google Button */}
              <div
                onClick={() => !loading && login()}
                className={`group relative flex items-center justify-center w-full px-6 py-3.5 
                        bg-white hover:bg-gray-50 active:bg-gray-100
                        text-gray-700 font-medium rounded-xl transition-all duration-200 
                        cursor-pointer select-none shadow-lg shadow-black/20 overflow-hidden
                        ${loading ? 'opacity-70 pointer-events-none' : ''}`}
              >
                {/* Loading State Overlay */}
                {loading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                )}

                <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50/50 transition-colors duration-200" />

                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-6 h-6 mr-3 z-10"
                />
                <span className="z-10 font-roboto">Continue with Google</span>
              </div>

              <div className="mt-8 text-xs text-gray-500 text-center">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Login;

