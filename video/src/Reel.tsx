import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {assets, CTA, CTA_DETAIL, FPS, scenes} from './config';
import './style.css';
const RED='#f12b31', IVORY='#f5f1e8', BLACK='#101010';
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const pop=(frame:number,delay=0,strong=false)=>spring({frame:frame-delay,fps:FPS,config:{damping:strong?11:18,stiffness:240,mass:0.65}});

const Words:React.FC<{lines:readonly string[];red:number;large?:boolean}>=({lines,red,large})=>{
 const f=useCurrentFrame(); let wordIndex=0;
 return <div className="headline">{lines.map((line,i)=><div key={line} style={{fontSize:i===red?(large?174:150):112,color:i===red?RED:undefined,lineHeight:1.03,marginBottom:12}}>{line.split(' ').map(word=>{const delay=4+wordIndex++*4; const p=pop(f,delay,i===red);return <span key={word} style={{display:'inline-block',marginRight:22,opacity:interpolate(f-delay,[0,4],[0,1],clamp),transform:`translateY(${(1-p)*70}px) scale(${0.8+p*0.2})`,filter:`blur(${Math.max(0,1-p)*5}px)`}}>{word}</span>})}</div>)}</div>
};
const Curve=()=> <svg className="curve" viewBox="0 0 1080 1920"><path d="M-280 1430 C1100 1950 1430 400 600 800 S-600 1400 400 2140" fill="none" stroke="#e1ded7" strokeWidth="100"/></svg>;
const Sticker:React.FC<{symbol:string;x:number;y:number;size?:number;delay?:number}>=({symbol,x,y,size=130,delay=4})=>{const f=useCurrentFrame(),p=pop(f,delay,true);return <div style={{position:'absolute',left:x,top:y,fontSize:size,transform:`translateY(${(1-p)*250+Math.sin(f/11)*9}px) rotate(${-12+(1-p)*30}deg) scale(${p})`,filter:'drop-shadow(0 16px 20px #0003)'}}>{symbol}</div>};
const Product:React.FC<{src:string;gray?:boolean;tilt?:number;top?:number;tap?:boolean}>=({src,gray=false,tilt=-5,top=790,tap=true})=>{
 const f=useCurrentFrame(),p=pop(f,7);const ring=interpolate(f,[24,39],[0,1],clamp);
 return <div style={{position:'absolute',left:70,top,width:940,transform:`translateX(${(1-p)*400}px) translateY(${Math.sin(f/15)*8}px) rotate(${tilt+(1-p)*14}deg) scale(${0.88+p*0.12})`,filter:`blur(${Math.max(0,1-p)*7}px)`}}>
  <div style={{border:'2px solid #ffffff50',borderRadius:28,overflow:'hidden',boxShadow:'0 36px 100px #0004',background:'#fff',position:'relative'}}>
   <Img src={staticFile(src)} style={{width:'100%',display:'block',filter:gray?'grayscale(1) contrast(1.15)':'none'}}/>
   {gray&&<div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(#0007 1px, transparent 1px)',backgroundSize:'5px 5px'}}/>}
   {tap&&f>24&&<div style={{position:'absolute',left:'72%',top:'53%',width:110,height:110,border:`5px solid ${RED}`,borderRadius:'50%',opacity:1-ring,transform:`scale(${0.3+ring*1.5})`}}/>}
  </div>
  <div style={{fontSize:24,letterSpacing:3,marginTop:28,textAlign:'center',opacity:.6}}>TRISHUL PRODUCT PREVIEW · SAMPLE DATA</div>
 </div>
};
const Note=()=>{const f=useCurrentFrame(),p=pop(f,4);return <div className="note" style={{transform:`translateY(${(1-p)*300}px) rotate(-6deg)`}}><div className="pin"/><div className="note-label">TODAY, UNDER CONTROL.</div>{['Plan your seats','Track your fees','Know your students'].map((s,i)=><div className="check-row" key={s} style={{opacity:interpolate(f,[10+i*10,14+i*10],[0,1],clamp),transform:`translateX(${(1-pop(f,10+i*10))*40}px)`}}><span>✓</span>{s}</div>)}<div className="note-line"/></div>};
const Keyboard=()=>{const f=useCurrentFrame();return <div className="keyboard" style={{transform:`translateX(${(1-pop(f,4))*600}px) rotate(-17deg)`}}>{Array.from({length:40},(_,i)=><div key={i} style={{background:i===25?RED:'#d1d1ce',color:i===25?'white':'#333'}}>{i===25?'!':i%3===0?'·':''}</div>)}</div>};
const Scene:React.FC<{index:number}>=({index})=>{
 const scene=scenes[index],f=useCurrentFrame(); const kind=scene.kind;
 return <AbsoluteFill style={{background:scene.dark?BLACK:IVORY,color:scene.dark?IVORY:BLACK,overflow:'hidden',clipPath:(index===3||index===7)?`circle(${interpolate(f,[0,9],[0,1400],clamp)}px at 50% 50%)`:undefined}}>
  {!scene.dark&&<Curve/>}{scene.dark&&<div className="glow"/>}
  <div className="scene-label"><span className="red-dot"/>{scene.label}</div>
  <div style={{position:'absolute',top:kind==='type'?540:kind==='contrast'?600:310,left:76,right:76,transform:kind==='contrast'?'rotate(-4deg)':undefined}}><Words lines={scene.lines} red={scene.red} large={kind==='brand'}/></div>
  {kind==='opening'&&<><Product src={assets.home} top={850} tilt={7} tap={false}/><Sticker symbol="✦" x={800} y={690} size={130}/></>}
  {kind==='problem'&&<><Keyboard/><Sticker symbol="😵‍💫" x={710} y={690}/><div className="tiny-copy">The paperwork never stops.</div></>}
  {kind==='type'&&<div className="type-line" style={{width:interpolate(f,[18,32],[0,820],clamp)}}/>}
  {kind==='seats'&&<><Product src={assets.seats}/><Sticker symbol="💡" x={790} y={640} size={150}/></>}
  {kind==='fees'&&<><Product src={assets.fees} tilt={5}/><Sticker symbol="💸" x={770} y={660}/></>}
  {kind==='checklist'&&<Note/>}
  {kind==='contrast'&&<div className="focus-orbit" style={{transform:`rotate(${f*1.5}deg)`}}>✦</div>}
  {kind==='brand'&&<><Product src={assets.home} top={850} tilt={-3} tap={false}/><div className="brand-sub">Seats. Students. Fees. Together.</div></>}
  {kind==='students'&&<Product src={assets.students} top={820} tilt={3}/>}
  {kind==='cta'&&<><div className="wordmark">trishul<span>.</span></div><div className="cta" style={{transform:`scale(${0.9+pop(f,16,true)*.1})`,opacity:interpolate(f,[16,20],[0,1],clamp)}}>{CTA}<span>↗</span></div><div className="cta-detail">{CTA_DETAIL}</div><Sticker symbol="✨" x={790} y={810}/></>}
  <div className="foot"><span>TRISHUL</span><span>{String(index+1).padStart(2,'0')} / 10</span></div>
  <div className="grain"/>

 </AbsoluteFill>
};
export const Reel=()=>{let from=0;return <AbsoluteFill style={{fontFamily:'Arial, Helvetica, sans-serif',background:BLACK}}><Audio src={staticFile('soundtrack.wav')} volume={0.7}/>{scenes.map((scene,index)=>{const start=from;from+=scene.duration;return <Sequence key={index} from={start} durationInFrames={scene.duration}><Scene index={index}/></Sequence>})}</AbsoluteFill>};
