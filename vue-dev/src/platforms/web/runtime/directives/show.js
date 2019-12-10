/* @flow */

import {
    enter,
    leave
} from '../modules/transition'

// recursively search for possible transition defined inside the component root
// 递归搜索组件根内部定义的可能过渡
function locateNode(vnode: VNode): VNodeWithData {
    return vnode.componentInstance && (!vnode.data || !vnode.data.transition) ?
        locateNode(vnode.componentInstance._vnode) :
        vnode
}

export default {
    bind(el: any, {
        value
    }: VNodeDirective, vnode: VNodeWithData) {
        vnode = locateNode(vnode)

        const transition = vnode.data && vnode.data.transition // 用来判断时候添加过渡效果
        const originalDisplay = el.__vOriginalDisplay =
            el.style.display === 'none' ? '' : el.style.display // 保存元素bind时display的值

        // 如果指令值为true 且有过渡效果 则执行动画效果 然后设置元素display的值
        // 否则根据值 设置显示 隐藏
        if (value && transition) {
            vnode.data.show = true

            enter(vnode, () => {
                el.style.display = originalDisplay
            })
        } else {
            el.style.display = value ? originalDisplay : 'none'
        }
    },

    update(el: any, {
        value,
        oldValue
    }: VNodeDirective, vnode: VNodeWithData) {
        /* istanbul ignore if */
        if (!value === !oldValue) return

        vnode = locateNode(vnode)

        const transition = vnode.data && vnode.data.transition

        // 更新的时候 存在过渡 则根据值调用enter leave效果
        // 否则根据值 设置显示 隐藏
        if (transition) {
            vnode.data.show = true

            if (value) {
                enter(vnode, () => {
                    el.style.display = el.__vOriginalDisplay
                })
            } else {
                leave(vnode, () => {
                    el.style.display = 'none'
                })
            }
        } else {
            el.style.display = value ? el.__vOriginalDisplay : 'none'
        }
    },

    unbind(
        el: any,
        binding: VNodeDirective,
        vnode: VNodeWithData,
        oldVnode: VNodeWithData,
        isDestroy: boolean
    ) {
        // 如果不是销毁就设置元素display为初始状态
        if (!isDestroy) {
            el.style.display = el.__vOriginalDisplay
        }
    }
}
