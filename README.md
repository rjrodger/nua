# nua

[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Dependency Status][david-badge]][david-url]
[![DeepScan grade](https://deepscan.io/api/teams/5016/projects/11447/branches/170759/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5016&pid=11447&bid=170759)
<a href="https://codeclimate.com/github/rjrodger/nua/maintainability"><img src="https://api.codeclimate.com/v1/badges/0f380e98b0fdd892fa76/maintainability" /></a>



Reference-preserving merge.


```
  var base = {a:{b:1}}
  var base_a = base.a
  var src = {a:{b:2}}

  Nua(base,src)
  expect(base).equal({a:{b:2}})
  expect(base_a === base.a).true()

```



## Install

```sh
npm install nua
```

# Notes

From the Irish [_nua_](http://www.focloir.ie/en/dictionary/ei/new). Pronounced _noo-ah_.


## License

Copyright (c) 2014-2016, Seamus D'Arcy and other contributors.
Licensed under [MIT][].

[MIT]: ./LICENSE
[travis-badge]: https://travis-ci.org/rjrodger/nua.svg
[travis-url]: https://travis-ci.org/rjrodger/nua
[npm-badge]: https://img.shields.io/npm/v/nua.svg
[npm-url]: https://npmjs.com/package/nua
[david-badge]: https://david-dm.org/rjrodger/nua.svg
[david-url]: https://david-dm.org/rjrodger/nua
[coveralls-badge]: https://coveralls.io/repos/github/rjrodger/nua/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/rjrodger/nua?branch=master
