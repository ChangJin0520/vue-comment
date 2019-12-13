/* @flow */

import VNode from './vnode'
import {
    resolveConstructorOptions
} from 'core/instance/init'
import {
    queueActivatedComponent
} from 'core/observer/scheduler'
import {
    createFunctionalComponent
} from './create-functional-component'

import {
    warn,
    isDef,
    isUndef,
    isTrue,
    isObject
} from '../util/index'

import {
    resolveAsyncComponent,
    createAsyncPlaceholder,
    extractPropsFromVNodeData
} from './helpers/index'

import {
    callHook,
    activeInstance,
    updateChildComponent,
    activateChildComponent,
    deactivateChildComponent
} from '../instance/lifecycle'

import {
    isRecyclableComponent,
    renderRecyclableComponentTemplate
} from 'weex/runtime/recycle-list/render-component-template'

// inline hooks to be invoked on component VNodes during patch
// patch执行期间在组件VNode上调用内联挂钩
const componentVNodeHooks = {
    init(vnode: VNodeWithData, hydrating: boolean): ? boolean {
        // 如果componentInstance存在 且 未被销毁 且 需要keepAlive
        // 则直接调用prepatch
        if (
            vnode.componentInstance &&
            !vnode.componentInstance._isDestroyed &&
            vnode.data.keepAlive
        ) {
            // kept-alive components, treat as a patch
            const mountedNode: any = vnode // work around flow
            componentVNodeHooks.prepatch(mountedNode, mountedNode)
        } else {
            // vnode.componentInstance不存在 或 已经销毁 或 非keepAlive
            // 则通过createComponentInstanceForVnode方法来创建新的Vue实例
            const child = vnode.componentInstance = createComponentInstanceForVnode(
                vnode,
                activeInstance
            )

            // 调用vue实例上的$mount方法
            child.$mount(hydrating ? vnode.elm : undefined, hydrating)
        }
    },

    // 调用prepatch钩子函数的前提，说明该自定义组件得到了复
    // 也就是说该自定义组件本身没有被替换
    // 我们只需要根据传入的props或者slots等来更新子模板的内容
    prepatch(oldVnode: MountedComponentVNode, vnode: MountedComponentVNode) {
        const options = vnode.componentOptions
        const child = vnode.componentInstance = oldVnode.componentInstance

        updateChildComponent(
            child,
            options.propsData, // updated props
            options.listeners, // updated listeners
            vnode, // new parent vnode
            options.children // new children
        )
    },

    insert(vnode: MountedComponentVNode) {
        const {
            context,
            componentInstance
        } = vnode

        // 如果未挂载则修改标识 并调用mounted钩子函数
        if (!componentInstance._isMounted) {
            componentInstance._isMounted = true
            callHook(componentInstance, 'mounted')
        }

        if (vnode.data.keepAlive) {
            if (context._isMounted) {
                // vue-router#1212
                // During updates, a kept-alive component's child components may
                // change, so directly walking the tree here may call activated hooks
                // on incorrect children. Instead we push them into a queue which will
                // be processed after the whole patch process ended.
                // 在更新期间，保持活动的组件的子组件可能会更改，
                // 因此直接walking the tree可能会在不正确的子组件上调用激活的钩子。
                // 相反，我们将它们推入队列，整个patch过程结束后将对其进行处理。
                queueActivatedComponent(componentInstance)
            } else {
                activateChildComponent(componentInstance, true /* direct */ )
            }
        }
    },

    destroy(vnode: MountedComponentVNode) {
        const {
            componentInstance
        } = vnode

        // 如果未销毁则进行销毁
        if (!componentInstance._isDestroyed) {
            // 如果组件未keepAlive 则调用$destory进行销毁
            // 否则对子组件进行deactivate处理
            if (!vnode.data.keepAlive) {
                componentInstance.$destroy()
            } else {
                deactivateChildComponent(componentInstance, true /* direct */ )
            }
        }
    }
}

// hooksToMerge共有四个值init、prepatch、insert、destroy
const hooksToMerge = Object.keys(componentVNodeHooks)

/**
 * 生成组件对应的VNode
 *
 * @export
 * @param {(Class<Component> | Function | Object | void)} Ctor 组件的配置项
 * @param {? VNodeData} data 组件标签上的属性
 * @param {Component} context 组件所在的vm对象
 * @param {? Array<VNode>} children 组件内的children 应该就是slot了
 * @param {string} [tag] 标签名
 * @returns {(VNode | Array<VNode> | void)} 返回组件对应的VNode对象
 */
