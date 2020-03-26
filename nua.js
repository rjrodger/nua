/* Copyright (c) 2018 Richard Rodger and other contributors */
'use strict'


// TODO: is it necessary to copy scalar values?
// TODO: test internal references


module.exports = function Nua(base, src, depth) {
  var max_depth = depth || Number.MAX_VALUE
  
  if('object' === typeof(base) && 'object' === typeof(src)) {
    walk(base, src, 0)
  }

  function walk(base, src, depth_in) {
    if( null == base || null == src || max_depth <= depth_in ) return;
    //if( null == base || null == src ) return
    // console.log('BASE',base,'SRC',src,typeof(base),typeof(src))

    var d = depth_in + 1
    
    if(Array.isArray(base) && Array.isArray(src)) {
      for(var i = 0; i < base.length; i++) {
        if( d < max_depth && 'object' === typeof(base[i]) ){
          walk(base[i], src[i], d)
        }
        else {
          base[i] = src[i]
        }
      }
      for(; i < src.length; i++) {
        base[i] = src[i]
      }
      base.splice(src.length)
    }
    else {
      var basekeys = Object.keys(base)
      for(var i = 0; i < basekeys.length; i++) {
        var baseval = base[basekeys[i]]
        var srcval = src[basekeys[i]]
        var basetype = null === baseval ? 'null' : typeof(baseval)
        var srctype = null === srcval ? 'null' : typeof(srcval)
                              
        if( 'object' === basetype && 'object' === srctype ) {
          if( d < max_depth ) {
            walk(baseval, srcval, d)
          }
          else {
            base[basekeys[i]] = srcval
          }
        }
        else if( void 0 === srcval) {
          delete base[basekeys[i]]
        }

        else if( 'object' !== basetype &&
                 'object' !== srctype ) {
          base[basekeys[i]] = srcval
        }
      }
      
      var srckeys = Object.keys(src)
      for(var i = 0; i < srckeys.length; i++) {
        if( void 0 === base[srckeys[i]] ) {
          base[srckeys[i]] = src[srckeys[i]]
        }
      }
    }
  }
}
