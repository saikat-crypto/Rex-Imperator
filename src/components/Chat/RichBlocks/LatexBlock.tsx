import React, { useMemo } from 'react';
import katex from 'katex';
import { Copy, Check } from 'lucide-react';

interface LatexBlockProps {
  formula: string;
  displayMode?: boolean;
  caption?: string;
}

export const LatexBlock: React.FC<LatexBlockProps> = ({
  formula,
  displayMode = true,
  caption,
}) => {
  const [copied, setCopied] = React.useState(false);

  const html = useMemo(() => {
    try {
      return katex.renderToString(formula, {
        displayMode,
        throwOnError: false,
      });
    } catch (e) {
      console.error('KaTeX rendering error:', e);
      return formula;
    }
  }, [formula, displayMode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(formula);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 group relative py-3 w-full">
      <div
        className="overflow-x-auto text-center text-[var(--text-primary)] py-2"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {caption && (
        <div className="mt-2 text-center text-xs text-[var(--text-muted)] italic font-serif">
          {caption}
        </div>
      )}

      <button
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 p-1 text-[#8A847A] hover:text-[var(--accent-primary)]"
        title="Copy LaTeX formula"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
