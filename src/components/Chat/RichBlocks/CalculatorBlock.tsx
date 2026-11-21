import React, { useState, useEffect, useRef } from 'react';
import type { CalculatorBlockPayload } from '../../../types';
import { Sliders } from 'lucide-react';
import katex from 'katex';

/** Renders a LaTeX string as a display block using KaTeX */
const KaTeXDisplay: React.FC<{ formula: string }> = ({ formula }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    try {
      katex.render(formula, ref.current, { throwOnError: false, displayMode: true });
    } catch {
      if (ref.current) ref.current.textContent = formula;
    }
  }, [formula]);
  return <span ref={ref} className="block text-center" />;
};

type CalcType = CalculatorBlockPayload['calculationType'];

interface ComputeResult {
  primary: string;
  secondary: string;
  formula: string; // KaTeX display formula string showing live substituted values
}

function computeResult(
  calculationType: CalcType,
  values: Record<string, number>
): ComputeResult {
  switch (calculationType) {
    case 'ohms-law': {
      const V = values['V'] ?? 12;
      const R = values['R'] ?? 4;
      const I = +(V / R).toFixed(4);
      return {
        primary: `I = ${I} A`,
        secondary: `Voltage: ${V} V  |  Resistance: ${R} Ω`,
        formula: `I = \\frac{V}{R} = \\frac{${V}}{${R}} = ${I}\\,\\text{A}`,
      };
    }
    case 'power-formula': {
      const V = values['V'] ?? 220;
      const I = values['I'] ?? 2;
      const P = +(V * I).toFixed(2);
      return {
        primary: `P = ${P} W`,
        secondary: `P = VI = ${V}×${I}`,
        formula: `P = VI = ${V} \\times ${I} = ${P}\\,\\text{W}`,
      };
    }
    case 'joules-law': {
      const I = values['I'] ?? 2;
      const R = values['R'] ?? 10;
      const t = values['t'] ?? 60;
      const H = +(I * I * R * t).toFixed(2);
      return {
        primary: `H = ${H} J`,
        secondary: `Heat generated in ${t}s`,
        formula: `H = I^2 R t = ${I}^2 \\times ${R} \\times ${t} = ${H}\\,\\text{J}`,
      };
    }
    case 'resistivity': {
      const rho = values['rho'] ?? 1.7;
      const l = values['l'] ?? 1;
      const A = values['A'] ?? 1;
      const R = +((rho * 1e-8 * l) / (A * 1e-6)).toFixed(6);
      return {
        primary: `R = ${R} Ω`,
        secondary: `ρ=${rho}×10⁻⁸ Ω·m  l=${l}m  A=${A}mm²`,
        formula: `R = \\frac{\\rho l}{A} = \\frac{${rho} \\times 10^{-8} \\times ${l}}{${A} \\times 10^{-6}} = ${R}\\,\\Omega`,
      };
    }
    case 'kinetic-energy': {
      const m = values['m'] ?? 5;
      const v = values['v'] ?? 10;
      const KE = +(0.5 * m * v * v).toFixed(2);
      return {
        primary: `KE = ${KE} J`,
        secondary: `Mass: ${m} kg  |  Speed: ${v} m/s`,
        formula: `KE = \\frac{1}{2}mv^2 = \\frac{1}{2} \\times ${m} \\times ${v}^2 = ${KE}\\,\\text{J}`,
      };
    }
    case 'wavelength': {
      const f = values['f'] ?? 5;
      const c = 3e8;
      const lam = +(c / (f * 1e14)).toFixed(4);
      return {
        primary: `λ = ${lam} μm`,
        secondary: `Frequency: ${f}×10¹⁴ Hz`,
        formula: `\\lambda = \\frac{c}{f} = \\frac{3 \\times 10^8}{${f} \\times 10^{14}} = ${lam}\\,\\mu\\text{m}`,
      };
    }
    case 'newtons-second': {
      const m = values['m'] ?? 10;
      const a = values['a'] ?? 5;
      const F = +(m * a).toFixed(2);
      return {
        primary: `F = ${F} N`,
        secondary: `Mass: ${m} kg  |  Acceleration: ${a} m/s²`,
        formula: `F = ma = ${m} \\times ${a} = ${F}\\,\\text{N}`,
      };
    }
    case 'gravitational-pe': {
      const m = values['m'] ?? 5;
      const h = values['h'] ?? 10;
      const g = 9.8;
      const PE = +(m * g * h).toFixed(2);
      return {
        primary: `PE = ${PE} J`,
        secondary: `Mass: ${m} kg  |  Height: ${h} m  |  g = 9.8 m/s²`,
        formula: `PE = mgh = ${m} \\times 9.8 \\times ${h} = ${PE}\\,\\text{J}`,
      };
    }
    case 'ideal-gas': {
      const n = values['n'] ?? 1;
      const T = values['T'] ?? 300;
      const V = values['V'] ?? 1;
      const R = 8.314;
      const P = +((n * R * T) / V).toFixed(2);
      return {
        primary: `P = ${P} Pa`,
        secondary: `n=${n} mol  T=${T} K  V=${V} L`,
        formula: `PV = nRT \\Rightarrow P = \\frac{nRT}{V} = \\frac{${n} \\times 8.314 \\times ${T}}{${V}} = ${P}\\,\\text{Pa}`,
      };
    }
    case 'sampling-temperature': {
      const temp = values['temp'] ?? 0.7;
      const topP = values['top_p'] ?? 0.9;
      const diversity = Math.round((temp * 0.65 + topP * 0.35) * 100);
      const risk = temp > 0.85 ? 'High (hallucinations likely)' : temp > 0.4 ? 'Balanced (creative & accurate)' : 'Strict (deterministic)';
      return { primary: `${diversity}% Diversity Index`, secondary: risk, formula: '' };
    }
    case 'compound-growth': {
      const base = values['base'] ?? 1000;
      const rate = (values['rate'] ?? 8) / 100;
      const years = values['years'] ?? 5;
      const total = Math.round(base * Math.pow(1 + rate, years));
      return {
        primary: `$${total.toLocaleString()}`,
        secondary: `Gain: +$${(total - base).toLocaleString()}`,
        formula: `A = P(1+r)^t = ${base}(1+${(rate * 100).toFixed(0)}\\%)^{${years}} = \\$${total.toLocaleString()}`,
      };
    }
    default: {
      const sum = Object.values(values).reduce((a, b) => a + b, 0);
      return { primary: `${sum}`, secondary: 'Composite output', formula: '' };
    }
  }
}

