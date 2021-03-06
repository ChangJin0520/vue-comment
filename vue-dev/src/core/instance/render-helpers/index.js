/* @flow */

import { toNumber, toString, looseEqual, looseIndexOf } from 'shared/util'
import { createTextVNode, createEmptyVNode } from 'core/vdom/vnode'
import { renderList } from './render-list'
import { renderSlot } from './render-slot'
import { resolveFilter } from './resolve-filter'
import { checkKeyCodes } from './check-keycodes'
import { bindObjectProps } from './bind-object-props'
import { renderStatic, markOnce } from './render-static'
import { bindObjectListeners } from './bind-object-listeners'
import { resolveScopedSlots } from './resolve-scoped-slots'
import { bindDynamicKeys, prependModifier } from './bind-dynamic-keys'

export function installRenderHelpers (target: any) {
  target._o = markOnce // v-once会用到
  target._n = toNumber // 转换数字 v-model会用到
  target._s = toString // 把一个值转换为字符串
  target._l = renderList // v-for会用到
  target._t = renderSlot // 渲染<slot> 解析slot标签时会用到
  target._q = looseEqual
  target._i = looseIndexOf
  target._m = renderStatic // 渲染静态内容
  target._f = resolveFilter
  target._k = checkKeyCodes
  target._b = bindObjectProps
  target._v = createTextVNode // 创建一个文本节点
  target._e = createEmptyVNode // 返回一个空的VNode
  target._u = resolveScopedSlots
  target._g = bindObjectListeners
  target._d = bindDynamicKeys
  target._p = prependModifier
}
