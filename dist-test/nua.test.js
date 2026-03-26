/* Copyright (c) 2018-2020 Richard Rodger and other contributors */
'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const Nua = require('../dist/nua');
(0, node_test_1.describe)('nua', function () {
    (0, node_test_1.it)('happy', () => {
        var base = { a: { b: 1 } };
        var base_a = base.a;
        var src = { a: { b: 2 } };
        Nua(base, src);
        node_assert_1.default.deepStrictEqual(base, { a: { b: 2 } });
        node_assert_1.default.strictEqual(base_a, base.a);
    });
    (0, node_test_1.it)('null-fields', () => {
        var base = { a: 1, b: null, c: 4, d: 5, f: null };
        var src = { a: 2, b: 3, c: null, e: 6, f: { g: 7 } };
        Nua(base, src);
        node_assert_1.default.deepStrictEqual(base, {
            a: 2, // override
            b: 3, // override (null is just a value)
            c: null, // override (null is just a value)
            // d is removed as not present in src
            e: 6, // defined in src
            f: { g: 7 }, // override (null is just a value)
        });
    });
    (0, node_test_1.it)('depth', () => {
        var src = { a: 11, b: { c: 22 }, d: { e: { f: 33 } } };
        var base0 = { a: 1, b: { c: 2 }, d: { e: { f: 3 } } };
        var base0b = base0.b;
        var base0d = base0.d;
        var base0e = base0.d.e;
        Nua(base0, src, { depth: 4 });
        node_assert_1.default.deepStrictEqual(base0, src);
        node_assert_1.default.strictEqual(base0b, base0.b);
        node_assert_1.default.strictEqual(base0d, base0.d);
        node_assert_1.default.strictEqual(base0e, base0.d.e);
        var base1 = { a: 1, b: { c: 2 }, d: { e: { f: 3 } } };
        Nua(base1, src, { depth: 3 });
        node_assert_1.default.deepStrictEqual(base1, src);
        var base2 = { a: 1, b: { c: 2 }, d: { e: { f: 3 } } };
        Nua(base2, src, { depth: 2 });
        node_assert_1.default.deepStrictEqual(base2, { a: 11, b: { c: 22 }, d: { e: { f: 3 } } });
        var base3 = { a: 1, b: { c: 2 }, d: { e: { f: 3 } } };
        var base3b = base3.b;
        var base3d = base3.d;
        var base3e = base3.d.e;
        Nua(base3, src, { depth: 1 });
        node_assert_1.default.deepStrictEqual(base3, { a: 11, b: { c: 2 }, d: { e: { f: 3 } } });
        node_assert_1.default.strictEqual(base3b, base3.b);
        node_assert_1.default.strictEqual(base3d, base3.d);
        node_assert_1.default.strictEqual(base3e, base3.d.e);
        var base4 = { a: 1, b: { c: 2 }, d: { e: { f: 3 } } };
        Nua(base4, src, { depth: 0 });
        node_assert_1.default.deepStrictEqual(base4, src);
    });
    (0, node_test_1.it)('array', () => {
        var base = { a: [1, 2] };
        var base_a = base.a;
        Nua(base, { a: [11, 22] });
        node_assert_1.default.deepStrictEqual(base, { a: [11, 22] });
        node_assert_1.default.strictEqual(base_a, base.a);
        Nua(base, { a: [11, 22, 33] });
        node_assert_1.default.deepStrictEqual(base, { a: [11, 22, 33] });
        node_assert_1.default.strictEqual(base_a, base.a);
        Nua(base, { a: [11] });
        node_assert_1.default.deepStrictEqual(base, { a: [11] });
        node_assert_1.default.strictEqual(base_a, base.a);
        Nua(base, { a: { b: 1 } });
        var a = base.a;
        a.b = 1;
        node_assert_1.default.deepStrictEqual(base, { a: a });
        node_assert_1.default.strictEqual(base_a, base.a);
    });
    (0, node_test_1.it)('object', () => {
        var base = { a: { b: 1, c: 2 } };
        var base_a = base.a;
        Nua(base, { a: { b: 11, c: 22 } });
        node_assert_1.default.deepStrictEqual(base, { a: { b: 11, c: 22 } });
        node_assert_1.default.strictEqual(base_a, base.a);
        Nua(base, { a: { b: 11, c: 22, d: 33 } });
        node_assert_1.default.deepStrictEqual(base, { a: { b: 11, c: 22, d: 33 } });
        node_assert_1.default.strictEqual(base_a, base.a);
        Nua(base, { a: { b: 11 } });
        node_assert_1.default.deepStrictEqual(base, { a: { b: 11 } });
        node_assert_1.default.strictEqual(base_a, base.a);
        Nua(base, { a: { b: 11 }, c: { d: { e: 1 } } });
        node_assert_1.default.deepStrictEqual(base, { a: { b: 11 }, c: { d: { e: 1 } } });
    });
    (0, node_test_1.it)('deep', () => {
        var base = {
            a: { c: 1, d: { e: 3, f: [5, { h: 7 }] } },
            b: [2, [4], { g: [6] }],
        };
        var base_a = base.a;
        var base_ad = base.a.d;
        var base_adf = base.a.d.f;
        var base_adf1 = base.a.d.f[1];
        var base_b = base.b;
        var base_b1 = base.b[1];
        var base_b2 = base.b[2];
        var base_b2g = base.b[2].g;
        Nua(null, null);
        Nua(null, 1);
        Nua(1, null);
        Nua(base, null);
        node_assert_1.default.deepStrictEqual(base, {
            a: { c: 1, d: { e: 3, f: [5, { h: 7 }] } },
            b: [2, [4], { g: [6] }],
        });
        Nua(base, 1);
        node_assert_1.default.deepStrictEqual(base, {
            a: { c: 1, d: { e: 3, f: [5, { h: 7 }] } },
            b: [2, [4], { g: [6] }],
        });
        Nua(base, { a: { c: {}, d: { e: 3, f: [5, { h: 7 }] } } }, { preserve: true });
        node_assert_1.default.deepStrictEqual(base, {
            a: { c: {}, d: { e: 3, f: [5, { h: 7 }] } },
            b: [2, [4], { g: [6] }],
        });
        Nua(base, {
            a: { c: 11, d: { e: 33, f: [55, { h: 77 }] } },
            b: [22, [44], { g: [66] }],
        });
        node_assert_1.default.deepStrictEqual(base, {
            a: { c: 11, d: { e: 33, f: [55, { h: 77 }] } },
            b: [22, [44], { g: [66] }],
        });
        node_assert_1.default.strictEqual(base_a, base.a);
        node_assert_1.default.strictEqual(base_ad, base.a.d);
        node_assert_1.default.strictEqual(base_adf, base.a.d.f);
        node_assert_1.default.strictEqual(base_adf1, base.a.d.f[1]);
        node_assert_1.default.strictEqual(base_b, base.b);
        node_assert_1.default.strictEqual(base_b1, base.b[1]);
        node_assert_1.default.strictEqual(base_b2, base.b[2]);
        node_assert_1.default.strictEqual(base_b2g, base.b[2].g);
        Nua(base, { a: { c: 11, d: { e: 33, f: [55] } }, b: [22, [44], {}] });
        node_assert_1.default.deepStrictEqual(base, {
            a: { c: 11, d: { e: 33, f: [55] } },
            b: [22, [44], {}],
        });
        node_assert_1.default.strictEqual(base_a, base.a);
        node_assert_1.default.strictEqual(base_ad, base.a.d);
        node_assert_1.default.strictEqual(base_adf, base.a.d.f);
        node_assert_1.default.strictEqual(base_b, base.b);
        node_assert_1.default.strictEqual(base_b1, base.b[1]);
        node_assert_1.default.strictEqual(base_b2, base.b[2]);
        Nua(base, { a: { c: 11, d: { e: 33 } }, b: [22, [44]] });
        node_assert_1.default.deepStrictEqual(base, { a: { c: 11, d: { e: 33 } }, b: [22, [44]] });
        node_assert_1.default.strictEqual(base_a, base.a);
        node_assert_1.default.strictEqual(base_ad, base.a.d);
        node_assert_1.default.strictEqual(base_b, base.b);
        node_assert_1.default.strictEqual(base_b1, base.b[1]);
        Nua(base, { a: { c: 11, d: {} }, b: [22] });
        node_assert_1.default.deepStrictEqual(base, { a: { c: 11, d: {} }, b: [22] });
        node_assert_1.default.strictEqual(base_a, base.a);
        node_assert_1.default.strictEqual(base_ad, base.a.d);
        node_assert_1.default.strictEqual(base_b, base.b);
        Nua(base, { a: { c: 11 } });
        node_assert_1.default.deepStrictEqual(base, { a: { c: 11 } });
        node_assert_1.default.strictEqual(base_a, base.a);
        Nua(base, {});
        node_assert_1.default.deepStrictEqual(base, {});
        var src = {
            a: { c: 111, d: { e: 333, f: [555, { h: 777 }] } },
            b: [222, [444], { g: [666] }],
        };
        var src_a = src.a;
        var src_ad = src.a.d;
        var src_adf = src.a.d.f;
        var src_adf1 = src.a.d.f[1];
        var src_b = src.b;
        var src_b1 = src.b[1];
        var src_b2 = src.b[2];
        var src_b2g = src.b[2].g;
        Nua(base, src);
        node_assert_1.default.deepStrictEqual(base, {
            a: { c: 111, d: { e: 333, f: [555, { h: 777 }] } },
            b: [222, [444], { g: [666] }],
        });
        node_assert_1.default.strictEqual(src_a, base.a);
        node_assert_1.default.strictEqual(src_ad, base.a.d);
        node_assert_1.default.strictEqual(src_adf, base.a.d.f);
        node_assert_1.default.strictEqual(src_adf1, base.a.d.f[1]);
        node_assert_1.default.strictEqual(src_b, base.b);
        node_assert_1.default.strictEqual(src_b1, base.b[1]);
        node_assert_1.default.strictEqual(src_b2, base.b[2]);
        node_assert_1.default.strictEqual(src_b2g, base.b[2].g);
        Nua(base, { a: 1 });
        node_assert_1.default.deepStrictEqual(base, {
            a: 1,
        });
    });
    (0, node_test_1.it)('setter', () => {
        var base = { a: 1, b: [2] };
        function s0(obj, key, val) {
            obj[key] = 'object' === typeof val ? val : val + 1;
        }
        Nua(base, { a: 2, b: [3, 4], c: 5, d: { e: 6, g: [7], h: null }, f: null, h: [8] }, { depth: 0, setter: s0 });
        node_assert_1.default.deepStrictEqual(base, {
            a: 3,
            b: [4, 5],
            c: 6,
            d: { e: 7, g: [8], h: null },
            f: null,
            h: [9],
        });
    });
    (0, node_test_1.it)('preserve', () => {
        var base = { a: 1, b: { c: 2 }, f: null };
        Nua(base, { d: 3 }, { preserve: true });
        node_assert_1.default.deepStrictEqual(base, { a: 1, b: { c: 2 }, d: 3, f: null });
        Nua(base, { b: { c: 4 } }, { preserve: true });
        node_assert_1.default.deepStrictEqual(base, { a: 1, b: { c: 4 }, d: 3, f: null });
        Nua(base, { f: { g: 5 } }, { preserve: true });
        node_assert_1.default.deepStrictEqual(base, { a: 1, b: { c: 4 }, d: 3, f: { g: 5 } });
    });
});
//# sourceMappingURL=nua.test.js.map