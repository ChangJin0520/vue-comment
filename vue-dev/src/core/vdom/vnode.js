/* @flow */
// VNode的构造函数 Chang-Jin 2019-11-18
export default class VNode {
    tag: string | void;
    data: VNodeData | void;
    children: ? Array<VNode> ;
    text: string | void;
    elm: Node | void;
    ns: string | void;
    context: Component | void; // rendered in this component's scope
    key: string | number | void;
    componentOptions: VNodeComponentOptions | void;
    componentInstance: Component | void; // component instance
    parent: VNode | void; // component placeholder node

    // strictly internal
    raw: boolean; // contains raw HTML? (server only)
    isStatic: boolean; // hoisted static node
    isRootInsert: boolean; // necessary for enter transition check
    isComment: boolean; // empty comment placeholder?
    isCloned: boolean; // is a cloned node?
    isOnce: boolean; // is a v-once node?
    asyncFactory: Function | void; // async component factory function
    asyncMeta: Object | void;
    isAsyncPlaceholder: boolean;
    ssrContext: Object | void;
    fnContext: Component | void; // real context vm for functional nodes
    fnOptions: ? ComponentOptions; // for SSR caching
    devtoolsMeta: ? Object; // used to store functional render context for devtools
    fnScopeId: ? string; // functional scope id support

    /**
     *Creates an instance of VNode.
     * @param {string} [tag] // 标签名
     * @param {VNodeData} [data] // 节点相关数据
     * @param {? Array<VNode>} [children] // 子节点对象数组
     * @param {string} [text] // 文本内容
     * @param {Node} [elm] // 原生节点元素
     * @param {Component} [context] // 元素所在的Vue实例
     * @param {VNodeComponentOptions} [componentOptions] // 自定义组件上部分组件属性
     * @param {Function} [asyncFactory]
     * @memberof VNode // 返回一个VNode实例对象
     */
    constructor(
        tag ?: string,
        data ?: VNodeData,
        children ?: ? Array<VNode> ,
        text ?: string,
        elm ?: Node,
        context ?: Component,
        componentOptions ?: VNodeComponentOptions,
        asyncFactory ?: Function
    ) {
        this.tag = tag // 标签名
        this.data = data // 结点相关属性数据
        this.children = children // 子节点
        this.text = text // 文本
        this.elm = elm // dom元素
        this.ns = undefined // 命名空间
        this.context = context // VNode所处Vue对象
        this.fnContext = undefined
        this.fnOptions = undefined
        this.fnScopeId = undefined
        this.key = data && data.key
        this.componentOptions = componentOptions // VNode对象如果对应的是一个自定义组件，componentOptions保存组件相关事件、props数据等
        this.componentInstance = undefined // VNode对象如果对应的是一个自定义组件，componentInstance保存相对应的vue实例
        this.parent = undefined // 当前自定义组件在父组件中的vnode
        this.raw = false // 包含原始HTML
        this.isStatic = false // 是否是静态内容
        this.isRootInsert = true
        this.isComment = false // 空注释占位符
        this.isCloned = false // 是否是clone的VNode对象
        this.isOnce = false // 是否是v-once元素的VNode对象
        this.asyncFactory = asyncFactory
        this.asyncMeta = undefined
        this.isAsyncPlaceholder = false
    }

    // DEPRECATED: alias for componentInstance for backwards compat.
    // 不推荐使用：向后兼容的componentInstance的别名。
    /* istanbul ignore next */
    get child(): Component | void {
        return this.componentInstance
    }
}

export const createEmptyVNode = (text: string = '') => {
    const node = new VNode()
    node.text = text
    node.isComment = true
    return node
}

export function createTextVNode(val: string | number) {
    return new VNode(undefined, undefined, undefined, String(val))
}

// optimized shallow clone
// used for static nodes and slot nodes because they may be reused across
// multiple renders, cloning them avoids errors when DOM manipulations rely
// on their elm reference.
// 优化的浅克隆
// 用于静态节点和插槽节点，
// 因为它们可以在多个渲染中重复使用，
// 克隆它们可以避免在DOM操作依赖于它们的elm参考时出错。
export function cloneVNode(vnode: VNode): VNode {
    const cloned = new VNode(
        vnode.tag,
        vnode.data,
        // #7975
        // clone children array to avoid mutating original in case of cloning
        // a child.
        vnode.children && vnode.children.slice(),
        vnode.text,
        vnode.elm,
        vnode.context,
        vnode.componentOptions,
        vnode.asyncFactory
    )
    cloned.ns = vnode.ns
    cloned.isStatic = vnode.isStatic
    cloned.key = vnode.key
    cloned.isComment = vnode.isComment
    cloned.fnContext = vnode.fnContext
    cloned.fnOptions = vnode.fnOptions
    cloned.fnScopeId = vnode.fnScopeId
    cloned.asyncMeta = vnode.asyncMeta
    cloned.isCloned = true
    return cloned
}