export const CalculatorBlock: React.FC<CalculatorBlockPayload> = ({
  title,
  formulaLabel,
  inputs,
  calculationType,
}) => {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    inputs.forEach((inp) => {
      initial[inp.id] = inp.defaultValue;
    });
    return initial;
  });

  const handleChange = (id: string, val: number) => {
    setValues((prev) => ({ ...prev, [id]: val }));
  };

  const result = computeResult(calculationType, values);

  return (
    <div className="my-6 w-full select-none">
      <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 sm:p-6 md:p-7">
        <div className="flex items-center justify-between mb-4 border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[var(--accent-primary)]" />
            <span className="text-sm font-medium text-[var(--text-primary)]">{title}</span>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">{formulaLabel}</span>
        </div>

        {/* Live KaTeX formula display */}
        {result.formula && (
          <div className="mb-5 py-3 px-4 rounded-xl bg-white/70 border border-[var(--border-subtle)] overflow-x-auto">
            <KaTeXDisplay formula={result.formula} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Input sliders */}
          <div className="space-y-4 lg:col-span-7">
            {inputs.map((inp) => (
              <div key={inp.id} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">{inp.label}</span>
                  <span className="font-mono font-medium text-[var(--accent-primary)]">
                    {values[inp.id]} {inp.unit || ''}
                  </span>
                </div>
                <input
                  type="range"
                  min={inp.min}
                  max={inp.max}
                  step={inp.step}
                  value={values[inp.id] ?? inp.defaultValue}
                  onChange={(e) => handleChange(inp.id, Number(e.target.value))}
                  className="w-full accent-[var(--accent-primary)] cursor-pointer h-1.5 bg-black/10 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                  <span>{inp.min} {inp.unit || ''}</span>
                  <span>{inp.max} {inp.unit || ''}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Live Result Card */}
          <div className="lg:col-span-5 h-full">
            <div className="p-5 rounded-xl bg-white/85 border border-[var(--border-medium)] flex flex-col justify-between h-full shadow-soft-sm min-h-[90px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  Result
                </span>
                <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
              </div>
              <div className="my-3">
                <div className="text-2xl font-serif font-normal text-[var(--text-primary)] tracking-tight">
                  {result.primary}
                </div>
              </div>
              <div className="text-xs font-mono text-[var(--accent-primary)] font-medium pt-2 border-t border-black/[0.04]">
                {result.secondary}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
