/* @flow */

import {
    emptyNode
} from 'core/vdom/patch'
import {
    resolveAsset,
    handleError
} from 'core/util/index'
import {
    mergeVNodeHook
} from 'core/vdom/helpers/index'

export default {
    create: updateDirectives,
    update: updateDirectives,
    destroy: function unbindDirectives(vnode: VNodeWithData) {
        updateDirectives(vnode, emptyNode)
    }
}

function updateDirectives(oldVnode: VNodeWithData, vnode: VNodeWithData) {
    if (oldVnode.data.directives || vnode.data.directives) {
        _update(oldVnode, vnode)
    }
}

function _update(oldVnode, vnode) {
    // 第一次实例化组件时 oldVnode是emptyNode
    const isCreate = oldVnode === emptyNode
    // 销毁组件时 vnode是emptyNode
    const isDestroy = vnode === emptyNode

    // 把指令统一处理为key: value模式
    const oldDirs = normalizeDirectives(oldVnode.data.directives, oldVnode.context)
    const newDirs = normalizeDirectives(vnode.data.directives, vnode.context)

    const dirsWithInsert = []
    const dirsWithPostpatch = []

    let key, oldDir, dir

    // 遍历newDirs
    for (key in newDirs) {
        oldDir = oldDirs[key] // 判断oldVnode中是否存在该指令
        dir = newDirs[key] // 从newDirs中取出指令

        // 第一次绑定
        if (!oldDir) {
            // new directive, bind
            // 调用当前指令的bind方法
            callHook(dir, 'bind', vnode, oldVnode)

            // 如果当前指令存在inserted方法 把该指令存到dirsWithInsert中
            if (dir.def && dir.def.inserted) {
                dirsWithInsert.push(dir)
            }
        } else {
            // existing directive, update
            // 不是第一次绑定 则调用更新钩子
            dir.oldValue = oldDir.value
            dir.oldArg = oldDir.arg

            // 调用当前指令的undate方法
            callHook(dir, 'update', vnode, oldVnode)

            // 若同时定义了componentUpdated钩子，则会先把它添加到dirsWithPostpatch数组中
            if (dir.def && dir.def.componentUpdated) {
                dirsWithPostpatch.push(dir)
            }
        }
    }

    // 遍历带inserted方法的指令 并调用inserted方法
    if (dirsWithInsert.length) {
        const callInsert = () => {
            for (let i = 0; i < dirsWithInsert.length; i++) {
                callHook(dirsWithInsert[i], 'inserted', vnode, oldVnode)
            }
        }

        // 如果vnode是第一次创建 会把dirsWithInsert数组中的回调追加到vnode.data.hook.insert中执行
        if (isCreate) {
            mergeVNodeHook(vnode, 'insert', callInsert)
        } else {
            callInsert()
        }
    }

    // postpatch钩子在patch之后调用
    if (dirsWithPostpatch.length) {
        mergeVNodeHook(vnode, 'postpatch', () => {
            for (let i = 0; i < dirsWithPostpatch.length; i++) {
                callHook(dirsWithPostpatch[i], 'componentUpdated', vnode, oldVnode)
            }
        })
    }

    // 不是第一次创建
    if (!isCreate) {
        // 调用旧vnode中新vnode不存在的指令的unbind钩子函数
        for (key in oldDirs) {
            if (!newDirs[key]) {
                // no longer present, unbind
                callHook(oldDirs[key], 'unbind', oldVnode, oldVnode, isDestroy)
            }
        }
    }
}

const emptyModifiers = Object.create(null)

function normalizeDirectives(
    dirs: ? Array<VNodeDirective> ,
    vm: Component
): {
    [key: string]: VNodeDirective
} {
    const res = Object.create(null)

    // 如果不存在指令 则直接返回
    if (!dirs) {
        return res
    }

    let i, dir
    for (i = 0; i < dirs.length; i++) {
        dir = dirs[i]
        if (!dir.modifiers) {
            dir.modifiers = emptyModifiers // 指令没有modifiers 添加上空对象
        }
        res[getRawDirName(dir)] = dir // key: value

        dir.def = resolveAsset(vm.$options, 'directives', dir.name, true) // 获取指令对应的处理方法 添加到def属性上
    }

    return res
}

function getRawDirName(dir: VNodeDirective): string {
    return dir.rawName || `${dir.name}.${Object.keys(dir.modifiers || {}).join('.')}`
}

// 调用指令的钩子函数
function callHook(dir, hook, vnode, oldVnode, isDestroy) {
    const fn = dir.def && dir.def[hook]
    if (fn) {
        try {
            // 执行钩子函数
            // vnode.elm指令所绑定的元素  dir指令对象
            // vnode当前虚拟节点  oldVnode上一个虚拟节点
            fn(vnode.elm, dir, vnode, oldVnode, isDestroy)
        } catch (e) {
            handleError(e, vnode.context, `directive ${dir.name} ${hook} hook`)
        }
    }
}
