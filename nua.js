/* Copyright (c) 2018 Richard Rodger and other contributors */
'use strict'



module.exports = function Nua(base, src) {
  if('object' === typeof(base) && 'object' === typeof(src)) {
    walk(base, src)
  }
}


function walk(base, src) {
  if( null == base || null == src ) return
  // console.log('BASE',base,'SRC',src,typeof(base),typeof(src))

  if(Array.isArray(base) && Array.isArray(src)) {
    for(var i = 0; i < base.length; i++) {
      if( 'object' === typeof(base[i]) ){
        walk(base[i], src[i])
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
  // else if('object' === typeof(base) && 'object' === typeof(src)) {
  else {
    var basekeys = Object.keys(base)
    for(var i = 0; i < basekeys.length; i++) {
      if( 'object' === typeof(base[basekeys[i]]) &&
          'object' === typeof(src[basekeys[i]]) ) {
        walk(base[basekeys[i]], src[basekeys[i]])
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
