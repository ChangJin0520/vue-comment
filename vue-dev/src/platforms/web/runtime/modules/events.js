/* @flow */

import {
    isDef,
    isUndef
} from 'shared/util'
import {
    updateListeners
} from 'core/vdom/helpers/index'
import {
    isIE,
    isFF,
    supportsPassive,
    isUsingMicroTask
} from 'core/util/index'
import {
    RANGE_TOKEN,
    CHECKBOX_RADIO_TOKEN
} from 'web/compiler/directives/model'
import {
    currentFlushTimestamp
} from 'core/observer/scheduler'

// normalize v-model event tokens that can only be determined at runtime.
// it's important to place the event as the first in the array because
// the whole point is ensuring the v-model callback gets called before
// user-attached handlers.
// 规范只能在运行时确定的v-model事件tokens。
// 重要的是，将事件放置在数组中的第一个位置，因为整个point是确保在用户附加的处理程序之前调用v-model回调。
function normalizeEvents(on) {
    /* istanbul ignore if */
    if (isDef(on[RANGE_TOKEN])) {
        // IE input[type=range] only supports `change` event
        // IE的range值支持change事件
        const event = isIE ? 'change' : 'input'

        on[event] = [].concat(on[RANGE_TOKEN], on[event] || [])
        delete on[RANGE_TOKEN]
    }
    // This was originally intended to fix #4521 but no longer necessary
    // after 2.5. Keeping it for backwards compat with generated code from < 2.4
    // 最初旨在修复#4521，但在2.5之后不再需要。 
    // 与<2.4生成的代码保持向后兼容
    /* istanbul ignore if */
    if (isDef(on[CHECKBOX_RADIO_TOKEN])) {
        on.change = [].concat(on[CHECKBOX_RADIO_TOKEN], on.change || [])
        delete on[CHECKBOX_RADIO_TOKEN]
    }
}

let target: any

// once的处理就是 在调用之后 remove掉时间 Chang-Jin 2019-11-28
function createOnceHandler(event, handler, capture) {
    const _target = target // save current target element in closure
    return function onceHandler() {
        const res = handler.apply(null, arguments)
        if (res !== null) {
            remove(event, onceHandler, capture, _target)
        }
    }
}

// #9446: Firefox <= 53 (in particular, ESR 52) has incorrect Event.timeStamp
// implementation and does not fire microtasks in between event propagation, so
// safe to exclude.
const useMicrotaskFix = isUsingMicroTask && !(isFF && Number(isFF[1]) <= 53)

// 给元素添加事件
function add(
    name: string,
    handler: Function,
    capture: boolean,
    passive: boolean
) {
    // async edge case #6566: inner click event triggers patch, event handler
    // attached to outer element during patch, and triggered again. This
    // happens because browsers fire microtask ticks between event propagation.
    // the solution is simple: we save the timestamp when a handler is attached,
    // and the handler would only fire if the event passed to it was fired
    // AFTER it was attached.
    // 异步边缘情况#6566：内部点击事件触发补丁，事件处理程序在补丁期间附加到外部元素，然后再次触发。 
    // 发生这种情况是因为浏览器在事件传播之间触发了微任务滴答。
    // 解决方案很简单：我们在附加处理程序时保存时间戳，只有当传递给它的事件在附加后触发时，处理程序才会触发。
    if (useMicrotaskFix) {
        const attachedTimestamp = currentFlushTimestamp
        const original = handler
        handler = original._wrapper = function(e) {
            if (
                // no bubbling, should always fire.
                // this is just a safety net in case event.timeStamp is unreliable in
                // certain weird environments...
                // 不得冒泡，应始终开火。
                // 这只是意外事件的safety net。timeStamp在某些奇怪的环境中不可靠...
                e.target === e.currentTarget ||
                // event is fired after handler attachment
                // 处理程序附加后触发事件
                e.timeStamp >= attachedTimestamp ||
                // bail for environments that have buggy event.timeStamp implementations
                // #9462 iOS 9 bug: event.timeStamp is 0 after history.pushState
                // #9681 QtWebEngine event.timeStamp is negative value
                // 为具有bug event.timeStamp实现的环境保释
                // #9462 iOS 9错误：history.pushState之后event.timeStamp为0
                // #9681 QtWebEngine event.timeStamp为负值
                e.timeStamp <= 0 ||
                // #9448 bail if event is fired in another document in a multi-page
                // electron/nw.js app, since event.timeStamp will be using a different
                // starting reference
                // ＃9448如果在多页electron/nw.js应用程序的另一个文档中触发了事件，则保释
                // 因为event.timeStamp将使用不同的起始引用
                e.target.ownerDocument !== document
            ) {
                return original.apply(this, arguments)
            }
        }
    }
    target.addEventListener(
        name,
        handler,
        supportsPassive ?
        {
            capture,
            passive
        } :
        capture
    )
}

// 销毁事件
function remove(
    name: string,
    handler: Function,
    capture: boolean,
    _target ?: HTMLElement
) {
    (_target || target).removeEventListener(
        name,
        handler._wrapper || handler,
        capture
    )
}

function updateDOMListeners(oldVnode: VNodeWithData, vnode: VNodeWithData) {
    if (isUndef(oldVnode.data.on) && isUndef(vnode.data.on)) {
        return
    }
    const on = vnode.data.on || {}
    const oldOn = oldVnode.data.on || {}
    target = vnode.elm
    normalizeEvents(on)
    updateListeners(on, oldOn, add, remove, createOnceHandler, vnode.context)
    target = undefined
}

export default {
    create: updateDOMListeners,
    update: updateDOMListeners
}
