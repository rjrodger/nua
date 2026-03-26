// Copyright (c) 2018-2025 Richard Rodger and other contributors
// Reference-preserving merge for map[string]any values.
package nua

// Setter is a custom function called to assign values during merge.
type Setter func(base map[string]any, key string, val any)

// Options controls merge behaviour.
type Options struct {
	// MaxDepth limits recursion depth. 0 means unlimited.
	MaxDepth int
	// Setter, if set, is called instead of direct assignment for scalar values.
	Setter Setter
	// Preserve keeps base keys that are absent from src.
	Preserve bool
}

// Merge merges src into base in-place, preserving object/slice references
// in base where possible. Both base and src must be map[string]any.
// Nil arguments are silently ignored.
func Merge(base, src map[string]any, opts *Options) {
	if base == nil || src == nil {
		return
	}

	o := Options{}
	if opts != nil {
		o = *opts
	}
	maxDepth := o.MaxDepth
	if maxDepth <= 0 {
		maxDepth = 1<<31 - 1 // effectively unlimited
	}

	walk(base, src, 0, maxDepth, o.Setter, o.Preserve)
}

func walk(base, src map[string]any, depth, maxDepth int, setter Setter, preserve bool) {
	if base == nil || src == nil || depth >= maxDepth {
		return
	}
	d := depth + 1

	// Update or remove existing base keys.
	for key, baseVal := range base {
		srcVal, exists := src[key]
		if !exists {
			if !preserve {
				delete(base, key)
			}
			continue
		}

		baseMap, baseIsMap := baseVal.(map[string]any)
		srcMap, srcIsMap := srcVal.(map[string]any)
		baseSlice, baseIsSlice := baseVal.([]any)
		srcSlice, srcIsSlice := srcVal.([]any)

		switch {
		case baseIsMap && srcIsMap:
			walk(baseMap, srcMap, d, maxDepth, setter, preserve)
		case baseIsSlice && srcIsSlice:
			walkSlice(base, key, baseSlice, srcSlice, d, maxDepth, setter, preserve)
		default:
			if setter != nil {
				setter(base, key, srcVal)
			} else {
				base[key] = srcVal
			}
		}
	}

	// Add new keys from src.
	for key, srcVal := range src {
		if _, exists := base[key]; exists {
			continue
		}
		if setter != nil {
			setter(base, key, srcVal)
			if srcMap, ok := srcVal.(map[string]any); ok {
				if baseMap, ok := base[key].(map[string]any); ok {
					walk(baseMap, srcMap, d, maxDepth, setter, preserve)
				}
			} else if srcSlice, ok := srcVal.([]any); ok {
				if baseSlice, ok := base[key].([]any); ok {
					walkSlice(base, key, baseSlice, srcSlice, d, maxDepth, setter, preserve)
				}
			}
		} else {
			base[key] = srcVal
		}
	}
}

func walkSlice(parent map[string]any, key string, base, src []any, depth, maxDepth int, setter Setter, preserve bool) {
	d := depth

	// Update overlapping indices.
	minLen := len(base)
	if len(src) < minLen {
		minLen = len(src)
	}
	for i := 0; i < minLen; i++ {
		baseMap, baseIsMap := base[i].(map[string]any)
		srcMap, srcIsMap := src[i].(map[string]any)
		baseSlice, baseIsSlice := base[i].([]any)
		srcSlice, srcIsSlice := src[i].([]any)

		switch {
		case baseIsMap && srcIsMap:
			walk(baseMap, srcMap, d, maxDepth, setter, preserve)
		case baseIsSlice && srcIsSlice:
			walkNestedSlice(base, i, baseSlice, srcSlice, d, maxDepth, setter, preserve)
		default:
			if setter != nil {
				// Apply setter via a temporary map wrapper so the setter signature works.
				tmp := map[string]any{"v": base[i]}
				setter(tmp, "v", src[i])
				base[i] = tmp["v"]
			} else {
				base[i] = src[i]
			}
		}
	}

	// Append extra src elements.
	for i := minLen; i < len(src); i++ {
		if setter != nil {
			tmp := map[string]any{}
			setter(tmp, "v", src[i])
			base = append(base, tmp["v"])
		} else {
			base = append(base, src[i])
		}
	}

	// Truncate if src is shorter.
	base = base[:len(src)]

	// Re-assign the slice to the parent since append may have created a new backing array.
	parent[key] = base
}

func walkNestedSlice(parentSlice []any, index int, base, src []any, depth, maxDepth int, setter Setter, preserve bool) {
	minLen := len(base)
	if len(src) < minLen {
		minLen = len(src)
	}
	for i := 0; i < minLen; i++ {
		baseMap, baseIsMap := base[i].(map[string]any)
		srcMap, srcIsMap := src[i].(map[string]any)
		switch {
		case baseIsMap && srcIsMap:
			walk(baseMap, srcMap, depth, maxDepth, setter, preserve)
		default:
			base[i] = src[i]
		}
	}
	for i := minLen; i < len(src); i++ {
		base = append(base, src[i])
	}
	base = base[:len(src)]
	parentSlice[index] = base
}
