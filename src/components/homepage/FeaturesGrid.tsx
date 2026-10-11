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
      <div className="papers-container mx-auto px-6">
        <div className="text-center mb-16">
          <h2
            className="font-bold mb-4"
            style={{
              fontFamily: 'var(--title-font)',
              color: 'var(--papers-text-color)',
              fontSize: 'clamp(var(--papers-text-2xl), 4vw, var(--papers-text-4xl))',
              letterSpacing: '-0.03em',
            }}
          >
            Everything You Need
          </h2>
          <p
            className="max-w-2xl mx-auto"
            style={{
              color: 'var(--muted-color)',
              fontSize: 'var(--papers-text-lg)',
              lineHeight: 'var(--papers-leading-loose)',
            }}
          >
            Built with modern tools and best practices for the best developer experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
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
                className="font-semibold mb-2"
                style={{
                  fontFamily: 'var(--title-font)',
                  color: 'var(--papers-text-color)',
                  fontSize: 'var(--papers-text-lg)',
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  color: 'var(--muted-color)',
                  fontSize: 'var(--papers-text-base)',
                  lineHeight: 'var(--papers-leading-relaxed)',
                }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
