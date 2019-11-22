/**
 * Virtual DOM patching algorithm based on Snabbdom by
 * Simon Friis Vindum (@paldepind)
 * Licensed under the MIT License
 * https://github.com/paldepind/snabbdom/blob/master/LICENSE
 *
 * modified by Evan You (@yyx990803)
 *
 * Not type-checking this because this file is perf-critical and the cost
 * of making flow understand it is not worth it.
 */

import VNode, {
    cloneVNode
} from './vnode'
import config from '../config'
import {
    SSR_ATTR
} from 'shared/constants'
import {
    registerRef
} from './modules/ref'
import {
    traverse
} from '../observer/traverse'
import {
    activeInstance
} from '../instance/lifecycle'
import {
    isTextInputType
} from 'web/util/element'

import {
    warn,
    isDef,
    isUndef,
    isTrue,
    makeMap,
    isRegExp,
    isPrimitive
} from '../util/index'

export const emptyNode = new VNode('', {}, [])

const hooks = ['create', 'activate', 'update', 'remove', 'destroy']

// 判断两个vnode是否可以复用为一个节点 Chang-Jin 2019-11-21
function sameVnode(a, b) {
    return (
        a.key === b.key && (
            (
                a.tag === b.tag &&
                a.isComment === b.isComment &&
                isDef(a.data) === isDef(b.data) &&
                sameInputType(a, b)
            ) || (
                isTrue(a.isAsyncPlaceholder) &&
                a.asyncFactory === b.asyncFactory &&
                isUndef(b.asyncFactory.error)
            )
        )
    )
}

function sameInputType(a, b) {
    if (a.tag !== 'input') return true
    let i
    const typeA = isDef(i = a.data) && isDef(i = i.attrs) && i.type
    const typeB = isDef(i = b.data) && isDef(i = i.attrs) && i.type
    return typeA === typeB || isTextInputType(typeA) && isTextInputType(typeB)
}

function createKeyToOldIndex(children, beginIndex, endIndex) {
    let i, key
    const map = {}
    for (i = beginIndex; i <= endIndex; ++i) {
        key = children[i].key
        if (isDef(key)) map[key] = i
    }
    return map
}

