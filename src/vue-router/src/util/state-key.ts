import { inBrowser } from './dom'

// use User Timing api (if present) for more accurate key precision
const Time =
  inBrowser && window.performance && window.performance.now
    ? window.performance
    : Date

/**
 * 生成状态对象key值
 *
 * @returns
 */
export function genStateKey(): string {
  return Time.now().toFixed(3)
}

let _key: string = genStateKey()

/**
 * 获取一条状态对象key值
 *
 * @returns
 */
export function getStateKey(): string {
  return _key
}

/**
 * 设置一个状态对象key值
 *
 * @param key
 * @returns
 */
export function setStateKey(key: string): string {
  return (_key = key)
}
