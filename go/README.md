# nua (Go)

Reference-preserving merge for `map[string]any` and `[]any` trees.

**Version:** `0.1.0` (exported as the `nua.Version` constant in `nua.go`).

This is the Go port of the [JavaScript / TypeScript `nua` package](../README.md).
The behavior matches the JS version; the Go-specific caveats are called out
in the [Explanation](#explanation-why-reference-preserving-and-the-slice-caveat)
section.

---

## Tutorial: your first merge

Install:

```sh
go get github.com/rjrodger/nua/go
```

Then merge a `src` map into a `base` map. The references inside `base` stay
valid afterwards:

```go
package main

import (
    "fmt"

    "github.com/rjrodger/nua/go"
)

func main() {
    base := map[string]any{"a": map[string]any{"b": 1}}
    baseA := base["a"].(map[string]any) // hold a reference into base
    src := map[string]any{"a": map[string]any{"b": 2}}

    nua.Merge(base, src)

    fmt.Println(base)       // map[a:map[b:2]]
    fmt.Println(baseA["b"]) // 2 — baseA still points at base["a"], now mutated
}
```

Inner maps inside `base` are mutated in place, so any reference you held
beforehand sees the new values.

---

## How-to guides

### Limit how deep the merge recurses

`WithDepth(n)` stops walking after _n_ levels. Beyond the limit, `src` values
are assigned wholesale instead of merged. `WithDepth(0)` (the default) means
no limit.

```go
base := map[string]any{
    "a": 1,
    "d": map[string]any{"e": map[string]any{"f": 3}},
}
src := map[string]any{
    "d": map[string]any{"e": map[string]any{"f": 99}},
}

nua.Merge(base, src, nua.WithDepth(2))
// base["d"]["e"] is replaced as a whole at depth 2; nua does not walk into f.
```

### Keep keys that are missing from `src`

By default, keys in `base` that are not in `src` are deleted. Pass
`WithPreserve(true)` to keep them:

```go
base := map[string]any{"a": 1, "b": 2}

nua.Merge(base, map[string]any{"a": 99})
// → map[a:99]              (b deleted)

base = map[string]any{"a": 1, "b": 2}
nua.Merge(base, map[string]any{"a": 99}, nua.WithPreserve(true))
// → map[a:99 b:2]          (b kept)
```

### Intercept assignments with a custom setter

`WithSetter` replaces the default in-place write. The setter receives the
parent container (a `map[string]any` or `[]any`), the key (`string` for maps,
`int` for slices), and the value being assigned.

```go
setter := func(parent any, key any, val any) {
    switch p := parent.(type) {
    case map[string]any:
        if n, ok := val.(int); ok {
            p[key.(string)] = n + 1
        } else {
            p[key.(string)] = val
        }
    case []any:
        if n, ok := val.(int); ok {
            p[key.(int)] = n + 1
        } else {
            p[key.(int)] = val
        }
    }
}

base := map[string]any{"a": 1}
nua.Merge(base, map[string]any{"a": 2, "b": 5}, nua.WithSetter(setter))
// → map[a:3 b:6]
```

### Preserve slice identity across length changes

A Go slice header (`ptr`, `len`, `cap`) gets a fresh backing array when
`append` exceeds capacity. If you want the slice's underlying array to keep
its identity through a `Merge` that grows the slice, allocate enough capacity
up front:

```go
s := make([]any, 0, 8)
s = append(s, 1, 2)
base := map[string]any{"a": s}

nua.Merge(base, map[string]any{"a": []any{11, 22, 33}})
// base["a"] still backed by the same underlying array
```

---

## Reference

### `func Merge(base, src any, opts ...Option) any`

Merges `src` into `base`. Both arguments must be `map[string]any` or `[]any`
of the same kind for any work to happen — otherwise `base` is returned
unchanged. Maps are mutated in place; slices may be reallocated when the
length grows beyond capacity, so callers that resize via `Merge` should use
the returned value when assigning back.

### Options

| Option                | Description                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| `WithDepth(n int)`    | Cap recursion depth. `0` (default) means no limit.                                                           |
| `WithPreserve(p bool)`| If `true`, keys present in `base` but absent from `src` are kept instead of deleted.                          |
| `WithSetter(s Setter)`| Override the default `parent[key] = value` assignment for scalar writes.                                      |

### Types

```go
type Setter func(parent any, key any, val any)
type Option func(*config)
```

### Constants

```go
const Version = "0.1.0"
```

### Behavior summary

- Both `base` and `src` are `map[string]any` → keys are merged recursively.
- Both are `[]any` → elements are merged by index; the resulting length matches `src`.
- Types differ at a position (e.g. map vs. slice) → `src`'s value replaces `base`'s.
- Key in `base`, missing in `src` → deleted (unless `WithPreserve(true)`).
- Key in `src`, missing in `base` → installed by reference (no copy).

---

## Explanation: why reference-preserving (and the slice caveat)

The point of `nua` is to update a tree in place so that any reference held
into that tree before the merge is still live after it. This matters for
long-lived configuration objects, observers wired to specific nested maps,
and identity-sensitive comparisons elsewhere in your program.

For maps this is straightforward: Go maps are reference types backed by a
runtime-managed header, and mutating `base[k] = v` does not change the map
header that the caller holds. References to inner maps inside `base` keep
their identity across `Merge`.

Slices need more care. A slice value is a `(ptr, len, cap)` header; when
`append` exceeds `cap`, Go allocates a new backing array and the header now
points somewhere else. So:

- `Merge` mutates a slice's elements in place when possible.
- If the merge grows the slice past its capacity, the returned slice header
  refers to a new backing array. The original header the caller held is now
  stale for the tail.
- If the merge shrinks the slice, the underlying array is preserved and the
  header is just truncated.

To keep slice identity across a length change, allocate the slice with
enough capacity up front (see the how-to above).

The other Go-specific case worth knowing: where the JS version lets a value
turn from an array into a key-bearing object (because in JS arrays are
objects), Go has no equivalent — assigning a `map[string]any` over a `[]any`
slot simply replaces the slot.

---

## License

Copyright (c) 2014-2016, Seamus D'Arcy and other contributors.
Licensed under [MIT](../LICENSE).
