import { hasChanged, isObject } from "@mini-vue/shared";
import { isTracking, trackEffect, triggerEffect } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
  private _value: any;
  public dep;
  constructor(value: any) {
    this._value = isObject(value) ? reactive(value) : value;
    this.dep = new Set();
  }

  get value() {
    if (isTracking()) {
      trackEffect(this.dep);
    }
    return this._value;
  }

  set value(newValue) {
    if (hasChanged(newValue, this._value)) {
      this._value = newValue;
      triggerEffect(this.dep); // 触发依赖
    }
  }
}

export function ref(value: any) {
  return new RefImpl(value);
}
