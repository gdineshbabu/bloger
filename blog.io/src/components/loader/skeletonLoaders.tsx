import { motion } from "framer-motion";
import { ReactNode, useState } from "react";
import { Sidebar } from "../sidebar/sidebar";
import { MenuIcon } from "lucide-react";

export const DashboardLayout = ({ children }: { children: ReactNode }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    return (
        <div className="bg-gray-950 text-white min-h-screen font-sans flex">
            <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
            <div className="flex-1 md:ml-64">
                <header className="md:hidden flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800 sticky top-0 z-20">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-md hover:bg-gray-800 text-gray-400">
                        <MenuIcon />
                    </button>
                    <h1 className="text-xl font-bold">blog<span className="text-fuchsia-400">.io</span></h1>
                    <div className="w-10"></div>
                </header>
                <main className="container mx-auto px-1 py-4 md:p-8">{children}</main>
            </div>
        </div>
    );
};

export const StatCard = ({ title, value }: { title: string, value: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-xl relative overflow-hidden"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800/70 to-fuchsia-900/10 opacity-70 rounded-lg"></div>
        <p className="text-gray-400 text-sm relative z-10">{title}</p>
        <p className="text-3xl font-bold mt-1 relative z-10 text-white">{value.toLocaleString()}</p>
    </motion.div>
);

export const SkeletonCard = () => <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 animate-pulse"><div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div><div className="h-8 bg-gray-700 rounded w-1/2"></div></div>;

export const SkeletonTable = () => (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg mt-6 overflow-x-auto">
        <table className="w-full text-sm text-left animate-pulse">
            <thead className="bg-gray-800 text-xs text-gray-400 uppercase">
                <tr>
                    <th scope="col" className="px-6 py-3"><div className="h-4 bg-gray-700 rounded w-3/4"></div></th>
                    <th scope="col" className="px-6 py-3"><div className="h-4 bg-gray-700 rounded w-3/4"></div></th>
                    <th scope="col" className="px-6 py-3"><div className="h-4 bg-gray-700 rounded w-3/4"></div></th>
                    
                    <th scope="col" className="px-6 py-3 hidden md:table-cell"><div className="h-4 bg-gray-700 rounded w-3/4"></div></th>
                    <th scope="col" className="px-6 py-3 hidden md:table-cell"><div className="h-4 bg-gray-700 rounded w-3/4"></div></th>
                    <th scope="col" className="px-6 py-3 hidden md:table-cell"><div className="h-4 bg-gray-700 rounded w-3/4"></div></th>
                    <th scope="col" className="px-6 py-3 hidden md:table-cell"><div className="h-4 bg-gray-700 rounded w-3/4"></div></th>
                    
                    <th scope="col" className="px-6 py-3 text-right"><div className="h-4 bg-gray-700 rounded w-3/4 ml-auto"></div></th>
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-700">
                        <td className="px-6 py-4"><div className="h-5 w-5 bg-gray-700 rounded-full"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-full mb-2"></div><div className="h-3 bg-gray-700 rounded w-1/2"></div></td>
                        <td className="px-6 py-4"><div className="h-5 bg-gray-700 rounded-full w-20"></div></td>
                        
                        <td className="px-6 py-4 hidden md:table-cell"><div className="h-4 bg-gray-700 rounded w-12"></div></td>
                        <td className="px-6 py-4 hidden md:table-cell"><div className="h-4 bg-gray-700 rounded w-12"></div></td>
                        <td className="px-6 py-4 hidden md:table-cell"><div className="h-4 bg-gray-700 rounded w-24"></div></td>
                        <td className="px-6 py-4 hidden md:table-cell"><div className="h-4 bg-gray-700 rounded w-24"></div></td>
                        
                        <td className="px-6 py-4"><div className="h-8 w-8 bg-gray-700 rounded-md ml-auto"></div></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export const DashboardSkeleton = () => (
    <DashboardLayout>
        <header className="flex justify-between items-center mb-8 animate-pulse">
            <div>
                <div className="h-10 bg-gray-700 rounded w-72 md:w-96 mb-3"></div>
                <div className="h-5 bg-gray-700 rounded w-64 md:w-80"></div>
            </div>
            <div className="h-10 w-40 bg-gray-700 rounded-lg hidden sm:block"></div>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        <section className="mt-12">
            <div className="flex justify-between items-center animate-pulse">
                <div className="h-8 bg-gray-700 rounded w-36"></div>
            </div>
            <SkeletonTable />
        </section>
        <section className="mt-12">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 h-96 animate-pulse"></div>
        </section>
    </DashboardLayout>
);