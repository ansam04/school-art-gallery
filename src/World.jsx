import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { SCHOOL, classes, sections, ROOM_ARTWORK_CAPACITY } from './data'
import schoolLogo from './assets/school-logo.webp'
import moeLogo from './assets/moe-logo.webp'

const C = {
  sandstone: '#e7dccd', ivory: '#f9f2e8', cream: '#eee6dc',
  floor: '#c9b9a8', brass: '#b58d58', charcoal: '#293037',
  sage: '#7f9992', deep: '#425b61', terracotta: '#b98173',
}
const PLACEHOLDER = 'هنا ستُعرض أعمال الطالبات بعد إضافتها من لوحة الإدارة'
const SCHOOL_SIGN_LINES = [
  { text: SCHOOL, size: 103, weight: 700, color: '#274542' },
  { text: 'معرض الإبداع الفني الافتراضي', size: 57, weight: 600, color: '#957950' },
]
// Five intentionally short lines: larger names without enlarging the plaque.
// Dark colors and bold weights improve legibility on mobile devices.
const LOBBY_CREDIT_LINES = [
  { text: 'معرض إبداعات طالباتنا', size: 136, weight: 800, color: '#173b38' },
  { text: 'إشراف معلمة التربية الفنية', size: 96, weight: 700, color: '#35514c' },
  { text: 'أريج الفواز', size: 158, weight: 800, color: '#123b37' },
  { text: 'مديرة المدرسة', size: 96, weight: 700, color: '#35514c' },
  { text: 'ماجدة الرفاعي', size: 158, weight: 800, color: '#123b37' },
]

