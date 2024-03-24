/**
 * 定义一些公共的方法
 */

/** 判断是否是对象 */
export const isObject = (value: unknown) =>
  value !== null && typeof value === "object";

/** 合并两个对象 */
export const extend = Object.assign;


