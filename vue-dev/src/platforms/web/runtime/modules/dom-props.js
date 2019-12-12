/* @flow */

import {
    isDef,
    isUndef,
    extend,
    toNumber
} from 'shared/util'
import {
    isSVG
} from 'web/util/index'

let svgContainer

function updateDOMProps(oldVnode: VNodeWithData, vnode: VNodeWithData) {
    // oldVNode VNode全不包含domProps 则直接返回
    if (isUndef(oldVnode.data.domProps) && isUndef(vnode.data.domProps)) {
        return
    }

    let key, cur
    const elm: any = vnode.elm // 取出VNode上的elm 就是DOM元素
    const oldProps = oldVnode.data.domProps || {}
    let props = vnode.data.domProps || {}

    // clone observed objects, as the user probably wants to mutate it
    // 克隆已观察对象，因为用户可能想要修改它
    if (isDef(props.__ob__)) { // __ob__就是通过definedPerporty添加的属性
        props = vnode.data.domProps = extend({}, props)
    }

    // 重置存在于oldProps但不存在于props上的属性
    for (key in oldProps) {
        if (!(key in props)) {
            elm[key] = ''
        }
    }

    // 遍历props上的值
    for (key in props) {
        cur = props[key] // 取值

        // ignore children if the node has textContent or innerHTML,
        // as these will throw away existing DOM nodes and cause removal errors
        // on subsequent patches (#3360)
        // 如果节点具有textContent或innerHTML，则remove子节点
        // 因为这些子节点将丢弃现有的DOM节点，并在后续补丁中导致删除错误（＃3360）
        if (key === 'textContent' || key === 'innerHTML') { // textContent innerHtml 对应着v-text v-html {{}}
            if (vnode.children) vnode.children.length = 0

            // 新旧值相同则跳过
            if (cur === oldProps[key]) continue

            // #6601 work around Chrome version <= 55 bug where single textNode
            // replaced by innerHTML/textContent retains its parentNode property
            // ＃6601解决了Chrome版本<= 55 bug
            // 其中单个textNode被innerHTML / textContent替换后仍保留其parentNode属性
            if (elm.childNodes.length === 1) {
                elm.removeChild(elm.childNodes[0])
            }
        }

        if (key === 'value' && elm.tagName !== 'PROGRESS') {
            // store value as _value as well since
            // non-string values will be stringified
            // 也将值存储为_value
            // 因为非字符串值将被字符串化
            elm._value = cur

            // avoid resetting cursor position when value is the same
            // 避免在值相同时重置光标位置
            const strCur = isUndef(cur) ? '' : String(cur)
            if (shouldUpdateValue(elm, strCur)) {
                elm.value = strCur
            }
        } else if (key === 'innerHTML' && isSVG(elm.tagName) && isUndef(elm.innerHTML)) { // 处理svg中的innerHTML
            // IE doesn't support innerHTML for SVG elements
            // IE不支持SVG元素的innerHTML
            svgContainer = svgContainer || document.createElement('div')
            svgContainer.innerHTML = `<svg>${cur}</svg>`
            const svg = svgContainer.firstChild

            while (elm.firstChild) {
                elm.removeChild(elm.firstChild)
            }

            while (svg.firstChild) {
                elm.appendChild(svg.firstChild)
            }
        } else if (
            // skip the update if old and new VDOM state is the same.
            // `value` is handled separately because the DOM value may be temporarily
            // out of sync with VDOM state due to focus, composition and modifiers.
            // This  #4521 by skipping the unnecesarry `checked` update.
            // 如果新旧VDOM状态相同，则跳过更新。
            // “值”是单独处理的，因为由于焦点，组成和修饰符，DOM值可能暂时与VDOM状态不同步。
            // ＃4521跳过了不必要的“检查”更新。
            cur !== oldProps[key]
        ) {
            // some property updates can throw
            // e.g. `value` on <progress> w/ non-finite value
            // 一些属性更新可能会抛出
            // 例如 具有非限定值的<progress>上的`value`
            try {
                elm[key] = cur // 直接修改DOM上的值
            } catch (e) {}
        }
    }
}

// check platforms/web/util/attrs.js acceptValue
type acceptValueElm = HTMLInputElement | HTMLSelectElement | HTMLOptionElement;

function shouldUpdateValue(elm: acceptValueElm, checkVal: string): boolean {
    return (!elm.composing && (
        elm.tagName === 'OPTION' ||
        isNotInFocusAndDirty(elm, checkVal) ||
        isDirtyWithModifiers(elm, checkVal)
    ))
}

function isNotInFocusAndDirty(elm: acceptValueElm, checkVal: string): boolean {
    // return true when textbox (.number and .trim) loses focus and its value is
    // not equal to the updated value
    let notInFocus = true
    // #6157
    // work around IE bug when accessing document.activeElement in an iframe
    try {
        notInFocus = document.activeElement !== elm
    } catch (e) {}
    return notInFocus && elm.value !== checkVal
}

function isDirtyWithModifiers(elm: any, newVal: string): boolean {
    const value = elm.value
    const modifiers = elm._vModifiers // injected by v-model runtime
    if (isDef(modifiers)) {
        if (modifiers.number) {
            return toNumber(value) !== toNumber(newVal)
        }
        if (modifiers.trim) {
            return value.trim() !== newVal.trim()
        }
    }
    return value !== newVal
}

export default {
    create: updateDOMProps,
    update: updateDOMProps
}
