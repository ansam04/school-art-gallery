import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Brush, Building2, ChevronLeft, ChevronRight, Eye, House, ImagePlus, Info, Layers, LogIn, LogOut, Menu, Move, Paintbrush, Search, Settings2, Shield, Trash2, UploadCloud, X } from 'lucide-react'
import {SCHOOL,classes,sections,rooms,ROOM_ARTWORK_CAPACITY} from './data'
import {configured,supabase} from './supabase'
import {listArtworks,saveArtwork,deleteArtwork} from './gallery'

const World = lazy(() => import('./World'))

const emptyForm={student_name:'',class_id:1,section:'drawing',image:null}
function locLabel(location){
  if(location.type==='outside')return 'الساحة الخارجية'
  if(location.type==='lobby')return 'البهو الرئيسي'
  const klass=classes.find(c=>c.id===location.classId)?.label||''
  if(location.type==='wing')return `جناح ${klass}`
  return `${klass} / ${sections.find(s=>s.id===location.section)?.label||''}`
}
function App(){
  const [location,setLocation]=useState({type:'outside'})
  const [artworks,setArtworks]=useState([])
  const [activeArt,setActiveArt]=useState(null)
  const [loading,setLoading]=useState(configured)
  const [error,setError]=useState('')
  const [query,setQuery]=useState('')
  const [panel,setPanel]=useState('gallery')
  const [sidebarOpen,setSidebarOpen]=useState(false)
  const [adminOpen,setAdminOpen]=useState(false)
  const [session,setSession]=useState(null)
  const [isAdmin,setIsAdmin]=useState(false)
  const [authEmail,setAuthEmail]=useState('')
  const [authPassword,setAuthPassword]=useState('')
  const [authBusy,setAuthBusy]=useState(false)
  const [adminMessage,setAdminMessage]=useState('')
  const [working,setWorking]=useState(false)
  const [editing,setEditing]=useState(null)
  const [form,setForm]=useState(emptyForm)
  const [savedPhoto,setSavedPhoto]=useState(null)
  const [artOffset,setArtOffset]=useState(0)
  const currentRoom=location.type==='room' ? rooms.find(r=>r.classId===location.classId&&r.section===location.section) : null
  const roomArtworks=useMemo(()=>artworks.filter(a=>Number(a.class_id)===location.classId&&a.section===location.section),[artworks,location])
  const filteredArtworks=useMemo(()=>artworks.filter(a=>{
    const match=[a.student_name,classes.find(c=>c.id===Number(a.class_id))?.label,sections.find(s=>s.id===a.section)?.label].join(' ').toLowerCase().includes(query.toLowerCase())
    return match && (location.type!=='room'||(Number(a.class_id)===location.classId&&a.section===location.section))
  }),[artworks,query,location])
  const artworksPageCount=Math.max(1,Math.ceil((location.type==='room'?filteredArtworks.length:artworks.length)/ROOM_ARTWORK_CAPACITY))
  const load=useCallback(async()=>{
    if(!configured){setLoading(false);return}
    try{const data=await listArtworks();setArtworks(data);setError('')}
    catch(e){setError('تعذر تحميل الأعمال: '+e.message)}
    finally{setLoading(false)}
  },[])
  useEffect(()=>{load()},[load])
  useEffect(()=>{
    if(!supabase)return
    let active=true
    async function checkAdmin(user){
      if(!user){if(active)setIsAdmin(false);return}
      const {data,error:readError}=await supabase.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle()
      if(active){setIsAdmin(Boolean(data&&!readError));if(readError)setAdminMessage('تعذّر التحقق من صلاحية الإدارة: '+readError.message)}
    }
    supabase.auth.getSession().then(({data})=>{if(active){setSession(data.session);checkAdmin(data.session?.user)}})
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,nextSession)=>{
      if(active){setSession(nextSession);checkAdmin(nextSession?.user)}
    })
    return()=>{active=false;subscription.unsubscribe()}
  },[])
  const go=useCallback(next=>{setLocation(next);setPanel('gallery');setSidebarOpen(false);setActiveArt(null);setArtOffset(0)},[])
  function openEditor(item=null){
    setEditing(item)
    setSavedPhoto(item?.image_url||null)
    setForm(item?{student_name:item.student_name,class_id:item.class_id,section:item.section,image:null}:{...emptyForm,class_id:location.classId||1,section:location.section||'drawing'})
    setAdminMessage('')
  }
  async function login(e){
    e.preventDefault()
    setAuthBusy(true);setAdminMessage('')
    const {error:loginError}=await supabase.auth.signInWithPassword({email:authEmail.trim(),password:authPassword})
    if(loginError)setAdminMessage('لم ينجح تسجيل الدخول: '+loginError.message)
    else {setAdminMessage('تم تسجيل الدخول. سيتم التحقق من صلاحيات الإدارة.');setAuthPassword('')}
    setAuthBusy(false)
  }
  async function logout(){await supabase.auth.signOut();setIsAdmin(false);setEditing(null);setAdminMessage('تم تسجيل الخروج')}
  async function submitArtwork(e){
    e.preventDefault()
    if(!isAdmin)return
    setWorking(true);setAdminMessage('')
    try{
      await saveArtwork(form,editing)
      await load()
      openEditor(null)
      setAdminMessage(editing?'تم تعديل العمل بنجاح':'تم رفع العمل بنجاح')
    }catch(ex){setAdminMessage('تعذّر حفظ العمل: '+ex.message)}
    finally{setWorking(false)}
  }
  async function removeArtwork(item){
    if(!isAdmin||!window.confirm(`هل تريدين حذف عمل الطالبة «${item.student_name}» نهائيًا؟`))return
    setWorking(true);setAdminMessage('')
    try{await deleteArtwork(item);await load();if(activeArt?.id===item.id)setActiveArt(null);setAdminMessage('تم حذف العمل')}
    catch(ex){setAdminMessage('تعذّر الحذف: '+ex.message)}
    finally{setWorking(false)}
  }
  useEffect(()=>{if(!adminOpen)return;const escape=e=>{if(e.key==='Escape')setAdminOpen(false)};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape)},[adminOpen])
  const back=()=>location.type==='room'?go({type:'wing',classId:location.classId}):location.type==='wing'?go({type:'lobby'}):go({type:'outside'})
  const title=locLabel(location)
  return <div className="app" dir="rtl">
    <header className="topbar">
      <div className="brand">
        <div className="brand-emblem"><Brush size={24}/></div>
        <div><div className="brand-eyebrow">مَتحف الإبداع · رحلة فنية افتراضية</div><h1>{SCHOOL}</h1></div>
      </div>
      <div className="header-actions">
        <span className="live-mark"><span className="live-dot"/> معرض ثلاثي الأبعاد</span>
        <button className="outline-btn" onClick={()=>setAdminOpen(true)} aria-label="لوحة الإدارة"><Settings2 size={17}/><span>لوحة الإدارة</span></button>
        <button className="square-btn menu-btn" onClick={()=>setSidebarOpen(v=>!v)} aria-label="القائمة"><Menu size={23}/></button>
      </div>
    </header>
    <div className="workspace">
      <aside className={`sidebar ${sidebarOpen?'sidebar--open':''}`}>
        <div className="sidebar-head"><div className="side-kicker">دليل الزائرة</div><h2>استكشفي المعرض</h2><button className="mobile-close" onClick={()=>setSidebarOpen(false)} aria-label="إغلاق"><X size={18}/></button></div>
        <nav className="side-nav" aria-label="أقسام المعرض">
          <button className={`nav-option ${location.type==='outside'?'is-active':''}`} onClick={()=>go({type:'outside'})}><House size={18}/> واجهة المدرسة <ChevronLeft size={15}/></button>
          <button className={`nav-option ${location.type==='lobby'?'is-active':''}`} onClick={()=>go({type:'lobby'})}><Building2 size={18}/> البهو الرئيسي <ChevronLeft size={15}/></button>
          <div className="side-divider"><span>الأجنحة السبعة</span><span>07</span></div>
          {classes.map(klass=><div className="wing-nav" key={klass.id}>
            <button className={`nav-option ${location.classId===klass.id?'is-active':''}`} onClick={()=>go({type:'wing',classId:klass.id})}><Layers size={17}/>{klass.label}<ChevronLeft size={15}/></button>
            {location.classId===klass.id&&<div className="subnav">{sections.map(sec=><button key={sec.id} className={location.section===sec.id&&location.type==='room'?'selected':''} onClick={()=>go({type:'room',classId:klass.id,section:sec.id})}><span className="section-bullet" style={{backgroundColor:sec.accent}}/>{sec.label}</button>)}</div>}
          </div>)}
        </nav>
        <div className="sidebar-foot"><div className="stats-line"><div><b>07</b><small>أجنحة</small></div><div><b>28</b><small>قاعة</small></div><div><b>{artworks.length}</b><small>عمل فني</small></div></div><p>كل لوحة حقيقية تظهر بعد إضافتها من إدارة المعرض.</p></div>
      </aside>
      <main className="main-area">
        <div className="viewport">
          <Suspense fallback={<div>جاري تحميل المعرض...</div>}>
            <World location={location} go={go} artworks={artworks} onArt={setActiveArt} artPage={artOffset}/>
          </Suspense>
          <div className="scene-top">
            <div className="scene-breadcrumb"><span>المعرض</span><ChevronLeft size={13}/><strong>{title}</strong></div>
            <div className="scene-chip"><Eye size={14}/> عرض تفاعلي 3D</div>
          </div>
          <div className="scene-bottom">
            <div className="scene-caption"><span className="eyebrow">THE ART JOURNEY</span><h2>{location.type==='outside'?'حيث يبدأ الإبداع':title}</h2><p>{location.type==='outside'?'رحلة بين أروقة الفن، مستوحاة من إبداعات طالبات المدرسة':location.type==='lobby'?'اختاري أحد الأجنحة السبعة للانتقال إلى القاعات الفنية':location.type==='wing'?'أربع قاعات متخصصة، لكل منها طابعها ومساحة عرضها':currentRoom?.sectionLabel+' · قاعة مستقلة داخل '+currentRoom?.classLabel}</p></div>
            <div className="scene-actions">
              {location.type==='outside'?<button className="primary-btn" onClick={()=>go({type:'lobby'})}>ابدئي الزيارة <ArrowLeft size={18}/></button>:<button className="glass-btn" onClick={back}><ArrowRight size={17}/> رجوع</button>}
            </div>
          </div>
          <div className="movement-pad" aria-label="التنقل بالكاميرا">
            <button title="تحركي للأمام" onClick={()=>window.dispatchEvent(new CustomEvent('gallery:move',{detail:{forward:1.2}}))}><ArrowLeft className="move-up" size={17}/></button>
            <div><button title="تحركي لليمين" onClick={()=>window.dispatchEvent(new CustomEvent('gallery:move',{detail:{side:1.2}}))}><ChevronRight size={17}/></button><button title="تحركي للخلف" onClick={()=>window.dispatchEvent(new CustomEvent('gallery:move',{detail:{forward:-1.2}}))}><ArrowRight className="move-down" size={17}/></button><button title="تحركي لليسار" onClick={()=>window.dispatchEvent(new CustomEvent('gallery:move',{detail:{side:-1.2}}))}><ChevronLeft size={17}/></button></div>
          </div>
        </div>
        <div className="lower-bar"><span><Move size={14}/> اسحبي لتدوير المشهد · عجلة الفأرة للتقريب · W A S D للحركة</span><span>المشهد {location.type==='outside'?'01':location.type==='lobby'?'02':location.type==='wing'?'03':'04'} / 04</span></div>
      </main>
      <aside className="inspector">
        <div className="inspector-tabs"><button className={panel==='gallery'?'selected':''} onClick={()=>setPanel('gallery')}>الأعمال الفنية</button><button className={panel==='about'?'selected':''} onClick={()=>setPanel('about')}>عن المعرض</button></div>
        {panel==='gallery'?<div className="inspector-body"><h3>{location.type==='room'?'أعمال هذه القاعة':'مقتنيات المعرض'}</h3><p className="dimmed">{location.type==='room'?`${roomArtworks.length} أعمال مسجلة في ${title}`:`${artworks.length} أعمال معروضة في جميع القاعات`}</p>
          <label className="searchbox"><Search size={17}/><input value={query} onChange={e=>{setQuery(e.target.value);setArtOffset(0)}} placeholder="بحث باسم الطالبة أو الفصل أو القسم..." aria-label="البحث عن عمل فني"/></label>
          {loading?<div className="empty-state">جارٍ تحميل الأعمال...</div>:error?<div className="warning">{error} <button onClick={load}>إعادة المحاولة</button></div>:artworks.length===0?<div className="empty-state"><ImagePlus size={30}/><b>بانتظار الأعمال الفنية</b><p>لم نضف أعمال طالبات بعد. ستظهر هنا بمجرد إعداد التخزين ورفع الصور.</p></div>:filteredArtworks.length===0?<div className="empty-state">لا توجد أعمال مطابقة للبحث في هذه المساحة.</div>:<div className="art-list">{(location.type==='room'?filteredArtworks.slice(artOffset*ROOM_ARTWORK_CAPACITY,(artOffset+1)*ROOM_ARTWORK_CAPACITY):filteredArtworks).map(a=><button key={a.id} className="art-list-item" onClick={()=>setActiveArt(a)}><img src={a.image_url} alt={`عمل فني للطالبة ${a.student_name}`} loading="lazy"/><span><b>{a.student_name}</b><small>{classes.find(c=>c.id===Number(a.class_id))?.label} · {sections.find(s=>s.id===a.section)?.label}</small></span><ChevronLeft size={16}/></button>)}</div>}
          {location.type==='room'&&filteredArtworks.length>ROOM_ARTWORK_CAPACITY&&<div className="pagination"><button disabled={artOffset===0} onClick={()=>setArtOffset(x=>Math.max(0,x-1))}>السابق</button><span>{artOffset+1} / {artworksPageCount}</span><button disabled={artOffset>=artworksPageCount-1} onClick={()=>setArtOffset(x=>x+1)}>التالي</button></div>}
          <div className="note-box"><Shield size={18}/><span>يرجى الحصول على الموافقات اللازمة قبل نشر أسماء الطالبات أو صور أعمالهن.</span></div>
        </div>:<div className="inspector-body"><div className="about-art"><Paintbrush size={33}/></div><h3>مساحة تحتفي بالإبداع</h3><p className="dimmed readable">معرض مدرسي افتراضي يضم سبعة أجنحة، لكل فصل أربع قاعات مخصصة للرسم والزخرفة والطباعة والخزف. تستطيع الزائرة التجول في المشاهد ثلاثية الأبعاد، والاطلاع على الأعمال بعد نشرها.</p><div className="discipline-list">{sections.map(s=><button key={s.id} onClick={()=>go({type:'room',classId:location.classId||1,section:s.id})}><span style={{backgroundColor:s.accent}}/>{s.label}<ChevronLeft size={16}/></button>)}</div><div className="note-box">الديكور الهندسي مجرد عناصر عرض؛ لا يُنسب إلى أي طالبة.</div></div>}
      </aside>
    </div>
    <footer className="footer"><span>المدرسة المتوسطة الثامنة بينبع البحر</span><span>معرض الفن الافتراضي · صُنع ليُكتشف</span></footer>
    {activeArt&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setActiveArt(null)}}><section className="art-modal" role="dialog" aria-modal="true" aria-label="تفاصيل العمل الفني"><button className="close-modal" onClick={()=>setActiveArt(null)} aria-label="إغلاق"><X size={22}/></button><img src={activeArt.image_url} alt={`عمل فني للطالبة ${activeArt.student_name}`}/><div className="art-details"><span className="eyebrow">ARTWORK DETAILS</span><h2>تفاصيل العمل الفني</h2><p><b>الطالبة:</b> {activeArt.student_name}</p><p><b>الفصل:</b> {classes.find(c=>c.id===Number(activeArt.class_id))?.label}</p><p><b>نوع الفن:</b> {sections.find(s=>s.id===activeArt.section)?.label}</p><button className="primary-btn" onClick={()=>{go({type:'room',classId:Number(activeArt.class_id),section:activeArt.section});setActiveArt(null)}}>زيارة القاعة <ArrowLeft size={16}/></button></div></section></div>}
    {adminOpen&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setAdminOpen(false)}}><section className="admin-modal" role="dialog" aria-modal="true" aria-label="لوحة إدارة المعرض"><div className="admin-header"><div><span className="eyebrow">ADMINISTRATION</span><h2>إدارة الأعمال الفنية</h2></div><button onClick={()=>setAdminOpen(false)} aria-label="إغلاق"><X size={22}/></button></div>
      {!configured?<div className="admin-unconfigured"><Info size={32}/><h3>إعداد التخزين السحابي مطلوب</h3><p>واجهة المعرض تعمل الآن، لكن رفع الصور وتعديلها وحذفها غير مفعلة حتى تنشئي مشروع Supabase وتضبطي صلاحيات الإدارة وتربطي مفاتيح الاتصال العامة.</p><p>ستجدين دليل الإعداد لاحقًا داخل ملف <code>README_AR.md</code>، ولا تضعي أبدًا كلمة مرور أو مفتاح service_role في ملفات الموقع.</p></div>:!session?<form className="admin-form" onSubmit={login}><h3>تسجيل دخول مسؤولة المعرض</h3><label>البريد الإلكتروني<input required type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} autoComplete="email"/></label><label>كلمة المرور<input required type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} autoComplete="current-password"/></label><button className="primary-btn" disabled={authBusy}><LogIn size={16}/>{authBusy?'جارٍ التحقق...':'دخول'}</button></form>:!isAdmin?<div className="admin-unconfigured"><Shield size={32}/><h3>الحساب ليس ضمن المسؤولات</h3><p>تم تسجيل الدخول، ولكن لم يُضف الحساب إلى جدول admin_users. لن تتمكني من إدارة الأعمال قبل منح الصلاحية عبر لوحة Supabase.</p><button className="outline-btn" onClick={logout}><LogOut size={16}/> تسجيل خروج</button></div>:<div className="admin-content"><div className="admin-toolbar"><span>مسؤولة المعرض: {session.user.email}</span><button onClick={logout} className="outline-btn"><LogOut size={16}/> خروج</button></div><div className="admin-columns"><form className="admin-form" onSubmit={submitArtwork}><h3>{editing?'تعديل عمل فني':'إضافة عمل فني جديد'}</h3><label>اسم الطالبة<input required maxLength={120} value={form.student_name} onChange={e=>setForm({...form,student_name:e.target.value})}/></label><div className="form-row"><label>الفصل<select value={form.class_id} onChange={e=>setForm({...form,class_id:Number(e.target.value)})}>{classes.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label><label>المجال الفني<select value={form.section} onChange={e=>setForm({...form,section:e.target.value})}>{sections.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label></div><label className="upload-file"><UploadCloud size={24}/><span>{form.image?.name|| (editing?'اختاري صورة جديدة لتغيير الصورة الحالية':'اختاري صورة JPG أو PNG أو WebP (حتى 5MB)')}</span><input type="file" accept="image/jpeg,image/png,image/webp" required={!editing} onChange={e=>setForm({...form,image:e.target.files?.[0]||null})}/></label>{savedPhoto&&<img className="admin-preview" src={savedPhoto} alt="الصورة الحالية"/>}<div className="admin-form-actions"><button type="submit" className="primary-btn" disabled={working}>{working?'جارٍ الحفظ...':editing?'حفظ التعديلات':'رفع العمل'}</button>{editing&&<button type="button" className="outline-btn" onClick={()=>openEditor()}>إلغاء التعديل</button>}</div></form><div className="admin-library"><h3>الأعمال المسجلة ({artworks.length})</h3>{artworks.length===0?<p className="dimmed">لا توجد أعمال مضافة بعد.</p>:artworks.map(a=><div className="admin-library-item" key={a.id}><img src={a.image_url} alt=""/><div><b>{a.student_name}</b><small>{classes.find(c=>c.id===Number(a.class_id))?.label} · {sections.find(s=>s.id===a.section)?.label}</small><div className="library-actions"><button disabled={working} onClick={()=>openEditor(a)}>تعديل</button><button disabled={working} className="danger-btn" onClick={()=>removeArtwork(a)}><Trash2 size={13}/> حذف</button></div></div></div>)}</div></div></div>}
      {adminMessage&&<div className="admin-message" role="status">{adminMessage}</div>}
    </section></div>}
  </div>
}
export default App
