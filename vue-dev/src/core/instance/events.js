/* @flow */

import {
    tip,
    toArray,
    hyphenate,
    formatComponentName,
    invokeWithErrorHandling
} from '../util/index'
import {
    updateListeners
} from '../vdom/helpers/index'

export function initEvents(vm: Component) {
    vm._events = Object.create(null) // 当前元素上绑定的自定义事件
    vm._hasHookEvent = false // 标识是否有hook:开头的事件
    // init parent attached events 初始化父组件上的附加事件
    const listeners = vm.$options._parentListeners
    if (listeners) {
        updateComponentListeners(vm, listeners)
    }
}

let target: any

function add(event, fn) {
    target.$on(event, fn)
}

function remove(event, fn) {
    target.$off(event, fn)
}

function createOnceHandler(event, fn) {
    const _target = target
    return function onceHandler() {
        const res = fn.apply(null, arguments)
        if (res !== null) {
            _target.$off(event, onceHandler)
        }
    }
}

export function updateComponentListeners(
    vm: Component,
    listeners: Object,
    oldListeners: ? Object
) {
    target = vm
    updateListeners(listeners, oldListeners || {}, add, remove, createOnceHandler, vm)
    target = undefined
}

export function eventsMixin(Vue: Class<Component> ) {
    const hookRE = /^hook:/

    // 事件注册
    Vue.prototype.$on = function(event: string | Array<string> , fn: Function): Component {
        const vm: Component = this

        if (Array.isArray(event)) { // 如果event是数组 则把该方法添加到不同事件
            for (let i = 0, l = event.length; i < l; i++) {
                vm.$on(event[i], fn)
            }
        } else {
            // 把回调函数注册到vue实例的_events上
            (vm._events[event] || (vm._events[event] = [])).push(fn)
            // optimize hook:event cost by using a boolean flag marked at registration
            // instead of a hash lookup
            // 通过使用注册时标记的布尔标志而不是哈希查找来优化hook：event成本
            if (hookRE.test(event)) {
                vm._hasHookEvent = true
            }
        }
        return vm
    }

    // once注册
    Vue.prototype.$once = function(event: string, fn: Function): Component {
        const vm: Component = this

        function on() {
            vm.$off(event, on)
            fn.apply(vm, arguments)
        }

        on.fn = fn

        vm.$on(event, on)
        return vm
    }

    // 事件销毁
    Vue.prototype.$off = function(event ?: string | Array<string> , fn ?: Function): Component {
        const vm: Component = this

        // all 不传递参数 则清空_events
        if (!arguments.length) {
            vm._events = Object.create(null)
            return vm
        }

        // array of events event是数组则遍历移除方法
        if (Array.isArray(event)) {
            for (let i = 0, l = event.length; i < l; i++) {
                vm.$off(event[i], fn)
            }
            return vm
        }

        // specific event 事件无方法处理
        const cbs = vm._events[event]
        if (!cbs) {
            return vm
        }

        // 没传具体方法 则销毁整个事件
        if (!fn) {
            vm._events[event] = null
            return vm
        }

        // specific handler 从事件对应的函数数组中 移除指定的函数
        let cb
        let i = cbs.length
        while (i--) {
            cb = cbs[i]
            if (cb === fn || cb.fn === fn) { // cb.fn === fn 为了处理通过once注册上的方法
                cbs.splice(i, 1)
                break
            }
        }
        return vm
    }

    // 触发事件 遍历调用事件对应的方法
    Vue.prototype.$emit = function(event: string): Component {
        const vm: Component = this
        // if (process.env.NODE_ENV !== 'production') {
        //     const lowerCaseEvent = event.toLowerCase()
        //     if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
        //         tip(
        //             `Event "${lowerCaseEvent}" is emitted in component ` +
        //             `${formatComponentName(vm)} but the handler is registered for "${event}". ` +
        //             `Note that HTML attributes are case-insensitive and you cannot use ` +
        //             `v-on to listen to camelCase events when using in-DOM templates. ` +
        //             `You should probably use "${hyphenate(event)}" instead of "${event}".`
        //         )
        //     }
        // }
        let cbs = vm._events[event]

        if (cbs) {
            cbs = cbs.length > 1 ? toArray(cbs) : cbs
            const args = toArray(arguments, 1)
            const info = `event handler for "${event}"`

            for (let i = 0, l = cbs.length; i < l; i++) {
                invokeWithErrorHandling(cbs[i], vm, args, vm, info)
            }
        }
        return vm
    }
}
