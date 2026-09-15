import { useEffect, useRef, useState } from 'react';
import { Group, Layer, Line, Rect, Stage, Text } from 'react-konva';
import Konva from 'konva';
import { challenges, filled, HEIGHT, LEFT, number, relative, slotX, solved, TABLE_HEIGHT, TARGET_Y, UNIT, WIDTH, type Action, type Piece, type Snapshot } from './model';

const palette = [ ['#e9b46d','#bd8444'], ['#72aaa0','#468078'], ['#a59dc6','#7e74a1'], ['#d99885','#b57260'] ];
interface Props { state: Snapshot; symbols: boolean; cut: string | null; dispatch: (action: Action)=>void; reduced: boolean; }

function Tile({piece,selected,symbols,whole,cut,reduced,onSelect,onDrop}: {
  piece:Piece; selected:boolean; symbols:boolean; whole:string; cut:string|null; reduced:boolean;
  onSelect:()=>void; onDrop:(x:number,y:number)=>void;
}) {
  const ref=useRef<Konva.Group>(null);
  const origin=useRef({x:piece.x,y:piece.y});
  const tween=useRef<Konva.Tween|null>(null);
  const dragging=useRef(false);
  const cancelled=useRef(false);
  const [lift,setLift]=useState(false);
  const width=number(piece.amount)*UNIT;
  const [top,edge]=palette[piece.color];
  useEffect(()=>{
    const node=ref.current; if (!node || dragging.current) return;
    tween.current?.destroy();
    if (reduced) node.position({x:piece.x,y:piece.y});
    else { tween.current=new Konva.Tween({node,x:piece.x,y:piece.y,duration:.23,easing:Konva.Easings.EaseInOut}); tween.current.play(); }
    return ()=>{ tween.current?.destroy(); };
  },[piece.x,piece.y,reduced]);
  useEffect(()=>{
    const cancel=()=>{
      if (!dragging.current) return;
      cancelled.current=true; dragging.current=false; setLift(false);
      ref.current?.stopDrag(); ref.current?.position({x:piece.x,y:piece.y});
    };
    window.addEventListener('pointercancel',cancel); window.addEventListener('touchcancel',cancel);
    window.addEventListener('blur',cancel); window.addEventListener('resize',cancel);
    return ()=>{cancel();window.removeEventListener('pointercancel',cancel);window.removeEventListener('touchcancel',cancel);window.removeEventListener('blur',cancel);window.removeEventListener('resize',cancel);};
  },[piece.x,piece.y]);
  return <Group ref={ref} x={origin.current.x} y={origin.current.y} draggable name={'piece-'+piece.id}
    onClick={onSelect} onTap={onSelect}
    onDragStart={()=>{tween.current?.destroy();cancelled.current=false;dragging.current=true;setLift(true);}}
    onDragEnd={e=>{
      dragging.current=false;setLift(false); if(cancelled.current) return;
      const x=e.target.x(),y=e.target.y();
      // Restore the node before applying a semantic drop, including rejected drops.
      e.target.position({x:piece.x,y:piece.y});onDrop(x,y);
    }}>
    <Rect x={0} y={lift?-7:0} width={width} height={HEIGHT+9} fill={edge} cornerRadius={8}
      shadowColor="#253d37" shadowBlur={lift?22:9} shadowOpacity={lift?.2:.11} shadowOffsetY={lift?18:7}/>
    <Rect x={0} y={lift?-7:0} width={width} height={HEIGHT} cornerRadius={7}
      fillLinearGradientStartPoint={{x:0,y:0}} fillLinearGradientEndPoint={{x:0,y:HEIGHT}}
      fillLinearGradientColorStops={[0,top,1,top]} stroke={selected?'#254b43':'#ffffff66'} strokeWidth={selected?3:1}/>
    <Line points={[9,7,width-9,7]} stroke="#ffffff55" strokeWidth={2} listening={false}/>
    {selected && <Rect x={width/2-3} y={HEIGHT+19} width={6} height={6} fill="#254b43" cornerRadius={3} listening={false}/>}
    {symbols && <Text text={relative(piece.amount,whole)} width={width} y={25} align="center" fontSize={width<65?18:26} fill="#254038" listening={false}/>}
    {selected && cut && piece.slot===null && <Line points={[number(cut)*width,-10,number(cut)*width,HEIGHT+12]} dash={[5,5]} stroke="#254038" strokeWidth={3} listening={false}/>}
  </Group>;
}

