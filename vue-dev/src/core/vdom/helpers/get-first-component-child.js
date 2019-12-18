/* @flow */

import {
    isDef
} from 'shared/util'
import {
    isAsyncPlaceholder
} from './is-async-placeholder'

export function getFirstComponentChild(children: ? Array < VNode > ): ? VNode {
    if (Array.isArray(children)) {
        for (let i = 0; i < children.length; i++) {
            const c = children[i]

            // 只有自定义组件才有componentOptions
            if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
                return c
            }
        }
    }
}
