/* @flow */

import {
    isRegExp,
    remove
} from 'shared/util'
import {
    getFirstComponentChild
} from 'core/vdom/helpers/index'

type VNodeCache = {
    [key: string]: ? VNode
};

// 获取组件名
function getComponentName(opts: ? VNodeComponentOptions): ? string {
    return opts && (opts.Ctor.options.name || opts.tag)
}

// 根据规则匹配
function matches(pattern: string | RegExp | Array < string > , name: string) : boolean {
    if (Array.isArray(pattern)) { // Array
        return pattern.indexOf(name) > -1
    } else if (typeof pattern === 'string') { // string
        return pattern.split(',').indexOf(name) > -1
    } else if (isRegExp(pattern)) { // RegExp
        return pattern.test(name)
    }

    /* istanbul ignore next */
    return false
}

// 处理缓存
function pruneCache(keepAliveInstance: any, filter: Function) {
    const {
        cache,
        keys,
        _vnode
    } = keepAliveInstance

    for (const key in cache) {
        const cachedNode: ? VNode = cache[key]

        if (cachedNode) {
            const name: ? string = getComponentName(cachedNode.componentOptions)

            if (name && !filter(name)) {
                pruneCacheEntry(cache, key, keys, _vnode)
            }
        }
    }
}

// 销毁缓存中的指定组件
function pruneCacheEntry(
    cache: VNodeCache,
    key: string,
    keys: Array < string > ,
    current ? : VNode
) {
    const cached = cache[key]

    if (cached && (!current || cached.tag !== current.tag)) {
        cached.componentInstance.$destroy()
    }

    cache[key] = null

    remove(keys, key)
}

const patternTypes: Array < Function > = [String, RegExp, Array]

export default {
    name: 'keep-alive',
    abstract: true,

    props: {
        include: patternTypes,
        exclude: patternTypes,
        max: [String, Number]
    },

    created() {
        this.cache = Object.create(null) // 用于缓存子组件
        this.keys = []
    },

    // keep-alive组价销毁的时候销毁其cache
    destroyed() {
        for (const key in this.cache) {
            pruneCacheEntry(this.cache, key, this.keys)
        }
    },

    mounted() {
        // 改变props的传值时 会对this.cache中的数据进行处理
        this.$watch('include', val => {
            pruneCache(this, name => matches(val, name))
        })

        this.$watch('exclude', val => {
            pruneCache(this, name => !matches(val, name))
        })
    },

    render() {
        const slot = this.$slots.default // 取到keep-alive内部子元素的vnode
        const vnode: VNode = getFirstComponentChild(slot) // 只取第一个自定义组件
        const componentOptions: ? VNodeComponentOptions = vnode && vnode.componentOptions // 只有自定义组件才有componentOptions

        if (componentOptions) {
            // check pattern 校验匹配规则
            const name: ? string = getComponentName(componentOptions)
            const {
                include,
                exclude
            } = this

            if (
                // not included
                (include && (!name || !matches(include, name))) ||
                // excluded
                (exclude && name && matches(exclude, name))
            ) {
                return vnode // 返回keep-alive中第一个子组件的vnode
            }

            const {
                cache,
                keys
            } = this
            // 子组件有key值则取key值 否则取其cid::tagName形式作为key
            const key = vnode.key == null ?
                // same constructor may get registered as different local components
                // so cid alone is not enough (#3269)
                // 同一构造函数可能注册为不同的本地组件
                // 因此仅凭cid是不够的（＃3269）
                componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '') :
                vnode.key

            if (cache[key]) {
                // 存在缓存则取对应缓存的组件实例
                vnode.componentInstance = cache[key].componentInstance
                // make current key freshest
                // 更新cache的key值
                remove(keys, key)
                keys.push(key)
            } else {
                // 当前key值没对应缓存 则按值存到cache中
                cache[key] = vnode
                keys.push(key)

                // prune oldest entry
                // 如果超过最大值 则销毁第一个
                if (this.max && keys.length > parseInt(this.max)) {
                    pruneCacheEntry(cache, keys[0], keys, this._vnode)
                }
            }

            // 添加标记
            vnode.data.keepAlive = true
        }

        return vnode || (slot && slot[0]) // 没有配置则直接返回第一个vnode
    }
}
