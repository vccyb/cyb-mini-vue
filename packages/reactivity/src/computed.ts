import { ReactiveEffect } from "./effect";
class ComputedImpl {
  // 是否需要重新缓存的标识
  private _dirty: Boolean = true;
  private _value: any;
  private _effect: ReactiveEffect;

  constructor(getter) {
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
      }
    });
  }

  get value() {
    if (this._dirty) {
      this._dirty = false; // 表示之后不需要重新计算  第二次就直接取 _value
      this._value = this._effect.run();
    }
    return this._value;
  }
}

export function computed(getter) {
  return new ComputedImpl(getter);
}
