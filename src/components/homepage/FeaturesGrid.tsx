import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

interface Feature {
  title: string;
  description: string;
  icon: string;
}

interface FeaturesGridProps {
  features: Feature[];
}

export function FeaturesGrid({ features }: FeaturesGridProps) {
  return (
    <section className="py-20">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2
            className="text-2xl md:text-3xl font-bold mb-4"
            style={{ fontFamily: 'var(--title-font)', color: 'var(--text-color)' }}
          >
            Everything You Need
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--muted-color)' }}>
            Built with modern tools and best practices for the best developer experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-xl border transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: 'var(--card-color)',
                borderColor: 'var(--border-unified)',
              }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{
                  backgroundColor: 'var(--primary-color)',
                  opacity: 0.95,
                }}
              >
                <Icon
                  icon={feature.icon}
                  width="24"
                  style={{ color: 'var(--selection-text-color)' }}
                />
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ fontFamily: 'var(--title-font)', color: 'var(--text-color)' }}
              >
                {feature.title}
              </h3>
              <p style={{ color: 'var(--muted-color)' }}>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
