import { useEffect } from 'react';

export default function LLMSPage() {
  useEffect(() => {
    window.location.replace('/llms.txt');
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-pulse text-muted-color">Opening llms.txt...</div>
    </div>
  );
}
