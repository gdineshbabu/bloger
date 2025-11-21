/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { motion, Variants } from 'framer-motion';

export const containerVariants: Variants = {
  initial: { opacity: 1 },
  exit: { 
    opacity: 0, 
    transition: { 
      duration: 0.5, 
      ease: "easeInOut" as any 
    } 
  },
};

export const logoVariants: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut" as any,
    },
  },
};

const Loader = () => {
  return (
    <motion.div
      key="loader"
      variants={containerVariants}
      initial="initial"
      exit="exit"
      className="fixed inset-0 z-[100] flex h-full w-full items-center justify-center bg-gray-950"
    >
      <motion.div
        variants={logoVariants}
        animate="animate"
      >
        <h1 className="text-4xl font-bold text-white">
          blog<span className="text-fuchsia-400">.io</span>
        </h1>
      </motion.div>
    </motion.div>
  );
};

export default Loader;
