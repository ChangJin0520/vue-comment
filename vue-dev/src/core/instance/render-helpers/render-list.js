/* @flow */

import {
    isObject,
    isDef,
    hasSymbol
} from 'core/util/index'

/**
 * Runtime helper for rendering v-for lists.
 * 渲染v-for列表的运行时helper
 * @return 返回一个VNode数组
 */
export function renderList(
    val: any,
    render: (
        val: any,
        keyOrIndex: string | number,
        index ?: number
    ) => VNode
){
    let ret , i, l, keys, key

    // 遍历对象为字符串的处理
    if (Array.isArray(val) || typeof val === 'string') {
        ret = new Array(val.length)
        for (i = 0, l = val.length; i < l; i++) {
            ret[i] = render(val[i], i)
        }
    } else if (typeof val === 'number') { // 被遍历对象为数字的处理
        ret = new Array(val)

        for (i = 0; i < val; i++) {
            ret[i] = render(i + 1, i)
        }
    } else if (isObject(val)) { // 被遍历对象为对象的处理
        if (hasSymbol && val[Symbol.iterator]) { // 含有迭代器
            ret = []
            const iterator = val[Symbol.iterator]()
            let result = iterator.next()

            while (!result.done) {
                ret.push(render(result.value, ret.length))
                result = iterator.next()
            }
        } else { // 普通对象
            keys = Object.keys(val)
            ret = new Array(keys.length)

            for (i = 0, l = keys.length; i < l; i++) {
                key = keys[i]
                ret[i] = render(val[key], key, i)
            }
        }
    }

    // 处理未定义
    if (!isDef(ret)) {
        ret = []
    }

    // 添加_isVList标识
    ret._isVList = true

    return ret
}
