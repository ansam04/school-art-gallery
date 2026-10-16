export const SCHOOL = 'المدرسة المتوسطة الثامنة بينبع البحر'
export const classes = Array.from({length:7}, (_,i)=>({id:i+1,label:`ثاني متوسط ${i+1}`}))
export const sections = [
  {id:'drawing',label:'الرسم',english:'PAINTING & DRAWING',accent:'#c49778',desc:'تكوينات لونية وتعبير بصري'},
  {id:'ornament',label:'الزخرفة',english:'ORNAMENTAL ART',accent:'#9bafaa',desc:'إيقاع وتناسق الخطوط والزخارف'},
  {id:'printing',label:'الطباعة',english:'PRINTMAKING',accent:'#bb9fbd',desc:'تجارب الطباعة وملمس الورق'},
  {id:'ceramics',label:'الخزف',english:'CERAMIC ART',accent:'#b7a17d',desc:'أشكال طينية ومجسمات خزفية'}
]
export const roomKey=(classId,section)=>`${classId}-${section}`
export const rooms=classes.flatMap(c=>sections.map(s=>({key:roomKey(c.id,s.id),classId:c.id,classLabel:c.label,section:s.id,sectionLabel:s.label})))

// Maximum works presented together in each three-dimensional hall.
export const ROOM_ARTWORK_CAPACITY = 26
