import { clearSessionClient } from "@/actions/localStorage";
import { AnimatePresence, motion } from "framer-motion";
import { FileTextIcon, LayoutDashboardIcon, LayoutGridIcon, LogOutIcon, UserIcon, XIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

export const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }: { isMobileMenuOpen: boolean; setIsMobileMenuOpen: (isOpen: boolean) => void; }) => {
    const router = useRouter();
    const pathname = usePathname();
    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboardIcon /> },
        { href: '/sites', label: 'My Sites', icon: <LayoutGridIcon /> },
        { href: '/posts', label: 'All Posts', icon: <FileTextIcon /> },
        { href: '/profile', label: 'Profile', icon: <UserIcon /> }
    ];

    const handleLogout = () => { clearSessionClient(); router.push('/login'); };

    return (
        <>
            <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-white fixed h-full border-r border-gray-800 p-4">
                <div className="px-2 py-4 border-b border-gray-800 mb-4">
                    <h1 className="text-2xl font-bold">
                        blog<span className="text-fuchsia-400">.io</span>
                    </h1>
                </div>
                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => router.push(item.href)}
                            className={`cursor-pointer flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                                pathname === item.href ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'hover:bg-gray-800'
                            }`}
                        >
                            {item.icon}
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="border-t border-gray-800 pt-4 mt-4">
                    <button
                        onClick={handleLogout}
                        className="cursor-pointer flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400"
                    >
                        <LogOutIcon />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <motion.aside
                            className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white border-r border-gray-800 p-4 flex flex-col"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-2 py-4 border-b border-gray-800 mb-4 flex justify-between items-center">
                                <h1 className="text-2xl font-bold">blog<span className="text-fuchsia-400">.io</span></h1>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                    <XIcon />
                                </button>
                            </div>
                            <nav className="flex-1 space-y-2">
                                {navItems.map((item) => (
                                    <button
                                        key={item.label}
                                        onClick={() => {
                                            router.push(item.href);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                                            pathname === item.href ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'hover:bg-gray-800'
                                        }`}
                                    >
                                        {item.icon}
                                        <span className="font-medium">{item.label}</span>
                                    </button>
                                ))}
                            </nav>
                            <div className="border-t border-gray-800 pt-4 mt-4">
                                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400">
                                    <LogOutIcon />
                                    <span className="font-medium">Logout</span>
                                </button>
                            </div>
                        </motion.aside>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
