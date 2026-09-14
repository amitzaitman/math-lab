import { useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import { snapFraction } from '../math/fractions';
import styles from './FractionBar.module.css';

interface Props {
  numerator: number; denominator: number; label: string;
  onChange?: (numerator: number) => void; disabled?: boolean;
}
export function FractionBar({numerator, denominator, label, onChange, disabled = false}: Props) {
  const active = useRef<number | null>(null);
  const [draft, setDraft] = useState<number | null>(null);
  const interactive = !!onChange && !disabled;
  const shown = draft ?? numerator;
  function valueAt(e: PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    // Same mathematical direction in Hebrew and English: zero is at the left.
    return snapFraction((e.clientX - box.left) / box.width, denominator);
  }
  function start(e: PointerEvent<SVGSVGElement>) {
    if (!interactive || active.current !== null || !e.isPrimary || e.button !== 0) return;
    active.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();
    setDraft(valueAt(e));
  }
  function end(e: PointerEvent<SVGSVGElement>) {
    if (active.current !== e.pointerId) return;
    active.current = null;
    setDraft(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
    onChange?.(valueAt(e));
  }
  function cancel() { active.current = null; setDraft(null); }
  function key(e: KeyboardEvent<SVGSVGElement>) {
    if (!interactive) return;
    const values: Record<string, number> = {
      ArrowRight: numerator + 1, ArrowUp: numerator + 1,
      ArrowLeft: numerator - 1, ArrowDown: numerator - 1,
      Home: 0, End: denominator,
    };
    if (!(e.key in values)) return;
    e.preventDefault();
    onChange?.(Math.max(0, Math.min(denominator, values[e.key])));
  }
  return <div className={styles.wrapper} dir="ltr">
    <svg viewBox="0 0 600 100" preserveAspectRatio="none" className={styles.bar}
      role={onChange ? 'slider' : 'img'} aria-label={label}
      aria-valuemin={onChange ? 0 : undefined}
      aria-valuemax={onChange ? denominator : undefined}
      aria-valuenow={onChange ? shown : undefined}
      aria-valuetext={onChange ? shown + ' / ' + denominator : undefined}
      aria-disabled={onChange ? disabled : undefined}
      tabIndex={onChange ? 0 : undefined} data-interactive={interactive}
      onPointerDown={start} onPointerMove={e => {
        if (active.current === e.pointerId) setDraft(valueAt(e));
      }} onPointerUp={end} onPointerCancel={cancel} onLostPointerCapture={cancel} onKeyDown={key}>
      <rect width="600" height="100" fill="var(--empty)" />
      <rect width={600 * shown / denominator} height="100" fill={onChange ? 'var(--gold)' : 'var(--teal)'} />
      {Array.from({length: denominator - 1}, (_, i) =>
        <line key={i} x1={600 * (i + 1) / denominator} x2={600 * (i + 1) / denominator}
          y1="0" y2="100" stroke="var(--paper)" strokeWidth="4" />)}
    </svg>
    <span className={styles.fraction} aria-hidden="true"><span>{shown}</span><span>{denominator}</span></span>
  </div>;
}
