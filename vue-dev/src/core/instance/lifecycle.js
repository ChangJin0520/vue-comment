/* @flow */

import config from '../config'
import Watcher from '../observer/watcher'
import {
    mark,
    measure
} from '../util/perf'
import {
    createEmptyVNode
} from '../vdom/vnode'
import {
    updateComponentListeners
} from './events'
import {
    resolveSlots
} from './render-helpers/resolve-slots'
import {
    toggleObserving
} from '../observer/index'
import {
    pushTarget,
    popTarget
} from '../observer/dep'

import {
    warn,
    noop,
    remove,
    emptyObject,
    validateProp,
    invokeWithErrorHandling
} from '../util/index'

export let activeInstance: any = null
export let isUpdatingChildComponent: boolean = false

export function setActiveInstance(vm: Component) {
    const prevActiveInstance = activeInstance
    activeInstance = vm
    return () => {
        activeInstance = prevActiveInstance
    }
}

export function initLifecycle(vm: Component) {
    const options = vm.$options

    // locate first non-abstract parent
    // 找到第一非抽象父组件
    let parent = options.parent
    if (parent && !options.abstract) {
        while (parent.$options.abstract && parent.$parent) {
            parent = parent.$parent
        }

        // 把组件添加到第一个非抽象组件下
        parent.$children.push(vm)
    }

    // 用于自定义子组件中 指向父组件的实例
    vm.$parent = parent

    // 指向根vm实例
    vm.$root = parent ? parent.$root : vm

    // 当前组件的子组件实例数组
    vm.$children = []

    vm.$refs = {}

    vm._watcher = null
    vm._inactive = null
    vm._directInactive = false
    vm._isMounted = false // 标识是否已挂载
    vm._isDestroyed = false // 标识是否已销毁
    vm._isBeingDestroyed = false // 标识是否正在销毁
}

export function lifecycleMixin(Vue: Class<Component> ) {
    Vue.prototype._update = function(vnode: VNode, hydrating ?: boolean) {
        const vm: Component = this
        const prevEl = vm.$el
        const prevVnode = vm._vnode
        const restoreActiveInstance = setActiveInstance(vm)
        vm._vnode = vnode
        // Vue.prototype.__patch__ is injected in entry points
        // based on the rendering backend used.
        if (!prevVnode) {
            // initial render
            // vm.$el是挂载的根元素  vnode是根元素对应的虚拟dom元素
            vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */ )
        } else {
            // updates
            vm.$el = vm.__patch__(prevVnode, vnode)
        }
        restoreActiveInstance()
        // update __vue__ reference
        if (prevEl) {
            prevEl.__vue__ = null
        }
        if (vm.$el) {
            vm.$el.__vue__ = vm
        }
        // if parent is an HOC, update its $el as well
        if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
            vm.$parent.$el = vm.$el
        }
        // updated hook is called by the scheduler to ensure that children are
        // updated in a parent's updated hook.
    }

    Vue.prototype.$forceUpdate = function() {
        const vm: Component = this
        if (vm._watcher) {
            vm._watcher.update()
        }
    }

    Vue.prototype.$destroy = function() {
        const vm: Component = this
        if (vm._isBeingDestroyed) {
            return
        }
        // 调用beforeDestroy钩子函数
        callHook(vm, 'beforeDestroy')

        // 通过vm._isBeingDestroyed来标识正在销毁，避免重复调用
        vm._isBeingDestroyed = true

        // remove self from parent
        // 从父元素中删除当前元素。
        const parent = vm.$parent
        if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
            remove(parent.$children, vm)
        }

        // teardown watchers
        // 销毁watcher
        if (vm._watcher) {
            vm._watcher.teardown()
        }
        let i = vm._watchers.length
        while (i--) {
            vm._watchers[i].teardown()
        }

        // remove reference from data ob
        // frozen object may not have observer.
        // vm._data_的监听对象的vmCount减1
        if (vm._data.__ob__) {
            vm._data.__ob__.vmCount--
        }

        // call the last hook...
        // 标识vm已销毁
        vm._isDestroyed = true

        // invoke destroy hooks on current rendered tree
        // 销毁当前组件
        vm.__patch__(vm._vnode, null)

        // fire destroyed hook
        // 调用destroyed钩子函数
        callHook(vm, 'destroyed')

        // turn off all instance listeners.
        // 销毁事件
        vm.$off()

        // remove __vue__ reference
        // 消除各种引用的资源
        if (vm.$el) {
            vm.$el.__vue__ = null
        }

        // release circular reference (#6759)
        // 释放循环引用?
        if (vm.$vnode) {
            vm.$vnode.parent = null
        }
    }
}

