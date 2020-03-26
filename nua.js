/* Copyright (c) 2018-2020 Richard Rodger and other contributors */
'use strict'

// TODO: is it necessary to copy scalar values?
// TODO: test internal references

module.exports = function Nua(base, src, depth) {
  var max_depth = depth || Number.MAX_VALUE
  //console.log('MD', max_depth)

  if ('object' === typeof base && 'object' === typeof src) {
    walk(base, src, 0)
  }

  function walk(base, src, depth_in) {
    if (null == base || null == src || max_depth <= depth_in) return
    // console.log('W', max_depth, depth_in)

    var d = depth_in + 1

    if (Array.isArray(base) && Array.isArray(src)) {
      for (var i = 0; i < base.length; i++) {
        if (/*d <= max_depth && */ 'object' === typeof base[i]) {
          walk(base[i], src[i], d)
        } else {
          base[i] = src[i]
        }
      }
      for (; i < src.length; i++) {
        base[i] = src[i]
      }
      base.splice(src.length)
    } else {
      var basekeys = Object.keys(base)
      for (var bI = 0; bI < basekeys.length; bI++) {
        var baseval = base[basekeys[bI]]
        var srcval = src[basekeys[bI]]
        var basetype = null === baseval ? 'null' : typeof baseval
        var srctype = null === srcval ? 'null' : typeof srcval

        if ('object' === basetype && 'object' === srctype) {
          //if( true /*d <= max_depth*/ ) {
          walk(baseval, srcval, d)
          //}
          //else {
          //  base[basekeys[bI]] = srcval
          //}
        } else if (void 0 === srcval) {
          delete base[basekeys[bI]]
        } else if ('object' !== basetype && 'object' !== srctype) {
          base[basekeys[bI]] = srcval
        }
      }

      var srckeys = Object.keys(src)
      for (var sI = 0; sI < srckeys.length; sI++) {
        if (void 0 === base[srckeys[sI]]) {
          base[srckeys[sI]] = src[srckeys[sI]]
        }
      }
    }
  }
}