export function createComponent(
    Ctor: Class<Component> | Function | Object | void,
    data: ? VNodeData,
    context: Component,
    children: ? Array<VNode> ,
    tag ?: string
): VNode | Array<VNode> | void {
    // Ctor为空表示从context的components属性上没找到tag对应的属性 Chang-Jin 2019-11-19
    if (isUndef(Ctor)) {
        return
    }

    const baseCtor = context.$options._base // _base就是Vue

    // plain options object: turn it into a constructor
    // 普通选项对象：将其转换为构造函数
    if (isObject(Ctor)) {
        Ctor = baseCtor.extend(Ctor) // 通过extend得到一个Vue的子类 Chang-Jin 2019-11-19
    }

    // if at this stage it's not a constructor or an async component factory,
    // reject.
    if (typeof Ctor !== 'function') {
        if (process.env.NODE_ENV !== 'production') {
            warn(`Invalid Component definition: ${String(Ctor)}`, context)
        }
        return
    }

    // async component
    // 处理异步组件
    let asyncFactory
    if (isUndef(Ctor.cid)) {
        asyncFactory = Ctor
        Ctor = resolveAsyncComponent(asyncFactory, baseCtor)
        if (Ctor === undefined) {
            // return a placeholder node for async component, which is rendered
            // as a comment node but preserves all the raw information for the node.
            // the information will be used for async server-rendering and hydration.
            return createAsyncPlaceholder(
                asyncFactory,
                data,
                context,
                children,
                tag
            )
        }
    }

    data = data || {}

    // resolve constructor options in case global mixins are applied after
    // component constructor creation
    // 递归合并父对象上的options属性
    resolveConstructorOptions(Ctor)

    // transform component v-model data into props & events
    // 对自定义组件上v-model指令的处理
    if (isDef(data.model)) {
        transformModel(Ctor.options, data)
    }

    // extract props
    // 根据子组件定义的props 抽取子组件上传递的数据  如果没有在props上定义 不会抽取
    const propsData = extractPropsFromVNodeData(data, Ctor, tag)

    // functional component
    if (isTrue(Ctor.options.functional)) {
        return createFunctionalComponent(Ctor, propsData, data, context, children)
    }

    // extract listeners, since these needs to be treated as
    // child component listeners instead of DOM listeners
    // 提取listener，因为这些需要被视为
    // 子组件listener，而不是DOM listener
    const listeners = data.on
    // replace with listeners with .native modifier
    // so it gets processed during parent component patch.
    // 用.native修饰符替换为listener
    // 因此会在父组件patch期间对其进行处理。
    data.on = data.nativeOn

    if (isTrue(Ctor.options.abstract)) { // Ctor.options.abstract是KeepLive等抽象组件
        // abstract components do not keep anything
        // other than props & listeners & slot
        // 抽象组件除了保留props，监听器和插槽之外，不保留其他任何东西
        // work around flow
        const slot = data.slot
        data = {}
        if (slot) {
            data.slot = slot
        }
    }

    // install component management hooks onto the placeholder node
    // 将组件管理挂钩安装到占位符节点上
    installComponentHooks(data)

    // return a placeholder vnode
    const name = Ctor.options.name || tag
    const vnode = new VNode(
        `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
        data, undefined, undefined, undefined, context, {
            Ctor,
            propsData,
            listeners,
            tag,
            children
        },
        asyncFactory
    )

    // Weex specific: invoke recycle-list optimized @render function for
    // extracting cell-slot template.
    // https://github.com/Hanks10100/weex-native-directive/tree/master/component
    /* istanbul ignore if */
    if (__WEEX__ && isRecyclableComponent(vnode)) {
        return renderRecyclableComponentTemplate(vnode)
    }

    return vnode
}

export function createComponentInstanceForVnode(
    vnode: any, // 我们知道它是MountedComponentVNode，但flow不知道
    parent: any, // activeInstance处于生命周期状态
): Component {
    const options: InternalComponentOptions = {
        _isComponent: true,
        _parentVnode: vnode,
        parent
    }

    // 校验内联模板渲染功能
    const inlineTemplate = vnode.data.inlineTemplate
    if (isDef(inlineTemplate)) {
        options.render = inlineTemplate.render
        options.staticRenderFns = inlineTemplate.staticRenderFns
    }

    // 调用new vnodeComponentOptions.Ctor(options)来创建一个新的Vue实例
    return new vnode.componentOptions.Ctor(options)
}

function installComponentHooks(data: VNodeData) {
    const hooks = data.hook || (data.hook = {})
    for (let i = 0; i < hooksToMerge.length; i++) {
        const key = hooksToMerge[i]
        const existing = hooks[key]
        const toMerge = componentVNodeHooks[key]

        // 如果data.hook上已经有了同名的钩子函数
        // 则创建一个新的函数，其内部分别调用这两个同名函数
        // 否则直接添加到data.hook对象上
        if (existing !== toMerge && !(existing && existing._merged)) {
            hooks[key] = existing ? mergeHook(toMerge, existing) : toMerge
        }
    }
}

function mergeHook(f1: any, f2: any): Function {
    const merged = (a, b) => {
        // flow complains about extra args which is why we use any
        f1(a, b)
        f2(a, b)
    }
    merged._merged = true
    return merged
}

// transform component v-model info (value and callback) into
// prop and event handler respectively.
function transformModel(options, data: any) {
    const prop = (options.model && options.model.prop) || 'value'
    const event = (options.model && options.model.event) || 'input';
    (data.attrs || (data.attrs = {}))[prop] = data.model.value
    const on = data.on || (data.on = {})
    const existing = on[event]
    const callback = data.model.callback
    if (isDef(existing)) {
        if (
            Array.isArray(existing) ?
            existing.indexOf(callback) === -1 :
            existing !== callback
        ) {
            on[event] = [callback].concat(existing)
        }
    } else {
        on[event] = callback
    }
}
