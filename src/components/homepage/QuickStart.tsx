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
            {quickStart.title}
          </h2>
          <p
            style={{
              color: 'var(--muted-color)',
              fontSize: 'var(--papers-text-lg)',
              lineHeight: 'var(--papers-leading-loose)',
            }}
          >
            Get up and running in minutes
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {quickStart.steps.map((step, index) => (
            <div key={index} className="flex items-start gap-4">
              <div
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold"
                style={{
                  backgroundColor: 'var(--primary-color)',
                  color: 'var(--selection-text-color)',
                  fontFamily: 'var(--mono-font)',
                  fontSize: 'var(--papers-text-xs)',
                }}
              >
                {index + 1}
              </div>
              <div className="flex-1">
                <h3
                  className="font-semibold mb-2"
                  style={{
                    color: 'var(--papers-text-color)',
                    fontSize: 'var(--papers-text-base)',
                  }}
                >
                  {step.title}
                </h3>
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--hover-color)',
                    color: 'var(--primary-color)',
                    border: '1px solid var(--border-unified)',
                    fontFamily: 'var(--mono-font)',
                    fontSize: 'var(--code-font-size)',
                  }}
                >
                  <code>{step.code}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
