import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

import { useTheme } from '../../providers/ThemeProvider';

interface HeroSectionProps {
  hero: {
    title: string;
    subtitle: string;
    description: string;
    cta: {
      primary: { text: string; href: string };
      secondary: { text: string; href: string };
    };
  };
}

export function HeroSection({ hero }: HeroSectionProps) {
  const { isDarkMode } = useTheme();

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background: isDarkMode
              ? 'radial-gradient(ellipse at top, rgba(255, 133, 161, 0.15) 0%, transparent 50%)'
              : 'radial-gradient(ellipse at top, rgba(103, 141, 88, 0.15) 0%, transparent 50%)',
          }}
        />
      </div>

      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6"
            style={{ fontFamily: 'var(--title-font)', color: 'var(--text-color)' }}
          >
            {hero.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl mb-4"
            style={{ fontFamily: 'var(--mono-font)', color: 'var(--primary-color)' }}
          >
            {hero.subtitle}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl mb-10 max-w-2xl mx-auto"
            style={{ color: 'var(--muted-color)' }}
          >
            {hero.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to={hero.cta.primary.href}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-105"
              style={{
                backgroundColor: 'var(--primary-color)',
                color: isDarkMode ? '#000' : '#fff',
                fontFamily: 'var(--mono-font)',
              }}
            >
              {hero.cta.primary.text}
              <Icon icon="mingcute:arrow-right-line" width="20" />
            </Link>

            <a
              href={hero.cta.secondary.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold text-lg border transition-all hover:scale-105"
              style={{
                borderColor: 'var(--border-unified)',
                color: 'var(--text-color)',
                fontFamily: 'var(--mono-font)',
              }}
            >
              <Icon icon="mingcute:github-line" width="20" />
              {hero.cta.secondary.text}
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
