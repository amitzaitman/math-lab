import Fraction from 'fraction.js';

// Rational strings are JSON-safe. Pixel positions never participate in equality.
export type Amount = string;
export const add = (a: Amount, b: Amount) => new Fraction(a).add(b).toFraction();
export const subtract = (a: Amount, b: Amount) => new Fraction(a).sub(b).toFraction();
export const multiply = (a: Amount, b: Amount) => new Fraction(a).mul(b).toFraction();
export const equal = (a: Amount, b: Amount) => new Fraction(a).equals(b);
export const number = (a: Amount) => new Fraction(a).valueOf();
export const relative = (a: Amount, whole: Amount) => new Fraction(a).div(whole).toFraction();
export const sum = (values: Amount[]) => values.reduce(add, '0');

export interface Piece { id: number; amount: Amount; x: number; y: number; slot: number | null; color: number; }
export interface Challenge { id: string; name: string; hint: string; stock: Amount; slots: Amount[]; counts?: number[]; equalParts?: boolean; }
export const challenges: Challenge[] = [
  {id: 'halves', name: 'שני חלקים שווים', hint: 'בחרו את החתיכה, חתכו אותה, והרכיבו את שני המקומות. נסו גם חיתוך שאינו באמצע — אפשר לחבר בחזרה או לבטל.', stock:'1', slots:['1/2','1/2'], counts:[1,1]},
  {id: 'exchange', name: 'חצי בשתי דרכים', hint: 'המסגרת היא חצי מהשלם. כסו אותה בשתי חתיכות שוות. מספר החתיכות משתנה, הכמות נשארת.', stock:'1/2', slots:['1/2'], counts:[2], equalParts:true},
  {id: 'mixed', name: 'שלם מחלקים שונים', hint: 'הרכיבו שלם מחצי ושני רבעים. בחרו שתי חתיכות במגש ולחצו על החיבור כדי ליצור חתיכה אחת.', stock:'1', slots:['1/2','1/4','1/4'], counts:[1,1,1]},
  {id: 'thirds', name: 'דרך חדשה לחלק', hint: 'שלושה מקומות שווים. אחרי שמפרידים שליש מהשלם, איזה חיתוך יחלק את מה שנשאר לשני שלישים שווים?', stock:'1', slots:['1/3','1/3','1/3'], counts:[1,1,1]},
  {id: 'explore', name: 'שולחן פתוח', hint: 'חתכו, חברו והרכיבו בכל דרך. אפשר לשנות את סרגל השלם מבלי לשנות אף חתיכה: מה קורה לשם השבר? כפתור העין חושף את הסימונים.', stock:'1', slots:['1']},
];
export const UNIT = 600;
export const LEFT = 180;
export const TARGET_Y = 172;
export const HEIGHT = 78;
export const WIDTH = 960;
export const TABLE_HEIGHT = 670;
export const CUTS = ['1/4','1/3','1/2','2/3','3/4'];
export interface Snapshot { version: 1; level: number; pieces: Piece[]; selected: number[]; nextId: number; whole: Amount; }
export interface History { past: Snapshot[]; present: Snapshot; future: Snapshot[]; }
export type Action = {type:'select'; id:number} | {type:'cut'; ratio:Amount} | {type:'join'} |
  {type:'move'; id:number; x:number; y:number; slot?:number | null} | {type:'place'; id:number; slot:number} |
  {type:'undo'} | {type:'redo'} | {type:'reset'} | {type:'level'; level:number} | {type:'whole'};