export function createPatchFunction(backend) {
    let i, j
    const cbs = {}

    const {
        modules,
        nodeOps
    } = backend

    for (i = 0; i < hooks.length; ++i) {
        cbs[hooks[i]] = []
        for (j = 0; j < modules.length; ++j) {
            if (isDef(modules[j][hooks[i]])) {
                cbs[hooks[i]].push(modules[j][hooks[i]])
            }
        }
    }

    // 创建一个div元素对应的最简单的vnode实例
    function emptyNodeAt(elm) {
        return new VNode(nodeOps.tagName(elm).toLowerCase(), {}, [], undefined, elm)
    }

    function createRmCb(childElm, listeners) {
        function remove() {
            if (--remove.listeners === 0) {
                removeNode(childElm)
            }
        }
        remove.listeners = listeners
        return remove
    }

    function removeNode(el) {
        const parent = nodeOps.parentNode(el)
        // element may have already been removed due to v-html / v-text
        if (isDef(parent)) {
            nodeOps.removeChild(parent, el)
        }
    }

    function isUnknownElement(vnode, inVPre) {
        return (
            !inVPre &&
            !vnode.ns &&
            !(
                config.ignoredElements.length &&
                config.ignoredElements.some(ignore => {
                    return isRegExp(ignore) ?
                        ignore.test(vnode.tag) :
                        ignore === vnode.tag
                })
            ) &&
            config.isUnknownElement(vnode.tag)
        )
    }

    let creatingElmInVPre = 0

    /**
     * 生产一个DOM元素
     *
     * @param {*} vnode 当前元素的VNode对象
     * @param {*} insertedVnodeQueue
     * @param {*} parentElm 原节点的父节点
     * @param {*} refElm 原节点的后一个节点
     * @param {*} nested
     * @param {*} ownerArray
     * @param {*} index
     */
    function createElm(
        vnode,
        insertedVnodeQueue,
        parentElm,
        refElm,
        nested,
        ownerArray,
        index
    ) {
        if (isDef(vnode.elm) && isDef(ownerArray)) {
            // This vnode was used in a previous render!
            // now it's used as a new node, overwriting its elm would cause
            // potential patch errors down the road when it's used as an insertion
            // reference node. Instead, we clone the node on-demand before creating
            // associated DOM element for it.
            vnode = ownerArray[index] = cloneVNode(vnode)
        }

        vnode.isRootInsert = !nested // for transition enter check
        // 如果当前vnode是一个组件，createComponent方法会初始化该组件，并最终返回true，否则返回undefined。
        if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
            return
        }

        const data = vnode.data
        const children = vnode.children
        const tag = vnode.tag
        if (isDef(tag)) {
            if (process.env.NODE_ENV !== 'production') {
                if (data && data.pre) {
                    creatingElmInVPre++
                }
                if (isUnknownElement(vnode, creatingElmInVPre)) {
                    warn(
                        'Unknown custom element: <' + tag + '> - did you ' +
                        'register the component correctly? For recursive components, ' +
                        'make sure to provide the "name" option.',
                        vnode.context
                    )
                }
            }

            // vnode.elm指向真实创建的dom元素
            vnode.elm = vnode.ns ?
                nodeOps.createElementNS(vnode.ns, tag) :
                nodeOps.createElement(tag, vnode)

            // 在使用scoped CSS时，给元素添加相应的属性
            setScope(vnode)

            /* istanbul ignore if */
            if (__WEEX__) {
                // in Weex, the default insertion order is parent-first.
                // List items can be optimized to use children-first insertion
                // with append="tree".
                const appendAsTree = isDef(data) && isTrue(data.appendAsTree)
                if (!appendAsTree) {
                    if (isDef(data)) {
                        invokeCreateHooks(vnode, insertedVnodeQueue)
                    }
                    insert(parentElm, vnode.elm, refElm)
                }
                createChildren(vnode, children, insertedVnodeQueue)
                if (appendAsTree) {
                    if (isDef(data)) {
                        // 调用创建时的一些钩子函数
                        invokeCreateHooks(vnode, insertedVnodeQueue)
                    }

                    // 当前元素插入到父级元素中
                    insert(parentElm, vnode.elm, refElm)
                }
            } else {
                createChildren(vnode, children, insertedVnodeQueue)
                if (isDef(data)) {
                    invokeCreateHooks(vnode, insertedVnodeQueue)
                }
                insert(parentElm, vnode.elm, refElm)
            }

            if (process.env.NODE_ENV !== 'production' && data && data.pre) {
                creatingElmInVPre--
            }
        } else if (isTrue(vnode.isComment)) {
            vnode.elm = nodeOps.createComment(vnode.text)
            insert(parentElm, vnode.elm, refElm)
        } else {
            vnode.elm = nodeOps.createTextNode(vnode.text)
            insert(parentElm, vnode.elm, refElm)
        }
    }

    function createComponent(vnode, insertedVnodeQueue, parentElm, refElm) {
        let i = vnode.data
        if (isDef(i)) {
            const isReactivated = isDef(vnode.componentInstance) && i.keepAlive
            if (isDef(i = i.hook) && isDef(i = i.init)) {
                i(vnode, false /* hydrating */ )
            }
            // after calling the init hook, if the vnode is a child component
            // it should've created a child instance and mounted it. the child
            // component also has set the placeholder vnode's elm.
            // in that case we can just return the element and be done.
            if (isDef(vnode.componentInstance)) {
                initComponent(vnode, insertedVnodeQueue)
                insert(parentElm, vnode.elm, refElm)
                if (isTrue(isReactivated)) {
                    reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm)
                }
                return true
            }
        }
    }

    function initComponent(vnode, insertedVnodeQueue) {
        if (isDef(vnode.data.pendingInsert)) {
            insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert)
            vnode.data.pendingInsert = null
        }
        vnode.elm = vnode.componentInstance.$el
        if (isPatchable(vnode)) {
            invokeCreateHooks(vnode, insertedVnodeQueue)
            setScope(vnode)
        } else {
            // empty component root.
            // skip all element-related modules except for ref (#3455)
            registerRef(vnode)
            // make sure to invoke the insert hook
            insertedVnodeQueue.push(vnode)
        }
    }

    function reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm) {
        let i
        // hack for #4339: a reactivated component with inner transition
        // does not trigger because the inner node's created hooks are not called
        // again. It's not ideal to involve module-specific logic in here but
        // there doesn't seem to be a better way to do it.
        let innerNode = vnode
        while (innerNode.componentInstance) {
            innerNode = innerNode.componentInstance._vnode
            if (isDef(i = innerNode.data) && isDef(i = i.transition)) {
                for (i = 0; i < cbs.activate.length; ++i) {
                    cbs.activate[i](emptyNode, innerNode)
                }
                insertedVnodeQueue.push(innerNode)
                break
            }
        }
        // unlike a newly created component,
        // a reactivated keep-alive component doesn't insert itself
        insert(parentElm, vnode.elm, refElm)
    }

    function insert(parent, elm, ref) {
        if (isDef(parent)) {
            if (isDef(ref)) {
                if (nodeOps.parentNode(ref) === parent) {
                    nodeOps.insertBefore(parent, elm, ref)
                }
            } else {
                nodeOps.appendChild(parent, elm)
            }
        }
    }

    function createChildren(vnode, children, insertedVnodeQueue) {
        // 先判断了children是不是数组，如果是则循环递归调用createElm方法创建每一个子元素
        if (Array.isArray(children)) {
            if (process.env.NODE_ENV !== 'production') {
                checkDuplicateKeys(children)
            }
            for (let i = 0; i < children.length; ++i) {
                createElm(children[i], insertedVnodeQueue, vnode.elm, null, true, children, i)
            }
        } else if (isPrimitive(vnode.text)) { // 若vnode.text是字符串或数字，也就是说当前节点是文本节点，则直接添加到vnode.elm上
            nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)))
        }
    }

    function isPatchable(vnode) {
        while (vnode.componentInstance) {
            vnode = vnode.componentInstance._vnode
        }
        return isDef(vnode.tag)
    }

    function invokeCreateHooks(vnode, insertedVnodeQueue) {
        for (let i = 0; i < cbs.create.length; ++i) {
            cbs.create[i](emptyNode, vnode)
        }
        i = vnode.data.hook // Reuse variable
        if (isDef(i)) {
            if (isDef(i.create)) i.create(emptyNode, vnode)
            if (isDef(i.insert)) insertedVnodeQueue.push(vnode)
        }
    }

    // set scope id attribute for scoped CSS.
    // this is implemented as a special case to avoid the overhead
    // of going through the normal attribute patching process.
    function setScope(vnode) {
        let i
        if (isDef(i = vnode.fnScopeId)) {
            nodeOps.setStyleScope(vnode.elm, i)
        } else {
            let ancestor = vnode
            while (ancestor) {
                if (isDef(i = ancestor.context) && isDef(i = i.$options._scopeId)) {
                    nodeOps.setStyleScope(vnode.elm, i)
                }
                ancestor = ancestor.parent
            }
        }
        // for slot content they should also get the scopeId from the host instance.
        if (isDef(i = activeInstance) &&
            i !== vnode.context &&
            i !== vnode.fnContext &&
            isDef(i = i.$options._scopeId)
        ) {
            nodeOps.setStyleScope(vnode.elm, i)
        }
    }

    /**
     * 添加节点的e父元素中
     *
     * @param {*} parentElm 父元素
     * @param {*} refElm 插入位置后一位元素
     * @param {*} vnodes 一组节点
     * @param {*} startIndex 从哪个节点开始
     * @param {*} endIndex 到哪个节点结束
     * @param {*} insertedVnodeQueue
     */
    function addVnodes(parentElm, refElm, vnodes, startIndex, endIndex, insertedVnodeQueue) {
        for (; startIndex <= endIndex; ++startIndex) {
            createElm(vnodes[startIndex], insertedVnodeQueue, parentElm, refElm, false, vnodes, startIndex)
        }
    }

    function invokeDestroyHook(vnode) {
        let i, j
        const data = vnode.data
        if (isDef(data)) {
            if (isDef(i = data.hook) && isDef(i = i.destroy)) i(vnode)
            for (i = 0; i < cbs.destroy.length; ++i) cbs.destroy[i](vnode)
        }
        if (isDef(i = vnode.children)) {
            for (j = 0; j < vnode.children.length; ++j) {
                invokeDestroyHook(vnode.children[j])
            }
        }
    }

    // 移除Vnode
    function removeVnodes(vnodes, startIndex, endIndex) {
        for (; startIndex <= endIndex; ++startIndex) {
            const ch = vnodes[startIndex]
            if (isDef(ch)) {
                if (isDef(ch.tag)) {
                    removeAndInvokeRemoveHook(ch)
                    invokeDestroyHook(ch)
                } else { // Text node
                    removeNode(ch.elm)
                }
            }
        }
    }

    function removeAndInvokeRemoveHook(vnode, rm) {
        if (isDef(rm) || isDef(vnode.data)) {
            let i
            const listeners = cbs.remove.length + 1
            if (isDef(rm)) {
                // we have a recursively passed down rm callback
                // increase the listeners count
                rm.listeners += listeners
            } else {
                // directly removing
                rm = createRmCb(vnode.elm, listeners)
            }
            // recursively invoke hooks on child component root node
            if (isDef(i = vnode.componentInstance) && isDef(i = i._vnode) && isDef(i.data)) {
                removeAndInvokeRemoveHook(i, rm)
            }
            for (i = 0; i < cbs.remove.length; ++i) {
                cbs.remove[i](vnode, rm)
            }
            if (isDef(i = vnode.data.hook) && isDef(i = i.remove)) {
                i(vnode, rm)
            } else {
                rm()
            }
        } else {
            removeNode(vnode.elm)
        }
    }


    /**
     * 新旧节点都有子节点的时候 如何复用节点
     *
     * @param {*} parentElm 父元素
     * @param {*} oldChild // 旧节点的子节点
     * @param {*} newChild // 新节点的子节点
     * @param {*} insertedVnodeQueue
     * @param {*} removeOnly
     */
    function updateChildren(parentElm, oldChild, newChild, insertedVnodeQueue, removeOnly) {
        let oldStartIndex = 0
        let newStartIndex = 0
        let oldEndIndex = oldChild.length - 1
        let newEndIndex = newChild.length - 1

        let oldStartVnode = oldChild[0]
        let newStartVnode = newChild[0]
        let oldEndVnode = oldChild[oldEndIndex]
        let newEndVnode = newChild[newEndIndex]

        let oldKeyToIndex, indexInOld, vnodeToMove, refElm

        // removeOnly is a special flag used only by <transition-group>
        // to ensure removed elements stay in correct relative positions
        // during leaving transitions
        // removeOnly是一个特殊标志，仅由<transition-group>使用
        // 确保在离开过渡期间被移除的元素保持在正确的相对位置
        const canMove = !removeOnly

        if (process.env.NODE_ENV !== 'production') {
            checkDuplicateKeys(newChild)
        }

        // 旧子节点数组 或 新子节点数组遍历结束后停止
        while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
            if (isUndef(oldStartVnode)) { // 头为空
                // oldStartVnode往后取
                oldStartVnode = oldChild[++oldStartIndex] // Vnode has been moved left
            } else if (isUndef(oldEndVnode)) { // 尾为空
                // oldEndVnode往前取
                oldEndVnode = oldChild[--oldEndIndex]
            } else if (sameVnode(oldStartVnode, newStartVnode)) { // 头头比较
                // 判断新旧起始子节点是否一样 如果一样 则复用dom元素并递归比较子节点
                patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue, newChild, newStartIndex)

                // 复用dom元素后 更新新旧开始节点
                oldStartVnode = oldChild[++oldStartIndex]
                newStartVnode = newChild[++newStartIndex]
            } else if (sameVnode(oldEndVnode, newEndVnode)) { // 尾尾比较
                // 判断新旧结束子节点是否一样 如果一样 则复用dom元素并递归比较子节点
                patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, newChild, newEndIndex)

                // 复用dom元素后 更新新旧结束节点
                oldEndVnode = oldChild[--oldEndIndex]
                newEndVnode = newChild[--newEndIndex]
            } else if (sameVnode(oldStartVnode, newEndVnode)) { // 头尾比较 // Vnode moved right
                // 判断旧开始节点 和 新结束节点是否一样 如果一样 则复用dom元素并递归比较子节点
                patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue, newChild, newEndIndex)

                canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm))

                // 复用dom元素后 更新旧开始节点 和 新结束节点
                oldStartVnode = oldChild[++oldStartIndex]
                newEndVnode = newChild[--newEndIndex]
            } else if (sameVnode(oldEndVnode, newStartVnode)) { // 尾头比较 // Vnode moved left
                // 判断旧结束节点 和 新开始节点是否一样 如果一样 则复用dom元素并递归比较子节点
                patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue, newChild, newStartIndex)

                canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm)

                // 复用dom元素后 更新旧结束节点 和 新开始节点
                oldEndVnode = oldChild[--oldEndIndex]
                newStartVnode = newChild[++newStartIndex]
            } else { // 上述情况都不满足 根据key值来复用元素
                if (isUndef(oldKeyToIndex)) {
                    // 遍历oldChild数组，找出其中有key的对象
                    // 以key为键，索引值为value，生成新的对象oldKeyToIndex
                    oldKeyToIndex = createKeyToOldIndex(oldChild, oldStartIndex, oldEndIndex)
                }

                // 查询新开始节点newStartVnode是否有key值
                // 查找oldChild是否有相同的key 并取其index值
                indexInOld = isDef(newStartVnode.key) ?
                    oldKeyToIndex[newStartVnode.key] :
                    findIndexInOld(newStartVnode, oldChild, oldStartIndex, oldEndIndex)

                // 如果newStartVnode不在oldChild中 则创建新元素
                if (isUndef(indexInOld)) { // New element
                    // 注意此处第四个参数传的是oldStartVnode.elm 所以newStartVnode对应的新元素会插入到其之前
                    createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newChild, newStartIndex)
                } else { // newStartVnode在oldChild中
                    vnodeToMove = oldChild[indexInOld] // 从oldChild中取出对应的对应的oldVnode

                    // 如果节点相同
                    if (sameVnode(vnodeToMove, newStartVnode)) {
                        // 复用dom元素 继续递归比较子节点
                        patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue, newChild, newStartIndex)

                        // 重置oldChild中相对于的元素为undefined
                        oldChild[indexInOld] = undefined

                        canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm)
                    } else { // 如果节点不同
                        // same key but different element. treat as new element
                        // 相同的key值 但是是不同的节点
                        // 调用createElm方法创建新元素
                        createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newChild, newStartIndex)
                    }
                }

                // 更新newStartVnode
                newStartVnode = newChild[++newStartIndex]
            }
        }

        // 删除无用的旧结点的操作
        if (oldStartIndex > oldEndIndex) { // oldChild中的元素全部复用
            refElm = isUndef(newChild[newEndIndex + 1]) ? null : newChild[newEndIndex + 1].elm
            // 依次把newStartIdx和newEndIdx之间的元素插入到相应的位置
            addVnodes(parentElm, refElm, newChild, newStartIndex, newEndIndex, insertedVnodeQueue)
        } else if (newStartIndex > newEndIndex) { // newCh中的元素全部复用
            // 依次删除oldStartIdx和oldEndIdx之间的元素
            removeVnodes(oldChild, oldStartIndex, oldEndIndex)
        }
    }

    function checkDuplicateKeys(children) {
        const seenKeys = {}
        for (let i = 0; i < children.length; i++) {
            const vnode = children[i]
            const key = vnode.key
            if (isDef(key)) {
                if (seenKeys[key]) {
                    warn(
                        `Duplicate keys detected: '${key}'. This may cause an update error.`,
                        vnode.context
                    )
                } else {
                    seenKeys[key] = true
                }
            }
        }
    }

    function findIndexInOld(node, oldChild, start, end) {
        for (let i = start; i < end; i++) {
            const c = oldChild[i]
            if (isDef(c) && sameVnode(node, c)) return i
        }
    }

    /**
     * 复用节点
     *
     * @param {*} oldVnode 旧节点
     * @param {*} vnode 新节点
     * @param {*} insertedVnodeQueue
     * @param {*} ownerArray 新节点所属数组
     * @param {*} index 新节点在数组中的索引
     * @param {*} removeOnly
     */
    function patchVnode(
        oldVnode,
        vnode,
        insertedVnodeQueue,
        ownerArray,
        index,
        removeOnly
    ) {
        if (oldVnode === vnode) {
            return
        }

        if (isDef(vnode.elm) && isDef(ownerArray)) {
            // clone reused vnode
            vnode = ownerArray[index] = cloneVNode(vnode)
        }

        // vnode对应的dom指向oldVnode的dom
        const elm = vnode.elm = oldVnode.elm

        if (isTrue(oldVnode.isAsyncPlaceholder)) {
            if (isDef(vnode.asyncFactory.resolved)) {
                hydrate(oldVnode.elm, vnode, insertedVnodeQueue)
            } else {
                vnode.isAsyncPlaceholder = true
            }
            return
        }

        // reuse element for static trees.
        // note we only do this if the vnode is cloned -
        // if the new node is not cloned it means the render functions have been
        // reset by the hot-reload-api and we need to do a proper re-render.
        // 静态树的重用元素。
        // 请注意，只有在克隆了vnode的情况下，我们才这样做
        // 如果未克隆新的节点，则意味着渲染功能已由hot-reload-api重置
        // 我们需要进行适当的重新渲染。
        if (isTrue(vnode.isStatic) &&
            isTrue(oldVnode.isStatic) &&
            vnode.key === oldVnode.key &&
            (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
        ) {
            vnode.componentInstance = oldVnode.componentInstance
            return
        }

        let i
        const data = vnode.data

        // // 调用prepatch钩子函数
        if (isDef(data) && isDef(i = data.hook) && isDef(i = i.prepatch)) {
            i(oldVnode, vnode)
        }

        // 分别获取oldVnode和vnode的子元素
        const oldChild = oldVnode.children
        const ch = vnode.children

        if (isDef(data) && isPatchable(vnode)) {
            // 更新元素上相关各种属性
            for (i = 0; i < cbs.update.length; ++i) {
                cbs.update[i](oldVnode, vnode)
            }

            // 调用update钩子函数
            if (isDef(i = data.hook) && isDef(i = i.update)) {
                i(oldVnode, vnode)
            }
        }

        // 新节点不是文本节点
        if (isUndef(vnode.text)) {
            if (isDef(oldChild) && isDef(ch)) { // 新旧节点都存在子元素
                // 子元素不相同则调用updateChildren来更新子元素
                if (oldChild !== ch) {
                    updateChildren(elm, oldChild, ch, insertedVnodeQueue, removeOnly)
                }
            } else if (isDef(ch)) { // 只有新节点存在子元素
                if (process.env.NODE_ENV !== 'production') {
                    checkDuplicateKeys(ch)
                }

                // 如果旧节点是文本节点则置空
                if (isDef(oldVnode.text)) {
                    nodeOps.setTextContent(elm, '')
                }

                // 把ch中的元素依次添加到elm中
                addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue)
            } else if (isDef(oldChild)) { // 只有旧节点存在子元素
                // 删除旧节点的子元素
                removeVnodes(oldChild, 0, oldChild.length - 1)
            } else if (isDef(oldVnode.text)) { // 新旧节点都不存在子元素 但旧节点是一个文本节点
                // 直接内容置空
                nodeOps.setTextContent(elm, '')
            }
        } else if (oldVnode.text !== vnode.text) { // 如果新节点是文本节点，且与旧节点文本不同，则直接修改文本内容
            nodeOps.setTextContent(elm, vnode.text)
        }

        // 调用postpatch钩子函数
        if (isDef(data)) {
            if (isDef(i = data.hook) && isDef(i = i.postpatch)) i(oldVnode, vnode)
        }
    }

    function invokeInsertHook(vnode, queue, initial) {
        // delay insert hooks for component root nodes, invoke them after the
        // element is really inserted
        if (isTrue(initial) && isDef(vnode.parent)) {
            vnode.parent.data.pendingInsert = queue
        } else {
            for (let i = 0; i < queue.length; ++i) {
                queue[i].data.hook.insert(queue[i])
            }
        }
    }

    let hydrationBailed = false
    // list of modules that can skip create hook during hydration because they
    // are already rendered on the client or has no need for initialization
    // Note: style is excluded because it relies on initial clone for future
    // deep updates (#7063).
    const isRenderedModule = makeMap('attrs,class,staticClass,staticStyle,key')

    // Note: this is a browser-only function so we can assume elms are DOM nodes.
    function hydrate(elm, vnode, insertedVnodeQueue, inVPre) {
        let i
        const {
            tag,
            data,
            children
        } = vnode
        inVPre = inVPre || (data && data.pre)
        vnode.elm = elm

        if (isTrue(vnode.isComment) && isDef(vnode.asyncFactory)) {
            vnode.isAsyncPlaceholder = true
            return true
        }
        // assert node match
        if (process.env.NODE_ENV !== 'production') {
            if (!assertNodeMatch(elm, vnode, inVPre)) {
                return false
            }
        }
        if (isDef(data)) {
            if (isDef(i = data.hook) && isDef(i = i.init)) i(vnode, true /* hydrating */ )
            if (isDef(i = vnode.componentInstance)) {
                // child component. it should have hydrated its own tree.
                initComponent(vnode, insertedVnodeQueue)
                return true
            }
        }
        if (isDef(tag)) {
            if (isDef(children)) {
                // empty element, allow client to pick up and populate children
                if (!elm.hasChildNodes()) {
                    createChildren(vnode, children, insertedVnodeQueue)
                } else {
                    // v-html and domProps: innerHTML
                    if (isDef(i = data) && isDef(i = i.domProps) && isDef(i = i.innerHTML)) {
                        if (i !== elm.innerHTML) {
                            /* istanbul ignore if */
                            if (process.env.NODE_ENV !== 'production' &&
                                typeof console !== 'undefined' &&
                                !hydrationBailed
                            ) {
                                hydrationBailed = true
                                console.warn('Parent: ', elm)
                                console.warn('server innerHTML: ', i)
                                console.warn('client innerHTML: ', elm.innerHTML)
                            }
                            return false
                        }
                    } else {
                        // iterate and compare children lists
                        let childrenMatch = true
                        let childNode = elm.firstChild
                        for (let i = 0; i < children.length; i++) {
                            if (!childNode || !hydrate(childNode, children[i], insertedVnodeQueue, inVPre)) {
                                childrenMatch = false
                                break
                            }
                            childNode = childNode.nextSibling
                        }
                        // if childNode is not null, it means the actual childNodes list is
                        // longer than the virtual children list.
                        if (!childrenMatch || childNode) {
                            /* istanbul ignore if */
                            if (process.env.NODE_ENV !== 'production' &&
                                typeof console !== 'undefined' &&
                                !hydrationBailed
                            ) {
                                hydrationBailed = true
                                console.warn('Parent: ', elm)
                                console.warn('Mismatching childNodes vs. VNodes: ', elm.childNodes, children)
                            }
                            return false
                        }
                    }
                }
            }
            if (isDef(data)) {
                let fullInvoke = false
                for (const key in data) {
                    if (!isRenderedModule(key)) {
                        fullInvoke = true
                        invokeCreateHooks(vnode, insertedVnodeQueue)
                        break
                    }
                }
                if (!fullInvoke && data['class']) {
                    // ensure collecting deps for deep class bindings for future updates
                    traverse(data['class'])
                }
            }
        } else if (elm.data !== vnode.text) {
            elm.data = vnode.text
        }
        return true
    }

    function assertNodeMatch(node, vnode, inVPre) {
        if (isDef(vnode.tag)) {
            return vnode.tag.indexOf('vue-component') === 0 || (
                !isUnknownElement(vnode, inVPre) &&
                vnode.tag.toLowerCase() === (node.tagName && node.tagName.toLowerCase())
            )
        } else {
            return node.nodeType === (vnode.isComment ? 8 : 3)
        }
    }

    // oldVnode是一个真实的DOM元素
    return function patch(oldVnode, vnode, hydrating, removeOnly) {
        // 如果vnode未定义，若oldVnode有值则销毁vnode，否则返回
        if (isUndef(vnode)) {
            if (isDef(oldVnode)) invokeDestroyHook(oldVnode)
            return
        }

        let isInitialPatch = false
        const insertedVnodeQueue = []

        // 如果oldVnode未定义，isInitialPatch置为true，然后调用createElm。
        if (isUndef(oldVnode)) {
            // empty mount (likely as component), create new root element
            isInitialPatch = true
            createElm(vnode, insertedVnodeQueue)
        } else {
            const isRealElement = isDef(oldVnode.nodeType)
            if (!isRealElement && sameVnode(oldVnode, vnode)) {
                // patch existing root node
                patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly)
            } else {
                if (isRealElement) {
                    // mounting to a real element
                    // check if this is server-rendered content and if we can perform
                    // a successful hydration.
                    if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
                        oldVnode.removeAttribute(SSR_ATTR)
                        hydrating = true
                    }
                    if (isTrue(hydrating)) {
                        if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
                            invokeInsertHook(vnode, insertedVnodeQueue, true)
                            return oldVnode
                        } else if (process.env.NODE_ENV !== 'production') {
                            warn(
                                'The client-side rendered virtual DOM tree is not matching ' +
                                'server-rendered content. This is likely caused by incorrect ' +
                                'HTML markup, for example nesting block-level elements inside ' +
                                '<p>, or missing <tbody>. Bailing hydration and performing ' +
                                'full client-side render.'
                            )
                        }
                    }
                    // either not server-rendered, or hydration failed.
                    // create an empty node and replace it
                    // 不是服务器渲染的，也不是hydrating。 则创建一个空节点替换原Vnode
                    oldVnode = emptyNodeAt(oldVnode)
                }

                // replacing existing element
                // 替换现有元素
                const oldElm = oldVnode.elm

                // 获得元素的父节点
                const parentElm = nodeOps.parentNode(oldElm)

                // create new node
                createElm(
                    vnode,
                    insertedVnodeQueue,
                    // extremely rare edge case: do not insert if old element is in a
                    // leaving transition. Only happens when combining transition +
                    // keep-alive + HOCs. (#4590)
                    oldElm._leaveCb ? null : parentElm,
                    nodeOps.nextSibling(oldElm)
                )

                // update parent placeholder node element, recursively
                if (isDef(vnode.parent)) {
                    let ancestor = vnode.parent
                    const patchable = isPatchable(vnode)
                    while (ancestor) {
                        for (let i = 0; i < cbs.destroy.length; ++i) {
                            cbs.destroy[i](ancestor)
                        }
                        ancestor.elm = vnode.elm
                        if (patchable) {
                            for (let i = 0; i < cbs.create.length; ++i) {
                                cbs.create[i](emptyNode, ancestor)
                            }
                            // #6513
                            // invoke insert hooks that may have been merged by create hooks.
                            // e.g. for directives that uses the "inserted" hook.
                            const insert = ancestor.data.hook.insert
                            if (insert.merged) {
                                // start at index 1 to avoid re-invoking component mounted hook
                                for (let i = 1; i < insert.fns.length; i++) {
                                    insert.fns[i]()
                                }
                            }
                        } else {
                            registerRef(ancestor)
                        }
                        ancestor = ancestor.parent
                    }
                }

                // destroy old node
                // 销毁旧的节点
                if (isDef(parentElm)) {
                    removeVnodes([oldVnode], 0, 0)
                } else if (isDef(oldVnode.tag)) {
                    invokeDestroyHook(oldVnode)
                }
            }
        }

        invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)
        return vnode.elm
    }
}
