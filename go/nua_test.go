package nua

import (
	"reflect"
	"testing"
)

func mapPtr(m map[string]any) uintptr  { return reflect.ValueOf(m).Pointer() }
func slicePtr(s []any) uintptr         { return reflect.ValueOf(s).Pointer() }

func assertEqual(t *testing.T, got, want any) {
	t.Helper()
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("not equal\n got: %#v\nwant: %#v", got, want)
	}
}

func TestHappy(t *testing.T) {
	base := map[string]any{"a": map[string]any{"b": 1}}
	baseA := base["a"].(map[string]any)
	src := map[string]any{"a": map[string]any{"b": 2}}

	Merge(base, src)
	assertEqual(t, base, map[string]any{"a": map[string]any{"b": 2}})
	if mapPtr(baseA) != mapPtr(base["a"].(map[string]any)) {
		t.Fatalf("inner map reference not preserved")
	}
}

func TestNullFields(t *testing.T) {
	base := map[string]any{"a": 1, "b": nil, "c": 4, "d": 5, "f": nil}
	src := map[string]any{"a": 2, "b": 3, "c": nil, "e": 6, "f": map[string]any{"g": 7}}

	Merge(base, src)

	assertEqual(t, base, map[string]any{
		"a": 2,
		"b": 3,
		"c": nil,
		"e": 6,
		"f": map[string]any{"g": 7},
	})
}

func TestDepth(t *testing.T) {
	src := map[string]any{
		"a": 11,
		"b": map[string]any{"c": 22},
		"d": map[string]any{"e": map[string]any{"f": 33}},
	}

	mkBase := func() map[string]any {
		return map[string]any{
			"a": 1,
			"b": map[string]any{"c": 2},
			"d": map[string]any{"e": map[string]any{"f": 3}},
		}
	}

	base0 := mkBase()
	base0b := base0["b"].(map[string]any)
	base0d := base0["d"].(map[string]any)
	base0e := base0d["e"].(map[string]any)
	Merge(base0, src, WithDepth(4))
	assertEqual(t, base0, src)
	if mapPtr(base0b) != mapPtr(base0["b"].(map[string]any)) {
		t.Fatalf("depth=4: b ref lost")
	}
	if mapPtr(base0d) != mapPtr(base0["d"].(map[string]any)) {
		t.Fatalf("depth=4: d ref lost")
	}
	if mapPtr(base0e) != mapPtr(base0["d"].(map[string]any)["e"].(map[string]any)) {
		t.Fatalf("depth=4: d.e ref lost")
	}

	base1 := mkBase()
	Merge(base1, src, WithDepth(3))
	assertEqual(t, base1, src)

	base2 := mkBase()
	Merge(base2, src, WithDepth(2))
	assertEqual(t, base2, map[string]any{
		"a": 11,
		"b": map[string]any{"c": 22},
		"d": map[string]any{"e": map[string]any{"f": 3}},
	})

	base3 := mkBase()
	base3b := base3["b"].(map[string]any)
	base3d := base3["d"].(map[string]any)
	base3e := base3d["e"].(map[string]any)
	Merge(base3, src, WithDepth(1))
	assertEqual(t, base3, map[string]any{
		"a": 11,
		"b": map[string]any{"c": 2},
		"d": map[string]any{"e": map[string]any{"f": 3}},
	})
	if mapPtr(base3b) != mapPtr(base3["b"].(map[string]any)) {
		t.Fatalf("depth=1: b ref lost")
	}
	if mapPtr(base3d) != mapPtr(base3["d"].(map[string]any)) {
		t.Fatalf("depth=1: d ref lost")
	}
	if mapPtr(base3e) != mapPtr(base3["d"].(map[string]any)["e"].(map[string]any)) {
		t.Fatalf("depth=1: d.e ref lost")
	}

	base4 := mkBase()
	Merge(base4, src, WithDepth(0))
	assertEqual(t, base4, src)
}

