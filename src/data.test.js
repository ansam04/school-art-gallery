import test from 'node:test'
import assert from 'node:assert/strict'
import {SCHOOL,classes,sections,rooms,roomKey} from './data.js'

test('correct school name',()=>assert.equal(SCHOOL,'المدرسة المتوسطة الثامنة بينبع البحر'))
test('seven independent classes',()=>{assert.equal(classes.length,7);assert.equal(new Set(classes.map(c=>c.id)).size,7)})
test('all four art sections',()=>{assert.deepEqual(sections.map(s=>s.id),['drawing','ornament','printing','ceramics'])})
test('every class has four unique reachable rooms',()=>{
  assert.equal(rooms.length,28)
  assert.equal(new Set(rooms.map(r=>r.key)).size,28)
  for(const c of classes){
    assert.equal(rooms.filter(r=>r.classId===c.id).length,4)
    for(const s of sections)assert.ok(rooms.some(r=>r.key===roomKey(c.id,s.id)))
  }
})
