import { supabase, publicImageUrl, BUCKET } from './supabase'

const maxFileBytes = 5 * 1024 * 1024
const extension = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}

export async function listArtworks() {
  if (!supabase) return []
  const {data,error} = await supabase.from('artworks').select('*').order('created_at',{ascending:false})
  if (error) throw error
  return (data||[]).map(art=>({...art,image_url:publicImageUrl(art.image_path)}))
}

export async function saveArtwork(form,previous=null) {
  if (!supabase) throw new Error('يرجى إعداد Supabase أولاً')
  const student_name=form.student_name?.trim()
  const class_id=Number(form.class_id)
  const section=form.section
  if(!student_name || student_name.length>120)throw new Error('اكتبي اسم الطالبة بشكل صحيح')
  if(!Number.isInteger(class_id)||class_id<1||class_id>7 || !['drawing','ornament','printing','ceramics'].includes(section))throw new Error('يجب تحديد فصل وقسم صحيحين')
  const file=form.image
  let image_path=previous?.image_path||null
  let newPath=null
  if(file) {
    if(!extension[file.type]||file.size>maxFileBytes||file.size<=0)throw new Error('استخدمي صورة JPG أو PNG أو WebP لا تتجاوز 5 ميجابايت')
    newPath=`${crypto.randomUUID()}.${extension[file.type]}`
    const {error}=await supabase.storage.from(BUCKET).upload(newPath,file,{contentType:file.type,upsert:false})
    if(error)throw error
    image_path=newPath
  }
  if(!image_path)throw new Error('اختاري صورة للعمل الفني')
  const values={student_name,class_id,section,image_path}
  let result
  if(previous)result=await supabase.from('artworks').update(values).eq('id',previous.id).select().single()
  else result=await supabase.from('artworks').insert(values).select().single()
  if(result.error){if(newPath) await supabase.storage.from(BUCKET).remove([newPath]);throw result.error}
  if(previous && newPath && previous.image_path!==newPath) {
    const removed=await supabase.storage.from(BUCKET).remove([previous.image_path])
    if(removed.error)console.warn('Old image cleanup pending:',removed.error.message)
  }
  return result.data
}

export async function deleteArtwork(item) {
  if(!supabase)throw new Error('يرجى إعداد Supabase أولاً')
  const {error}=await supabase.from('artworks').delete().eq('id',item.id)
  if(error)throw error
  const removed=await supabase.storage.from(BUCKET).remove([item.image_path])
  if(removed.error)throw new Error('حُذف السجل لكن تعذّر حذف الصورة من التخزين. راجعي التخزين: '+removed.error.message)
}
