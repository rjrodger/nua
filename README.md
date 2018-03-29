# nua

Reference-preserving merge.


```
  var base = {a:{b:1}}
  var base_a = base.a
  var src = {a:{b:2}}

  Nua(base,src)
  expect(base).equal({a:{b:2}})
  expect(base_a === base.a).true()

```

