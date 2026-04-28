// Package nua performs a reference-preserving merge of src into base.
//
// Maps (map[string]any) are mutated in place so the caller's reference
// continues to point at the merged result. Slices ([]any) have their
// underlying elements mutated in place where possible; when the result
// length differs from the original, the returned slice header reflects
// the new length and should be used by the caller.
package nua

import "math"

// Version is the current version of the nua Go module.
const Version = "0.1.0"

// Setter overrides scalar assignment during the merge. It receives the
// parent container (map[string]any or []any), the key (string for maps,
// int for slices), and the value being assigned.
type Setter func(parent any, key any, val any)

type config struct {
	depth    int
	setter   Setter
	preserve bool
}

// Option configures a call to Merge.
type Option func(*config)

// WithDepth caps recursion depth. A value of 0 (the default) means no limit.
func WithDepth(d int) Option {
	return func(c *config) { c.depth = d }
}

// WithSetter installs a custom assignment function used in place of the
// default in-place write.
func WithSetter(s Setter) Option {
	return func(c *config) { c.setter = s }
}

// WithPreserve keeps keys present in base but absent in src, instead of
// deleting them.
func WithPreserve(p bool) Option {
	return func(c *config) { c.preserve = p }
}

// Merge merges src into base. Both arguments must be a map[string]any or
// []any for any work to happen; otherwise base is returned unchanged.
func Merge(base, src any, opts ...Option) any {
	cfg := &config{}
	for _, opt := range opts {
		opt(cfg)
	}
	maxDepth := cfg.depth
	if maxDepth <= 0 {
		maxDepth = math.MaxInt
	}
	if matched(base, src) {
		return walk(base, src, 0, maxDepth, cfg)
	}
	return base
}

func walk(base, src any, depthIn, maxDepth int, cfg *config) any {
	if base == nil || src == nil || depthIn >= maxDepth {
		return base
	}
	d := depthIn + 1

	if baseSlice, ok := base.([]any); ok {
		return walkSlice(baseSlice, src.([]any), d, maxDepth, cfg)
	}
	return walkMap(base.(map[string]any), src.(map[string]any), d, maxDepth, cfg)
}

// matched reports whether base and src are both maps or both slices —
// the only cases where walk recurses. Mixed types (map vs slice, or
// container vs scalar) fall back to direct assignment.
func matched(base, src any) bool {
	if base == nil || src == nil {
		return false
	}
	_, baseIsMap := base.(map[string]any)
	_, srcIsMap := src.(map[string]any)
	if baseIsMap && srcIsMap {
		return true
	}
	_, baseIsSlice := base.([]any)
	_, srcIsSlice := src.([]any)
	return baseIsSlice && srcIsSlice
}

func walkSlice(base, src []any, d, maxDepth int, cfg *config) []any {
	n := len(base)
	if len(src) < n {
		n = len(src)
	}
	for i := 0; i < n; i++ {
		if matched(base[i], src[i]) {
			base[i] = walk(base[i], src[i], d, maxDepth, cfg)
		} else if cfg.setter != nil {
			cfg.setter(base, i, src[i])
		} else {
			base[i] = src[i]
		}
	}
	for i := n; i < len(src); i++ {
		if cfg.setter != nil {
			base = append(base, nil)
			cfg.setter(base, i, src[i])
		} else {
			base = append(base, src[i])
		}
	}
	if len(base) > len(src) {
		base = base[:len(src)]
	}
	return base
}

func walkMap(base, src map[string]any, d, maxDepth int, cfg *config) map[string]any {
	for key, baseval := range base {
		srcval, srcExists := src[key]
		switch {
		case matched(baseval, srcval):
			base[key] = walk(baseval, srcval, d, maxDepth, cfg)
		case !srcExists:
			if !cfg.preserve {
				delete(base, key)
			}
		default:
			if cfg.setter != nil {
				cfg.setter(base, key, srcval)
			} else {
				base[key] = srcval
			}
		}
	}
	for key, srcval := range src {
		if _, exists := base[key]; exists {
			continue
		}
		if cfg.setter != nil {
			cfg.setter(base, key, srcval)
			if matched(base[key], srcval) {
				base[key] = walk(base[key], srcval, d, maxDepth, cfg)
			}
		} else {
			base[key] = srcval
		}
	}
	return base
}

