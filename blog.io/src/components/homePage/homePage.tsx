import React, { useState, useEffect, FC } from 'react';
import { motion, AnimatePresence, useSpring, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getSession } from '@/actions/cookies';
import Image from 'next/image';

interface AuthProps {
    isAuthenticated: boolean;
}

interface HeaderProps extends AuthProps {
    isMenuOpen: boolean;
    setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isScrolled: boolean;
}

const StarIcon = ({ size = 28, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
);
const CheckCircleIcon = ({ size = 20, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);
const ArrowRightIcon = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`inline-block ml-2 ${className}`}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
);
const MenuIcon = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);
const XIcon = ({ size = 24, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const SparklesIcon = ({ size = 28, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9L12 18l1.9-5.8 5.8-1.9-5.8-1.9L12 3zM5 21l1.9-5.8L1 13.3l5.8-1.9L5 21zm18-4-1.9 5.8-5.8 1.9 5.8 1.9L19 3l1.9 5.8 5.8 1.9-5.8-1.9z"/></svg>
);
const BotIcon = ({ size = 28, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 8V4H8V8H4v4h4v4h4v4h4v-4h4v-4h-4V8z"/><rect x="4" y="8" width="16" height="8" rx="2" /><path d="M9 16v-4" /><path d="M15 16v-4" /></svg>
);
const ZapIcon = ({ size = 28, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
);
const CodeIcon = ({ size = 28, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
);
const ChevronDownIcon = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"></polyline></svg>
);
const EyeIcon = ({ size = 28, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
const HistoryIcon = ({ size = 28, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
);
const LayersIcon = ({ size = 28, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
);
const TagIcon = ({ size = 28, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
);

const SvgGooFilter = () => (
    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style={{ display: 'none' }}>
      <defs>
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </defs>
    </svg>
);

const CustomCursor = () => {
    const colors = [
        'bg-fuchsia-500', 
        'bg-cyan-400', 
        'bg-emerald-400', 
        'bg-orange-400', 
        'bg-indigo-500'
    ];
    const [colorIndex, setColorIndex] = useState(0);

    useEffect(() => {
        const colorInterval = setInterval(() => {
            setColorIndex(prevIndex => (prevIndex + 1) % colors.length);
        }, 2000); 

        return () => {
            clearInterval(colorInterval);
        };
    }, [colors.length]);
    
    const currentColor = colors[colorIndex];

    const springConfig = (stiffness: number, damping: number) => ({
        stiffness,
        damping,
        restDelta: 0.001
    });

    const mouseX = useSpring(-100, springConfig(1200, 60));
    const mouseY = useSpring(-100, springConfig(1200, 60));
    const dot2X = useSpring(-100, springConfig(700, 50));
    const dot2Y = useSpring(-100, springConfig(700, 50));
    const dot3X = useSpring(-100, springConfig(400, 40));
    const dot3Y = useSpring(-100, springConfig(400, 40));
    const dot4X = useSpring(-100, springConfig(200, 30));
    const dot4Y = useSpring(-100, springConfig(200, 30));
    const dot5X = useSpring(-100, springConfig(100, 20));
    const dot5Y = useSpring(-100, springConfig(100, 20));

    useEffect(() => {
        const moveMouse = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
            dot2X.set(e.clientX);
            dot2Y.set(e.clientY);
            dot3X.set(e.clientX);
            dot3Y.set(e.clientY);
            dot4X.set(e.clientX);
            dot4Y.set(e.clientY);
            dot5X.set(e.clientX);
            dot5Y.set(e.clientY);
        };
        
        window.addEventListener('mousemove', moveMouse);
        return () => {
            window.removeEventListener('mousemove', moveMouse);
        };
    }, [mouseX, mouseY, dot2X, dot2Y, dot3X, dot3Y, dot4X, dot4Y, dot5X, dot5Y]);

    const dots = [
        { x: mouseX, y: mouseY, size: 32, opacity: 1 },
        { x: dot2X, y: dot2Y, size: 28, opacity: 0.9 },
        { x: dot3X, y: dot3Y, size: 24, opacity: 0.7 },
        { x: dot4X, y: dot4Y, size: 20, opacity: 0.5 },
        { x: dot5X, y: dot5Y, size: 16, opacity: 0.3 },
    ];

    return (
        <div 
            className="hidden md:block fixed top-0 left-0 w-full h-full pointer-events-none z-10" 
            style={{ filter: 'url(#goo)' }}
        >
            {dots.map((dot, index) => (
                <motion.div
                    key={index}
                    className={`absolute ${currentColor} rounded-full -translate-x-1/2 -translate-y-1/2`}
                    style={{
                        translateX: dot.x,
                        translateY: dot.y,
                        width: dot.size,
                        height: dot.size,
                        opacity: dot.opacity,
                        transition: 'background-color 0.5s ease-in-out'
                    }}
                />
            ))}
        </div>
    );
};

interface TemplateData {
    name: string;
    imgSrc: string;
    description: string;
}

interface TemplateModalProps {
    template: TemplateData | null;
    onClose: () => void;
    isAuthenticated: boolean;
}

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const modalVariants: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.9,
        y: 20,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        y: 20,
        transition: {
            duration: 0.2,
        },
    },
};

const TemplateModal: FC<TemplateModalProps> = ({ template, onClose, isAuthenticated }) => {
    const router = useRouter();
    const [siteName, setSiteName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    if (!template) return null;

    const handleCreateSite = async () => {
        if (!siteName) return;
        setIsCreating(true);
        await new Promise(res => setTimeout(res, 1500));
        setIsCreating(false);
        router.push(`/dashboard/editor/${siteName.toLowerCase().replace(/\s+/g, '-')}`);
    };

    return (
        <motion.div
            className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            onClick={onClose}
        >
            <motion.div
                className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
                variants={modalVariants}
                exit="exit"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-full md:w-1/2 relative h-64 md:h-auto">
                    <Image
                        src={template.imgSrc}
                        alt={template.name}
                        fill
                        className="object-cover"
                    />
                </div>

                <div className="w-full md:w-1/2 p-8 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-white">{template.name}</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <XIcon size={28} />
                        </button>
                    </div>

                    <p className="text-gray-300 mb-8">{template.description}</p>

                    {isAuthenticated ? (
                        <AuthenticatedContent
                            siteName={siteName}
                            setSiteName={setSiteName}
                            isCreating={isCreating}
                            handleCreateSite={handleCreateSite}
                        />
                    ) : (
                        <UnauthenticatedContent />
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AuthenticatedContent: FC<any> = ({ siteName, setSiteName, isCreating, handleCreateSite }) => (
    <div>
        <label htmlFor="siteName" className="block text-sm font-semibold text-gray-300 mb-2">
            Name your new site:
        </label>
        <input
            id="siteName"
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="e.g., 'My Awesome Portfolio'"
            className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 mb-4"
        />
        <motion.button
            onClick={handleCreateSite}
            disabled={isCreating || !siteName}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-bold px-6 py-3 rounded-md transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isCreating ? 'Creating...' : (
                <>
                    Create Site
                    <ArrowRightIcon className="ml-2" />
                </>
            )}
        </motion.button>
    </div>
);

const UnauthenticatedContent: FC = () => {
    const router = useRouter();
    return (
        <div className="bg-gray-800/50 border border-fuchsia-500/30 p-6 rounded-lg text-center">
            <h3 className="font-semibold text-lg mb-3">Create an account to use this template</h3>
            <p className="text-gray-300 mb-6 text-sm">
                Join for free to start building your portfolio.
            </p>
            <div className="flex flex-col gap-3">
                <motion.button
                    onClick={() => router.push('/signup')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-bold px-6 py-2 rounded-md transition-all"
                >
                    Sign Up for Free
                </motion.button>
                <button
                    onClick={() => router.push('/login')}
                    className="text-gray-300 hover:text-fuchsia-400 transition-colors cursor-pointer"
                >
                    Already have an account? Log In
                </button>
            </div>
        </div>
    );
};


export default function App() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const session = await getSession(); 
            if (session) {
                setIsAuthenticated(true);
            }
        };

        checkAuth();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > window.innerHeight * 0.9) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div className="bg-gray-900 text-white font-sans overflow-x-hidden antialiased relative">
            <SvgGooFilter />
            <CustomCursor />
            
            <AnimatePresence>
                {isMenuOpen && <MobileMenu isAuthenticated={isAuthenticated} />}
            </AnimatePresence>
            
            <main className="relative z-20">
                <HeroSection 
                  isMenuOpen={isMenuOpen} 
                  setIsMenuOpen={setIsMenuOpen} 
                  isAuthenticated={isAuthenticated} 
                  isScrolled={isScrolled}
                />
                <WhyChooseUsSection />
                <HowItWorksSection />
                <TemplatesSection isAuthenticated={isAuthenticated} />
                <FeaturesSection />
                <AIFeaturesSection />
                <VersioningSection />
                <TestimonialsSection />
                <PricingSection />
                <FAQSection />
                <CTASection isAuthenticated={isAuthenticated} />
            </main>
            <Footer />
        </div>
    );
}

const Header: FC<HeaderProps> = ({ isMenuOpen, setIsMenuOpen, isAuthenticated, isScrolled }) => {
    const router = useRouter();
    return (
        <header className={`
            z-30 transition-all duration-300 ease-in-out
            ${isScrolled 
                ? 'fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-lg border-b border-gray-700 shadow-lg' 
                : 'relative'
            }
        `}>
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="text-2xl font-bold tracking-tight">
                    blog<span className="text-fuchsia-400">.io</span>
                </motion.div>
                <nav className="hidden md:flex items-center space-x-8 text-gray-300">
                    <a href="#templates" className="hover:text-fuchsia-400 transition-colors">Templates</a>
                    <a href="#features" className="hover:text-fuchsia-400 transition-colors">Features</a>
                    <a href="#ai-features" className="hover:text-fuchsia-400 transition-colors">AI Magic</a>
                    <a href="#pricing" className="hover:text-fuchsia-400 transition-colors">Pricing</a>
                </nav>
                <div className="hidden md:flex items-center space-x-4">
                    {isAuthenticated ? (
                        <motion.button onClick={() => router.push('/dashboard')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-fuchsia-500 cursor-pointer hover:bg-fuchsia-600 text-white font-semibold px-5 py-2 rounded-lg transition-colors">
                            Continue to Dashboard
                        </motion.button>
                    ) : (
                        <>
                            <button className="text-gray-300 hover:text-fuchsia-400 transition-colors cursor-pointer" onClick={() => router.push('/login')}>Log In</button>
                            <motion.button onClick={() => router.push('/signup')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-fuchsia-500 cursor-pointer hover:bg-fuchsia-600 text-white font-semibold px-5 py-2 rounded-lg transition-colors">
                                Get Started
                            </motion.button>
                        </>
                    )}
                </div>
                <div className="md:hidden">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <XIcon /> : <MenuIcon />}</button>
                </div>
            </div>
        </header>
    );
};

const MobileMenu: FC<AuthProps> = ({ isAuthenticated }) => {
    const router = useRouter();
    return (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="md:hidden bg-gray-800/90 backdrop-blur-lg border-b border-gray-700 fixed top-[69px] left-0 right-0 z-30">
            <div className="container mx-auto px-6 py-4 flex flex-col space-y-4 text-gray-200">
                <a href="#templates" className="hover:text-fuchsia-400 transition-colors">Templates</a>
                <a href="#features" className="hover:text-fuchsia-400 transition-colors">Features</a>
                <a href="#ai-features" className="hover:text-fuchsia-400 transition-colors">AI Magic</a>
                <a href="#pricing" className="hover:text-fuchsia-400 transition-colors">Pricing</a>
                {isAuthenticated ? (
                    <motion.button onClick={() => router.push('/dashboard')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-semibold px-5 py-2 rounded-lg transition-colors cursor-pointer">
                        Continue to Dashboard
                    </motion.button>
                ) : (
                    <>
                        <button className="hover:text-fuchsia-400 transition-colors text-left cursor-pointer" onClick={() => router.push('/login')}>Log In</button>
                        <motion.button onClick={() => router.push('/signup')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-semibold px-5 py-2 rounded-lg transition-colors cursor-pointer">
                            Get Started
                        </motion.button>
                    </>
                )}
            </div>
        </motion.div>
    );
};

const HeroSection: FC<HeaderProps> = ({ isMenuOpen, setIsMenuOpen, isAuthenticated, isScrolled }) => {
    const [topic, setTopic] = useState('');
    const [headlines, setHeadlines] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerateHeadlines = async () => {
        if (!topic) {
            setError('Please enter a topic or profession.');
            return;
        }
        setIsLoading(true); setError(''); setHeadlines([]);
        const prompt = `Generate 3 short, catchy, and professional website headlines for a "${topic}". Return the response as a JSON object with a key "headlines" which is an array of strings.`;
        try {
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { "headlines": { type: "ARRAY", items: { type: "STRING" } } } } } };
            
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY; 
            if (!apiKey) {
                throw new Error("API key is not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY.");
            }
            
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]) {
                const parsedJson = JSON.parse(result.candidates[0].content.parts[0].text);
                setHeadlines(parsedJson.headlines || []);
            } else {
                throw new Error("Unexpected API response structure.");
            }
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to generate headlines. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="relative h-screen flex flex-col justify-center text-center overflow-hidden">
            
            <div className="absolute top-0 left-0 right-0">
                <Header 
                  isMenuOpen={isMenuOpen} 
                  setIsMenuOpen={setIsMenuOpen} 
                  isAuthenticated={isAuthenticated} 
                  isScrolled={isScrolled}
                />
            </div>
            
            <video
                className="absolute top-0 left-0 w-full h-full object-cover -z-20"
                src="/videos/background1.mp4"
                autoPlay
                loop
                muted
                playsInline
            >
                Your browser does not support the video tag.
            </video>
            
            <div className="absolute top-0 left-0 w-full h-full bg-gray-900/60 -z-10"></div>
            
            <div className="absolute inset-0 top-[-10rem] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[-20rem]">
                <div className="relative left-1/2 -z-10 aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-40rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
            </div>
            
            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    className="max-w-3xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tighter mb-6 bg-gradient-to-r from-fuchsia-400 to-indigo-400 text-transparent bg-clip-text">
                        Create Your Stunning Portfolio & Blog in Minutes
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-xl mx-auto mb-10">
                        The ultimate platform to showcase your work and share your stories. Let our AI help you get started.
                    </p>
                    <div className="bg-gray-800/50 p-6 rounded-lg border border-fuchsia-500/30 max-w-xl mx-auto backdrop-blur-sm">
                        <p className="font-semibold mb-3 text-center">✨ Try our AI Headline Generator!</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., 'Photographer'"
                                className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                            />
                            <motion.button
                                onClick={handleGenerateHeadlines}
                                disabled={isLoading}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-bold px-6 py-2 rounded-md transition-all flex items-center justify-center"
                            >
                                {isLoading ? 'Generating...' : 'Generate'}
                            </motion.button>
                        </div>
                        {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
                        <AnimatePresence>
                            {headlines.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mt-4 space-y-2"
                                >
                                    {headlines.map((headline, index) => (
                                        <p key={index} className="bg-gray-700/50 p-2 rounded-md text-sm">
                                            &quot;{headline}&quot;
                                        </p>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

const WhyChooseUsSection = () => {
    const items = [
        { icon: <SparklesIcon />, title: "AI-Powered", description: "Leverage the power of Gemini for content creation." },
        { icon: <ZapIcon />, title: "Blazing Fast", description: "Optimized for speed and top performance scores." },
        { icon: <CodeIcon />, title: "No Code Needed", description: "Build and customize without writing a single line of code." }
    ];
    return (
        <section className="py-20 bg-gray-800/50">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Why <span className="text-gradient">blog.io</span>?</h2>
                    <p className="text-gray-400 mt-2 max-w-2xl mx-auto">We combine cutting-edge technology with elegant design to give you the best platform for your creative work.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {items.map((item, index) => (
                        <motion.div key={index} className="text-center p-8 bg-gray-900 rounded-lg border border-gray-800" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: index * 0.1 }}>
                            <div className="inline-block p-4 bg-gray-800 rounded-full mb-4 text-fuchsia-400">{item.icon}</div>
                            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                            <p className="text-gray-400">{item.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const HowItWorksSection = () => {
    const steps = [
        { number: '01', title: 'Choose a Template', description: 'Select from our library of professionally designed, fully customizable templates.' },
        { number: '02', title: 'Customize Your Site', description: 'Use our no-code editor to add your content, change colors, and make it your own.' },
        { number: '03', title: 'Publish & Share', description: 'Go live with one click and share your stunning new portfolio and blog with the world.' },
    ];
    return (
        <section className="py-20">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold">Get Started in 3 Easy Steps</h2>
                    <p className="text-gray-400 mt-2 max-w-2xl mx-auto">Creating your professional online presence has never been easier.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative">
                    <div className="hidden md:block absolute top-1/6 left-0 w-full h-px -translate-y-1/2">
                        <svg width="100%" height="2"><line x1="0" y1="1" x2="100%" y2="1" strokeWidth="2" strokeDasharray="8 8" className="stroke-gray-700"/></svg>
                    </div>
                    {steps.map((step, index) => (
                         <motion.div key={index} className="flex flex-col items-center text-center z-10" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: index * 0.15 }}>
                             <div className="flex items-center justify-center w-16 h-16 bg-gray-800 border-2 border-fuchsia-500 text-fuchsia-400 text-2xl font-bold rounded-full mb-6">{step.number}</div>
                             <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                             <p className="text-gray-400 max-w-xs">{step.description}</p>
                         </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

interface TemplatesSectionProps {
    isAuthenticated: boolean;
}

const templates: TemplateData[] = [
    { 
        name: "Minimalist Folio", 
        imgSrc: "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
        description: "A clean, elegant, and straightforward design perfect for showcasing your best work without distractions. Ideal for photographers and designers."
    },
    { 
        name: "Creative Writer", 
        imgSrc: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
        description: "A content-first layout that puts your stories front and center. Features beautiful typography and a robust blogging engine."
    },
    { 
        name: "Bold & Visual", 
        imgSrc: "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
        description: "A vibrant, image-heavy template for visual artists and agencies. Make a bold statement with full-bleed images and dynamic grids."
    },
];

const TemplatesSection: FC<TemplatesSectionProps> = ({ isAuthenticated }) => {
    
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);

    return (
        <section id="templates" className="py-20 bg-gray-800/50">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Stunning Templates, Ready to Go</h2>
                    <p className="text-gray-400 mt-2">Choose a design that matches your style.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {templates.map((template, index) => (
                        <motion.div key={index} className="group bg-gray-900 rounded-lg border border-gray-800 overflow-hidden" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: index * 0.1 }}>
                            <div className="overflow-hidden relative h-64">
                               <Image 
                                    src={template.imgSrc} 
                                    alt={template.name} 
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300" 
                                />
                            </div>
                            <div className="p-6 flex justify-between items-center">
                                <h3 className="text-lg font-semibold">{template.name}</h3>
                                <motion.button 
                                    onClick={() => setSelectedTemplate(template)}
                                    whileHover={{ scale: 1.05 }} 
                                    whileTap={{ scale: 0.95 }} 
                                    className="bg-fuchsia-500 cursor-pointer hover:bg-fuchsia-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                    Use Template
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {selectedTemplate && (
                    <TemplateModal
                        key="template-modal"
                        template={selectedTemplate}
                        onClose={() => setSelectedTemplate(null)}
                        isAuthenticated={isAuthenticated}
                    />
                )}
            </AnimatePresence>
        </section>
    );
};

const FeaturesSection = () => {
    const features = [
        { title: "Easy Customization", description: "Personalize your site with an intuitive drag-and-drop editor. Change colors, fonts, and layouts in real-time.", icon: <StarIcon />, imgSrc: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" },
        { title: "Powerful Blogging Engine", description: "Share your stories with a feature-rich blog. Includes SEO tools, scheduling, and rich media embedding.", icon: <ArrowRightIcon />, imgSrc: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" },
    ];

    return (
        <section id="features" className="py-20 overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold">Everything You Need to Succeed</h2>
                    <p className="text-gray-400 mt-2">Powerful features for creators of all levels.</p>
                </div>
                <div className="space-y-16">
                    {features.map((feature, index) => (
                        <div key={index} className={`flex flex-col md:flex-row items-center gap-12 ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                            <motion.div className="md:w-1/2" initial={{ opacity: 0, x: index % 2 !== 0 ? 50 : -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.6 }}>
                                <div className="text-fuchsia-400 mb-4">{feature.icon}</div>
                                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                            </motion.div>
                            <motion.div className="md:w-1/2" initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.6 }}>
                                <div className="relative aspect-video">
                                    <Image 
                                        src={feature.imgSrc} 
                                        alt={`${feature.title} illustration`} 
                                        fill
                                        className="rounded-lg shadow-2xl shadow-fuchsia-900/20 object-cover" 
                                    />
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const AIFeaturesSection = () => {
    const aiFeatures = [
        { title: "AI Blog Post Assistant", description: "Beat writer's block. Generate ideas, outlines, or even full drafts for your blog posts in seconds.", icon: <BotIcon /> },
        { title: "Smart Portfolio Descriptions", description: "Let AI write compelling descriptions for your portfolio projects. Just provide a few keywords.", icon: <SparklesIcon /> },
        { title: "AI-Generated Color Palettes", description: "Describe a mood, and our AI will suggest beautiful, harmonious color palettes for your website.", icon: <BotIcon /> },
    ];

    return (
        <section id="ai-features" className="relative py-20 bg-gray-800/50 overflow-hidden">
             <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-cyan-500 rounded-full opacity-10 blur-3xl"></div>
             <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-fuchsia-500 rounded-full opacity-10 blur-3xl"></div>
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Supercharge Your Content with <span className="text-gradient">AI Magic</span></h2>
                    <p className="text-gray-400 mt-2">Our Gemini-powered tools help you create better content, faster.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {aiFeatures.map((feature, index) => (
                        <motion.div key={index} className="p-8 rounded-lg bg-gray-900 border border-gray-800 relative overflow-hidden animated-border-box" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: index * 0.1 }}>
                            <div className="text-fuchsia-400 mb-4">{feature.icon}</div>
                            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                            <p className="text-gray-400">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
            <style jsx>{`
                .animated-border-box::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border-radius: 0.5rem; 
                    border: 1px solid transparent;
                    background: linear-gradient(120deg, #d946ef, #22d3ee, #d946ef) border-box;
                    -webkit-mask:
                        linear-gradient(#fff 0 0) padding-box, 
                        linear-gradient(#fff 0 0);
                    -webkit-mask-composite: destination-out;
                    mask-composite: exclude;
                    opacity: 0;
                    transition: opacity 0.3s ease-in-out;
                    background-size: 200% 200%;
                    animation: gradient-pan 3s linear infinite;
                }
                .animated-border-box:hover::before {
                    opacity: 1;
                }
                @keyframes gradient-pan {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>
        </section>
    );
};

const VersioningSection = () => {
    const versionFeatures = [
        { title: "Live Preview", description: "See your changes instantly in a real-time preview before you publish.", icon: <EyeIcon /> },
        { title: "Version History", description: "Never lose your work. We automatically save versions as you edit.", icon: <HistoryIcon /> },
        { title: "One-Click Revert", description: "Jump back to any previous version of your site with a single click.", icon: <LayersIcon /> },
        { title: "Named Versions", description: "Save and name specific milestones, like 'Holiday Sale' or 'New Portfolio Launch'.", icon: <TagIcon /> },
    ];

    return (
        <section id="versioning-features" className="py-20">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Total Control Over Your Content</h2>
                    <p className="text-gray-400 mt-2 max-w-2xl mx-auto">Edit with confidence. Our powerful versioning system has your back.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {versionFeatures.map((feature, index) => (
                        <motion.div 
                            key={index} 
                            className="text-center p-6 bg-gray-800/50 rounded-lg border border-gray-800"
                            initial={{ opacity: 0, y: 20 }} 
                            whileInView={{ opacity: 1, y: 0 }} 
                            viewport={{ once: true, amount: 0.5 }} 
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="inline-block p-4 bg-gray-800 rounded-full mb-4 text-fuchsia-400">{feature.icon}</div>
                            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                            <p className="text-gray-400 text-sm">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const TestimonialsSection = () => {
    const testimonials = [
        { name: "Sarah K.", role: "Photographer", text: "blog.io transformed my online presence. The AI tools are a game-changer for creating project descriptions. I couldn't be happier!", avatar: "https://i.pravatar.cc/150?img=1" },
        { name: "David L.", role: "Developer", text: "As a developer, I appreciate the speed and clean code. But the fact that I can build a stunning site this fast without writing any code myself is just incredible.", avatar: "https://i.pravatar.cc/150?img=2" },
        { name: "Maria G.", role: "Writer", text: "The blogging platform is a dream. It's intuitive, powerful, and has all the SEO features I need to grow my audience. Highly recommended!", avatar: "https://i.pravatar.cc/150?img=3" },
    ];
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrent(prev => (prev + 1) % testimonials.length);
        }, 30000);
        return () => clearInterval(interval);
    }, [testimonials.length]);

    return (
        <section className="py-20">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Loved by Creators Worldwide</h2>
                </div>
                <div className="relative max-w-2xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div key={current} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="text-center bg-gray-800/50 p-8 rounded-lg border border-gray-700">
                            <Image 
                                src={testimonials[current].avatar} 
                                alt={testimonials[current].name} 
                                width={64}
                                height={64}
                                className="rounded-full mx-auto mb-4 border-2 border-fuchsia-400" 
                            />
                            <p className="text-gray-300 italic text-lg mb-4">&quot;{testimonials[current].text}&quot;</p>
                            <h4 className="font-bold text-white">{testimonials[current].name}</h4>
                            <p className="text-sm text-fuchsia-400">{testimonials[current].role}</p>
                        </motion.div>
                    </AnimatePresence>
                    <div className="flex justify-center mt-6 space-x-2">
                        {testimonials.map((_, index) => (
                            <button key={index} onClick={() => setCurrent(index)} className={`w-2.5 h-2.5 rounded-full transition-colors ${current === index ? 'bg-fuchsia-500' : 'bg-gray-600 hover:bg-gray-500'}`}></button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const PricingSection = () => {
    const [isYearly, setIsYearly] = useState(false);
    const plans = {
        free: { name: "Free", price: { monthly: 0, yearly: 0 }, description: "For hobbyists starting out.", features: ["1 Portfolio Site", "Basic Templates", "Community Support"] },
        premium: { name: "Premium", price: { monthly: 12, yearly: 10 }, description: "For professionals and creators.", features: ["Unlimited Sites", "Premium Templates", "Custom Domain", "Advanced Analytics", "✨ AI Writing Assistant"] },
    };

    return (
        <section id="pricing" className="py-20 bg-gray-800/50">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Choose Your Plan</h2>
                    <p className="text-gray-400 mt-2">Simple, transparent pricing. No hidden fees.</p>
                    <div className="mt-6 flex justify-center items-center space-x-4">
                        <span>Monthly</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={isYearly} onChange={() => setIsYearly(!isYearly)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-focus:ring-4 peer-focus:ring-fuchsia-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fuchsia-500"></div>
                        </label>
                        <span>Yearly (Save 20%)</span>
                    </div>
                </div>
                <div className="flex flex-col lg:flex-row justify-center items-center gap-8">
                    {Object.values(plans).map((plan) => (
                        <motion.div key={plan.name} whileHover={{ y: -10, boxShadow: "0px 10px 30px rgba(192, 38, 211, 0.2)" }} className={`w-full max-w-sm p-8 rounded-lg bg-gray-900 border ${plan.name === 'Premium' ? 'border-fuchsia-500' : 'border-gray-700'}`}>
                            {plan.name === 'Premium' && (<div className="text-center mb-4"><span className="bg-fuchsia-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span></div>)}
                            <h3 className="text-2xl font-semibold text-center">{plan.name}</h3>
                            <p className="text-gray-400 text-center mt-2">{plan.description}</p>
                            <div className="text-center my-8">
                                <span className="text-5xl font-bold">${isYearly ? plan.price.yearly : plan.price.monthly}</span>
                                <span className="text-gray-400">/month</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature, index) => (<li key={index} className="flex items-center text-gray-300"><CheckCircleIcon className="text-green-400" /><span className="ml-3">{feature}</span></li>))}
                            </ul>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`w-full cursor-pointer py-3 rounded-lg font-semibold transition-colors ${plan.name === 'Premium' ? 'bg-fuchsia-500 hover:bg-fuchsia-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                {plan.name === 'Free' ? 'Start for Free' : 'Go Premium'}
                            </motion.button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs = [
        { q: "Can I use my own domain name?", a: "Yes! On our Premium plan, you can easily connect your own custom domain name." },
        { q: "Is there a free trial for the Premium plan?", a: "We offer a 14-day money-back guarantee. If you're not satisfied with the Premium plan for any reason, just let us know and we'll issue a full refund." },
        { q: "Do I need to know how to code?", a: "Not at all! blog.io is a completely no-code platform. Our intuitive editor makes it easy for anyone to build a beautiful website." },
        { q: "What is the AI Writing Assistant?", a: "Our AI Writing Assistant, powered by Google's Gemini, helps you generate blog post ideas, write portfolio descriptions, overcome writer's block, and create content faster." },
    ];

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section id="faq" className="py-20">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
                </div>
                <div className="max-w-3xl mx-auto space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
                            <button onClick={() => toggleFAQ(index)} className="w-full flex justify-between items-center text-left p-6 font-semibold">
                                <span>{faq.q}</span>
                                <motion.div animate={{ rotate: openIndex === index ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                    <ChevronDownIcon />
                                </motion.div>
                            </button>
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
                                        <div className="px-6 pb-6 text-gray-400">
                                            {faq.a}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const CTASection: FC<AuthProps> = ({ isAuthenticated }) => {
    const router = useRouter();
    return (
        <section className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl">
                <div className="relative left-1/2 -z-10 aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+20rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
            </div>
            <div className="container mx-auto px-6 text-center relative z-10">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.5 }}>
                    <h2 className="text-3xl md:text-4xl font-bold">
                        {isAuthenticated ? "Welcome Back!" : "Ready to Build Your Online Presence?"}
                    </h2>
                    <p className="text-gray-300 mt-4 mb-8 max-w-2xl mx-auto">
                        {isAuthenticated ? "Let's get back to creating. Head to your dashboard to manage your sites and draft new content." : "Join thousands of creators who trust our platform to build their portfolios and blogs. Start for free, no credit card required."}
                    </p>
                    <motion.button
                        onClick={() => isAuthenticated ? router.push('/dashboard') : router.push('/signup')}
                        whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgb(217, 70, 239)" }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-bold px-8 py-4 rounded-lg text-lg transition-all cursor-pointer"
                    >
                        {isAuthenticated ? "Go to Your Dashboard" : "Sign Up Now - It's Free!"}
                    </motion.button>
                </motion.div>
            </div>
        </section>
    );
};

const Footer = () => {
    return (
        <footer className="relative z-20 bg-gray-900 border-t border-gray-800">
            <div className="container mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center text-gray-400">
                    <p>&copy; {new Date().getFullYear()} blog.io. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-fuchsia-400 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-ffuchsia-400 transition-colors">Terms</a>
                        <a href="#" className="hover:text-fuchsia-400 transition-colors">Contact</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
