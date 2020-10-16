/* Copyright (c) 2018-2020 Richard Rodger and other contributors */
'use strict';
function Nua(base, src, opts) {
    opts = opts || {};
    var max_depth = opts.depth || Number.MAX_VALUE;
    var setter = opts.setter;
    var preserve = !!opts.preserve;
    if ('object' === typeof base && 'object' === typeof src) {
        walk(base, src, 0);
    }
    function walk(base, src, depth_in) {
        if (null == base || null == src || max_depth <= depth_in)
            return;
        // console.log('W', max_depth, depth_in)
        var d = depth_in + 1;
        if (Array.isArray(base) && Array.isArray(src)) {
            for (var i = 0; i < base.length; i++) {
                if ( /*d <= max_depth && */'object' === typeof base[i]) {
                    walk(base[i], src[i], d);
                }
                else {
                    setter ? setter(base, i, src[i]) : (base[i] = src[i]);
                }
            }
            for (; i < src.length; i++) {
                setter ? setter(base, i, src[i]) : (base[i] = src[i]);
            }
            base.splice(src.length);
        }
        else {
            var basekeys = Object.keys(base);
            for (var bI = 0; bI < basekeys.length; bI++) {
                var baseval = base[basekeys[bI]];
                var srcval = src[basekeys[bI]];
                var basetype = null === baseval ? 'null' : typeof baseval;
                var srctype = null === srcval ? 'null' : typeof srcval;
                if ('object' === basetype && 'object' === srctype) {
                    walk(baseval, srcval, d);
                }
                else if (void 0 === srcval) {
                    if (!preserve) {
                        delete base[basekeys[bI]];
                    }
                }
                else {
                    setter
                        ? setter(base, basekeys[bI], srcval)
                        : (base[basekeys[bI]] = srcval);
                }
            }
            var srckeys = Object.keys(src);
            for (var sI = 0; sI < srckeys.length; sI++) {
                if (void 0 === base[srckeys[sI]]) {
                    if (setter) {
                        setter(base, srckeys[sI], src[srckeys[sI]]);
                        if (null != src[srckeys[sI]] &&
                            (Array.isArray(src[srckeys[sI]]) ||
                                'object' === typeof src[srckeys[sI]])) {
                            walk(base[srckeys[sI]], src[srckeys[sI]], d);
                        }
                    }
                    else {
                        base[srckeys[sI]] = src[srckeys[sI]];
                    }
                }
            }
        }
    }
}
module.exports = Nua;
//# sourceMappingURL=nua.js.map