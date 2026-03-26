// Copyright (c) 2018-2025 Richard Rodger and other contributors
package nua

import (
	"reflect"
	"testing"
)

func eq(t *testing.T, got, want map[string]any) {
	t.Helper()
	if !reflect.DeepEqual(got, want) {
		t.Errorf("got %v, want %v", got, want)
	}
}

func same(t *testing.T, a, b any) {
	t.Helper()
	av := reflect.ValueOf(a)
	bv := reflect.ValueOf(b)
	if av.Pointer() != bv.Pointer() {
		t.Error("expected same reference")
	}
}

func TestHappy(t *testing.T) {
	base := map[string]any{"a": map[string]any{"b": 1}}
	baseA := base["a"].(map[string]any)

	Merge(base, map[string]any{"a": map[string]any{"b": 2}}, nil)
	eq(t, base, map[string]any{"a": map[string]any{"b": 2}})
	same(t, baseA, base["a"])
}

func TestNullFields(t *testing.T) {
	base := map[string]any{"a": 1, "b": nil, "c": 4, "d": 5, "f": nil}
	src := map[string]any{"a": 2, "b": 3, "c": nil, "e": 6, "f": map[string]any{"g": 7}}

	Merge(base, src, nil)

	eq(t, base, map[string]any{
		"a": 2,
		"b": 3,
		"c": nil,
		// d removed
		"e": 6,
		"f": map[string]any{"g": 7},
	})
}

func TestDepth(t *testing.T) {
	src := map[string]any{"a": 11, "b": map[string]any{"c": 22}, "d": map[string]any{"e": map[string]any{"f": 33}}}

	// depth 4 (deep enough)
	base0 := map[string]any{"a": 1, "b": map[string]any{"c": 2}, "d": map[string]any{"e": map[string]any{"f": 3}}}
	base0b := base0["b"].(map[string]any)
	base0d := base0["d"].(map[string]any)
	base0e := base0["d"].(map[string]any)["e"].(map[string]any)
	Merge(base0, src, &Options{MaxDepth: 4})
	eq(t, base0, src)
	same(t, base0b, base0["b"])
	same(t, base0d, base0["d"])
	same(t, base0e, base0["d"].(map[string]any)["e"])

	// depth 3
	base1 := map[string]any{"a": 1, "b": map[string]any{"c": 2}, "d": map[string]any{"e": map[string]any{"f": 3}}}
	Merge(base1, src, &Options{MaxDepth: 3})
	eq(t, base1, src)

	// depth 2 - does not recurse into d.e
	base2 := map[string]any{"a": 1, "b": map[string]any{"c": 2}, "d": map[string]any{"e": map[string]any{"f": 3}}}
	Merge(base2, src, &Options{MaxDepth: 2})
	eq(t, base2, map[string]any{"a": 11, "b": map[string]any{"c": 22}, "d": map[string]any{"e": map[string]any{"f": 3}}})

	// depth 1 - only top-level scalars
	base3 := map[string]any{"a": 1, "b": map[string]any{"c": 2}, "d": map[string]any{"e": map[string]any{"f": 3}}}
	base3b := base3["b"].(map[string]any)
	base3d := base3["d"].(map[string]any)
	Merge(base3, src, &Options{MaxDepth: 1})
	eq(t, base3, map[string]any{"a": 11, "b": map[string]any{"c": 2}, "d": map[string]any{"e": map[string]any{"f": 3}}})
	same(t, base3b, base3["b"])
	same(t, base3d, base3["d"])
}

func TestArray(t *testing.T) {
	base := map[string]any{"a": []any{1, 2}}
	baseA := base["a"].([]any)

	Merge(base, map[string]any{"a": []any{11, 22}}, nil)
	eq(t, base, map[string]any{"a": []any{11, 22}})
	// Slice header may differ after append/truncate, so we check deep equal only.

	Merge(base, map[string]any{"a": []any{11, 22, 33}}, nil)
	eq(t, base, map[string]any{"a": []any{11, 22, 33}})

	Merge(base, map[string]any{"a": []any{11}}, nil)
	eq(t, base, map[string]any{"a": []any{11}})

	// Overwrite slice with map
	Merge(base, map[string]any{"a": map[string]any{"b": 1}}, nil)
	eq(t, base, map[string]any{"a": map[string]any{"b": 1}})
	_ = baseA
}

func TestObject(t *testing.T) {
	base := map[string]any{"a": map[string]any{"b": 1, "c": 2}}
	baseA := base["a"].(map[string]any)

	Merge(base, map[string]any{"a": map[string]any{"b": 11, "c": 22}}, nil)
	eq(t, base, map[string]any{"a": map[string]any{"b": 11, "c": 22}})
	same(t, baseA, base["a"])

	Merge(base, map[string]any{"a": map[string]any{"b": 11, "c": 22, "d": 33}}, nil)
	eq(t, base, map[string]any{"a": map[string]any{"b": 11, "c": 22, "d": 33}})
	same(t, baseA, base["a"])

	Merge(base, map[string]any{"a": map[string]any{"b": 11}}, nil)
	eq(t, base, map[string]any{"a": map[string]any{"b": 11}})
	same(t, baseA, base["a"])

	Merge(base, map[string]any{"a": map[string]any{"b": 11}, "c": map[string]any{"d": map[string]any{"e": 1}}}, nil)
	eq(t, base, map[string]any{"a": map[string]any{"b": 11}, "c": map[string]any{"d": map[string]any{"e": 1}}})
}

