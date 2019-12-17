/* @flow */

import {
    extend,
    warn,
    isObject
} from 'core/util/index'

/**
 * Runtime helper for rendering <slot>
 * render slot元素时的运行时助手
 */
export function renderSlot(
    name: string, // slot的那么属性值
    fallback: ? Array<VNode>, // 降级用的vnode数组
    props: ? Object, // slot的传参
    bindObject: ? Object // bind
): ? Array<VNode> {
    const scopedSlotFn = this.$scopedSlots[name]
    let nodes

    if (scopedSlotFn) { // scoped slot
        props = props || {}
        if (bindObject) {
            // if (process.env.NODE_ENV !== 'production' && !isObject(bindObject)) {
            //     warn(
            //         'slot v-bind without argument expects an Object',
            //         this
            //     )
            // }
            props = extend(extend({}, bindObject), props)
        }
        nodes = scopedSlotFn(props) || fallback
    } else {
        nodes = this.$slots[name] || fallback // 从$slot上获取slot的name随影的VNode
    }

    const target = props && props.slot

    if (target) {
        return this.$createElement('template', {
            slot: target
        }, nodes)
    } else {
        return nodes
    }
}
