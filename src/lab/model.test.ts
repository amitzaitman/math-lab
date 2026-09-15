import { describe, expect, it } from 'vitest';
import { add, canCut, canJoin, challenges, CUTS, equal, history, initial, reducer, relative, solved, sum, type History } from './model';
const total=(h:History)=>sum(h.present.pieces.map(p=>p.amount));
describe('exact quantity and reversible manipulation',()=>{
  it('preserves stock for every permitted cut and join, including unequal parts',()=>{
    for(let level=0;level<challenges.length;level++) for(const ratio of CUTS){
      let h=history(level); if(!canCut(h.present,ratio)) continue;
      h=reducer(h,{type:'cut',ratio});
      expect(equal(total(h),challenges[level].stock)).toBe(true);
      for(const p of h.present.pieces) h=reducer(h,{type:'select',id:p.id});
      expect(canJoin(h.present)).toBe(true);
      h=reducer(h,{type:'join'});
      expect(h.present.pieces).toHaveLength(1);
      expect(equal(total(h),challenges[level].stock)).toBe(true);
      expect(reducer(reducer(h,{type:'undo'}),{type:'redo'}).present).toEqual(h.present);
    }
  });
  it('does not accept a whole as a half or duplicate an already placed piece',()=>{
    let h=history();expect(reducer(h,{type:'place',id:1,slot:0})).toBe(h);
    h=reducer(h,{type:'cut',ratio:'1/2'});
    h=reducer(h,{type:'place',id:2,slot:0});
    expect(reducer(h,{type:'place',id:2,slot:0})).toBe(h);
    expect(reducer(h,{type:'place',id:3,slot:0})).toBe(h);
    h=reducer(h,{type:'place',id:3,slot:1});expect(solved(h.present)).toBe(true);
    expect(equal(total(h),'1')).toBe(true);
  });
  it('distinguishes covering half from covering it with two equal parts',()=>{
    let h=history(1);h=reducer(h,{type:'place',id:1,slot:0});expect(solved(h.present)).toBe(false);
    h=history(1);h=reducer(h,{type:'cut',ratio:'1/3'});
    h=reducer(reducer(h,{type:'place',id:2,slot:0}),{type:'place',id:3,slot:0});
    expect(equal(total(h),'1/2')).toBe(true);expect(solved(h.present)).toBe(false);
    h=history(1);h=reducer(h,{type:'cut',ratio:'1/2'});
    h=reducer(reducer(h,{type:'place',id:2,slot:0}),{type:'place',id:3,slot:0});
    expect(solved(h.present)).toBe(true);
  });
  it('changes the referent, not the pieces, and supports JSON snapshots',()=>{
    let h=history(1);const before=h.present.pieces;
    expect(relative(before[0].amount,h.present.whole)).toBe('1/2');
    h=reducer(h,{type:'whole'});
    expect(h.present.pieces).toBe(before);expect(relative(before[0].amount,h.present.whole)).toBe('1');
    expect(JSON.parse(JSON.stringify(h))).toEqual(h);
  });
  it('rejects unsupported cuts and invalid movement, and discards a redo branch',()=>{
    let h=history();expect(reducer(h,{type:'cut',ratio:'0'})).toBe(h);
    expect(reducer(h,{type:'move',id:1,x:NaN,y:400})).toBe(h);
    h=reducer(h,{type:'cut',ratio:'1/2'});h=reducer(h,{type:'undo'});
    expect(h.present).toEqual(initial());h=reducer(h,{type:'cut',ratio:'1/3'});
    expect(h.future).toHaveLength(0);
    expect(add('1/3','1/6')).toBe('1/2');
  });
});
