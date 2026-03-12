import { motion } from 'framer-motion';

interface QuickStartStep {
  title: string;
  code: string;
}

interface QuickStartProps {
  quickStart: {
    title: string;
    steps: QuickStartStep[];
  };
}

export function QuickStart({ quickStart }: QuickStartProps) {
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
            {quickStart.title}
          </h2>
          <p className="text-lg" style={{ color: 'var(--muted-color)' }}>
            Get up and running in minutes
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {quickStart.steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-start gap-4"
            >
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                style={{
                  backgroundColor: 'var(--primary-color)',
                  color: 'var(--selection-text-color)',
                  fontFamily: 'var(--mono-font)',
                }}
              >
                {index + 1}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                  {step.title}
                </h4>
                <div
                  className="p-4 rounded-lg font-mono text-sm"
                  style={{
                    backgroundColor: 'var(--hover-color)',
                    color: 'var(--primary-color)',
                    border: '1px solid var(--border-unified)',
                  }}
                >
                  <code>{step.code}</code>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
