/* @flow */

import config from '../config'
import VNode, {
    createEmptyVNode
} from './vnode'
import {
    createComponent
} from './create-component'
import {
    traverse
} from '../observer/traverse'

import {
    warn,
    isDef,
    isUndef,
    isTrue,
    isObject,
    isPrimitive,
    resolveAsset
} from '../util/index'

import {
    normalizeChildren,
    simpleNormalizeChildren
} from './helpers/index'
import { renderList } from '../instance/render-helpers/render-list'

const SIMPLE_NORMALIZE = 1
const ALWAYS_NORMALIZE = 2

// wrapper function for providing a more flexible interface
// without getting yelled at by flow
export function createElement(
    context: Component, // 当前的vm对象
    tag: any, // 标签名
    data: any, // 节点相关的属性
    children: any, // 子元素
    normalizationType: any, // 子元素归一化的处理的级别
    alwaysNormalize: boolean // 是否总是归一化处理
): VNode | Array<VNode> {

    // 判断是否有相关属性 没有属性 则向前取值
    if (Array.isArray(data) || isPrimitive(data)) {
        normalizationType = children
        children = data
        data = undefined
    }
    if (isTrue(alwaysNormalize)) {
        normalizationType = ALWAYS_NORMALIZE
    }
    return _createElement(context, tag, data, children, normalizationType)
}

export function _createElement(
    context: Component,
    tag ?: string | Class<Component> | Function | Object,
    data ?: VNodeData,
    children ?: any,
    normalizationType ?: number
): VNode | Array<VNode> {
    if (isDef(data) && isDef((data: any).__ob__)) {
        process.env.NODE_ENV !== 'production' && warn(
            `Avoid using observed data object as vnode data: ${JSON.stringify(data)}\n` +
            'Always create fresh vnode data objects in each render!',
            context
        )
        return createEmptyVNode()
    }
    // object syntax in v-bind
    if (isDef(data) && isDef(data.is)) {
        tag = data.is
    }

    // 判断tag是不是为空，如果为空则直接返回一个空的VNode Chang-Jin 2019-11-18
    if (!tag) {
        // in case of component :is set to falsy value
        return createEmptyVNode()
    }
    // warn against non-primitive key
    if (process.env.NODE_ENV !== 'production' &&
        isDef(data) && isDef(data.key) && !isPrimitive(data.key)
    ) {
        if (!__WEEX__ || !('@binding' in data.key)) {
            warn(
                'Avoid using non-primitive value as key, ' +
                'use string/number value instead.',
                context
            )
        }
    }
    // support single function children as default scoped slot
    // 子元素第一个参数为函数，则作为默认的slot Chang-Jin 2019-11-18
    if (Array.isArray(children) &&
        typeof children[0] === 'function'
    ) {
        data = data || {}
        data.scopedSlots = {
            default: children[0]
        }
        children.length = 0
    }

    // 对子元素进行归一化 Chang-Jin 2019-11-18
    if (normalizationType === ALWAYS_NORMALIZE) {
        children = normalizeChildren(children)
    } else if (normalizationType === SIMPLE_NORMALIZE) {
        children = simpleNormalizeChildren(children)
    }

    let vnode, ns

    if (typeof tag === 'string') {
        let Ctor
        ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag)
        // tag是字符串又是平台保留标签名。则直接创建VNode对象 Chang-Jin 2019-11-18
        if (config.isReservedTag(tag)) {
            // platform built-in elements
            if (process.env.NODE_ENV !== 'production' && isDef(data) && isDef(data.nativeOn)) {
                warn(
                    `The .native modifier for v-on is only valid on components but it was used on <${tag}>.`,
                    context
                )
            }
            vnode = new VNode(
                config.parsePlatformTagName(tag), data, children,
                undefined, undefined, context
            )

        // tag是字符串又定义了组件 Chang-Jin 2019-11-18
        } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
            // component
            vnode = createComponent(Ctor, data, context, children, tag)

        // tag是字符串，但既不是平台保留标签名，也不是components中的自定义标签 Chang-Jin 2019-11-18
        } else {
            // unknown or unlisted namespaced elements
            // check at runtime because it may get assigned a namespace when its
            // parent normalizes children
            vnode = new VNode(
                tag, data, children,
                undefined, undefined, context
            )
        }
    } else {
        // tag不是字符串 可能直接是一个Vue的子类 Chang-Jin 2019-11-18
        // new Vue({
        //     render: function(h) {
        //         return h(Vue.extend({
        //             template: '<div>test</div>'
        //         }))
        //     }
        // }).$mount('#app')
        // direct component options / constructor
        vnode = createComponent(tag, data, context, children)
    }
    if (Array.isArray(vnode)) {
        return vnode
    } else if (isDef(vnode)) {
        if (isDef(ns)) applyNS(vnode, ns)
        if (isDef(data)) registerDeepBindings(data)
        return vnode
    } else {
        return createEmptyVNode()
    }
}

function applyNS(vnode, ns, force) {
    vnode.ns = ns
    if (vnode.tag === 'foreignObject') {
        // use default namespace inside foreignObject
        ns = undefined
        force = true
    }
    if (isDef(vnode.children)) {
        for (let i = 0, l = vnode.children.length; i < l; i++) {
            const child = vnode.children[i]
            if (isDef(child.tag) && (
                    isUndef(child.ns) || (isTrue(force) && child.tag !== 'svg'))) {
                applyNS(child, ns, force)
            }
        }
    }
}

// ref #5318
// necessary to ensure parent re-render when deep bindings like :style and
// :class are used on slot nodes
function registerDeepBindings(data) {
    if (isObject(data.style)) {
        traverse(data.style)
    }
    if (isObject(data.class)) {
        traverse(data.class)
    }
}
