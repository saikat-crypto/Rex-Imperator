import React from 'react';
import katex from 'katex';
import type { SearchResult } from '../../../types';
import { CitationTooltip } from './CitationTooltip';

export const RotatingSquareCursor: React.FC = () => (
  <span
    className="inline-block ml-1.5 w-[8.5px] h-[8.5px] bg-[var(--accent-primary)] rounded-[1.5px] align-middle animate-spin shadow-[0_0_6px_var(--accent-glow)] shrink-0 select-none"
    style={{ animationDuration: '1.6s' }}
    aria-label="Generating"
  />
);

/**
 * Cleans and sanitizes common LLM LaTeX formatting quirks:
 * - Escaped asterisks (\*) from markdown escaping -> \cdot
 * - Raw asterisk multiplication between alphanumeric symbols (e.g. I * R) -> I \cdot R
 * - Scientific notation with asterisks (e.g. 3.6 * 10^6) -> 3.6 \times 10^6
 * - Escaped underscores (e.g. R\_1) -> R_1
 */
export const sanitizeLatex = (raw: string): string => {
  return raw
    .replace(/([0-9])\s*(?:\\\*|\*)\s*(10\^)/g, (_, a, b) => `${a} \\times ${b}`)
    .replace(/\\\*/g, ' \\cdot ')
    .replace(/(?<=[a-zA-Z0-9_\^])\s*\*\s*(?=[a-zA-Z0-9_\^])/g, ' \\cdot ')
    .replace(/\\_/g, '_')
    .replace(/\\~/g, '~')
    .trim();
};

/**
 * Auto-balances and closes in-flight LaTeX equations while tokens are streaming,
 * preventing broken syntax or unrendered raw math before closing delimiters arrive.
 */