function Box({ p=[0,0,0], s=[1,1,1], color=C.cream, metalness=0, roughness=.8, onClick, rotation, opacity=1 }) {
  return <mesh position={p} rotation={rotation} castShadow receiveShadow onClick={onClick}>
    <boxGeometry args={s}/>
    <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} transparent={opacity<1} opacity={opacity}/>
  </mesh>
}
function Label({ children, p, width=320, className='', onClick, scale=.012 }) {
  return <Html position={p} center transform distanceFactor={12} scale={scale/.012} zIndexRange={[50,0]}>
    <div dir="rtl" className={`world-label ${className}`} style={{width}} onClick={onClick}>{children}</div>
  </Html>
}
function Pillar({ p }) {
  return <group position={p}>
    <Box p={[0,2.9,0]} s={[.85,5.8,.85]} color={C.ivory}/>
    <Box p={[0,5.9,0]} s={[1.18,.32,1.18]} color={C.brass} metalness={.45}/>
    <Box p={[0,.2,0]} s={[1.12,.4,1.12]} color={C.sandstone}/>
  </group>
}
function Plant({p=[0,0,0],scale=1}) {
  return <group position={p} scale={scale}>
    <mesh position={[0,.48,0]} castShadow><cylinderGeometry args={[.52,.34,.96,12]}/><meshStandardMaterial color="#c2b6a8" roughness={.85}/></mesh>
    {Array.from({length:6},(_,i)=>{
      const a=i*Math.PI/3
      return <mesh key={i} position={[Math.cos(a)*.31,1.4+Math.sin(i*2)*.12,Math.sin(a)*.31]} rotation={[.20*Math.cos(a),a,.27]} castShadow>
        <sphereGeometry args={[.31,12,10]}/><meshStandardMaterial color={i%2?'#64796a':'#819482'} roughness={.9}/>
      </mesh>
    })}
    <mesh position={[0,1.16,0]}><cylinderGeometry args={[.09,.11,.6,9]}/><meshStandardMaterial color="#6c7660"/></mesh>
  </group>
}
function Sculpture({p=[0,0,0],style='arc'}) {
  return <group position={p}>
    <Box p={[0,.54,0]} s={[1.3,1.08,1.3]} color="#e6d7c7"/>
    <Box p={[0,1.15,0]} s={[1.52,.15,1.52]} color={C.ivory}/>
    {style==='arc' ? <mesh position={[0,1.77,0]} rotation={[0,Math.PI/5,0]} castShadow>
      <torusGeometry args={[.58,.19,12,45,Math.PI*1.6]}/><meshStandardMaterial color="#a77f64" roughness={.45} metalness={.13}/>
    </mesh> : <mesh position={[0,1.78,0]} castShadow>
      <dodecahedronGeometry args={[.59,0]}/><meshStandardMaterial color={C.sage} roughness={.5}/>
    </mesh>}
  </group>
}
function Ground({w=30,d=23}) {
  return <group>
    <Box p={[0,-.24,0]} s={[w,.48,d]} color="#ac9e90"/>
    <Box p={[0,.01,0]} s={[w-.34,.06,d-.34]} color={C.floor} roughness={.3}/>
    {Array.from({length:7},(_,i)=><Box key={i} p={[-w/2+(i+1)*w/8,.048,0]} s={[.025,.008,d-.45]} color="#e7ded4"/>)}
  </group>
}
function WallArt({p,accent=C.sage,angle=0}) {
  return <group position={p} rotation={[0,angle,0]}>
    <Box s={[2.8,2.8,.12]} color={C.brass}/>
    <Box p={[0,0,.085]} s={[2.54,2.54,.04]} color={C.ivory}/>
    <mesh position={[0,0,.13]}><planeGeometry args={[2.26,2.26]}/><meshStandardMaterial color={accent}/></mesh>
    <mesh position={[-.28,.15,.15]} rotation={[0,0,.6]}><torusGeometry args={[.62,.21,9,40]}/><meshStandardMaterial color="#e2ccaf"/></mesh>
    <mesh position={[.39,-.43,.16]}><circleGeometry args={[.35,30]}/><meshStandardMaterial color="#eee6d8"/></mesh>
  </group>
}
function LightSetup(){return <>
  <ambientLight intensity={1.3}/>
  <hemisphereLight intensity={.85} color="#fff0de" groundColor="#97918b"/>
  <directionalLight position={[7,14,9]} intensity={2.6} castShadow shadow-mapSize={[1024,1024]}/>
  <pointLight position={[-9,5,1]} intensity={65} distance={20} color="#ffdfa9"/>
  <pointLight position={[9,5,-2]} intensity={55} distance={19} color="#f1e8ff"/>
</>}
function CeilingBeams({w,d}){
  return <group>
    {[-1,0,1].map(i=><Box key={i} p={[i*w/3,6.72,0]} s={[.14,.14,d-.8]} color={C.brass}/>) }
    {[-1,0,1].map(i=><Box key={'b'+i} p={[0,6.75,i*d/4]} s={[w-.8,.08,.12]} color="#f9e3bd"/>) }
  </group>
}
// A finished, inward-facing ceiling for exhibition rooms.
// The single-sided underside stays invisible from a top-down camera view.
function RoomCeiling({w,d}) {
  return <group>
    <mesh position={[0,6.82,0]} rotation={[Math.PI/2,0,0]} receiveShadow>
      <planeGeometry args={[w-.62,d-.62]}/>
      <meshStandardMaterial color="#f5f1e9" roughness={.92} side={THREE.FrontSide}/>
    </mesh>
    {/* Three slim lighting tracks replace the open, crossing beam grid. */}
    {[-w*.27,0,w*.27].map((x,i)=><group key={i}>
      <Box p={[x,6.72,0]} s={[.13,.065,d-.95]} color="#d9c5a6"/>
      {[-d*.26,d*.26].map((z,j)=><group key={j}>
        <Box p={[x,6.62,z]} s={[.20,.075,2.1]} color="#fff4db"/>
        <pointLight position={[x,6.32,z]} intensity={16} distance={12} color="#fff2d6"/>
      </group>)}
    </group>)}
  </group>
}
function GalleryShell({w=30,d=23,heading,sub,finishedCeiling=false,roomNameplate=false}){
  return <group>
    <Ground w={w} d={d}/>
    <Box p={[0,3.42,-d/2]} s={[w,6.84,.42]} color={C.cream}/>
    <Box p={[-w/2,3.42,0]} s={[.42,6.84,d]} color={C.sandstone}/>
    <Box p={[w/2,3.42,0]} s={[.42,6.84,d]} color={C.sandstone}/>
    <Box p={[0,.22,-d/2+.31]} s={[w-.45,.36,.22]} color={C.brass}/>
    <Box p={[0,6.63,-d/2+.3]} s={[w-.5,.23,.23]} color={C.brass}/>
    {finishedCeiling ? <RoomCeiling w={w} d={d}/> : <CeilingBeams w={w} d={d}/>}
    {roomNameplate ? (
      // Real three-dimensional wall sign: stays sharp and fixed above the art.
      // Unlike a floating Html label, it never overlaps the framed works on phones.
      <CanvasSign
        p={[0,5.70,-d/2+.63]}
        size={[8.2,1.58]}
        frameColor="#496963"
        faceColor="#f8f5ef"
        lines={[
          { text: heading, size: 148, weight: 800, color: '#193e39' },
          { text: sub.split('|')[0].trim(), size: 94, weight: 700, color: '#415d55' },
        ]}
      />
    ) : (
      <Label p={[0,5.5,-d/2+.42]} width={390} className="architecture-title"><strong>{heading}</strong><small>{sub}</small></Label>
    )}
    <pointLight position={[0,5,0]} intensity={80} distance={25} color="#ffe1bc"/>
  </group>
}
// Physical 3D Arabic sign. CanvasTexture is used instead of Html because
// the latter can be hidden or clipped by the browser's 3D CSS layers.
// The text remains attached to the actual door inside the WebGL scene.

