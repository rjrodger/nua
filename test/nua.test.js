'use strict'

const Lab = require('lab')
const Code = require('code')
const lab = (exports.lab = Lab.script())
const expect = Code.expect

const Nua = require('..')


lab.test('happy', fin => {
  var base = {a:{b:1}}
  var base_a = base.a
  var src = {a:{b:2}}

  Nua(base,src)
  expect(base).equal({a:{b:2}})
  expect(base_a === base.a).true()

  fin()
})


lab.test('array', fin => {
  var base = {a:[1,2]}
  var base_a = base.a

  Nua(base,{a:[11,22]})
  expect(base).equal({a:[11,22]})
  expect(base_a === base.a).true()

  Nua(base,{a:[11,22,33]})
  expect(base).equal({a:[11,22,33]})
  expect(base_a === base.a).true()

  Nua(base,{a:[11]})
  expect(base).equal({a:[11]})
  expect(base_a === base.a).true()

  fin()
})


lab.test('object', fin => {
  var base = {a:{b:1,c:2}}
  var base_a = base.a

  Nua(base,{a:{b:11,c:22}})
  expect(base).equal({a:{b:11,c:22}})
  expect(base_a === base.a).true()

  Nua(base,{a:{b:11,c:22,d:33}})
  expect(base).equal({a:{b:11,c:22,d:33}})
  expect(base_a === base.a).true()

  Nua(base,{a:{b:11}})
  expect(base).equal({a:{b:11}})
  expect(base_a === base.a).true()

  fin()
})


lab.test('deep', fin => {
  var base = {a:{c:1,d:{e:3,f:[5,{h:7}]}}, b:[2,[4],{g:[6]}]}
  var base_a = base.a
  var base_ad = base.a.d
  var base_adf = base.a.d.f
  var base_adf1 = base.a.d.f[1]
  var base_b = base.b
  var base_b1 = base.b[1]
  var base_b2 = base.b[2]
  var base_b2g = base.b[2].g

  Nua(null,null)
  Nua(null,1)
  Nua(1,null)
  
  Nua(base,null)
  expect(base).equal({a:{c:1,d:{e:3,f:[5,{h:7}]}}, b:[2,[4],{g:[6]}]})

  Nua(base,1)
  expect(base).equal({a:{c:1,d:{e:3,f:[5,{h:7}]}}, b:[2,[4],{g:[6]}]})

  Nua(base,{a:1, b:2})
  expect(base).equal({a:{c:1,d:{e:3,f:[5,{h:7}]}}, b:[2,[4],{g:[6]}]})

  Nua(base,{a:{c:{},d:{e:3,f:[5,{h:7}]}}, b:2})
  expect(base).equal({a:{c:1,d:{e:3,f:[5,{h:7}]}}, b:[2,[4],{g:[6]}]})

  //return fin()
  
  Nua(base,{a:{c:11,d:{e:33,f:[55,{h:77}]}}, b:[22,[44],{g:[66]}]})
  expect(base).equal({a:{c:11,d:{e:33,f:[55,{h:77}]}}, b:[22,[44],{g:[66]}]})
  expect(base_a === base.a).true()
  expect(base_ad === base.a.d).true()
  expect(base_adf === base.a.d.f).true()
  expect(base_adf1 === base.a.d.f[1]).true()
  expect(base_b === base.b).true()
  expect(base_b1 === base.b[1]).true()
  expect(base_b2 === base.b[2]).true()
  expect(base_b2g === base.b[2].g).true()

  Nua(base,{a:{c:11,d:{e:33,f:[55]}}, b:[22,[44],{}]})
  expect(base).equal({a:{c:11,d:{e:33,f:[55]}}, b:[22,[44],{}]})
  expect(base_a === base.a).true()
  expect(base_ad === base.a.d).true()
  expect(base_adf === base.a.d.f).true()
  expect(base_b === base.b).true()
  expect(base_b1 === base.b[1]).true()
  expect(base_b2 === base.b[2]).true()

  Nua(base,{a:{c:11,d:{e:33}}, b:[22,[44]]})
  expect(base).equal({a:{c:11,d:{e:33}}, b:[22,[44]]})
  expect(base_a === base.a).true()
  expect(base_ad === base.a.d).true()
  expect(base_b === base.b).true()
  expect(base_b1 === base.b[1]).true()

  Nua(base,{a:{c:11,d:{}}, b:[22]})
  expect(base).equal({a:{c:11,d:{}}, b:[22]})
  expect(base_a === base.a).true()
  expect(base_ad === base.a.d).true()
  expect(base_b === base.b).true()

  Nua(base,{a:{c:11}})
  expect(base).equal({a:{c:11}})
  expect(base_a === base.a).true()

  Nua(base,{})
  expect(base).equal({})

  
  var src = {a:{c:111,d:{e:333,f:[555,{h:777}]}}, b:[222,[444],{g:[666]}]}
  var src_a = src.a
  var src_ad = src.a.d
  var src_adf = src.a.d.f
  var src_adf1 = src.a.d.f[1]
  var src_b = src.b
  var src_b1 = src.b[1]
  var src_b2 = src.b[2]
  var src_b2g = src.b[2].g

  Nua(base,src)
  expect(base).equal({a:{c:111,d:{e:333,f:[555,{h:777}]}}, b:[222,[444],{g:[666]}]})
  expect(src_a === base.a).true()
  expect(src_ad === base.a.d).true()
  expect(src_adf === base.a.d.f).true()
  expect(src_adf1 === base.a.d.f[1]).true()
  expect(src_b === base.b).true()
  expect(src_b1 === base.b[1]).true()
  expect(src_b2 === base.b[2]).true()
  expect(src_b2g === base.b[2].g).true()

  fin()
})