export function Table({state,symbols,cut,dispatch,reduced}:Props) {
  const host=useRef<HTMLDivElement>(null);
  const [size,setSize]=useState(900);
  useEffect(()=>{
    if(!host.current) return;
    const observer=new ResizeObserver(entries=>setSize(entries[0].contentRect.width));
    observer.observe(host.current);return ()=>observer.disconnect();
  },[]);
  const c=challenges[state.level];
  const complete=solved(state);
  const scale=size/WIDTH;
  function drop(piece:Piece,x:number,y:number) {
    const center=x+number(piece.amount)*UNIT/2;
    const slot=c.slots.findIndex((amount,i)=>center>=slotX(state,i)-12 && center<=slotX(state,i)+number(amount)*UNIT+12);
    if(slot>=0 && Math.abs(y-TARGET_Y)<70) dispatch({type:'place',id:piece.id,slot});
    else dispatch({type:'move',id:piece.id,x,y});
  }
  const floating=state.pieces.filter(p=>p.slot===null);
  return <div ref={host} className="table-canvas" data-testid="table" role="img" aria-label="שולחן חיתוך והרכבה. אותן פעולות זמינות בכפתורי החתיכות שמתחת לשולחן.">
    <Stage width={size} height={TABLE_HEIGHT*scale} scaleX={scale} scaleY={scale}>
      <Layer>
        <Rect width={WIDTH} height={TABLE_HEIGHT} fill="#f4f1e9" cornerRadius={24}/>
        <Rect x={28} y={300} width={WIDTH-56} height={TABLE_HEIGHT-328} fill="#eae6dc" cornerRadius={20}/>
        {Array.from({length:17},(_,i)=><Line key={i} points={[52,327+i*18,908,327+i*18]} stroke="#b7ab9710" listening={false}/>)}
        <Line points={[LEFT,86,LEFT+UNIT*number(state.whole),86]} stroke="#657b70" strokeWidth={2}/>
        {[0,number(state.whole)].map((n,i)=><Line key={i} points={[LEFT+UNIT*n,77,LEFT+UNIT*n,95]} stroke="#657b70" strokeWidth={2}/>)}
        <Text text="1" x={LEFT} width={UNIT*number(state.whole)} y={46} align="center" fill="#657b70" fontSize={22}/>
        {c.slots.map((amount,i)=>{
          const x=slotX(state,i), width=number(amount)*UNIT;
          return <Group key={i} onClick={()=>state.selected.length===1 && dispatch({type:'place',id:state.selected[0],slot:i})}
            onTap={()=>state.selected.length===1 && dispatch({type:'place',id:state.selected[0],slot:i})}>
            <Rect x={x+2} y={TARGET_Y-4} width={width-4} height={HEIGHT+17} fill={complete?'#dcece3':'#e0e4dc'} cornerRadius={9} stroke={complete?'#4a8575':'#92a095'} strokeWidth={2} dash={complete?[]:[6,6]}/>
            {Array.from({length:c.counts?.[i]??1},(_,j)=><Rect key={j} x={x+width/2+((j-((c.counts?.[i]??1)-1)/2)*14)-3} y={TARGET_Y+HEIGHT+31} width={6} height={6} cornerRadius={3} fill="#728a7d" listening={false}/>)}
            {number(filled(state,i))===0 && <Text text="↓" x={x} width={width} y={TARGET_Y+22} align="center" fontSize={30} fill="#879b8a" listening={false}/>}
          </Group>;
        })}
        {state.pieces.filter(p=>p.slot!==null).concat(floating).map(p=><Tile key={p.id} piece={p} selected={state.selected.includes(p.id)} symbols={symbols} whole={state.whole}
          cut={state.selected.length===1?cut:null} reduced={reduced}
          onSelect={()=>dispatch({type:'select',id:p.id})} onDrop={(x,y)=>drop(p,x,y)}/>)}
        {complete && <Text text="✓" x={LEFT+UNIT+30} y={TARGET_Y+20} fontSize={36} fill="#478574" listening={false}/>}
      </Layer>
    </Stage>
  </div>;
}