export function mountComponent(
    vm: Component,
    el: ? Element,
    hydrating ?: boolean
): Component {
    vm.$el = el
    if (!vm.$options.render) {
        vm.$options.render = createEmptyVNode
        if (process.env.NODE_ENV !== 'production') {
            /* istanbul ignore if */
            if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
                vm.$options.el || el) {
                warn(
                    'You are using the runtime-only build of Vue where the template ' +
                    'compiler is not available. Either pre-compile the templates into ' +
                    'render functions, or use the compiler-included build.',
                    vm
                )
            } else {
                warn(
                    'Failed to mount component: template or render function not defined.',
                    vm
                )
            }
        }
    }
    callHook(vm, 'beforeMount')

    let updateComponent
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        updateComponent = () => {
            const name = vm._name
            const id = vm._uid
            const startTag = `vue-perf-start:${id}`
            const endTag = `vue-perf-end:${id}`

            mark(startTag)
            const vnode = vm._render()
            mark(endTag)
            measure(`vue ${name} render`, startTag, endTag)

            mark(startTag)
            vm._update(vnode, hydrating)
            mark(endTag)
            measure(`vue ${name} patch`, startTag, endTag)
        }
    } else {
        updateComponent = () => {
            vm._update(vm._render(), hydrating)
        }
    }

    // we set this to vm._watcher inside the watcher's constructor
    // since the watcher's initial patch may call $forceUpdate (e.g. inside child
    // component's mounted hook), which relies on vm._watcher being already defined
    // 我们将其设置为观察者构造函数中的vm._watcher
    // 因为观察者的初始patch可能会调用$forceUpdate（例如，在子组件的已挂载钩子内部）
    // 这取决于已经定义的vm._watcher
    new Watcher(vm, updateComponent, noop, {
        before() {
            if (vm._isMounted && !vm._isDestroyed) {
                callHook(vm, 'beforeUpdate')
            }
        }
    }, true /* isRenderWatcher */ )
    hydrating = false

    // manually mounted instance, call mounted on self
    // mounted is called for render-created child components in its inserted hook
    if (vm.$vnode == null) {
        vm._isMounted = true
        callHook(vm, 'mounted')
    }
    return vm
}

