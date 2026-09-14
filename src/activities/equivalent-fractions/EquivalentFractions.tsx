import { useEffect, useReducer, useState } from 'react';
import { FractionBar } from '../../manipulatives/FractionBar';
import { initialState, reducer, rounds } from './model';
import styles from './EquivalentFractions.module.css';

export function EquivalentFractions() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [started, setStarted] = useState(false);
  const [help, setHelp] = useState(false);
  const round = rounds[state.round];
  useEffect(() => {
    if (!state.solved || state.complete || help) return;
    const timer = window.setTimeout(() => dispatch({type: 'next'}), 1800);
    return () => window.clearTimeout(timer);
  }, [state.solved, state.complete, state.round, help]);
  function reset() { dispatch({type: 'reset'}); setStarted(false); setHelp(false); }
  const symbols = state.round >= 2 || state.solved;
  return <section className={styles.activity} aria-label="שברים שקולים">
    <nav className={styles.tools} aria-label="כלים">
      <button className="quiet" aria-label="התחלה מחדש" onClick={reset}>↻</button>
      <button className="quiet" aria-label="עזרה" aria-expanded={help} onClick={() => setHelp(!help)}>?</button>
    </nav>
    {help && <aside className={styles.help}>מלאו את הפס הזהוב עד שיתאים לירוק. אפשר לגרור, לגעת או להשתמש בחצים במקלדת.</aside>}
    <div className={styles.progress} aria-label={'תרגיל ' + (state.round + 1) + ' מתוך ' + rounds.length}>
      {rounds.map((_, i) => <span key={i} data-filled={i < state.round || i === state.round && state.solved} />)}
    </div>
    <div className={styles.board} data-solved={state.solved} data-testid="board">
      <FractionBar numerator={round.target.numerator} denominator={round.target.denominator} showSymbol={symbols}
        label={'שבר היעד ' + round.target.numerator + ' מתוך ' + round.target.denominator} />
      <div className={styles.bridge} aria-hidden="true">{state.solved ? '=' : '↕'}</div>
      <div className={styles.input} onPointerDownCapture={() => setStarted(true)} onKeyDownCapture={() => setStarted(true)}>
        <FractionBar key={state.round + ':' + state.complete} numerator={state.numerator} denominator={round.denominator}
          showSymbol={symbols} label="מילוי הפס" disabled={state.solved}
          onChange={numerator => dispatch({type: 'select', numerator})} />
        {!started && !state.solved && state.round === 0 && <div className={styles.gesture} aria-hidden="true" data-testid="gesture">
          <span className={styles.trail} /><span className={styles.finger}>☝</span>
        </div>}
      </div>
    </div>
    <p className={styles.srOnly} role="status" aria-live="polite">
      {state.complete ? 'הפעילות הושלמה' : state.solved ? 'בדיוק! אותה כמות.' : 'התאימו את הכמות בפס הזהוב לפס הירוק'}
    </p>
    {state.complete && <div className={styles.finish}>
      <span aria-hidden="true">✦</span>
      <button aria-label="ננסה שוב" onClick={reset}>↻</button>
    </div>}
  </section>;
}