export function initial(level = 0): Snapshot {
  return {version:1, level, pieces:[{id:1, amount:challenges[level].stock, x:LEFT, y:420, slot:null, color:0}], selected:[1], nextId:2, whole:'1'};
}
export const history = (level = 0): History => ({past:[], present:initial(level), future:[]});
export function slotX(s: Snapshot, slot: number) {
  return LEFT + UNIT * number(sum(challenges[s.level].slots.slice(0, slot)));
}
export function filled(s: Snapshot, slot: number) { return sum(s.pieces.filter(p => p.slot === slot).map(p => p.amount)); }
export function solved(s: Snapshot) {
  const c = challenges[s.level];
  return c.slots.every((capacity, i) => {
    const parts = s.pieces.filter(p => p.slot === i);
    return equal(filled(s,i), capacity) && (!c.counts || parts.length === c.counts[i]) &&
      (!c.equalParts || parts.every(p => equal(p.amount,parts[0].amount)));
  }) && s.pieces.every(p => p.slot !== null);
}
export function canCut(s: Snapshot, ratio: Amount) {
  const p = s.pieces.find(p => p.id === s.selected[0]);
  return !!p && s.selected.length === 1 && p.slot === null && CUTS.includes(ratio) && s.pieces.length < 12 &&
    number(multiply(p.amount, ratio)) >= 1/12 && number(multiply(p.amount, subtract('1',ratio))) >= 1/12;
}
export function canJoin(s: Snapshot) { return s.selected.length > 1 && s.selected.every(id => s.pieces.some(p => p.id === id && p.slot === null)); }
function commit(h: History, present: Snapshot): History { return {past:[...h.past.slice(-59),h.present],present,future:[]}; }
function pack(s: Snapshot): Snapshot {
  const used: Record<number, Amount> = {};
  return {...s,pieces:s.pieces.map(p => {
    if (p.slot === null) return p;
    const before = used[p.slot] ?? '0'; used[p.slot] = add(before,p.amount);
    return {...p,x:slotX(s,p.slot) + number(before)*UNIT,y:TARGET_Y};
  })};
}
export function reducer(h: History, action: Action): History {
  const s = h.present;
  if (action.type === 'level') return Number.isInteger(action.level) && challenges[action.level] ? history(action.level) : h;
  if (action.type === 'reset') return history(s.level);
  if (action.type === 'undo') return h.past.length ? {past:h.past.slice(0,-1),present:h.past[h.past.length-1],future:[s,...h.future]} : h;
  if (action.type === 'redo') return h.future.length ? {past:[...h.past,s],present:h.future[0],future:h.future.slice(1)} : h;
  if (action.type === 'whole') return commit(h,{...s,whole:equal(s.whole,'1') ? '1/2' : '1'});
  if (action.type === 'select') return s.pieces.some(p=>p.id===action.id) ? {...h,present:{...s,selected:s.selected.includes(action.id) ? s.selected.filter(id=>id!==action.id) : [...s.selected,action.id]}} : h;
  if (action.type === 'cut') {
    if (!canCut(s,action.ratio)) return h;
    const p=s.pieces.find(p=>p.id===s.selected[0])!;
    const a=multiply(p.amount,action.ratio), b=subtract(p.amount,a);
    const pieces=s.pieces.filter(q=>q.id!==p.id).concat([
      {...p,id:s.nextId,amount:a,x:Math.max(24,p.x-8)},
      {...p,id:s.nextId+1,amount:b,x:Math.min(WIDTH-number(b)*UNIT-24,p.x+number(a)*UNIT+16),color:(p.color+1)%4},
    ]);
    return commit(h,{...s,pieces,selected:[],nextId:s.nextId+2});
  }
  if (action.type === 'join') {
    if (!canJoin(s)) return h;
    const chosen=s.pieces.filter(p=>s.selected.includes(p.id));
    const amount=sum(chosen.map(p=>p.amount));
    return commit(h,{...s,pieces:[...s.pieces.filter(p=>!s.selected.includes(p.id)),{id:s.nextId,amount,
      x:Math.min(Math.min(...chosen.map(p=>p.x)),WIDTH-number(amount)*UNIT-24),y:Math.min(...chosen.map(p=>p.y)),slot:null,color:chosen[0].color}],selected:[s.nextId],nextId:s.nextId+1});
  }
  const p=s.pieces.find(p=>p.id===action.id); if (!p) return h;
  const slot=action.type==='place' ? action.slot : action.slot ?? null;
  if (slot !== null) {
    const capacity=challenges[s.level].slots[slot];
    const rest=sum(s.pieces.filter(q=>q.id!==p.id && q.slot===slot).map(q=>q.amount));
    if (!capacity || new Fraction(add(rest,p.amount)).compare(capacity)>0) return h;
    if (p.slot===slot) return h;
    return commit(h,pack({...s,pieces:s.pieces.map(q=>q.id===p.id?{...q,slot}:q),selected:[]}));
  }
  if (action.type!=='move' || !Number.isFinite(action.x) || !Number.isFinite(action.y)) return h;
  const x=Math.max(24,Math.min(WIDTH-number(p.amount)*UNIT-24,action.x));
  const y=Math.max(320,Math.min(TABLE_HEIGHT-HEIGHT-24,action.y));
  if (p.slot===null && x===p.x && y===p.y) return h;
  return commit(h,pack({...s,pieces:s.pieces.map(q=>q.id===p.id?{...q,x,y,slot:null}:q)}));
}
