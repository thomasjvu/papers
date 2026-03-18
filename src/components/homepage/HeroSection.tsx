import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

import { useTheme } from '../../providers/ThemeProvider';

interface HeroSectionProps {
  hero: {
    title: string;
    subtitle: string;
    description: string;
    artwork?: {
      src: string;
      alt: string;
      caption?: string;
    };
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
            background: `radial-gradient(ellipse at top, rgba(var(--primary-color-rgb), ${
              isDarkMode ? '0.14' : '0.06'
            }) 0%, transparent 62%)`,
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
            className="text-4xl md:text-6xl font-bold mb-6"
            style={{ fontFamily: 'var(--title-font)', color: 'var(--text-color)' }}
          >
            {hero.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl mb-4"
            style={{ fontFamily: 'var(--mono-font)', color: 'var(--primary-color)' }}
          >
            {hero.subtitle}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-base md:text-lg mb-10 max-w-2xl mx-auto"
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
                color: 'var(--selection-text-color)',
                fontFamily: 'var(--mono-font)',
              }}
            >
              {hero.cta.primary.text}
              <Icon icon="mingcute:arrow-right-line" width="20" />
            </Link>

            <Link
              to={hero.cta.secondary.href}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold text-lg border transition-all hover:scale-105"
              style={{
                borderColor: 'var(--border-unified)',
                color: 'var(--text-color)',
                fontFamily: 'var(--mono-font)',
              }}
            >
              <Icon icon="mingcute:book-2-line" width="20" />
              {hero.cta.secondary.text}
            </Link>
          </motion.div>

          {hero.artwork ? (
            <motion.figure
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-[28px] border p-3"
              style={{
                borderColor: 'var(--border-unified)',
                backgroundColor: 'var(--card-color)',
              }}
            >
              <img
                src={hero.artwork.src}
                alt={hero.artwork.alt}
                className="w-full rounded-[20px] border"
                style={{ borderColor: 'var(--border-unified)' }}
              />
              {hero.artwork.caption ? (
                <figcaption
                  className="px-2 pt-3 text-left"
                  style={{
                    color: 'var(--muted-color)',
                    fontFamily: 'var(--mono-font)',
                    fontSize: 'var(--text-xs)',
                    lineHeight: 'var(--leading-relaxed)',
                  }}
                >
                  {hero.artwork.caption}
                </figcaption>
              ) : null}
            </motion.figure>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
