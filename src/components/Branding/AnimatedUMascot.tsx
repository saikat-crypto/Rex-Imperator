import * as React from "react"

interface Props { preview?:string; cadence?:number; style?:React.CSSProperties; className?: string; paused?: boolean }
const logo="https://framerusercontent.com/images/bcVQxnu5ZLXCDEwQ7y7dCxSjw.png?width=1600&height=800&kb=906"
const poses=[[-17,0,1],[17,-8,2],[0,0,3],[0,0,4],[-12,5,5],[0,-12,6],[0,0,7],[12,4,8],[0,0,9], [0,0,10], [5,2,11], [-5,2,12], [0,0,13], [0,0,14], [0,0,15]]

export default function AnimatedUMascot({cadence=11,preview="auto",style,className, paused=false}:Props){
 const [pose,setPose]=React.useState(-1)
 const [blink,setBlink]=React.useState(false)
 const [draw,setDraw]=React.useState(0)
 const [fading]=React.useState(false)
 const [wiping,setWiping]=React.useState(false)
 const [hand,setHand]=React.useState({x:239,y:250,angle:-90})
 const forming=React.useRef(true)
 const trace=React.useRef<SVGPathElement>(null)
 const innerTrace=React.useRef<SVGPathElement>(null)
 React.useEffect(()=>{
  if (paused) return;
  const media=window.matchMedia("(prefers-reduced-motion: reduce)")
  let alive=true, frame=0
  const timers=new Set<ReturnType<typeof setTimeout>>()
  const later=(fn:()=>void,ms:number)=>{const t=setTimeout(()=>{timers.delete(t);if(alive)fn()},ms);timers.add(t)}
  const sweep=(erase:boolean)=>{
   if(media.matches){setDraw(1);setWiping(false);forming.current=false;return}
   if(document.hidden){later(()=>sweep(erase),10000);return}
   forming.current=true;setPose(-1);setWiping(erase)
   const start=performance.now()
   const tick=(now:number)=>{
    if(!alive)return
    const t=Math.min(1,(now-start)/3600)
    const eased=t*t*(3-2*t)
    const p=erase?1-eased:eased
    setDraw(p)
    if(innerTrace.current&&trace.current){
     const pt=innerTrace.current.getPointAtLength(innerTrace.current.getTotalLength()*p)
     const outer=trace.current.getPointAtLength(trace.current.getTotalLength()*p)
     const angle=Math.atan2(outer.y-pt.y,outer.x-pt.x)*180/Math.PI+90
     setHand({x:pt.x,y:pt.y,angle})
    }
    if(t<1)frame=requestAnimationFrame(tick)
    else {
     forming.current=false;setWiping(false)
     later(()=>sweep(!erase),erase?4500+Math.random()*2000:26000+Math.random()*10000)
    }
   }
   frame=requestAnimationFrame(tick)
  }
  if(media.matches){setDraw(1);forming.current=false}else later(()=>sweep(false),1400)
  return()=>{alive=false;cancelAnimationFrame(frame);timers.forEach(clearTimeout)}
 },[paused])
 React.useEffect(()=>{
  if (paused) return;
  const media=window.matchMedia("(prefers-reduced-motion: reduce)")
  let active=true
  const timers=new Set<ReturnType<typeof setTimeout>>()
  let last=-1
  const later=(fn:()=>void,ms:number)=>{const t=setTimeout(()=>{timers.delete(t);if(active)fn()},ms);timers.add(t)}
  const cycle=()=>{
   if(!media.matches){
    let next=Math.floor(Math.random()*poses.length);if(next===last)next=(next+1)%poses.length;last=next
    setPose(next);later(()=>setPose(-1),2500+Math.random()*1000)
   }
   later(cycle,Math.max(3,cadence)*1000+Math.random()*2000)
  }
  const blinkLoop=()=>{if(!media.matches){setBlink(true);later(()=>setBlink(false),150)}later(blinkLoop,2500+Math.random()*2000)}
  later(cycle,1500);later(blinkLoop,1200)
  return()=>{active=false;timers.forEach(clearTimeout)}

 },[cadence, paused])
 const selected=preview==="auto"?pose:Number(preview)
 const progress=paused ? 1 : (preview==="face"?0:preview==="wiping"?.52:preview==="forming"?.52:preview==="forming-left"?.18:preview==="forming-right"?.82:preview==="auto"?draw:1)
 const handPoint=preview==="forming"||preview==="wiping"?{x:330,y:518,angle:180}:preview==="forming-left"?{x:239,y:390,angle:-90}:preview==="forming-right"?{x:445,y:390,angle:90}:hand
 const [dx,dy,expression]=selected<0?[0,0,0]:poses[selected] || [0,0,0]
 const clipId=React.useId().replace(/:/g,"")
 const amused=[1,3,7,8,9,10,14].includes(expression)
 const startled=expression===6||expression===12
 const skeptical=expression===5||expression===15
 const mouth=expression===6||expression===12?"M337 450 Q359 421 381 451 Q382 486 359 486 Q337 483 337 450":expression===2||expression===11?"M338 451 Q357 435 378 451 Q365 475 338 451":expression===5||expression===15?"M304 462 Q357 452 418 464":amused?"M299 444 Q358 505 418 439":"M302 459 Q358 450 416 455"

 const transition="transform 420ms cubic-bezier(.22,1,.36,1)"
 return <div role="img" aria-label="U mascot" className={className} style={{width:"100%",height:"100%",...style,overflow:"hidden"}}>
 <svg width="100%" height="100%" viewBox="51 133 574 574" style={{display:"block",overflow:"hidden"}}>
 <defs>
 <path ref={innerTrace} d="M239 250 L239 405 Q239 518 338 518 Q445 518 445 398 L450 250" fill="none"/>
 <clipPath id={clipId}><path d="M51 133H625V298L616 400L600 505L551 621L435 697H51Z"/></clipPath>
 <clipPath id={clipId+"edge"}><path d="M439 405 L455 405 Q452 451 438 482 L423 478 Q438 446 439 405Z"/></clipPath>
 <mask id={clipId+"body"} maskUnits="userSpaceOnUse" x="51" y="133" width="574" height="574">
 <path ref={trace} d="M157 250 L157 420 Q157 570 300 570 L355 570 Q529 570 529 410 L529 250" fill="none" stroke="white" strokeWidth="235" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1-progress} opacity={progress>0?1:0}/>
 </mask>
 </defs>
 <g style={{opacity:fading&&preview==="auto"?0:1,transition:"opacity 700ms ease"}}>
 <image href={logo} x="0" y="0" width="1600" height="800" clipPath={"url(#"+clipId+")"} mask={"url(#"+clipId+"body)"}/>
 </g>
 <path d="M263 211 Q301 173 329 199" fill="none" stroke="#B8000C" strokeWidth="26" strokeLinecap="round"/>
 <path d="M397 218 Q420 196 447 215" fill="none" stroke="#B8000C" strokeWidth="25" strokeLinecap="round"/>
 <ellipse cx="300" cy="313" rx="62" ry="78" fill="white" stroke="#950008" strokeWidth="9"/>
 <ellipse cx="437" cy="313" rx="57" ry="74" fill="white" stroke="#950008" strokeWidth="9"/>
 <ellipse cx="300" cy="316" rx="52" ry="66" fill="#fff"/>
 <ellipse cx="437" cy="315" rx="48" ry="61" fill="#fff"/>
 {[300,437].map((x,i)=><g key={x} style={{transformOrigin:x+"px 316px",transform:blink||(expression===3&&i===1)?"scaleY(.08)":skeptical?"scaleY(.65)":expression===7?"scaleY(.72)":"scaleY(1)",transition:blink?"transform 100ms ease":transition}}>
 <ellipse cx={x} cy="316" rx={i===0?51:47} ry={i===0?65:60} fill="white"/>
 <g style={{transform:"translate("+dx+"px,"+dy+"px)",transition}}>
 <ellipse cx={x+9} cy="324" rx={startled?21:30} ry={startled?32:43} fill="#300006"/>
 <ellipse cx={x+19} cy="305" rx="10" ry="13" fill="white"/>
 </g></g>)}
 <path d="M286 427 Q356 410 437 430 L430 475 Q356 503 287 487 Z" fill="#F7F7F7"/>
 <g mask={"url(#"+clipId+"body)"} style={{opacity:fading&&preview==="auto"?0:1,transition:"opacity 700ms ease"}}>
 <image href={logo} x="0" y="0" width="1600" height="800" clipPath={"url(#"+clipId+"edge)"}/>
 </g>
 <path d={mouth} stroke="#720008" strokeWidth={expression===2||startled?12:16} fill={expression===2||startled||expression===7||expression===8?"#720008":"none"} strokeLinecap="round" strokeLinejoin="round"/>

 {expression===8&&<path d="M344 466 Q360 458 377 466 L374 485 Q359 503 346 483Z" fill="#F2727E" stroke="#720008" strokeWidth="5"/>}
 {expression===6&&<path d="M505 272 Q525 298 509 309 Q489 312 493 296Z" fill="#A9DCE9" stroke="#720008" strokeWidth="4"/>}
 {progress>0&&progress<1&&<g transform={"translate("+(handPoint.x-34)+" "+(handPoint.y-112)+") rotate("+handPoint.angle+" 34 112)"} stroke="#720008" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
 <path d="M34 112 Q14 99 35 73" fill="none" stroke="#720008" strokeWidth="19"/>
 <path d="M34 112 Q14 99 35 73" fill="none" stroke="#D9000D" strokeWidth="11"/>
 {(wiping||preview==="wiping")&&<rect x="1" y="8" width="75" height="56" rx="14" fill="#FFF3B0" stroke="#720008" strokeWidth="4"/>}
 <ellipse cx="39" cy="73" rx="17" ry="8" fill="#FFF9E7" transform="rotate(-18 39 73)"/>
 <path d="M14 52 L5 33 Q1 25 9 22 Q15 20 24 33 L22 6 Q22-3 30-3 Q37-3 37 6 L39 22 L42 1 Q44-7 51-4 Q57-2 55 7 L53 26 L60 13 Q65 6 71 11 Q76 15 72 24 L64 43 Q72 39 77 44 Q81 51 72 59 L56 72 Q34 84 21 66Z" fill="#FFF9E7"/>
 <path d="M27 46q13-7 23 5" fill="none"/>
 </g>}
 {expression===9&&progress===1&&<g transform="translate(313 375) rotate(180 17 143)" stroke="#720008" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
  <path d="M17 143 Q45 153 54 108" fill="none" stroke="#720008" strokeWidth="19"/>
  <path d="M17 143 Q45 153 54 108" fill="none" stroke="#D9000D" strokeWidth="11"/>
  <ellipse cx="46" cy="111" rx="21" ry="8" fill="#FFF9E7"/>
  <path d="M8 95 Q-5 77 6 49 L9 12 Q11-6 25 0 Q32 3 31 20 L31 39 Q43 28 53 39 Q65 32 73 45 Q92 43 93 63 L91 84 Q85 107 61 111 L25 111Z" fill="#FFF9E7"/>
  <ellipse cx="20" cy="17" rx="13" ry="18" fill="#FFF9E7"/>
  <path d="M31 47v21m22-24v23m20-18v19M15 80q20-19 37 0" fill="none"/>
 </g>}
 </svg></div>
}

