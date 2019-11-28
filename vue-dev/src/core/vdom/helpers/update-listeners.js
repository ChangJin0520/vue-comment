/* @flow */

import {
    warn,
    invokeWithErrorHandling
} from 'core/util/index'
import {
    cached,
    isUndef,
    isTrue,
    isPlainObject
} from 'shared/util'

// 对name之前的符号进行处理
const normalizeEvent = cached((name: string): {
    name: string,
    once: boolean,
    capture: boolean,
    passive: boolean,
    handler ?: Function,
    params ?: Array<any>
} => {
    const passive = name.charAt(0) === '&'
    name = passive ? name.slice(1) : name
    const once = name.charAt(0) === '~' // Prefixed last, checked first
    name = once ? name.slice(1) : name
    const capture = name.charAt(0) === '!'
    name = capture ? name.slice(1) : name
    return {
        name,
        once,
        capture,
        passive
    }
})

// 创建事件函数调用器
export function createFnInvoker(fns: Function | Array<Function> , vm: ? Component): Function {
    function invoker() {
        const fns = invoker.fns
        if (Array.isArray(fns)) {
            const cloned = fns.slice()
            for (let i = 0; i < cloned.length; i++) {
                invokeWithErrorHandling(cloned[i], null, arguments, vm, `v-on handler`)
            }
        } else {
            // return handler return value for single handlers
            return invokeWithErrorHandling(fns, null, arguments, vm, `v-on handler`)
        }
    }
    invoker.fns = fns
    return invoker
}

// 遍历处理新添加进来的事件
export function updateListeners(
    on: Object,
    oldOn: Object,
    add: Function,
    remove: Function,
    createOnceHandler: Function,
    vm: Component
) {
    let name, def, cur, old, event

    for (name in on) {
        // cur 和 old 其实是name对应的函数调用器
        def = cur = on[name]
        old = oldOn[name]

        event = normalizeEvent(name)
        /* istanbul ignore if */
        // if (__WEEX__ && isPlainObject(def)) {
        //     cur = def.handler
        //     event.params = def.params
        // }

        if (isUndef(cur)) { //  新事件未定义 则报错处理
            process.env.NODE_ENV !== 'production' && warn(
                `Invalid handler for event "${event.name}": got ` + String(cur),
                vm
            )
        } else if (isUndef(old)) { // 旧事件未定义 添加事件
            // 新事件方法未定义 调用createFnInvoker对事件函数进行封装
            if (isUndef(cur.fns)) {
                cur = on[name] = createFnInvoker(cur, vm)
            }

            // 事件为once 调用createOnceHandler对事件进行封装
            if (isTrue(event.once)) {
                cur = on[name] = createOnceHandler(event.name, cur, event.capture)
            }

            add(event.name, cur, event.capture, event.passive, event.params)
        } else if (cur !== old) { // 新事件不等于旧事件
            // 替换事件的回调
            old.fns = cur
            on[name] = old
        }
    }

    // 旧事件独有的 则调用remove销毁
    for (name in oldOn) {
        if (isUndef(on[name])) {
            event = normalizeEvent(name)
            remove(event.name, oldOn[name], event.capture)
        }
    }
}
