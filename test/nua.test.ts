/* Copyright (c) 2018-2020 Richard Rodger and other contributors */
'use strict'

import { describe, it } from 'node:test'
import assert from 'node:assert'

const Nua = require('../dist/nua')

describe('nua', function() {
  it('happy', () => {
    var base = { a: { b: 1 } }
    var base_a = base.a
    var src = { a: { b: 2 } }

    Nua(base, src)
    assert.deepStrictEqual(base, { a: { b: 2 } })
    assert.strictEqual(base_a, base.a)
  })

  it('null-fields', () => {
    var base = { a: 1, b: null, c: 4, d: 5, f: null }
    var src = { a: 2, b: 3, c: null, e: 6, f: { g: 7 } }

    Nua(base, src)

    assert.deepStrictEqual(base, {
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
    assert.deepStrictEqual(base0, src)
    assert.strictEqual(base0b, base0.b)
    assert.strictEqual(base0d, base0.d)
    assert.strictEqual(base0e, base0.d.e)

    var base1 = { a: 1, b: { c: 2 }, d: { e: { f: 3 } } }
    Nua(base1, src, { depth: 3 })
    assert.deepStrictEqual(base1, src)

    var base2 = { a: 1, b: { c: 2 }, d: { e: { f: 3 } } }
    Nua(base2, src, { depth: 2 })
    assert.deepStrictEqual(base2, { a: 11, b: { c: 22 }, d: { e: { f: 3 } } })

    var base3 = { a: 1, b: { c: 2 }, d: { e: { f: 3 } } }
    var base3b = base3.b
    var base3d = base3.d
    var base3e = base3.d.e
    Nua(base3, src, { depth: 1 })
    assert.deepStrictEqual(base3, { a: 11, b: { c: 2 }, d: { e: { f: 3 } } })
    assert.strictEqual(base3b, base3.b)
    assert.strictEqual(base3d, base3.d)
    assert.strictEqual(base3e, base3.d.e)

    var base4 = { a: 1, b: { c: 2 }, d: { e: { f: 3 } } }
    Nua(base4, src, { depth: 0 })
    assert.deepStrictEqual(base4, src)
  })

  it('array', () => {
    var base = { a: [1, 2] }
    var base_a = base.a

    Nua(base, { a: [11, 22] })
    assert.deepStrictEqual(base, { a: [11, 22] })
    assert.strictEqual(base_a, base.a)

    Nua(base, { a: [11, 22, 33] })
    assert.deepStrictEqual(base, { a: [11, 22, 33] })
    assert.strictEqual(base_a, base.a)

    Nua(base, { a: [11] })
    assert.deepStrictEqual(base, { a: [11] })
    assert.strictEqual(base_a, base.a)

    Nua(base, { a: { b: 1 } })
    var a = base.a
      ; (a as any).b = 1
    assert.deepStrictEqual(base, { a: a })
    assert.strictEqual(base_a, base.a)
  })

  it('object', () => {
    var base = { a: { b: 1, c: 2 } }
    var base_a = base.a

    Nua(base, { a: { b: 11, c: 22 } })
    assert.deepStrictEqual(base, { a: { b: 11, c: 22 } })
    assert.strictEqual(base_a, base.a)

    Nua(base, { a: { b: 11, c: 22, d: 33 } })
    assert.deepStrictEqual(base, { a: { b: 11, c: 22, d: 33 } })
    assert.strictEqual(base_a, base.a)

    Nua(base, { a: { b: 11 } })
    assert.deepStrictEqual(base, { a: { b: 11 } })
    assert.strictEqual(base_a, base.a)

    Nua(base, { a: { b: 11 }, c: { d: { e: 1 } } })
    assert.deepStrictEqual(base, { a: { b: 11 }, c: { d: { e: 1 } } })
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
    var base_b2g = (base.b[2] as any).g

    Nua(null, null)
    Nua(null, 1)
    Nua(1, null)

    Nua(base, null)
    assert.deepStrictEqual(base, {
      a: { c: 1, d: { e: 3, f: [5, { h: 7 }] } },
      b: [2, [4], { g: [6] }],
    })

    Nua(base, 1)
    assert.deepStrictEqual(base, {
      a: { c: 1, d: { e: 3, f: [5, { h: 7 }] } },
      b: [2, [4], { g: [6] }],
    })

    Nua(
      base,
      { a: { c: {}, d: { e: 3, f: [5, { h: 7 }] } } },
      { preserve: true }
    )
    assert.deepStrictEqual(base, {
      a: { c: {}, d: { e: 3, f: [5, { h: 7 }] } },
      b: [2, [4], { g: [6] }],
    })

    Nua(base, {
      a: { c: 11, d: { e: 33, f: [55, { h: 77 }] } },
      b: [22, [44], { g: [66] }],
    })
    assert.deepStrictEqual(base, {
      a: { c: 11, d: { e: 33, f: [55, { h: 77 }] } },
      b: [22, [44], { g: [66] }],
    })
    assert.strictEqual(base_a, base.a)
    assert.strictEqual(base_ad, base.a.d)
    assert.strictEqual(base_adf, base.a.d.f)
    assert.strictEqual(base_adf1, base.a.d.f[1])
    assert.strictEqual(base_b, base.b)
    assert.strictEqual(base_b1, base.b[1])
    assert.strictEqual(base_b2, base.b[2])
    assert.strictEqual(base_b2g, (base.b[2] as any).g)

    Nua(base, { a: { c: 11, d: { e: 33, f: [55] } }, b: [22, [44], {}] })
    assert.deepStrictEqual(base, {
      a: { c: 11, d: { e: 33, f: [55] } },
      b: [22, [44], {}],
    })
    assert.strictEqual(base_a, base.a)
    assert.strictEqual(base_ad, base.a.d)
    assert.strictEqual(base_adf, base.a.d.f)
    assert.strictEqual(base_b, base.b)
    assert.strictEqual(base_b1, base.b[1])
    assert.strictEqual(base_b2, base.b[2])

    Nua(base, { a: { c: 11, d: { e: 33 } }, b: [22, [44]] })
    assert.deepStrictEqual(base, { a: { c: 11, d: { e: 33 } }, b: [22, [44]] })
    assert.strictEqual(base_a, base.a)
    assert.strictEqual(base_ad, base.a.d)
    assert.strictEqual(base_b, base.b)
    assert.strictEqual(base_b1, base.b[1])

    Nua(base, { a: { c: 11, d: {} }, b: [22] })
    assert.deepStrictEqual(base, { a: { c: 11, d: {} }, b: [22] })
    assert.strictEqual(base_a, base.a)
    assert.strictEqual(base_ad, base.a.d)
    assert.strictEqual(base_b, base.b)

    Nua(base, { a: { c: 11 } })
    assert.deepStrictEqual(base, { a: { c: 11 } })
    assert.strictEqual(base_a, base.a)

    Nua(base, {})
    assert.deepStrictEqual(base, {})

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
    var src_b2g = (src.b[2] as any).g

    Nua(base, src)
    assert.deepStrictEqual(base, {
      a: { c: 111, d: { e: 333, f: [555, { h: 777 }] } },
      b: [222, [444], { g: [666] }],
    })
    assert.strictEqual(src_a, base.a)
    assert.strictEqual(src_ad, base.a.d)
    assert.strictEqual(src_adf, base.a.d.f)
    assert.strictEqual(src_adf1, base.a.d.f[1])
    assert.strictEqual(src_b, base.b)
    assert.strictEqual(src_b1, base.b[1])
    assert.strictEqual(src_b2, base.b[2])
    assert.strictEqual(src_b2g, (base.b[2] as any).g)

    Nua(base, { a: 1 })
    assert.deepStrictEqual(base, {
      a: 1,
    })
  })

  it('setter', () => {
    var base = { a: 1, b: [2] }

    function s0(obj: any, key: any, val: any) {
      obj[key] = 'object' === typeof val ? val : val + 1
    }

    Nua(
      base,
      { a: 2, b: [3, 4], c: 5, d: { e: 6, g: [7], h: null }, f: null, h: [8] },
      { depth: 0, setter: s0 }
    )
    assert.deepStrictEqual(base, {
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
    assert.deepStrictEqual(base, { a: 1, b: { c: 2 }, d: 3, f: null })

    Nua(base, { b: { c: 4 } }, { preserve: true })
    assert.deepStrictEqual(base, { a: 1, b: { c: 4 }, d: 3, f: null })

    Nua(base, { f: { g: 5 } }, { preserve: true })
    assert.deepStrictEqual(base, { a: 1, b: { c: 4 }, d: 3, f: { g: 5 } })
  })
})