export const autoCloseStreamingMath = (text: string): string => {
  if (!text) return '';
  let result = text;

  // 1. Display math auto-close ($$...$$)
  const displayParts = result.split('$$');
  if (displayParts.length % 2 === 0) {
    let last = displayParts[displayParts.length - 1];
    const leftCount = (last.match(/\\left\b/g) || []).length;
    const rightCount = (last.match(/\\right\b/g) || []).length;
    if (leftCount > rightCount) {
      last += ' \\right.'.repeat(leftCount - rightCount);
    }
    const openBraces = (last.match(/\{/g) || []).length;
    const closeBraces = (last.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      last += '}'.repeat(openBraces - closeBraces);
    }
    displayParts[displayParts.length - 1] = last;
    result = displayParts.join('$$') + '$$';
  }

  // 2. Inline math auto-close per line ($...$)
  const lines = result.split('\n');
  const healedLines = lines.map((line) => {
    const noDouble = line.replace(/\$\$[\s\S]*?\$\$/g, '');
    const singleMatches = noDouble.match(/(?<!\\)\$/g);
    if (singleMatches && singleMatches.length % 2 === 1) {
      const lastDollarIdx = line.lastIndexOf('$');
      const tail = line.slice(lastDollarIdx + 1);
      const openBraces = (tail.match(/\{/g) || []).length;
      const closeBraces = (tail.match(/\}/g) || []).length;
      let suffix = '';
      if (openBraces > closeBraces) {
        suffix += '}'.repeat(openBraces - closeBraces);
      }
      return `${line}${suffix}$`;
    }
    return line;
  });

  return healedLines.join('\n');
};

/**
 * Automatically detects and heals unbracketed LaTeX mathematics, Greek letters,
 * physics variables, subscripts, and scientific units that the LLM may output without $ delimiters.
 */
export const healMarkdownLatex = (text: string): string => {
  if (!text) return '';

  // Split by already existing math blocks ($$...$$ and $...$) so we never double-wrap valid LaTeX
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g);

  return parts
    .map((part, i) => {
      // Odd indices are valid math blocks ($$...$$ or $...$), leave untouched
      if (i % 2 === 1) return part;

      // Even indices: outside math blocks
      const lines = part.split('\n');
      const healedLines = lines.map((line) => {
        let trimmed = line.trim();

        // 1. Normalize bullet symbols: '• ' -> '- '
        if (trimmed.startsWith('• ')) {
          line = line.replace('• ', '- ');
          trimmed = line.trim();
        }

        // 2. Check if this line is a standalone formula (e.g. \rho = (R \* A) / l, R = \rho * (l/A), V = IR):
        const hasStopwords = /\b(is|are|was|were|the|where|because|then|which|states|that|when|with|and|or|for|of|in|to|avoid|losing|marks|mention|essential|note|critical|application|applications)\b/i.test(trimmed);
        const hasEquals = trimmed.includes('=');
        const hasFormulaTokens = /[\\+\-\*\/\^\(\)]|[A-Za-z\u0370-\u03ff]/.test(trimmed);

        if (hasEquals && !hasStopwords && hasFormulaTokens && trimmed.length > 2 && trimmed.length < 120 && !trimmed.startsWith('#')) {
          let formula = trimmed
            .replace(/\\\*/g, ' \\cdot ')
            .replace(/(?<=[a-zA-Z0-9_\^])\s*\*\s*(?=[a-zA-Z0-9_\^])/g, ' \\cdot ');

          // Convert fraction patterns like \rho = (R \cdot A) / l or \rho = RA / l to \rho = \frac{RA}{l}
          const fracMatch = formula.match(/^([\\\w\u0370-\u03ff]+)\s*=\s*(.+?)\s*\/\s*([A-Za-z0-9\\\w\u0370-\u03ff]+)$/);
          if (fracMatch) {
            const left = fracMatch[1].trim();
            const num = fracMatch[2].trim().replace(/^\((.*)\)$/, '$1').trim();
            const den = fracMatch[3].trim().replace(/^\((.*)\)$/, '$1').trim();
            formula = `${left} = \\frac{${num}}{${den}}`;
          }
          return `$$${formula}$$`;
        }

        // 3. For non-standalone lines, heal inline math, escaped asterisks, raw LaTeX commands & units:
        let l = line.replace(/\\\*/g, ' \\cdot ');

        // Protect and wrap compound units like \Omega\cdot m or \Omega * m -> $\Omega \cdot \text{m}$
        l = l.replace(/(?:\\Omega|Ω)\s*(?:\\cdot|\*|\.)\s*m\b/g, '__OHM_METER__');
        l = l.replace(/(?:\\Omega|Ω)\b/g, '$\\Omega$');
        l = l.replace(/(?:\\rho|ρ)\b/g, '$\\rho$');
        l = l.replace(/(?:\\mu|μ)\b/g, '$\\mu$');
        l = l.replace(/(?:\\Delta|Δ)\b/g, '$\\Delta$');
        l = l.replace(/(?:\\lambda|λ)\b/g, '$\\lambda$');
        l = l.replace(/(?:\\alpha|α)\b/g, '$\\alpha$');
        l = l.replace(/(?:\\beta|β)\b/g, '$\\beta$');
        l = l.replace(/(?:\\theta|θ)\b/g, '$\\theta$');
        l = l.replace(/(?:\\pi|π)\b/g, '$\\pi$');
        l = l.replace(/(?:\\sigma|σ)\b/g, '$\\sigma$');
        l = l.replace(/__OHM_METER__/g, '$\\Omega \\cdot \\text{m}$');

        // Subscripted variables in parentheses: (E_g), (E_c), (E_v), (I_1), (R_eq), (V_s), etc.
        l = l.replace(/\(([A-Za-z])_([A-Za-z0-9]+)\)/g, '($$$1_{$2}$)');

        // Single physics/carrier variables in parentheses: (n), (p), (q), (v)
        l = l.replace(/\(([a-zA-Z])\)/g, '($$$1$)');

        // Standalone subscripted physics variables: N_c, E_c, E_f, N_v, R_1, R_2, V_0, I_rms, etc.
        l = l.replace(/\b([A-Za-z])_([A-Za-z0-9]+)\b/g, '$$$1_{$2}$');

        // Standalone physics constants and variables before definition verbs:
        // e.g. "k is the Boltzmann constant", "T is the temperature"
        l = l.replace(
          /\b([a-zA-Z])\s+(is\s+(?:the\s+)?(?:Boltzmann\s+constant|temperature|absolute\s+temperature|Planck(?:'s)?\s+constant|energy|charge|mass|velocity|frequency|wavelength|current|voltage|resistance|resistivity|conductivity|capacitance|inductance|mobility|effective\s+mass|Fermi\s+(?:energy|level))\b)/gi,
          '$$$1$ $2'
        );

        // Variables following "where", commas, and "and" in variable definition lists:
        // e.g. "where N_c is ...", ", E_c is ...", "and T is ..."
        l = l.replace(/(?<=\bwhere\s+)([A-Za-z](?:_[A-Za-z0-9]+)?)(?=\s+is\b)/g, '$$$1$');
        l = l.replace(/(?<=,\s*)([A-Za-z](?:_[A-Za-z0-9]+)?)(?=\s+is\b)/g, '$$$1$');
        l = l.replace(/(?<=\band\s+)([A-Za-z](?:_[A-Za-z0-9]+)?)(?=\s+is\b)/g, '$$$1$');

        // Units with exponents like m^2, cm^2, s^-1, 10^-8
        l = l.replace(/\b(m|cm|mm)\^(\d+)\b/g, '$\\text{$1}^$2$');
        l = l.replace(/\b10\^(-?\d+)\b/g, '$10^{$1}$');

        // Single physics variables in bullet definitions: e.g. "- R is the" -> "- $R$ is the"
        l = l.replace(/^(\s*-\s+)([A-Za-z])(\s+(?:is|represents|=|denotes)\b)/g, '$1$$$2$$$3');

        return l;
      });

      return healedLines.join('\n');
    })
    .join('');
};

interface TextBlockProps {
  content: string;
  isStreaming?: boolean;
  sources?: SearchResult[];
}

export const TextBlock: React.FC<TextBlockProps> = ({
  content,
  isStreaming = false,
  sources = [],
}) => {
  if (!content && isStreaming) {
    return (
      <div className="py-1">
        <RotatingSquareCursor />
      </div>
    );
  }

  // Normalize any [SOURCE X] or [Source X] tokens to standard [X] format
  const normalizedContent = (content || '').replace(/\[\s*(?:source|sources)\s*(\d+(?:\s*,\s*\d+)*)\s*\]/gi, '[$1]');

  // If streaming, auto-close and balance open math blocks for seamless progressive rendering
  const processedContent = isStreaming
    ? autoCloseStreamingMath(normalizedContent)
    : normalizedContent;

  const formatMarkdown = (text: string) => {
    const lines = text.split('\n');
    const lastIndex = lines.length - 1;
    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      const isLast = index === lastIndex;
      const cursor = isLast && isStreaming ? <RotatingSquareCursor /> : null;

      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="text-[15px] sm:text-[15.5px] font-semibold text-[#181615] mt-3.5 mb-1.5 tracking-tight">
            {renderInlineMarkdown(line.replace('### ', ''))}
            {cursor}
          </h3>
        );
        return;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="text-lg sm:text-xl font-serif font-normal text-[#181615] mt-4.5 mb-2 tracking-tight">
            {renderInlineMarkdown(line.replace('## ', ''))}
            {cursor}
          </h2>
        );
        return;
      }
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={index} className="text-xl sm:text-2xl font-serif font-normal text-[#181615] mt-5 mb-2.5 tracking-tight">
            {renderInlineMarkdown(line.replace('# ', ''))}
            {cursor}
          </h1>
        );
        return;
      }

      // Standalone Display Math block ($$...$$)
      if (line.trim().startsWith('$$') && line.trim().endsWith('$$') && line.trim().length > 4) {
        try {
          const math = sanitizeLatex(line.trim().slice(2, -2));
          const html = katex.renderToString(math, {
            displayMode: true,
            throwOnError: false,
          });
          elements.push(
            <div
              key={index}
              className="my-3 py-1 overflow-x-auto text-center select-text"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
          return;
        } catch {
          // fall through to standard render
        }
      }

      // Bullet lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().startsWith('• ')) {
        const itemText = line.trim().replace(/^[-*•]\s+/, '');
        elements.push(
          <li key={index} className="ml-5 list-disc marker:text-[#FCD702] text-[#1E1D1B] leading-[1.62] text-[13.5px] sm:text-[14px] py-0.5">
            {renderInlineMarkdown(itemText)}
            {cursor}
          </li>
        );
        return;
      }

      // Numbered lists
      const numberedMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (numberedMatch) {
        elements.push(
          <div key={index} className="flex gap-2.5 my-1 text-[#1E1D1B] leading-[1.62] text-[13.5px] sm:text-[14px]">
            <span className="font-semibold text-[#D60103] text-[13.5px] sm:text-[14px] min-w-[18px]">
              {numberedMatch[1]}.
            </span>
            <span className="flex-1">
              {renderInlineMarkdown(numberedMatch[2])}
              {cursor}
            </span>
          </div>
        );
        return;
      }

      // Blockquotes
      if (line.trim().startsWith('> ')) {
        elements.push(
          <blockquote key={index} className="border-l-2 border-[#FCD702] pl-3.5 my-2.5 italic text-[#4A463F] text-[13.5px] sm:text-[14px] py-0.5">
            {renderInlineMarkdown(line.trim().substring(2))}
            {cursor}
          </blockquote>
        );
        return;
      }

      // Empty lines
      if (!line.trim()) {
        if (isLast && isStreaming) {
          elements.push(
            <div key={index} className="h-3 flex items-center">
              <RotatingSquareCursor />
            </div>
          );
        } else {
          elements.push(<div key={index} className="h-2" />);
        }
        return;
      }

      // Standard paragraph
      elements.push(
        <p key={index} className="leading-[1.62] text-[#1E1D1B] my-1.5 font-normal text-[13.5px] sm:text-[14px]">
          {renderInlineMarkdown(line)}
          {cursor}
        </p>
      );
    });

    return elements;
  };

  const renderInlineMarkdown = (text: string) => {
    // Normalize any in-flight [SOURCE X] variants to [X]
    const cleanText = text.replace(/\[\s*(?:source|sources)\s*(\d+(?:\s*,\s*\d+)*)\s*\]/gi, '[$1]');

    // Regex splits by:
    // 1. Display math: $$...$$
    // 2. Inline math: $...$ (does not match empty or cross-newlines)
    // 3. Bold: **...**
    // 4. Code: `...`
    // 5. Italic: *...*
    // 6. Citation tokens: [1], [2], [1, 2], [1, 2, 3], etc.
    const parts = cleanText.split(/(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$|\*\*.*?\*\*|`.*?`|\*.*?\*|\[\d+(?:\s*,\s*\d+)*\])/g);

    return parts.map((part, i) => {
      // Citation tokens: [1], [2], [1, 2], etc.
      if (part.startsWith('[') && part.endsWith(']') && /^\[\d+(?:\s*,\s*\d+)*\]$/.test(part)) {
        const nums = part
          .slice(1, -1)
          .split(',')
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n));

        return (
          <span key={`cite-group-${i}`} className="inline-flex items-center align-baseline">
            {nums.map((num, idx) => {
              const source = sources && sources.length >= num ? sources[num - 1] : undefined;
              if (source) {
                return <CitationTooltip key={`cite-${num}-${idx}`} source={source} num={num} />;
              }
              return (
                <span
                  key={`cite-fallback-${num}-${idx}`}
                  className="inline-flex items-center justify-center text-[10px] font-semibold text-[#D93025] bg-red-50 border border-red-200/70 rounded px-1.5 py-0.5 mx-0.5 leading-none align-middle select-none"
                  title={`Curriculum Citation [${num}]`}
                >
                  {num}
                </span>
              );
            })}
          </span>
        );
      }

      // Display math ($$...$$)
      if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
        try {
          const math = sanitizeLatex(part.slice(2, -2));
          const html = katex.renderToString(math, {
            displayMode: true,
            throwOnError: false,
          });
          return (
            <span
              key={i}
              className="block my-2 overflow-x-auto text-center select-text"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={i}>{part}</span>;
        }
      }

      // Inline math ($...$)
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2 && !part.startsWith('$$')) {
        try {
          const math = sanitizeLatex(part.slice(1, -1));
          const html = katex.renderToString(math, {
            displayMode: false,
            throwOnError: false,
          });
          return (
            <span
              key={i}
              className="inline-math px-0.5 align-baseline select-text"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={i}>{part}</span>;
        }
      }

      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-[#0D0D0E]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="font-mono text-[12.5px] bg-[#F1F5F9] text-[#181615] px-1.5 py-0.5 rounded mx-0.5 border border-black/[0.06]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="italic text-[#2C2A26]">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return <div className="space-y-1">{formatMarkdown(healMarkdownLatex(processedContent))}</div>;
};
