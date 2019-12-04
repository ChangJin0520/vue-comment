/* @flow */

import VNode from '../vnode'
import {
    createFnInvoker
} from './update-listeners'
import {
    remove,
    isDef,
    isUndef,
    isTrue
} from 'shared/util'

/**
 * 合并VNode上的已存在的同名钩子函数
 *
 * @export
 * @param {Object} def
 * @param {string} hookKey 钩子名字
 * @param {Function} hook 钩子方法
 */
export function mergeVNodeHook(def: Object, hookKey: string, hook: Function) {
    // 如果传入的是一个vnode 则取其上的hook
    // 在vnode的data属性 hook上存着该虚拟dom相关的钩子函数
    if (def instanceof VNode) {
        def = def.data.hook || (def.data.hook = {})
    }

    let invoker
    const oldHook = def[hookKey] // 取原钩子函数

    function wrappedHook() {
        hook.apply(this, arguments)

        // important: remove merged hook to ensure it's called only once
        // and prevent memory leak
        // 重要：删除合并的挂钩以确保仅调用一次，并防止内存泄漏
        remove(invoker.fns, wrappedHook)
    }

    if (isUndef(oldHook)) { // 不存在该钩子
        // no existing hook
        // invoker函数其实就是把把传入的函数放到invoker的fns属性上 执行的时候再取出fns属性上的函数来执行
        invoker = createFnInvoker([wrappedHook]) // 构建一个函数调用器 以备以后调用
    } else { // 已存在钩子
        // 该钩子函数上有函数 且 该钩子已合并
        if (isDef(oldHook.fns) && isTrue(oldHook.merged)) {
            // already a merged invoker
            invoker = oldHook
            invoker.fns.push(wrappedHook) // 直接push到invoker的fns上
        } else { // 已存在的钩子函数 没有fns 或 未合并
            // existing plain hook
            // 合并原钩子函数和当前包裹的钩子函数
            invoker = createFnInvoker([oldHook, wrappedHook]) // 注意: 这里的oldHook其实也是一个invoker
        }
    }

    invoker.merged = true // 添加merged标记

    def[hookKey] = invoker
}