func TestArray(t *testing.T) {
	base := map[string]any{"a": []any{1, 2}}
	// preserve enough capacity so identity survives same-length and shrink merges
	base["a"] = append(make([]any, 0, 8), base["a"].([]any)...)
	baseA := base["a"].([]any)

	Merge(base, map[string]any{"a": []any{11, 22}})
	assertEqual(t, base, map[string]any{"a": []any{11, 22}})
	if slicePtr(baseA) != slicePtr(base["a"].([]any)) {
		t.Fatalf("same-length merge: slice array ref lost")
	}

	Merge(base, map[string]any{"a": []any{11, 22, 33}})
	assertEqual(t, base, map[string]any{"a": []any{11, 22, 33}})
	if slicePtr(baseA) != slicePtr(base["a"].([]any)) {
		t.Fatalf("grow within cap: slice array ref lost")
	}

	Merge(base, map[string]any{"a": []any{11}})
	assertEqual(t, base, map[string]any{"a": []any{11}})
	if slicePtr(baseA) != slicePtr(base["a"].([]any)) {
		t.Fatalf("shrink: slice array ref lost")
	}

	// type change: src.a is a map, base.a is a slice — Go can't carry index
	// keys on a slice the way JS can on an array, so the value is replaced.
	Merge(base, map[string]any{"a": map[string]any{"b": 1}})
	assertEqual(t, base, map[string]any{"a": map[string]any{"b": 1}})
}

func TestObject(t *testing.T) {
	base := map[string]any{"a": map[string]any{"b": 1, "c": 2}}
	baseA := base["a"].(map[string]any)

	Merge(base, map[string]any{"a": map[string]any{"b": 11, "c": 22}})
	assertEqual(t, base, map[string]any{"a": map[string]any{"b": 11, "c": 22}})
	if mapPtr(baseA) != mapPtr(base["a"].(map[string]any)) {
		t.Fatalf("a ref lost after equal-shape merge")
	}

	Merge(base, map[string]any{"a": map[string]any{"b": 11, "c": 22, "d": 33}})
	assertEqual(t, base, map[string]any{"a": map[string]any{"b": 11, "c": 22, "d": 33}})
	if mapPtr(baseA) != mapPtr(base["a"].(map[string]any)) {
		t.Fatalf("a ref lost after key-add merge")
	}

	Merge(base, map[string]any{"a": map[string]any{"b": 11}})
	assertEqual(t, base, map[string]any{"a": map[string]any{"b": 11}})
	if mapPtr(baseA) != mapPtr(base["a"].(map[string]any)) {
		t.Fatalf("a ref lost after key-remove merge")
	}

	Merge(base, map[string]any{
		"a": map[string]any{"b": 11},
		"c": map[string]any{"d": map[string]any{"e": 1}},
	})
	assertEqual(t, base, map[string]any{
		"a": map[string]any{"b": 11},
		"c": map[string]any{"d": map[string]any{"e": 1}},
	})
}

