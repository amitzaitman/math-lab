import { useEffect, useReducer, useState } from 'react';
import { ArrowLeft, Check, Eye, HelpCircle, Link, Redo2, RotateCcw, Ruler, Scissors, Undo2 } from 'lucide-react';
import { Table } from './Table';
import { canCut, canJoin, challenges, CUTS, history, number, reducer, relative, solved } from './model';
import './lab.css';

function Diagram({parts}: {parts:string[]}) {
  const total=parts.reduce((a,p)=>a+number(p),0);
  return <span className="diagram" aria-hidden="true">{parts.map((p,i)=><span key={i} style={{flex:number(p)/total}}/>)}</span>;
}
export function Lab() {
  const [h,dispatch]=useReducer(reducer,undefined,()=>history());
  const s=h.present,c=challenges[s.level];
  const [symbols,setSymbols]=useState(false);
  const [help,setHelp]=useState(false);
  const [cut,setCut]=useState<string|null>('1/2');
  const [reduced,setReduced]=useState(false);
  const done=solved(s);
  useEffect(()=>{
    const query=matchMedia('(prefers-reduced-motion: reduce)');
    const change=()=>setReduced(query.matches);change();query.addEventListener('change',change);return ()=>query.removeEventListener('change',change);
  },[]);
  const selected=s.pieces.filter(p=>s.selected.includes(p.id));
  const canSplit=selected.length===1 && selected[0].slot===null;
  return <main className="lab" aria-label="מעבדת השברים">
    <header className="lab-header">
      <span className="lab-mark" aria-hidden="true"><i/><i/><i/></span>
      <nav className="chapters" aria-label="פעילויות">
        {challenges.map((chapter,i)=><button key={chapter.id} aria-label={chapter.name} aria-current={s.level===i?'step':undefined}
          onClick={()=>dispatch({type:'level',level:i})}><Diagram parts={chapter.slots}/></button>)}
      </nav>
      <button className="icon-button" aria-label="עזרה" aria-expanded={help} onClick={()=>setHelp(!help)}><HelpCircle size={21}/></button>
    </header>
    {help && <aside className="help-panel"><strong>{c.name}</strong><p>{c.hint}</p><p>הנקודות מתחת למסגרת מציינות כמה חתיכות נרצה להניח בה. בוחרים חתיכה ואז כלי או יעד. בחירה בכמה חתיכות מאפשרת לחבר אותן. במקלדת משתמשים בכפתורי החתיכות והיעדים.</p></aside>}
    <div className="workbench">
      <div className="bench-top">
        <span className="chapter-number" aria-label={'פעילות '+(s.level+1)+' מתוך '+challenges.length}>{String(s.level+1).padStart(2,'0')} <span>/ {String(challenges.length).padStart(2,'0')}</span></span>
        <div className="bench-tools">
          <button className="icon-button" aria-label="הצגת שברים" aria-pressed={symbols} onClick={()=>setSymbols(!symbols)}><Eye size={20}/></button>
          <button className="icon-button" aria-label="שינוי השלם להשוואה" aria-pressed={s.whole==='1/2'} onClick={()=>{dispatch({type:'whole'});setSymbols(true);}}><Ruler size={20}/></button>
        </div>
      </div>
      <Table state={s} dispatch={dispatch} symbols={symbols} cut={cut} reduced={reduced}/>
      <div className="cut-tools" role="group" aria-label="חיתוך וחיבור">
        <Scissors size={21} aria-hidden="true"/>
        <div className="cut-options">{CUTS.map(ratio=><button key={ratio} className="cut-choice" disabled={!canCut(s,ratio)}
          aria-label={'חיתוך בנקודה '+ratio} onPointerEnter={()=>setCut(ratio)} onFocus={()=>setCut(ratio)}
          onClick={()=>dispatch({type:'cut',ratio})}><Diagram parts={[ratio,String(1-number(ratio))]}/></button>)}</div>
        <span className="tool-separator"/>
        <button className="icon-button" aria-label="חיבור החתיכות שנבחרו" disabled={!canJoin(s)} onClick={()=>dispatch({type:'join'})}><Link size={22}/></button>
      </div>
      {!canSplit && selected.length===0 && <span className="selection-cue" aria-hidden="true">◌</span>}
    </div>
    <div className="under-table">
      <div className="history-tools">
        <button className="icon-button" aria-label="ביטול" disabled={!h.past.length} onClick={()=>dispatch({type:'undo'})}><Undo2 size={22}/></button>
        <button className="icon-button" aria-label="ביצוע מחדש" disabled={!h.future.length} onClick={()=>dispatch({type:'redo'})}><Redo2 size={22}/></button>
        <button className="icon-button" aria-label="התחלה מחדש" onClick={()=>dispatch({type:'reset'})}><RotateCcw size={19}/></button>
      </div>
      <div className="conservation" dir="ltr" aria-label="הכמות הכוללת נשמרת" data-testid="conservation">
        {symbols ? <>{relative(c.stock,s.whole)} <span>=</span> {s.pieces.map(p=>relative(p.amount,s.whole)).join(' + ')}</> : <><Diagram parts={[c.stock]}/><span>=</span><Diagram parts={s.pieces.map(p=>p.amount)}/></>}
      </div>
      <button className={'next-button '+(done?'ready':'')} aria-label={s.level===challenges.length-1?'התחלה מחדש':'הפעילות הבאה'} disabled={!done}
        onClick={()=>dispatch(s.level===challenges.length-1?{type:'reset'}:{type:'level',level:s.level+1})}>{done?<Check size={23}/>:<ArrowLeft size={23}/>}</button>
    </div>
    <div className="piece-controls" role="group" aria-label="בחירת חתיכות">
      {s.pieces.map(p=><button key={p.id} className={'piece-chip color-'+p.color} aria-label={'חתיכה '+p.id+', '+relative(p.amount,s.whole)+(p.slot===null?', במגש':', במסגרת')}
        aria-pressed={s.selected.includes(p.id)} onClick={()=>dispatch({type:'select',id:p.id})}>
        <span className="chip-size" style={{width:Math.max(10,number(p.amount)*60)}} aria-hidden="true"/>
        {symbols && <span dir="ltr" aria-hidden="true">{relative(p.amount,s.whole)}</span>}
      </button>)}
    </div>
    {selected.length===1 && <div className="target-controls" role="group" aria-label="הנחת החתיכה שנבחרה">
      {c.slots.map((amount,i)=><button key={i} aria-label={'הנחה במסגרת '+(i+1)} onClick={()=>dispatch({type:'place',id:selected[0].id,slot:i})}><span aria-hidden="true">↓</span><Diagram parts={[amount]}/></button>)}
      {selected[0].slot!==null && <button aria-label="הוצאה למגש" onClick={()=>dispatch({type:'move',id:selected[0].id,x:180,y:440})}><span aria-hidden="true">↓ ▱</span></button>}
    </div>}
    <p className="sr-only" role="status" aria-live="polite">{done?'ההרכבה הושלמה. אפשר להמשיך לחקור או לעבור לפעילות הבאה.':s.pieces.length+' חתיכות. '+selected.length+' נבחרו.'}</p>
  </main>;
}
