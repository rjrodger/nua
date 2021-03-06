/* Copyright (c) 2018-2020 Richard Rodger and other contributors */
'use strict'

var Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

const Code = require('@hapi/code')

const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect

const Nua = require('..')

describe('nua', function () {
  it('happy', () => {
    var base = { a: { b: 1 } }
    var base_a = base.a
    var src = { a: { b: 2 } }

    Nua(base, src)
    expect(base).equal({ a: { b: 2 } })
    expect(base_a === base.a).true()
  })

  it('null-fields', () => {
    var base = { a: 1, b: null, c: 4, d: 5, f: null }
    var src = { a: 2, b: 3, c: null, e: 6, f: { g: 7 } }

    Nua(base, src)

    expect(base).equal({
      a: 2, // override
      b: 3, // override (null is just a value)
      c: null, // override (null is just a value)
      // d is removed as not present in src
      e: 6, // defined in src
      f: { g: 7 }, // override (null is just a value)
    })
  })

  it('depth', () => {
    var src = { a: 11, b: { c: 22 }, d: { e: { f: 33 } } }

    var base0 = { a: 1, b: { c: 2 }, d: { e: { f: 3 } } }
    var base0b = base0.b
    var base0d = base0.d
    var base0e = base0.d.e
    Nua(base0, src, { depth: 4 })
    expect(base0).equal(src)
    expect(base0b === base0.b).true()
    expect(base0d === base0.d).true()
    expect(base0e === base0.d.e).true()

    var base1 = { a: 1, b: { c: 2 }, d: { e: { f: 3 } } }
    Nua(base1, src, { depth: 3 })
    expect(base1).equal(src)

    var base2 = { a: 1, b: { c: 2 }, d: { e: { f: 3 } } }
    Nua(base2, src, { depth: 2 })
    expect(base2).equal({ a: 11, b: { c: 22 }, d: { e: { f: 3 } } })

    var base3 = { a: 1, b: { c: 2 }, d: { e: { f: 3 } } }
    var base3b = base3.b
    var base3d = base3.d
    var base3e = base3.d.e
    Nua(base3, src, { depth: 1 })
    expect(base3).equal({ a: 11, b: { c: 2 }, d: { e: { f: 3 } } })
    expect(base3b === base3.b).true()
    expect(base3d === base3.d).true()
    expect(base3e === base3.d.e).true()

    var base4 = { a: 1, b: { c: 2 }, d: { e: { f: 3 } } }
    Nua(base4, src, { depth: 0 })
    expect(base4).equal(src)
  })

  it('array', () => {
    var base = { a: [1, 2] }
    var base_a = base.a

    Nua(base, { a: [11, 22] })
    expect(base).equal({ a: [11, 22] })
    expect(base_a === base.a).true()

    Nua(base, { a: [11, 22, 33] })
    expect(base).equal({ a: [11, 22, 33] })
    expect(base_a === base.a).true()

    Nua(base, { a: [11] })
    expect(base).equal({ a: [11] })
    expect(base_a === base.a).true()

    Nua(base, { a: { b: 1 } })
    var a = base.a
    a.b = 1
    expect(base).equal({ a: a })
    expect(base_a === base.a).true()
  })

  it('object', () => {
    var base = { a: { b: 1, c: 2 } }
    var base_a = base.a

    Nua(base, { a: { b: 11, c: 22 } })
    expect(base).equal({ a: { b: 11, c: 22 } })
    expect(base_a === base.a).true()

    Nua(base, { a: { b: 11, c: 22, d: 33 } })
    expect(base).equal({ a: { b: 11, c: 22, d: 33 } })
    expect(base_a === base.a).true()

    Nua(base, { a: { b: 11 } })
    expect(base).equal({ a: { b: 11 } })
    expect(base_a === base.a).true()

    Nua(base, { a: { b: 11 }, c: { d: { e: 1 } } })
    expect(base).equal({ a: { b: 11 }, c: { d: { e: 1 } } })
  })

  it('deep', () => {
    var base = {
      a: { c: 1, d: { e: 3, f: [5, { h: 7 }] } },
      b: [2, [4], { g: [6] }],
    }
    var base_a = base.a
    var base_ad = base.a.d
    var base_adf = base.a.d.f
    var base_adf1 = base.a.d.f[1]
    var base_b = base.b
    var base_b1 = base.b[1]
    var base_b2 = base.b[2]
    var base_b2g = base.b[2].g

    Nua(null, null)
    Nua(null, 1)
    Nua(1, null)

    Nua(base, null)
    expect(base).equal({
      a: { c: 1, d: { e: 3, f: [5, { h: 7 }] } },
      b: [2, [4], { g: [6] }],
    })

    Nua(base, 1)
    expect(base).equal({
      a: { c: 1, d: { e: 3, f: [5, { h: 7 }] } },
      b: [2, [4], { g: [6] }],
    })

    Nua(
      base,
      { a: { c: {}, d: { e: 3, f: [5, { h: 7 }] } } },
      { preserve: true }
    )
    expect(base).equal({
      a: { c: {}, d: { e: 3, f: [5, { h: 7 }] } },
      b: [2, [4], { g: [6] }],
    })

    Nua(base, {
      a: { c: 11, d: { e: 33, f: [55, { h: 77 }] } },
      b: [22, [44], { g: [66] }],
    })
    expect(base).equal({
      a: { c: 11, d: { e: 33, f: [55, { h: 77 }] } },
      b: [22, [44], { g: [66] }],
    })
    expect(base_a === base.a).true()
    expect(base_ad === base.a.d).true()
    expect(base_adf === base.a.d.f).true()
    expect(base_adf1 === base.a.d.f[1]).true()
    expect(base_b === base.b).true()
    expect(base_b1 === base.b[1]).true()
    expect(base_b2 === base.b[2]).true()
    expect(base_b2g === base.b[2].g).true()

    Nua(base, { a: { c: 11, d: { e: 33, f: [55] } }, b: [22, [44], {}] })
    expect(base).equal({
      a: { c: 11, d: { e: 33, f: [55] } },
      b: [22, [44], {}],
    })
    expect(base_a === base.a).true()
    expect(base_ad === base.a.d).true()
    expect(base_adf === base.a.d.f).true()
    expect(base_b === base.b).true()
    expect(base_b1 === base.b[1]).true()
    expect(base_b2 === base.b[2]).true()

    Nua(base, { a: { c: 11, d: { e: 33 } }, b: [22, [44]] })
    expect(base).equal({ a: { c: 11, d: { e: 33 } }, b: [22, [44]] })
    expect(base_a === base.a).true()
    expect(base_ad === base.a.d).true()
    expect(base_b === base.b).true()
    expect(base_b1 === base.b[1]).true()

    Nua(base, { a: { c: 11, d: {} }, b: [22] })
    expect(base).equal({ a: { c: 11, d: {} }, b: [22] })
    expect(base_a === base.a).true()
    expect(base_ad === base.a.d).true()
    expect(base_b === base.b).true()

    Nua(base, { a: { c: 11 } })
    expect(base).equal({ a: { c: 11 } })
    expect(base_a === base.a).true()

    Nua(base, {})
    expect(base).equal({})

    var src = {
      a: { c: 111, d: { e: 333, f: [555, { h: 777 }] } },
      b: [222, [444], { g: [666] }],
    }
    var src_a = src.a
    var src_ad = src.a.d
    var src_adf = src.a.d.f
    var src_adf1 = src.a.d.f[1]
    var src_b = src.b
    var src_b1 = src.b[1]
    var src_b2 = src.b[2]
    var src_b2g = src.b[2].g

    Nua(base, src)
    expect(base).equal({
      a: { c: 111, d: { e: 333, f: [555, { h: 777 }] } },
      b: [222, [444], { g: [666] }],
    })
    expect(src_a === base.a).true()
    expect(src_ad === base.a.d).true()
    expect(src_adf === base.a.d.f).true()
    expect(src_adf1 === base.a.d.f[1]).true()
    expect(src_b === base.b).true()
    expect(src_b1 === base.b[1]).true()
    expect(src_b2 === base.b[2]).true()
    expect(src_b2g === base.b[2].g).true()

    Nua(base, { a: 1 })
    expect(base).equal({
      a: 1,
    })
  })

  it('setter', () => {
    var base = { a: 1, b: [2] }

    function s0(obj, key, val) {
      obj[key] = 'object' === typeof val ? val : val + 1
    }

    Nua(
      base,
      { a: 2, b: [3, 4], c: 5, d: { e: 6, g: [7], h: null }, f: null, h: [8] },
      { depth: 0, setter: s0 }
    )
    expect(base).equal({
      a: 3,
      b: [4, 5],
      c: 6,
      d: { e: 7, g: [8], h: null },
      f: null,
      h: [9],
    })
  })

  it('preserve', () => {
    var base = { a: 1, b: { c: 2 }, f: null }

    Nua(base, { d: 3 }, { preserve: true })
    expect(base).equal({ a: 1, b: { c: 2 }, d: 3, f: null })

    Nua(base, { b: { c: 4 } }, { preserve: true })
    expect(base).equal({ a: 1, b: { c: 4 }, d: 3, f: null })

    Nua(base, { f: { g: 5 } }, { preserve: true })
    expect(base).equal({ a: 1, b: { c: 4 }, d: 3, f: { g: 5 } })
  })
})