func TestDeep(t *testing.T) {
	base := map[string]any{
		"a": map[string]any{"c": 1, "d": map[string]any{"e": 3, "f": []any{5, map[string]any{"h": 7}}}},
		"b": []any{2, []any{4}, map[string]any{"g": []any{6}}},
	}
	// expand caps so slice identity survives length changes
	withCap := func(s []any, c int) []any { return append(make([]any, 0, c), s...) }
	a := base["a"].(map[string]any)
	d := a["d"].(map[string]any)
	d["f"] = withCap(d["f"].([]any), 8)
	base["b"] = withCap(base["b"].([]any), 8)
	bSlice := base["b"].([]any)
	bSlice[2].(map[string]any)["g"] = withCap(bSlice[2].(map[string]any)["g"].([]any), 8)

	baseA := base["a"].(map[string]any)
	baseAD := baseA["d"].(map[string]any)
	baseADF := baseAD["f"].([]any)
	baseADF1 := baseADF[1].(map[string]any)
	baseB := base["b"].([]any)
	baseB1 := baseB[1].([]any)
	baseB2 := baseB[2].(map[string]any)
	baseB2G := baseB2["g"].([]any)

	// nil and scalar src — base unchanged
	Merge(nil, nil)
	Merge(nil, 1)
	Merge(1, nil)

	Merge(base, nil)
	assertEqual(t, base, map[string]any{
		"a": map[string]any{"c": 1, "d": map[string]any{"e": 3, "f": []any{5, map[string]any{"h": 7}}}},
		"b": []any{2, []any{4}, map[string]any{"g": []any{6}}},
	})

	Merge(base, 1)
	assertEqual(t, base, map[string]any{
		"a": map[string]any{"c": 1, "d": map[string]any{"e": 3, "f": []any{5, map[string]any{"h": 7}}}},
		"b": []any{2, []any{4}, map[string]any{"g": []any{6}}},
	})

	Merge(base, map[string]any{"a": map[string]any{"c": map[string]any{}, "d": map[string]any{"e": 3, "f": []any{5, map[string]any{"h": 7}}}}}, WithPreserve(true))
	assertEqual(t, base, map[string]any{
		"a": map[string]any{"c": map[string]any{}, "d": map[string]any{"e": 3, "f": []any{5, map[string]any{"h": 7}}}},
		"b": []any{2, []any{4}, map[string]any{"g": []any{6}}},
	})

	Merge(base, map[string]any{
		"a": map[string]any{"c": 11, "d": map[string]any{"e": 33, "f": []any{55, map[string]any{"h": 77}}}},
		"b": []any{22, []any{44}, map[string]any{"g": []any{66}}},
	})
	assertEqual(t, base, map[string]any{
		"a": map[string]any{"c": 11, "d": map[string]any{"e": 33, "f": []any{55, map[string]any{"h": 77}}}},
		"b": []any{22, []any{44}, map[string]any{"g": []any{66}}},
	})
	if mapPtr(baseA) != mapPtr(base["a"].(map[string]any)) {
		t.Fatalf("a ref lost")
	}
	if mapPtr(baseAD) != mapPtr(base["a"].(map[string]any)["d"].(map[string]any)) {
		t.Fatalf("a.d ref lost")
	}
	if slicePtr(baseADF) != slicePtr(base["a"].(map[string]any)["d"].(map[string]any)["f"].([]any)) {
		t.Fatalf("a.d.f ref lost")
	}
	if mapPtr(baseADF1) != mapPtr(base["a"].(map[string]any)["d"].(map[string]any)["f"].([]any)[1].(map[string]any)) {
		t.Fatalf("a.d.f[1] ref lost")
	}
	if slicePtr(baseB) != slicePtr(base["b"].([]any)) {
		t.Fatalf("b ref lost")
	}
	if slicePtr(baseB1) != slicePtr(base["b"].([]any)[1].([]any)) {
		t.Fatalf("b[1] ref lost")
	}
	if mapPtr(baseB2) != mapPtr(base["b"].([]any)[2].(map[string]any)) {
		t.Fatalf("b[2] ref lost")
	}
	if slicePtr(baseB2G) != slicePtr(base["b"].([]any)[2].(map[string]any)["g"].([]any)) {
		t.Fatalf("b[2].g ref lost")
	}

	Merge(base, map[string]any{
		"a": map[string]any{"c": 11, "d": map[string]any{"e": 33, "f": []any{55}}},
		"b": []any{22, []any{44}, map[string]any{}},
	})
	assertEqual(t, base, map[string]any{
		"a": map[string]any{"c": 11, "d": map[string]any{"e": 33, "f": []any{55}}},
		"b": []any{22, []any{44}, map[string]any{}},
	})

	Merge(base, map[string]any{
		"a": map[string]any{"c": 11, "d": map[string]any{"e": 33}},
		"b": []any{22, []any{44}},
	})
	assertEqual(t, base, map[string]any{
		"a": map[string]any{"c": 11, "d": map[string]any{"e": 33}},
		"b": []any{22, []any{44}},
	})

	Merge(base, map[string]any{
		"a": map[string]any{"c": 11, "d": map[string]any{}},
		"b": []any{22},
	})
	assertEqual(t, base, map[string]any{
		"a": map[string]any{"c": 11, "d": map[string]any{}},
		"b": []any{22},
	})

	Merge(base, map[string]any{"a": map[string]any{"c": 11}})
	assertEqual(t, base, map[string]any{"a": map[string]any{"c": 11}})

	Merge(base, map[string]any{})
	assertEqual(t, base, map[string]any{})

	src := map[string]any{
		"a": map[string]any{"c": 111, "d": map[string]any{"e": 333, "f": []any{555, map[string]any{"h": 777}}}},
		"b": []any{222, []any{444}, map[string]any{"g": []any{666}}},
	}
	srcA := src["a"].(map[string]any)
	srcAD := srcA["d"].(map[string]any)
	srcADF := srcAD["f"].([]any)
	srcADF1 := srcADF[1].(map[string]any)
	srcB := src["b"].([]any)
	srcB1 := srcB[1].([]any)
	srcB2 := srcB[2].(map[string]any)
	srcB2G := srcB2["g"].([]any)

	// when base lacks a key, merge installs the src reference directly
	Merge(base, src)
	assertEqual(t, base, map[string]any{
		"a": map[string]any{"c": 111, "d": map[string]any{"e": 333, "f": []any{555, map[string]any{"h": 777}}}},
		"b": []any{222, []any{444}, map[string]any{"g": []any{666}}},
	})
	if mapPtr(srcA) != mapPtr(base["a"].(map[string]any)) {
		t.Fatalf("base.a should now point at src.a")
	}
	if mapPtr(srcAD) != mapPtr(base["a"].(map[string]any)["d"].(map[string]any)) {
		t.Fatalf("base.a.d should now point at src.a.d")
	}
	if slicePtr(srcADF) != slicePtr(base["a"].(map[string]any)["d"].(map[string]any)["f"].([]any)) {
		t.Fatalf("base.a.d.f should now point at src.a.d.f")
	}
	if mapPtr(srcADF1) != mapPtr(base["a"].(map[string]any)["d"].(map[string]any)["f"].([]any)[1].(map[string]any)) {
		t.Fatalf("base.a.d.f[1] should now point at src.a.d.f[1]")
	}
	if slicePtr(srcB) != slicePtr(base["b"].([]any)) {
		t.Fatalf("base.b should now point at src.b")
	}
	if slicePtr(srcB1) != slicePtr(base["b"].([]any)[1].([]any)) {
		t.Fatalf("base.b[1] should now point at src.b[1]")
	}
	if mapPtr(srcB2) != mapPtr(base["b"].([]any)[2].(map[string]any)) {
		t.Fatalf("base.b[2] should now point at src.b[2]")
	}
	if slicePtr(srcB2G) != slicePtr(base["b"].([]any)[2].(map[string]any)["g"].([]any)) {
		t.Fatalf("base.b[2].g should now point at src.b[2].g")
	}

	Merge(base, map[string]any{"a": 1})
	assertEqual(t, base, map[string]any{"a": 1})
}

