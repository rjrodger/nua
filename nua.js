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
        if( 'object' === typeof(base[basekeys[i]]) &&
            'object' === typeof(src[basekeys[i]]) ) {
          if( d < max_depth ) {
            walk(base[basekeys[i]], src[basekeys[i]], d)
          }
          else {
            base[basekeys[i]] = src[basekeys[i]]
          }
        }
        else if( void 0 === src[basekeys[i]]) {
          delete base[basekeys[i]]
        }

        else if( 'object' !== typeof(base[basekeys[i]]) &&
                 'object' !== typeof(src[basekeys[i]]) ) {
          base[basekeys[i]] = src[basekeys[i]]
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
