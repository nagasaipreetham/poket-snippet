import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import SnippetModule from '../components/Modules/SnippetModule';
import CompilerInterface from '../components/Compiler/CompilerInterface';
import useCompilerStore from '../store/compilerStore';
import { Play, Terminal, ChevronDown, RefreshCw, Sparkles, Wand2, Pen, Eraser, Square, Circle, Type, Image, MousePointer2 } from 'lucide-react';

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
  const snippetSectionRef = useRef(null);
  const isSnippetInView = useInView(snippetSectionRef, { margin: "-50% 0% -20% 0%", once: true });
  const compilerSectionRef = useRef(null);
  const isCompilerInView = useInView(compilerSectionRef, { margin: "-50% 0% -20% 0%", once: true });
  const compilerContainerRef = useRef(null);
  const { setCode: setCompilerCode } = useCompilerStore();


  // Snippet Preview State & Logic
  const fullBinarySearchCode = `public class BinarySearchExample {\n    public static void main(String[] args) {\n\n        int[] arr = {2, 4, 6, 8, 10, 12, 14};\n        int target = 10;\n\n        int low = 0;\n        int high = arr.length - 1;\n\n        while (low <= high) {\n            int mid = (low + high) / 2;\n\n            if (arr[mid] == target) {\n                System.out.println("Element found at index: " + mid);\n                return;\n            } \n            else if (arr[mid] < target) {\n                low = mid + 1;\n            } \n            else {\n                high = mid - 1;\n            }\n        }\n\n        System.out.println("Element not found");\n    }\n}`;

  const [mockSnippet, setMockSnippet] = useState({
    codeTitle: "Binary Search Implementation",
    language: "java",
    content: "",
    description: "A clear and efficient implementation of the Binary Search algorithm in Java. This O(log n) approach is ideal for searching sorted arrays.",
    expectedOutput: "Element found at index: 4",
    customMetadata: []
  });

  const [isSearchingSimilar, setIsSearchingSimilar] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const recommendationData = {
    tagsAssigned: ["Binary Search"],
    easy: [
      { acRate: "48.6", difficulty: "Easy", frontendQuestionId: "35", title: "Search Insert Position", titleSlug: "search-insert-position", topicTags: "['Array', 'Binary Search']" },
      { acRate: "40.1", difficulty: "Easy", frontendQuestionId: "69", title: "Sqrt(x)", titleSlug: "sqrtx", topicTags: "['Math', 'Binary Search']" },
      { acRate: "69.3", difficulty: "Easy", frontendQuestionId: "222", title: "Count Complete Tree Nodes", titleSlug: "count-complete-tree-nodes", topicTags: "['Binary Search', 'Bit Manipulation', 'Tree', 'Binary Tree']" }
    ],
    medium: [
      { acRate: "42.5", difficulty: "Medium", frontendQuestionId: "33", title: "Search in Rotated Sorted Array", titleSlug: "search-in-rotated-sorted-array", topicTags: "['Array', 'Binary Search']" },
      { acRate: "46.4", difficulty: "Medium", frontendQuestionId: "34", title: "Find First and Last Position of Element in Sorted Array", titleSlug: "find-first-and-last-position-of-element-in-sorted-array", topicTags: "['Array', 'Binary Search']" },
      { acRate: "51.9", difficulty: "Medium", frontendQuestionId: "74", title: "Search a 2D Matrix", titleSlug: "search-a-2d-matrix", topicTags: "['Array', 'Binary Search', 'Matrix']" }
    ],
    hard: [
      { acRate: "43.2", difficulty: "Hard", frontendQuestionId: "4", title: "Median of Two Sorted Arrays", titleSlug: "median-of-two-sorted-arrays", topicTags: "['Array', 'Binary Search', 'Divide and Conquer']" },
      { acRate: "44.0", difficulty: "Hard", frontendQuestionId: "154", title: "Find Minimum in Rotated Sorted Array II", titleSlug: "find-minimum-in-rotated-sorted-array-ii", topicTags: "['Array', 'Binary Search']" },
      { acRate: "59.5", difficulty: "Hard", frontendQuestionId: "302", title: "Smallest Rectangle Enclosing Black Pixels", titleSlug: "smallest-rectangle-enclosing-black-pixels", topicTags: "['Array', 'Binary Search', 'Depth-First Search', 'Breadth-First Search', 'Matrix']" },
    ]
  };

  // Typing effect - Starts when snippet section enters vertical center
  useEffect(() => {
    if (!isSnippetInView) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= fullBinarySearchCode.length) {
        setMockSnippet(prev => ({
          ...prev,
          content: fullBinarySearchCode.slice(0, currentIndex)
        }));
        currentIndex += 3; // Chunk characters to reduce re-renders (1/3 the frequency)
      } else {
        clearInterval(interval);
        // Auto-trigger "Find Similar" logic - 2 sec wait as requested
        setIsSearchingSimilar(true);
        setTimeout(() => {
          setIsSearchingSimilar(false);
          setShowRecommendations(true);
        }, 2000);
      }
    }, 16); // 16ms (~60fps) is much better for performance than 5ms
    return () => clearInterval(interval);
  }, [isSnippetInView]);

  // Compiler Demo Animation Logic
  const fullCompilerCode = `import java.util.Scanner;

public class BinarySearchExample {
    public static void main(String[] args) {

        int[] arr = {2, 4, 6, 8, 10, 12, 14};

        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter the target element: ");
        int target = scanner.nextInt();

        int low = 0;
        int high = arr.length - 1;

        while (low <= high) {
            int mid = (low + high) / 2;

            if (arr[mid] == target) {
                System.out.println("Element found at index: " + mid);
                return;
            } 
            else if (arr[mid] < target) {
                low = mid + 1;
            } 
            else {
                high = mid - 1;
            }
        }

        System.out.println("Element not found");
    }
}`;
  const fullCompilerInput = `Enter the target element: 10`;

  useEffect(() => {
    if (!isCompilerInView) return;

    let codeIndex = 0;
    let inputIndex = 0;
    let isDemoComplete = false;

    // reset compiler state first
    setCompilerCode("");

    // Set Java Language visually without popup
    setTimeout(() => {
      const currentLangBtn = Array.from(compilerContainerRef.current?.querySelectorAll('button') || [])
        .find(b => b.textContent.includes('JavaScript') || b.textContent.includes('Python') || b.textContent.includes('Java'));

      if (currentLangBtn) {
        const span = currentLangBtn.querySelector('span');
        if (span) {
          span.textContent = 'Java';
          span.style.color = '#E76F00';
        }
      }

      setTimeout(() => {
        startTypingSequence();
      }, 500);
    }, 500);

    const outputHtml = `
      <div class="text-gray-300 font-mono text-[11px]">
        <div class="flex items-center gap-2 border-b border-white/5 pb-2 mb-2">
           <span class="text-gray-500 font-semibold uppercase text-[9px]">Status:</span>
           <span class="text-[9px] font-medium px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">Success</span>
           <span class="text-gray-600 text-[9px] ml-auto">Time: 0.12s</span>
        </div>
        <div class="opacity-70 font-mono">Enter the target element: 10</div>
        <div class="text-white font-bold mt-1 bg-white/5 py-1 px-2 rounded inline-block border border-white/10 font-mono">Element found at index: 4</div>
      </div>
    `;

    // Persistence helper
    const applyMockResults = () => {
      // Re-inject output data if visible
      const outputArea = compilerContainerRef.current?.querySelector('.overflow-auto');
      if (outputArea && !outputArea.querySelector('textarea')) {
        outputArea.innerHTML = outputHtml;
      }

      // Re-inject input data if visible
      const textarea = compilerContainerRef.current?.querySelector('textarea[placeholder*="input"]');
      if (textarea) {
        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
        nativeTextAreaValueSetter.call(textarea, fullCompilerInput);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };

    // Tab click listener for persistence
    const handleTabClick = (e) => {
      if (!isDemoComplete) return; // Prevent simulated clicks from triggering results prematurely
      const btn = e.target.closest('button');
      if (!btn) return;
      const text = btn.textContent || '';
      if (text.includes('Input') || text.includes('Output')) {
        // Longer timeout to allow React to mount the respective panel
        setTimeout(applyMockResults, 150);
      }
    };

    const container = compilerContainerRef.current;
    if (container) {
      container.addEventListener('click', handleTabClick, true); // Capture phase to catch clicks early
    }

    const startTypingSequence = () => {
      const typeCode = setInterval(() => {
        if (codeIndex < fullCompilerCode.length) {
          setCompilerCode(fullCompilerCode.substring(0, codeIndex + 3));
          codeIndex += 3;
        } else {
          clearInterval(typeCode);

          // Phase 2: Input Animation
          setTimeout(() => {
            // Switch to Input tab
            const tabs = Array.from(compilerContainerRef.current?.querySelectorAll('button') || []);
            const inputTab = tabs.find(b => b.textContent && b.textContent.includes('Input'));
            if (inputTab) inputTab.click();

            // Wait for Input textarea to mount securely
            setTimeout(() => {
              const typeInput = setInterval(() => {
                if (inputIndex < fullCompilerInput.length) {
                  // Use placeholder-based selector to be 100% sure it's the input box
                  const textarea = compilerContainerRef.current?.querySelector('textarea[placeholder*="input"]');
                  if (textarea) {
                    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                    nativeTextAreaValueSetter.call(textarea, fullCompilerInput.substring(0, inputIndex + 1));
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                  inputIndex += 1;
                } else {
                  clearInterval(typeInput);

                  // Phase 3: Trigger Run
                  setTimeout(() => {
                    const runBtn = Array.from(compilerContainerRef.current?.querySelectorAll('button') || [])
                      .find(b => b.textContent.includes('Run'));

                    if (runBtn) {
                      runBtn.innerHTML = '<div class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Running';
                      runBtn.classList.add('opacity-70');

                      setTimeout(() => {
                        runBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run';
                        runBtn.classList.remove('opacity-70');

                        // Switch to Output tab
                        const outputTab = Array.from(compilerContainerRef.current?.querySelectorAll('button') || [])
                          .find(b => b.textContent && b.textContent.includes('Output'));
                        if (outputTab) outputTab.click();

                        setTimeout(() => {
                          applyMockResults();
                          isDemoComplete = true; // Enable persistence for manual 
                        }, 200);
                      }, 2000);
                    }
                  }, 500);
                }
              }, 60); // Slightly more realistic typing speed
            }, 400); // Increased mount delay to 400ms for safety
          }, 800);
        }
      }, 16);
    };

    return () => {
      clearInterval(typeCode);
      if (container) {
        container.removeEventListener('click', handleTabClick, true);
      }
    };
  }, [isCompilerInView, setCompilerCode]);

  // Refined: Static UI Injection to avoid flicker
  useEffect(() => {
    const injectStaticButtons = () => {
      const actionsDiv = compilerContainerRef.current?.querySelector('.flex.items-center.gap-3.relative');
      if (actionsDiv && !actionsDiv.querySelector('[data-auto-complete-demo]')) {
        const convertBtn = Array.from(actionsDiv.querySelectorAll('button'))
          .find(b => b.textContent.includes('Convert'));

        if (convertBtn) {
          const autoBtn = document.createElement('div');
          autoBtn.setAttribute('data-auto-complete-demo', 'true');
          autoBtn.innerHTML = `
            <div class="flex items-center gap-2 px-4 py-1.5 bg-[#1e1e1e] border-2 border-yellow-500/30 text-yellow-500 rounded-full text-xs font-medium transition-all shadow-sm opacity-100 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
              Auto Complete
            </div>
          `;
          actionsDiv.insertBefore(autoBtn, convertBtn);
        }
      }
    };

    // Use MutationObserver to detect when the compiler toolbar is rendered
    const observer = new MutationObserver(() => {
      injectStaticButtons();
    });

    if (compilerContainerRef.current) {
      observer.observe(compilerContainerRef.current, { childList: true, subtree: true });
      injectStaticButtons(); // Initial attempt
    }

    return () => observer.disconnect();
  }, []);

  const handleSnippetPreviewUpdate = (updates) => {
    let newUpdates = { ...updates };

    if ('content' in newUpdates) {
      delete newUpdates.content; // Strict editor freeze
    }

    // Prevent desc & expected output updates
    if ('description' in newUpdates && newUpdates.description !== mockSnippet.description) {
      delete newUpdates.description;
    }
    if ('expectedOutput' in newUpdates && newUpdates.expectedOutput !== mockSnippet.expectedOutput) {
      delete newUpdates.expectedOutput;
    }

    if ('customMetadata' in newUpdates && newUpdates.customMetadata.length > 1 && newUpdates.customMetadata.length > mockSnippet.customMetadata.length) {
      toast('Maximum of 1 custom field allowed in preview.', {
        icon: '🔒',
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
      return;
    }
    setMockSnippet(prev => ({ ...prev, ...newUpdates }));
  };

  const handleSnippetPreviewClick = (e) => {
    const btn = e.target.closest('button');
    if (btn) {
      const text = (btn.innerText || btn.textContent || '').toLowerCase();
      if (text.includes('run') || text.includes('ask ai') || text.includes('find similar')) {
        e.stopPropagation();
        e.preventDefault();
        toast('This feature is disabled during preview.', {
          icon: '🔒',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      }
    }

    // Additional click block for text areas in desc and exp output
    const metadataField = e.target.closest('.border.border-border.rounded-lg.bg-surface');
    if (metadataField && (e.target.tagName === 'TEXTAREA' || e.target.closest('button'))) {
      const isCustom = metadataField.querySelector('input[placeholder="Field Title"]');
      if (!isCustom && e.target.tagName === 'TEXTAREA') {
        e.preventDefault();
        e.stopPropagation();
        e.target.blur();
        toast('Editing this text is disabled in preview.', {
          icon: '🔒', id: 'meta-lock', style: { borderRadius: '10px', background: '#333', color: '#fff' }
        });
      }
    }
  };

  const handleSnippetPreviewKeyDown = (e) => {
    // Block keys for Code Editor (Monaco)
    if (e.target.closest('.monaco-editor')) {
      const allowed = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'];
      if (!allowed.includes(e.key) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        toast('Editing is disabled in preview.', {
          icon: '🔒', id: 'editor-lock', style: { borderRadius: '10px', background: '#333', color: '#fff' }
        });
      }
    }

    // Block keys for Metadata Textareas
    const metadataField = e.target.closest('.border.border-border.rounded-lg.bg-surface');
    if (metadataField && e.target.tagName === 'TEXTAREA') {
      const isCustom = metadataField.querySelector('input[placeholder="Field Title"]');
      if (!isCustom) {
        const allowed = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'];
        if (!allowed.includes(e.key) && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          toast('Editing this text is disabled in preview.', {
            icon: '🔒', id: 'meta-lock', style: { borderRadius: '10px', background: '#333', color: '#fff' }
          });
        }
      }
    }
  };

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
                    Poket <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Snippet</span>
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
                    Poket Snippet helps in organizing and accessing code snippets and allows you to retrieve them from anywhere.
                    It also includes AI-powered features that help refine and improve your code.
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Snippet Module Preview Section */}
      <section
        ref={snippetSectionRef}
        className="w-full max-w-7xl mx-auto px-6 pt-8 pb-20 relative z-10"
      >
        <div className="flex flex-col lg:flex-row items-start justify-between gap-16 lg:gap-24">

          {/* Left Side: Matter / Info Box */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="w-full lg:w-[30%] flex flex-col items-start"
          >
            <div className="mb-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 font-sans tracking-tight">
                Snippet module
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
            </div>

            <div className="floating-nav p-8 rounded-3xl w-full border border-white/10 shadow-2xl relative overflow-hidden group">
              {/* Subtle hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <h3 className="text-2xl font-bold text-white mb-6 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-purple-400 fill-current">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm1 9h-4v2h4v-2zm-4 4h4v2h-4v-2zm5 5H6V4h7v5h5v11z" />
                  </svg>
                </div>
                The Smart Notebook
              </h3>

              <div className="space-y-6 text-gray-300">
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <p className="leading-relaxed">
                    <span className="text-white font-bold">Maintain & Organize.</span> Keep your code clean, readable, and perfectly organized for easy access from anywhere.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                  <p className="leading-relaxed">
                    <span className="text-white font-bold">Metadata.</span> Add powerful context with interactive descriptions, expected outputs, and custom metadata fields.
                  </p>
                </div>
              </div>

              {/* Decorative accent */}
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Feature Showcase</span>
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                </div>
              </div>
            </div>

            {/* Second Box: LeetCode Feature (Appears after load) */}
            <AnimatePresence>
              {showRecommendations && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="floating-nav p-8 rounded-3xl w-full border border-white/10 shadow-2xl relative overflow-hidden mt-[160px] group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <h3 className="text-xl font-bold text-white mb-4 tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <img src="/leetcode-logo.png" alt="LeetCode" className="w-5 h-5 object-contain" />
                    </div>
                    Smart Recommendations
                  </h3>

                  <p className="text-gray-400 leading-relaxed text-sm">
                    Our system analyzes the code stored in your snippets and <span className="text-yellow-500/90 font-medium">suggests relevant LeetCode problems</span> related to that specific concept, helping you bridge the gap between notes and practice.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <style>{`
            /* Strict Read-Only for Monaco Editor */
            .snippet-preview .monaco-editor .inputarea {
                display: none !important;
            }
            /* Visual Merge: Make Module appear as part of the container */
            .snippet-preview > div:first-child {
                border: none !important;
                border-radius: 12px 12px 0 0 !important;
                margin-bottom: 0 !important;
                box-shadow: none !important;
                background-color: transparent !important;
            }
            /* Fix footer bar height and line */
            .snippet-preview .h-10.bg-\\[\\#1e1e1e\\].border-t {
                border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
            }
            /* Reduce height of code editor by 10% */
            .snippet-preview .bg-\\[\\#191919\\].relative.group {
                height: 450px !important;
            }
          `}</style>

          {/* Right Side: Interactive Module Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="w-full lg:w-[62%] flex flex-col items-center"
          >
            <div
              className="snippet-preview w-full shadow-2xl shadow-purple-900/10 rounded-xl border border-white/10 bg-[#1e1e1e] transition-all overflow-hidden relative"
              onClickCapture={handleSnippetPreviewClick}
              onKeyDownCapture={handleSnippetPreviewKeyDown}
            >
              <SnippetModule
                module={mockSnippet}
                snippetId="preview-id"
                onUpdate={handleSnippetPreviewUpdate}
                isDragging={false}
              />

              {/* Integrated Loading Overlay - Replaces/Overlays the bottom section */}
              <AnimatePresence>
                {isSearchingSimilar && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-0 left-0 right-0 h-10 bg-[#1e1e1e] flex items-center px-4 z-20"
                  >
                    <div className="ml-auto flex items-center space-x-2 text-yellow-500 font-bold text-xs uppercase tracking-tight">
                      <div className="w-3.5 h-3.5 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                      <span>Searching LeetCode...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Integrated LeetCode Style Recommendations */}
              <AnimatePresence>
                {showRecommendations && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="p-5 bg-[#1e1e1e] border-t border-white/10 flex flex-col gap-4 overflow-hidden"
                  >
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      <img src="/leetcode-logo.png" alt="LeetCode Logo" className="w-5 h-5 object-contain" />
                      Recommended LeetCode Practice
                      <span className="text-xs text-gray-500 font-normal ml-2">
                        (Based on: <span className="text-gray-300">Binary Search</span>)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      {/* EASY */}
                      <div className="flex flex-col gap-2">
                        <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-widest pl-1 mb-1 opacity-80">Easy</h3>
                        {recommendationData.easy.map(prob => (
                          <div key={prob.frontendQuestionId} className="group flex flex-col border border-emerald-500/20 bg-white/0 hover:bg-emerald-500/5 p-3 rounded-lg border-dashed transition-all cursor-default">
                            <span className="font-bold text-emerald-400 mb-1 leading-tight text-xs">{prob.frontendQuestionId}. {prob.title}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] text-gray-500 font-mono">{prob.acRate}% Acceptance</span>
                              <div className="text-[9px] border border-emerald-500/30 rounded px-1.5 py-0.5 text-emerald-500/60 uppercase font-black">Tags</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* MEDIUM */}
                      <div className="flex flex-col gap-2">
                        <h3 className="text-[11px] font-black text-orange-500 uppercase tracking-widest pl-1 mb-1 opacity-80">Medium</h3>
                        {recommendationData.medium.map(prob => (
                          <div key={prob.frontendQuestionId} className="group flex flex-col border border-orange-500/20 bg-white/0 hover:bg-orange-500/5 p-3 rounded-lg border-dashed transition-all cursor-default">
                            <span className="font-bold text-orange-400 mb-1 leading-tight text-xs">{prob.frontendQuestionId}. {prob.title}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] text-gray-500 font-mono">{prob.acRate}% Acceptance</span>
                              <div className="text-[9px] border border-orange-500/30 rounded px-1.5 py-0.5 text-orange-500/60 uppercase font-black">Tags</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* HARD */}
                      <div className="flex flex-col gap-2">
                        <h3 className="text-[11px] font-black text-rose-500 uppercase tracking-widest pl-1 mb-1 opacity-80">Hard</h3>
                        {recommendationData.hard.map(prob => (
                          <div key={prob.frontendQuestionId} className="group flex flex-col border border-rose-500/20 bg-white/0 hover:bg-rose-500/5 p-3 rounded-lg border-dashed transition-all cursor-default">
                            <span className="font-bold text-rose-400 mb-1 leading-tight text-xs">{prob.frontendQuestionId}. {prob.title}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] text-gray-500 font-mono">{prob.acRate}% Acceptance</span>
                              <div className="text-[9px] border border-rose-500/30 rounded px-1.5 py-0.5 text-rose-500/60 uppercase font-black">Tags</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      <section
        ref={compilerSectionRef}
        className="w-full max-w-7xl mx-auto px-6 py-20 relative z-10"
      >
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-10">

          {/* Left Column: Compiler Demo UI (54%) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="w-full lg:w-[57%] flex flex-col"
          >
            <div
              ref={compilerContainerRef}
              className="compiler-preview w-full h-[546px] shadow-2xl shadow-blue-900/10 rounded-xl border border-white/10 overflow-hidden relative"
            >
              <CompilerInterface />
            </div>
          </motion.div>

          <style>{`
            /* Strict Interaction Restrictions for Compiler Demo */
            .compiler-preview .monaco-editor .inputarea,
            .compiler-preview textarea {
                pointer-events: none !important;
            }
            
            /* Block Toolbar actions (Language, Convert, Run, Auto Complete) */
            .compiler-preview > div > div:first-child button {
                pointer-events: none !important;
            }
            
            /* Block Resize handle */
            .compiler-preview .cursor-ns-resize {
                display: none !important;
                pointer-events: none !important;
            }

            .compiler-preview .monaco-editor {
                border-radius: 0 !important;
            }

            /* Instantly hide the Expand/More button to avoid flicker */
            .compiler-preview .flex.items-center.gap-3.relative button:first-child {
                display: none !important;
            }
          `}</style>

          {/* Middle Column: Main Description (21%) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="w-full lg:w-[25%] flex flex-col"
          >
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-white mb-2 font-sans tracking-tight">
                Built-in Compiler
              </h2>
              <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
            </div>

            <div className="floating-nav p-6 rounded-3xl w-full flex-1 border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <h3 className="text-xl font-bold text-white mb-6 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Terminal size={18} className="text-blue-400" />
                </div>
                Execution
              </h3>

              <div className="space-y-6 text-gray-300 text-sm">
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <p className="leading-relaxed">
                    <span className="text-white font-bold text-xs uppercase block mb-1">Write & Run</span>
                    Compile and execute code instantly without local setup.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                  <p className="leading-relaxed">
                    <span className="text-white font-bold text-xs uppercase block mb-1">38 Languages</span>
                    Support for major languages including Java, Python, and C++.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Compiler v2.0</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: AI & Automation Features (21%) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="w-full lg:w-[18%] flex flex-col gap-6"
          >
            {/* Box 1: Auto Convert */}
            <div className="floating-nav p-6 rounded-3xl w-full border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <h3 className="text-lg font-bold text-white mb-3 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <RefreshCw size={16} className="text-indigo-400" />
                </div>
                Auto Convert
              </h3>

              <p className="text-gray-400 leading-relaxed text-xs">
                Instantly <span className="text-indigo-400 font-medium">transform your code</span> from one language to another with a single click, maintaining original logic and structure perfectly.
              </p>
            </div>

            {/* Box 2: AI Assistant */}
            <div className="floating-nav p-6 rounded-3xl w-full border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <h3 className="text-lg font-bold text-white mb-3 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Wand2 size={16} className="text-purple-400" />
                </div>
                Code Assistant
              </h3>

              <p className="text-gray-400 leading-relaxed text-xs">
                AI-powered <span className="text-purple-400 font-medium">auto-complete and bug fixing</span>. Analyze your code in real-time to detect errors and suggest modern optimizations.
              </p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Poket Canvas Feature Section */}
      <section className="w-full max-w-7xl mx-auto px-6 py-20 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">

          {/* Left Side: Information Box */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="w-full lg:w-[32%] flex flex-col items-start"
          >
            <div className="mb-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 font-sans tracking-tight">
                Poket Canvas
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
            </div>

            <div className="floating-nav p-8 rounded-3xl w-full border border-white/10 shadow-2xl relative overflow-hidden group bg-[#0a0a0a]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-6 tracking-tight flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Pen className="w-5 h-5 text-blue-400" />
                  </div>
                  The Infinite Board
                </h3>

                <div className="space-y-6 text-gray-300">
                  <div className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <p className="leading-relaxed">
                      <span className="text-white font-bold">Ultimate Canvas.</span> Sketch architectures, map out data flows, and ideate visually on an infinite handwritten playground. Add images, embed code blocks, draw shapes, and organize elements however you want.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                    <p className="leading-relaxed">
                      <span className="text-white font-bold">Real-time Cloud Sync.</span> Your brilliant ideas are never lost. Every stroke is instantly saved to the cloud, accessible instantly from anywhere, anytime.
                    </p>
                  </div>
                </div>

                {/* Decorative accent */}
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">NOTEBOOK V2.0</span>
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side: Mock Canvas UI */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="w-full lg:w-[68%] flex flex-col items-center"
          >
            <div className="w-full h-[540px] bg-[#1a1a1a] rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden group">
              {/* Canvas Custom Grid Background */}
              <div className="absolute inset-0 opacity-[0.1]" style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}></div>

              {/* Mock Toolbar */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center bg-[#252526]/90 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl z-20">
                <div className="flex items-center gap-1">
                  <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl shadow-lg border border-blue-500/30">
                    <Pen size={18} />
                  </div>
                  <div className="p-2.5 text-gray-400 rounded-xl">
                    <Eraser size={18} />
                  </div>
                </div>

                <div className="w-px h-6 bg-white/10 mx-2"></div>

                <div className="flex items-center gap-1">
                  <div className="p-2.5 text-gray-400 rounded-xl">
                    <Square size={18} />
                  </div>
                  <div className="p-2.5 text-gray-400 rounded-xl">
                    <Circle size={18} />
                  </div>
                  <div className="p-2.5 text-gray-400 rounded-xl">
                    <Type size={18} />
                  </div>
                  <div className="p-2.5 text-gray-400 rounded-xl">
                    <Image size={18} />
                  </div>
                </div>

                <div className="w-px h-6 bg-white/10 mx-2"></div>

                <div className="p-2.5 text-gray-400 rounded-xl">
                  <MousePointer2 size={18} />
                </div>
              </div>

              {/* Mock Drawing Elements (Static & Animated) */}
              <div className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Drawing path simulating a pen stroke (Above Line - starts first) */}
                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                  <motion.path
                    d="M 150 200 Q 250 150 400 250 T 550 230 T 650 300"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                  />
                </svg>

                {/* Connection Line (Below Line - starts after the first completes) */}
                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                  <motion.path
                    d="M 200 300 C 300 300, 400 400, 500 400"
                    fill="transparent"
                    stroke="#a855f7"
                    strokeWidth="3"
                    strokeDasharray="8 8"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 0.8 }}
                    viewport={{ once: true }}
                    transition={{ duration: 2, ease: "easeInOut", delay: 2.5 }}
                  />
                </svg>
              </div>

              {/* Info Pill */}
              <div className="absolute bottom-6 right-6 flex items-center gap-3">
                <div className="px-4 py-2 bg-purple-500/10 backdrop-blur-md border border-purple-500/20 rounded-full text-[11px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2 shadow-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>
                  Infinite Canvas
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

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