func TestSetter(t *testing.T) {
	base := map[string]any{"a": 1, "b": []any{2}}

	// In JS, typeof null === 'object', so the JS setter writes null through
	// unchanged. Match that here: nil and containers pass through, ints get
	// incremented.
	setter := func(parent any, key any, val any) {
		set := func(v any) {
			switch p := parent.(type) {
			case map[string]any:
				p[key.(string)] = v
			case []any:
				p[key.(int)] = v
			}
		}
		switch v := val.(type) {
		case nil:
			set(nil)
		case map[string]any, []any:
			set(v)
		case int:
			set(v + 1)
		default:
			set(v)
		}
	}

	src := map[string]any{
		"a": 2,
		"b": []any{3, 4},
		"c": 5,
		"d": map[string]any{"e": 6, "g": []any{7}, "h": nil},
		"f": nil,
		"h": []any{8},
	}
	Merge(base, src, WithDepth(0), WithSetter(setter))
	assertEqual(t, base, map[string]any{
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

	Merge(base, map[string]any{"d": 3}, WithPreserve(true))
	assertEqual(t, base, map[string]any{
		"a": 1,
		"b": map[string]any{"c": 2},
		"d": 3,
		"f": nil,
	})

	Merge(base, map[string]any{"b": map[string]any{"c": 4}}, WithPreserve(true))
	assertEqual(t, base, map[string]any{
		"a": 1,
		"b": map[string]any{"c": 4},
		"d": 3,
		"f": nil,
	})

	Merge(base, map[string]any{"f": map[string]any{"g": 5}}, WithPreserve(true))
	assertEqual(t, base, map[string]any{
		"a": 1,
		"b": map[string]any{"c": 4},
		"d": 3,
		"f": map[string]any{"g": 5},
	})
}
