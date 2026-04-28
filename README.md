# nua

[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Dependency Status][david-badge]][david-url]
[![DeepScan grade](https://deepscan.io/api/teams/5016/projects/11447/branches/170759/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5016&pid=11447&bid=170759)
<a href="https://codeclimate.com/github/rjrodger/nua/maintainability"><img src="https://api.codeclimate.com/v1/badges/0f380e98b0fdd892fa76/maintainability" /></a>

Reference-preserving merge for JavaScript / TypeScript objects and arrays.

A Go port is also available — see [`go/README.md`](./go/README.md).

---

## Tutorial: your first merge

Install:

```sh
npm install nua
```

Then merge a `src` object into a `base` object. The references inside `base`
stay valid afterwards:

```js
const Nua = require('nua')

const base = { a: { b: 1 } }
const baseA = base.a            // hold a reference into base
const src  = { a: { b: 2 } }

Nua(base, src)

base                            // → { a: { b: 2 } }
baseA === base.a                // → true (same object, mutated in place)
```

That's the core idea: `base` is mutated in place, and any inner objects or
arrays that already existed inside `base` keep their identity.

---

## How-to guides

### Limit how deep the merge recurses

Use `depth` to stop walking after _n_ levels. Beyond the limit, `src` values
are assigned wholesale instead of merged.

```js
const base = { a: 1, b: { c: 2 }, d: { e: { f: 3 } } }

Nua(base, { d: { e: { f: 99 } } }, { depth: 2 })
// base.d.e is replaced as a whole, base.d.e.f is not walked individually
```

### Keep keys that are missing from `src`

By default, keys in `base` that are not in `src` are deleted. Pass
`preserve: true` to keep them:

```js
const base = { a: 1, b: 2 }

Nua(base, { a: 99 })                     // → { a: 99 }              (b deleted)
Nua(base, { a: 99 }, { preserve: true }) // → { a: 99, b: 2 }        (b kept)
```

### Intercept assignments with a custom setter

The `setter` option replaces the default `parent[key] = value` write. Useful
for proxies, change tracking, or transforming values during the merge:

```js
function setter(parent, key, val) {
  parent[key] = (typeof val === 'object') ? val : val + 1
}

const base = { a: 1 }
Nua(base, { a: 2, b: 5 }, { setter })
// → { a: 3, b: 6 }
```

---

## Reference

### `Nua(base, src, opts?)`

Mutates `base` so that its content matches `src`, while preserving the object
and array references that already existed inside `base`. Returns nothing.

If either `base` or `src` is not an object, the call is a no-op.

#### Options

| Option     | Type                                          | Default | Description                                                                              |
| ---------- | --------------------------------------------- | ------- | ---------------------------------------------------------------------------------------- |
| `depth`    | `number`                                      | ∞       | Stop recursing after this many levels. `0` means no limit.                               |
| `preserve` | `boolean`                                     | `false` | If `true`, keys present in `base` but absent from `src` are kept instead of deleted.     |
| `setter`   | `(parent, key, value) => void`                | —       | Called in place of the default `parent[key] = value` assignment for scalar leaf writes.  |

#### Behavior summary

- Both `base` and `src` are objects → keys are merged recursively.
- Both are arrays → elements are merged by index; `base.length` is set to `src.length`.
- Types differ at a position (e.g. object vs. array) → `src`'s value replaces `base`'s.
- Key in `base`, missing in `src` → deleted (unless `preserve: true`).
- Key in `src`, missing in `base` → installed by reference (no copy).

---

## Explanation: why reference-preserving?

`Object.assign` and the spread operator solve different problems. They produce
a _new_ object, which means any code that already holds a reference into the
old object now points at stale data.

`nua` instead mutates `base` in place. Inner objects and arrays inside `base`
keep their identity across the merge — references held elsewhere stay live and
see the new values. This matters when:

- A long-lived config object is rehydrated from a fresh source.
- A reactive system (Vue, MobX, hand-rolled observers) tracks specific nested
  objects and would lose those subscriptions if you replaced the whole tree.
- You want shallow equality checks (`===`) on nested objects to keep meaning
  something across merges.

The trade-off is that `nua` does mutate; if you need an unchanged `base`,
clone it first.

---

## Notes

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