// The canvas and the displayed plane MUST have the same aspect ratio.
// Otherwise Arabic text becomes unnaturally stretched (as in the previous version).
function CanvasSign({
  lines=[],
  p=[0,0,0],
  size=[6,1.6],
  frameColor=C.deep,
  faceColor='#f3f6f1',
  textColor='#274542',
  accentColor='#b58d58',
  rotation=[0,0,0],
  textureWidth=2048,
}) {
  const innerWidth = size[0] - .20
  const innerHeight = size[1] - .20
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = textureWidth
    // Match actual mesh aspect ratio to avoid stretching the words.
    canvas.height = Math.round(canvas.width * (innerHeight / innerWidth))
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const w = canvas.width
    const h = canvas.height
    ctx.fillStyle = faceColor
    ctx.fillRect(0, 0, w, h)
    ctx.lineWidth = Math.max(5, h * .022)
    ctx.strokeStyle = '#7d9b93'
    ctx.strokeRect(8, 8, w-16, h-16)
    ctx.lineWidth = Math.max(2, h * .01)
    ctx.strokeStyle = accentColor
    ctx.strokeRect(23, 23, w-46, h-46)
    ctx.direction = 'rtl'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const ys = lines.length === 1 ? [.5]
      : lines.length === 2 ? [.34, .76]
      : lines.length === 5 ? [.145, .320, .490, .655, .825]
      : [.25, .51, .78]
    lines.forEach((line, i) => {
      const { text = '', size: requestedSize = 90, weight = 700, color = textColor } =
        typeof line === 'string' ? { text: line } : line
      ctx.fillStyle = color
      // Limit type size to the available vertical space as well as the width.
      // The source size scales for larger / smaller canvas heights.
      const lineHeightCap = h * (lines.length === 5 ? .154 : lines.length === 3 ? .18 : lines.length === 2 ? .34 : .5)
      let fontSize = Math.min(requestedSize * (w / 1800), lineHeightCap)
      const sidePadding = Math.max(115, w * .075)
      while (fontSize > 22) {
        ctx.font = `${weight} ${Math.round(fontSize)}px Tahoma, Arial, sans-serif`
        if (ctx.measureText(text).width <= w - sidePadding * 2) break
        fontSize -= 2
      }
      // A very subtle ink outline helps dark Arabic letters hold their shape
      // at smaller mobile display sizes without making the text look heavy.
      ctx.font = `${weight} ${Math.round(fontSize)}px Tahoma, Arial, sans-serif`
      ctx.lineJoin = 'round'
      ctx.strokeStyle = color
      ctx.lineWidth = Math.max(.6, fontSize * .012)
      ctx.strokeText(text, w / 2, h * (ys[i] ?? .5))
      ctx.fillText(text, w / 2, h * (ys[i] ?? .5))
    })
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    t.needsUpdate = true
    return t
  }, [lines, innerHeight, innerWidth, faceColor, textColor, accentColor, textureWidth])
  useEffect(() => () => texture?.dispose(), [texture])
  return <group position={p} rotation={rotation}>
    <Box s={[size[0], size[1], .12]} color={frameColor} roughness={.55}/>
    <Box p={[0,0,.072]} s={[innerWidth, innerHeight, .04]} color={faceColor} roughness={.85}/>
    {texture && <mesh position={[0,0,.099]}>
      <planeGeometry args={[innerWidth, innerHeight]}/>
      <meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide}/>
    </mesh>}
  </group>
}
function LogoPlaque({ image, p=[0,0,0], size=[2.25,2.25], rotation=[0,0,0] }) {
  const [aspect, setAspect] = useState(1)
  const texture = useMemo(() => {
    const t = new THREE.TextureLoader().load(image, loaded => {
      const original = loaded.image
      if (original?.width && original?.height) setAspect(original.width / original.height)
    })
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [image])
  useEffect(() => () => texture?.dispose(), [texture])
  const maxW = size[0] - .36
  const maxH = size[1] - .36
  const h = Math.min(maxH, maxW / aspect)
  const w = h * aspect
  return <group position={p} rotation={rotation}>
    <Box s={[size[0], size[1], .18]} color={C.deep} roughness={.55}/>
    <Box p={[0,0,.10]} s={[size[0]-.2, size[1]-.2, .06]} color='#f8f5ee' roughness={.9}/>
    {texture && <mesh position={[0,0,.151]}>
      <planeGeometry args={[w,h]}/>
      <meshBasicMaterial map={texture} transparent toneMapped={false} side={THREE.DoubleSide}/>
    </mesh>}
  </group>
}
function DoorNameplate({title,onClick}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1400
    canvas.height = 210
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Matte ivory plate with a subtle sage border, aligned with the gallery.
    ctx.fillStyle = '#f3f6f1'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#77958c'
    ctx.lineWidth = 11
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16)

    // Browser Canvas 2D handles shaping and right-to-left Arabic glyphs.
    const text = String(title ?? '')
    ctx.direction = 'rtl'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#31534e'
    let fontSize = 118
    do {
      ctx.font = `700 ${fontSize}px Tahoma, Arial, sans-serif`
      if (ctx.measureText(text).width <= canvas.width - 145) break
      fontSize -= 4
    } while (fontSize > 48)
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 3)

    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    t.needsUpdate = true
    return t
  }, [title])

  useEffect(() => () => texture?.dispose(), [texture])

  return <group>
    <Box p={[0,5.13,.40]} s={[4.84,.88,.16]} color="#607c76" roughness={.65} onClick={onClick}/>
    <Box p={[0,5.13,.495]} s={[4.64,.68,.05]} color="#f3f6f1" roughness={.85} onClick={onClick}/>
    {texture && <mesh position={[0,5.13,.535]} onClick={onClick}>
      <planeGeometry args={[4.62,.66]}/>
      <meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide}/>
    </mesh>}
  </group>
}
function Portal({p=[0,0,0],rotation=0,title,detail,onClick,color=C.deep}){
  return <group position={p} rotation={[0,rotation,0]}>
    <Box p={[0,2.25,0]} s={[5,4.5,.32]} color={C.brass}/>
    <Box p={[0,2.2,.22]} s={[4.65,4.2,.13]} color={C.ivory}/>
    <Box p={[0,2.2,.29]} s={[4.25,3.83,.12]} color={color} roughness={.4} onClick={onClick}/>
    <Box p={[0,4.28,.35]} s={[4.25,.13,.13]} color="#ddbf89" onClick={onClick}/>
    <DoorNameplate title={title} onClick={onClick}/>
    <Label p={[0,2.45,.43]} width={176} className="portal-label" onClick={onClick}>
      <strong>اضغطي للدخول</strong><small>{detail || 'اكتشفي المعرض'}</small>
    </Label>
  </group>
}
function Outside({go}){
  return <group>
    <Ground w={52} d={38}/>
    <Box p={[0,4.6,-9.3]} s={[39,9.2,2]} color={C.sandstone}/>
    <Box p={[0,8.94,-9]} s={[42,.55,4.6]} color={C.ivory}/>
    <Box p={[0,9.4,-8.5]} s={[42,.15,4.2]} color={C.brass}/>
    {[-16.5,-13,13,16.5].map((x,i)=><Pillar key={i} p={[x,0,-6.6]}/>) }
    {[-9,-5,5,9].map(x=><group key={x}>
      <Box p={[x,4.55,-8.05]} s={[2.35,4.7,.18]} color="#486c70" metalness={.28} roughness={.19}/>
      <Box p={[x,4.55,-7.93]} s={[.13,4.8,.2]} color={C.brass}/>
    </group>)}
    <Box p={[0,4,-7.98]} s={[6.7,6,.25]} color="#33464d" metalness={.35} roughness={.19} onClick={()=>go({type:'lobby'})}/>
    <Box p={[0,4,-7.75]} s={[.10,6,.1]} color={C.brass}/>
    {/* One compact, centered group: the two logos flank the school name.
        The whole group remains below the roof eave (bottom about y=8.67). */}
    <CanvasSign p={[0,7.45,-7.35]} size={[7.50,1.55]} lines={SCHOOL_SIGN_LINES} frameColor='#3f625f'/>
    <LogoPlaque image={schoolLogo} p={[-5.18,7.25,-7.35]} size={[2.30,2.20]}/>
    <LogoPlaque image={moeLogo} p={[5.18,7.25,-7.35]} size={[2.30,2.20]}/>
    <Box p={[0,.065,8]} s={[8,.12,23]} color="#e8d8c5"/>
    {[-12,12].map(x=><group key={x}><Sculpture p={[x,0,4]}/><Plant p={[x*1.4,0,-1.5]} scale={1.2}/></group>)}
    <Portal p={[0,0,-7.25]} title="دخول المعرض" detail="ابدئي الزيارة الفنية" color="#3f625f" onClick={()=>go({type:'lobby'})}/>
  </group>
}
function Lobby({go}){
  const wings=classes.map((c,i)=>({c,i,p: i<4?[(i-1.5)*8.4,0,-14.0] : i===4?[-19.2,0,-5]:i===5?[19.2,0,-5]:[19.2,0,4],rotation: i===4?Math.PI/2:i>4?-Math.PI/2:0}))
  return <group>
    <GalleryShell w={40} d={31} heading="ردهة الإبداع" sub="7 أجنحة | 28 قاعة فنية" finishedCeiling/>
    <Box p={[0,.26,6]} s={[15,.52,3]} color={C.ivory}/>
    <Box p={[0,1.05,6]} s={[10,1.1,1.8]} color="#e3d3c2"/>
    <Box p={[0,1.6,6]} s={[10,.16,1.9]} color={C.brass}/>
    <Label p={[0,2.5,6]} width={250} className="desk-sign">أهلاً بكِ في معرض طالباتنا</Label>
    {/* Credits are on the LEFT SIDE WALL, away from all seven wing doors. */}
    <CanvasSign p={[-19.49,3.75,4]} rotation={[0,Math.PI/2,0]} size={[7.4,3.3]} lines={LOBBY_CREDIT_LINES} frameColor='#3f625f' textureWidth={3072} />
    {wings.map(({c,i,p,rotation})=><Portal key={c.id} p={p} rotation={rotation} title={c.label} color={i%2===0?'#536b6c':'#715c5d'} onClick={()=>go({type:'wing',classId:c.id})}/>)}
    <Sculpture p={[-14.5,0,7]}/><Sculpture p={[14.5,0,10]} style="stone"/>
    <Plant p={[-17,0,-9]}/><Plant p={[17,0,-9]}/>
    <WallArt p={[-19.65,3,11]} angle={Math.PI/2} accent={C.terracotta}/>
    <WallArt p={[19.65,3,-3]} angle={-Math.PI/2} accent={C.sage}/>
  </group>
}
function Wing({go,classId}){
  const c=classes.find(x=>x.id===classId)
  return <group>
    <GalleryShell w={33} d={25} heading={`جناح ${c.label}`} sub="الرسم • الزخرفة • الطباعة • الخزف" finishedCeiling/>
    {sections.map((s,i)=><Portal key={s.id} p={[(i-1.5)*7.9,0,-8.3]} title={s.label} detail={s.desc} color={['#876656','#577b72','#7d6682','#8e7855'][i]} onClick={()=>go({type:'room',classId,section:s.id})}/>)}
    <Sculpture p={[-11.5,0,5]}/><Sculpture p={[11.5,0,5]} style="stone"/>
    <Plant p={[0,0,5.3]}/>
  </group>
}
function Artwork({art,p,rot=0,onArt}) {
  // Loading the texture on the object itself does not require any external image service.
  const texture=useMemo(()=>{
    const t=new THREE.TextureLoader().load(art.image_url)
    t.colorSpace=THREE.SRGBColorSpace
    return t
  },[art.image_url])
  useEffect(()=>()=>texture.dispose(),[texture])
  return <group position={p} rotation={[0,rot,0]} onClick={()=>onArt(art)}>
    <Box s={[2.55,2.48,.15]} color={C.brass}/>
    <Box p={[0,0,.09]} s={[2.31,2.25,.06]} color={C.ivory}/>
    <mesh position={[0,0,.133]}><planeGeometry args={[2.16,2.08]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>
    <Label p={[0,-1.52,.20]} width={155} className="art-label"><strong>{art.student_name}</strong></Label>
  </group>
}
// Exhibition layout in metres, shared by all 28 halls.
// 8 works on the far wall, 7 on each long side, 4 on two double-sided
// freestanding exhibition partitions: 8 + 7 + 7 + 4 = 26 displays.
// Each work is 2.55 metres wide; centre-to-centre spacing is at least 3.4m.
const ROOM_DISPLAY_SLOTS = [
  ...Array.from({ length: 8 }, (_, i) => ({
    p: [-12.95 + i * 3.7, 3.35, -13.62], rot: 0,
  })),
  ...Array.from({ length: 7 }, (_, i) => ({
    p: [-16.61, 3.35, -10.2 + i * 3.4], rot: Math.PI / 2,
  })),
  ...Array.from({ length: 7 }, (_, i) => ({
    p: [16.61, 3.35, -10.2 + i * 3.4], rot: -Math.PI / 2,
  })),
  ...[-6.7, 6.7].flatMap(x => [
    { p: [x, 3.35, 4.35], rot: 0 },
    { p: [x, 3.35, 3.67], rot: Math.PI },
  ]),
]
if (ROOM_DISPLAY_SLOTS.length !== ROOM_ARTWORK_CAPACITY) {
  throw new Error('The artwork display layout must contain exactly 26 slots.')
}

function ExhibitionPartitions({ isCeramics }) {
  return <group>
    {[-6.7, 6.7].map(x => <group key={x}>
      <Box p={[x,2.68,4.02]} s={[3.65,5.36,.30]} color={C.ivory}/>
      <Box p={[x,5.35,4.02]} s={[3.85,.14,.48]} color={C.brass} metalness={.28}/>
      <Box p={[x,.14,4.02]} s={[4.05,.28,.8]} color={C.sandstone}/>
      {/* Both sides of this partition have an independent display surface. */}
    </group>)}
    {isCeramics && [-11.2, 0, 11.2].map((x,i) => <group key={x}>
      <Box p={[x,.65,-2.1]} s={[1.5,1.3,1.5]} color={C.ivory}/>
      <mesh position={[x,1.62,-2.1]} castShadow>
        <cylinderGeometry args={[.33,.54,.60,24]}/>
        <meshStandardMaterial color={['#a77e64','#bca89a','#84958b'][i]} roughness={.65}/>
      </mesh>
      <mesh position={[x,1.94,-2.1]}>
        <torusGeometry args={[.33,.06,12,28]}/>
        <meshStandardMaterial color="#dfc6aa"/>
      </mesh>
    </group>)}
  </group>
}
function Room({classId,section,artworks,onArt,artPage=0}) {
  const c=classes.find(x=>x.id===classId)
  const s=sections.find(x=>x.id===section)
  const arts=artworks.filter(a=>Number(a.class_id)===classId&&a.section===section)
  const currentPage=arts.slice(artPage*ROOM_ARTWORK_CAPACITY,(artPage+1)*ROOM_ARTWORK_CAPACITY)
  const isCeramics=section==='ceramics'
  return <group>
    <GalleryShell w={34} d={28} heading={`قاعة ${s.label}`} sub={`${c.label} | ${s.english}`} finishedCeiling roomNameplate/>
    <Box p={[0,.115,1.2]} s={[6.3,.10,23.5]} color="#e9dbca"/>
    <Box p={[0,.176,1.2]} s={[.075,.015,23.5]} color={C.brass}/>
    <ExhibitionPartitions isCeramics={isCeramics}/>
    {/* Sculptures are architecture, not fictitious student submissions. */}
    {!isCeramics && <>
      <Sculpture p={[-12,0,5]} style="stone"/>
      <Sculpture p={[12,0,5]}/>
    </>}
    {currentPage.map((art,i)=>{
      const slot=ROOM_DISPLAY_SLOTS[i]
      return <Artwork key={art.id} art={art} p={slot.p} rot={slot.rot} onArt={onArt}/>
    })}
    {arts.length===0 && <group>
      <WallArt p={[-7.4,3.35,-13.62]} accent={s.accent}/>
      <WallArt p={[0,3.35,-13.62]} accent={C.sage}/>
      <WallArt p={[7.4,3.35,-13.62]} accent={C.terracotta}/>
      <Label p={[0,1.3,-13.45]} width={340} className="empty-gallery">
        {PLACEHOLDER} · اللوحات الملونة المعروضة الآن للديكور فقط
      </Label>
    </group>}
    {arts.length>ROOM_ARTWORK_CAPACITY && <Label p={[0,1.45,-11.3]} width={310} className="empty-gallery">
      صفحة العرض {artPage+1} من {Math.ceil(arts.length/ROOM_ARTWORK_CAPACITY)}
    </Label>}
    <Plant p={[-13.2,0,10.8]}/>
    <Plant p={[13.2,0,10.8]}/>
  </group>
}
function CameraNavigator({location}) {
  const { camera }=useThree()
  const orbit=useRef()
  const held=useRef(new Set())
  const limits=location.type==='outside'?{x:24,z:17}:location.type==='lobby'?{x:17,z:13}:location.type==='wing'?{x:14,z:10}:{x:15.2,z:19}
  useEffect(()=>{
    const distance=location.type==='outside'?26:location.type==='lobby'?27:location.type==='wing'?23:19
    camera.position.set(0,6.7,distance)
    orbit.current?.target.set(0,2.65,0)
    orbit.current?.update()
    held.current.clear()
  },[location.type,location.classId,location.section,camera])
  useEffect(()=>{
    const keyDown=e=>{
      if(e.target instanceof HTMLElement && /input|textarea|select/i.test(e.target.tagName)) return
      if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
        held.current.add(e.code)
        if(e.code.startsWith('Arrow'))e.preventDefault()
      }
    }
    const keyUp=e=>held.current.delete(e.code)
    const blur=()=>held.current.clear()
    const singleStep=e=>travel(e.detail.forward||0,e.detail.side||0)
    function travel(forward,side){
      const target=orbit.current?.target
      if(!target)return
      const view=new THREE.Vector3()
      camera.getWorldDirection(view);view.y=0
      if(view.lengthSq()<.0001)view.set(0,0,-1)
      view.normalize()
      const right=new THREE.Vector3(-view.z,0,view.x)
      const delta=view.multiplyScalar(forward).addScaledVector(right,side)
      const x=THREE.MathUtils.clamp(camera.position.x+delta.x,-limits.x,limits.x)
      const z=THREE.MathUtils.clamp(camera.position.z+delta.z,-limits.z,limits.z)
      const applied=new THREE.Vector3(x-camera.position.x,0,z-camera.position.z)
      camera.position.add(applied)
      target.add(applied)
      orbit.current.update()
    }
    // Exported as one discrete movement event for touch controls.
    window.addEventListener('keydown',keyDown)
    window.addEventListener('keyup',keyUp)
    window.addEventListener('blur',blur)
    window.addEventListener('gallery:move',singleStep)
    const moveRef=held
    const frameMover=()=>{
      const keys=moveRef.current
      if(!keys.size)return
      const f=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)
      const side=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)
      if(f||side)travel(f*.105,side*.105)
    }
    mover.current=frameMover
    return ()=>{
      window.removeEventListener('keydown',keyDown)
      window.removeEventListener('keyup',keyUp)
      window.removeEventListener('blur',blur)
      window.removeEventListener('gallery:move',singleStep)
      mover.current=null
    }
  },[camera,limits.x,limits.z])
  const mover=useRef(null)
  useFrame(()=>mover.current?.())
  return <OrbitControls ref={orbit} makeDefault enableDamping dampingFactor={.08} enablePan={false} minDistance={3.5} maxDistance={34} minPolarAngle={.35} maxPolarAngle={Math.PI/2.02} />
}
export default function World({location,go,artworks,onArt,artPage=0}) {
  const sceneKey=[location.type,location.classId||'',location.section||''].join('-')
  return <Canvas shadows dpr={[1,1.5]} camera={{position:[0,6.7,23],fov:51}} gl={{antialias:true,powerPreference:'high-performance'}}>
    <color attach="background" args={['#b2bdba']}/>
    <fog attach="fog" args={['#b2bdba',34,88]}/>
    <LightSetup/>
    {location.type==='outside'?<Outside go={go}/>:
      location.type==='lobby'?<Lobby go={go}/>:
      location.type==='wing'?<Wing go={go} classId={location.classId}/>:
      <Room classId={location.classId} section={location.section} artworks={artworks} onArt={onArt} artPage={artPage}/>}
    <CameraNavigator key={sceneKey} location={location}/>
  </Canvas>
}
