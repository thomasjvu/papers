import { motion } from 'framer-motion';
import { useEffect } from 'react';

import { homepageConfig } from '../../shared/documentation-config.js';

import { Footer, FeaturesGrid, HeroSection, QuickStart } from '../components/homepage';

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
      className="min-h-screen"
      style={{ backgroundColor: 'var(--background-color)' }}
    >
      <HeroSection hero={homepageConfig.hero} />

      <div
        className="mx-auto h-px w-full max-w-4xl"
        style={{ backgroundColor: 'var(--border-unified)', opacity: 0.5 }}
      />

      <FeaturesGrid features={homepageConfig.features} />

      <div
        className="mx-auto h-px w-full max-w-4xl"
        style={{ backgroundColor: 'var(--border-unified)', opacity: 0.5 }}
      />

      <QuickStart quickStart={homepageConfig.quickStart} />

      <Footer footer={homepageConfig.footer} />
    </motion.div>
  );
}
