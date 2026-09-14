import { useReducer } from 'react';
import { FractionBar } from '../../manipulatives/FractionBar';
import { initialState, reducer, rounds } from './model';
import styles from './EquivalentFractions.module.css';

export function EquivalentFractions() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const round = rounds[state.round];
  return <section className={styles.activity} aria-labelledby="activity-title">
    <div className={styles.topline}><span>01 / שברים שקולים</span><button className="quiet" onClick={() => dispatch({type:'reset'})}>התחלה מחדש</button></div>
    <h1 id="activity-title">{state.complete ? 'חלקים שונים. אותה כמות.' : 'אותה כמות, בדרך אחרת'}</h1>
    <p className={styles.subtitle}>{state.complete ? 'גיליתם איך שברים שונים יכולים להיות שווים.' : 'מלאו את הפס הזהוב עד שיתאים לפס הירוק.'}</p>
    <div className={styles.progress} aria-label={'תרגיל ' + (state.round + 1) + ' מתוך ' + rounds.length}>
      {rounds.map((_, i) => <span key={i} data-filled={i < state.round || i === state.round && state.solved} />)}
    </div>
    <div className={styles.board}>
      <div className={styles.label}>הכמות שלנו</div>
      <FractionBar numerator={round.target.numerator} denominator={round.target.denominator}
        label={'שבר היעד ' + round.target.numerator + ' מתוך ' + round.target.denominator} />
      <div className={styles.bridge} aria-hidden="true">{state.solved ? '=' : '↕'}</div>
      <div className={styles.label}>החלוקה שלכם</div>
      <FractionBar key={state.round + ':' + state.complete} numerator={state.numerator} denominator={round.denominator}
        label="מילוי הפס" disabled={state.solved} onChange={numerator => dispatch({type: 'select', numerator})} />
      <p className={styles.hint}>גוררים או נוגעים בפס · במקלדת: מקשי החצים</p>
    </div>
    <div className={styles.feedback}>
      <p role="status" aria-live="polite">{state.solved ? 'בדיוק! אותו אורך, אותה כמות.' : 'אפשר לנסות ולשנות — הפס הירוק נשאר קבוע.'}</p>
      {state.complete ? <button onClick={() => dispatch({type:'reset'})}>ננסה שוב ↻</button> :
        state.solved ? <button onClick={() => dispatch({type:'next'})}>{state.round === rounds.length - 1 ? 'סיום המסע' : 'ממשיכים ←'}</button> : null}
    </div>
  </section>;
}