export function updateChildComponent(
    vm: Component,
    propsData: ? Object,
    listeners: ? Object,
    parentVnode: MountedComponentVNode,
    renderChildren: ? Array<VNode>
) {
    if (process.env.NODE_ENV !== 'production') {
        isUpdatingChildComponent = true
    }

    // determine whether component has slot children
    // we need to do this before overwriting $options._renderChildren.
    // 确定组件是否具有插槽子代，
    // 我们需要在覆盖$ options._renderChildren之前执行此操作。

    // check if there are dynamic scopedSlots (hand-written or compiled but with
    // dynamic slot names). Static scoped slots compiled from template has the
    // "$stable" marker.
    // 检查是否有动态scopedSlot（手写或编译的但具有动态插槽名称）。
    // 从模板编译的静态作用域插槽具有“ $ stable”标记。
    const newScopedSlots = parentVnode.data.scopedSlots
    const oldScopedSlots = vm.$scopedSlots
    const hasDynamicScopedSlot = !!(
        (newScopedSlots && !newScopedSlots.$stable) ||
        (oldScopedSlots !== emptyObject && !oldScopedSlots.$stable) ||
        (newScopedSlots && vm.$scopedSlots.$key !== newScopedSlots.$key)
    )

    // Any static slot children from the parent may have changed during parent's
    // update. Dynamic scoped slots may also have changed. In such cases, a forced
    // update is necessary to ensure correctness.
    // 父级的任何静态插槽子级可能在父级更新期间已更改。
    // 动态范围的插槽也可能已更改。
    // 在这种情况下，必须进行强制更新以确保正确性。
    const needsForceUpdate = !!(
        renderChildren || // has new static slots 有新的静态插槽
        vm.$options._renderChildren || // has old static slots 有旧的静态插槽
        hasDynamicScopedSlot
    )

    // 更新vnode相关关系
    vm.$options._parentVnode = parentVnode
    vm.$vnode = parentVnode // update vm's placeholder node without re-render 更新vm的占位符节点，而无需重新渲染
    if (vm._vnode) { // update child tree's parent 更新子树的父级
        vm._vnode.parent = parentVnode
    }
    vm.$options._renderChildren = renderChildren

    // update $attrs and $listeners hash
    // these are also reactive so they may trigger child update if the child
    // used them during render
    // 更新$attrs和$listeners哈希值也是响应式的
    // 因此如果子代在渲染期间使用它们，它们可能会触发子代更新
    vm.$attrs = parentVnode.data.attrs || emptyObject
    vm.$listeners = listeners || emptyObject

    // update props // 更新 props
    if (propsData && vm.$options.props) {
        toggleObserving(false)
        const props = vm._props
        const propKeys = vm.$options._propKeys || []
        for (let i = 0; i < propKeys.length; i++) {
            const key = propKeys[i]
            const propOptions: any = vm.$options.props // wtf flow?
            props[key] = validateProp(key, propOptions, propsData, vm) // 对传递的数据类型等进行校验。
        }
        toggleObserving(true)
        // keep a copy of raw propsData 保留原始propsData的副本
        vm.$options.propsData = propsData
    }

    // update listeners // 更新 listeners
    listeners = listeners || emptyObject
    const oldListeners = vm.$options._parentListeners
    vm.$options._parentListeners = listeners
    updateComponentListeners(vm, listeners, oldListeners)

    // resolve slots + force update if has children
    // 处理slots并如果有子级强制更新
    if (needsForceUpdate) {
        vm.$slots = resolveSlots(renderChildren, parentVnode.context)
        vm.$forceUpdate()
    }

    if (process.env.NODE_ENV !== 'production') {
        isUpdatingChildComponent = false
    }
}

function isInInactiveTree(vm) {
    while (vm && (vm = vm.$parent)) {
        if (vm._inactive) return true
    }
    return false
}

export function activateChildComponent(vm: Component, direct ?: boolean) {
    if (direct) {
        vm._directInactive = false
        if (isInInactiveTree(vm)) {
            return
        }
    } else if (vm._directInactive) {
        return
    }
    if (vm._inactive || vm._inactive === null) {
        vm._inactive = false
        for (let i = 0; i < vm.$children.length; i++) {
            activateChildComponent(vm.$children[i])
        }
        callHook(vm, 'activated')
    }
}

export function deactivateChildComponent(vm: Component, direct ?: boolean) {
    if (direct) {
        vm._directInactive = true
        if (isInInactiveTree(vm)) {
            return
        }
    }
    if (!vm._inactive) {
        vm._inactive = true
        for (let i = 0; i < vm.$children.length; i++) {
            deactivateChildComponent(vm.$children[i])
        }
        callHook(vm, 'deactivated')
    }
}

export function callHook(vm: Component, hook: string) {
    // #7573 disable dep collection when invoking lifecycle hooks
    pushTarget()
    const handlers = vm.$options[hook]
    const info = `${hook} hook`
    if (handlers) {
        for (let i = 0, j = handlers.length; i < j; i++) {
            invokeWithErrorHandling(handlers[i], vm, null, vm, info)
        }
    }
    if (vm._hasHookEvent) {
        vm.$emit('hook:' + hook)
    }
    popTarget()
}