func TestDeep(t *testing.T) {
	base := map[string]any{
		"a": map[string]any{"c": 1, "d": map[string]any{"e": 3, "f": []any{5, map[string]any{"h": 7}}}},
		"b": []any{2, []any{4}, map[string]any{"g": []any{6}}},
	}
	baseA := base["a"].(map[string]any)
	baseAd := baseA["d"].(map[string]any)

	// nil src is no-op
	Merge(base, nil, nil)
	Merge(nil, nil, nil)

	Merge(base, map[string]any{
		"a": map[string]any{"c": 11, "d": map[string]any{"e": 33, "f": []any{55, map[string]any{"h": 77}}}},
		"b": []any{22, []any{44}, map[string]any{"g": []any{66}}},
	}, nil)
	eq(t, base, map[string]any{
		"a": map[string]any{"c": 11, "d": map[string]any{"e": 33, "f": []any{55, map[string]any{"h": 77}}}},
		"b": []any{22, []any{44}, map[string]any{"g": []any{66}}},
	})
	same(t, baseA, base["a"])
	same(t, baseAd, base["a"].(map[string]any)["d"])

	Merge(base, map[string]any{
		"a": map[string]any{"c": 11, "d": map[string]any{"e": 33, "f": []any{55}}},
		"b": []any{22, []any{44}, map[string]any{}},
	}, nil)
	eq(t, base, map[string]any{
		"a": map[string]any{"c": 11, "d": map[string]any{"e": 33, "f": []any{55}}},
		"b": []any{22, []any{44}, map[string]any{}},
	})
	same(t, baseA, base["a"])
	same(t, baseAd, base["a"].(map[string]any)["d"])

	Merge(base, map[string]any{
		"a": map[string]any{"c": 11, "d": map[string]any{"e": 33}},
		"b": []any{22, []any{44}},
	}, nil)
	eq(t, base, map[string]any{
		"a": map[string]any{"c": 11, "d": map[string]any{"e": 33}},
		"b": []any{22, []any{44}},
	})
	same(t, baseA, base["a"])
	same(t, baseAd, base["a"].(map[string]any)["d"])

	Merge(base, map[string]any{
		"a": map[string]any{"c": 11, "d": map[string]any{}},
		"b": []any{22},
	}, nil)
	eq(t, base, map[string]any{
		"a": map[string]any{"c": 11, "d": map[string]any{}},
		"b": []any{22},
	})
	same(t, baseA, base["a"])
	same(t, baseAd, base["a"].(map[string]any)["d"])

	Merge(base, map[string]any{"a": map[string]any{"c": 11}}, nil)
	eq(t, base, map[string]any{"a": map[string]any{"c": 11}})
	same(t, baseA, base["a"])

	Merge(base, map[string]any{}, nil)
	eq(t, base, map[string]any{})
}

func TestSetter(t *testing.T) {
	base := map[string]any{"a": 1, "b": []any{2}}

	s0 := func(obj map[string]any, key string, val any) {
		switch v := val.(type) {
		case int:
			obj[key] = v + 1
		default:
			obj[key] = val
		}
	}

	Merge(base, map[string]any{
		"a": 2,
		"b": []any{3, 4},
		"c": 5,
		"d": map[string]any{"e": 6, "g": []any{7}, "h": nil},
		"f": nil,
		"h": []any{8},
	}, &Options{Setter: s0})

	eq(t, base, map[string]any{
		"a": 3,
		"b": []any{4, 5},
		"c": 6,
		"d": map[string]any{"e": 7, "g": []any{8}, "h": nil},
		"f": nil,
		"h": []any{9},
	})
}

func TestPreserve(t *testing.T) {
	base := map[string]any{"a": 1, "b": map[string]any{"c": 2}, "f": nil}

	Merge(base, map[string]any{"d": 3}, &Options{Preserve: true})
	eq(t, base, map[string]any{"a": 1, "b": map[string]any{"c": 2}, "d": 3, "f": nil})

	Merge(base, map[string]any{"b": map[string]any{"c": 4}}, &Options{Preserve: true})
	eq(t, base, map[string]any{"a": 1, "b": map[string]any{"c": 4}, "d": 3, "f": nil})

	Merge(base, map[string]any{"f": map[string]any{"g": 5}}, &Options{Preserve: true})
	eq(t, base, map[string]any{"a": 1, "b": map[string]any{"c": 4}, "d": 3, "f": map[string]any{"g": 5}})
}
