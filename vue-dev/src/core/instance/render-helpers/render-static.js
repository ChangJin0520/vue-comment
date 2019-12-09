/* @flow */

/**
 * Runtime helper for rendering static trees.
 */
/**
 * 渲染静态内容
 *
 * @export
 * @param {number} index 索引值 指向最终生成的staticRenderFns数组中对应的内容
 * @param {boolean} isInFor 标识元素是否包裹在for循环中
 * @returns {(VNode | Array<VNode>)}
 */
export function renderStatic(
    index: number,
    isInFor: boolean
): VNode | Array<VNode> {
    const cached = this._staticTrees || (this._staticTrees = [])
    let tree = cached[index]

    // if has already-rendered static tree and not inside v-for,
    // we can reuse the same tree.
    // 如果已经渲染了静态树并且不在v-for中，
    // 我们可以重用同一棵树。
    if (tree && !isInFor) {
        return tree
    }

    // otherwise, render a fresh tree.
    // 否则，重新渲染树。
    tree = cached[index] = this.$options.staticRenderFns[index].call(
        this._renderProxy,
        null,
        this // for render fns generated for functional component templates
    )

    markStatic(tree, `__static__${index}`, false)
    return tree
}

/**
 * Runtime helper for v-once.
 * Effectively it means marking the node as static with a unique key.
 * v-once的运行时帮助程序。
 * 实际上，这意味着使用唯一key将节点标记为静态。
 */
export function markOnce( // markOnce其实就是给vnode添加了key, 同时给isStatic, isOnce赋值为true
    tree: VNode | Array<VNode> ,
    index: number,
    key: string
) {
    // `__once__${index}${key ? `_${key}` : ``}` 使用index和key 拼接出一个唯一key
    markStatic(tree, `__once__${index}${key ? `_${key}` : ``}`, true)
    return tree
}

function markStatic(
    tree: VNode | Array<VNode> ,
    key: string,
    isOnce: boolean
) {
    if (Array.isArray(tree)) {
        for (let i = 0; i < tree.length; i++) {
            if (tree[i] && typeof tree[i] !== 'string') {
                markStaticNode(tree[i], `${key}_${i}`, isOnce)
            }
        }
    } else {
        markStaticNode(tree, key, isOnce)
    }
}

function markStaticNode(node, key, isOnce) {
    node.isStatic = true
    node.key = key
    node.isOnce = isOnce
}
