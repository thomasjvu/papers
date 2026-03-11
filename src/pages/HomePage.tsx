import { motion } from 'framer-motion';
import { useEffect } from 'react';

import { homepageConfig } from '../../shared/documentation-config.js';

import Navigation from '../components/Navigation';
import { HeroSection, FeaturesGrid, QuickStart, Footer } from '../components/homepage';

const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'papers';

export default function HomePage() {
  useEffect(() => {
    document.title = `${SITE_NAME} | Modern documentation template`;
  }, []);

  if (!homepageConfig.enabled) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pt-12"
      style={{ backgroundColor: 'var(--background-color)' }}
    >
      <Navigation />
      <HeroSection hero={homepageConfig.hero} />

      <div
        className="h-px w-full max-w-4xl mx-auto"
        style={{ backgroundColor: 'var(--border-unified)', opacity: 0.5 }}
      />

      <FeaturesGrid features={homepageConfig.features} />

      <div
        className="h-px w-full max-w-4xl mx-auto"
        style={{ backgroundColor: 'var(--border-unified)', opacity: 0.5 }}
      />

      <QuickStart quickStart={homepageConfig.quickStart} />

      <Footer footer={homepageConfig.footer} />
    </motion.div>
  );
}
