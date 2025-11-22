import React from 'react';
import { motion } from 'framer-motion';
import SplashScreen from '../components/SplashScreen';

const Landing = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SplashScreen />
    </motion.div>
  );
};

export default Landing;