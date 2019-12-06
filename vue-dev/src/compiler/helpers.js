/* @flow */

import {
    emptyObject
} from 'shared/util'
import {
    parseFilters
} from './parser/filter-parser'

type Range = {
    start ?: number,
    end ?: number
};

/* eslint-disable no-unused-vars */
export function baseWarn(msg: string, range ?: Range) {
    console.error(`[Vue compiler]: ${msg}`)
}
/* eslint-enable no-unused-vars */

export function pluckModuleFunction < F: Function > (
    modules: ? Array<Object> ,
    key: string
): Array<F> {
    return modules ?
        modules.map(m => m[key]).filter(_ => _) : []
}

export function addProp(el: ASTElement, name: string, value: string, range ?: Range, dynamic ?: boolean) {
    (el.props || (el.props = [])).push(rangeSetItem({
        name,
        value,
        dynamic
    }, range))
    el.plain = false
}

export function addAttr(el: ASTElement, name: string, value: any, range ?: Range, dynamic ?: boolean) {
    const attrs = dynamic ?
        (el.dynamicAttrs || (el.dynamicAttrs = [])) :
        (el.attrs || (el.attrs = []))
    attrs.push(rangeSetItem({
        name,
        value,
        dynamic
    }, range))
    el.plain = false
}

// add a raw attr (use this in preTransforms)
export function addRawAttr(el: ASTElement, name: string, value: any, range ?: Range) {
    el.attrsMap[name] = value
    el.attrsList.push(rangeSetItem({
        name,
        value
    }, range))
}

export function addDirective(
    el: ASTElement,
    name: string,
    rawName: string,
    value: string,
    arg: ? string,
    isDynamicArg: boolean,
    modifiers: ? ASTModifiers,
    range ?: Range
) {
    (el.directives || (el.directives = [])).push(rangeSetItem({
        name,
        rawName,
        value,
        arg,
        isDynamicArg,
        modifiers
    }, range))
    el.plain = false
}

function prependModifierMarker(symbol: string, name: string, dynamic ?: boolean): string {
    return dynamic ?
        `_p(${name},"${symbol}")` :
        symbol + name // mark the event as captured
}

export function addHandler(
    el: ASTElement,
    name: string,
    value: string,
    modifiers: ? ASTModifiers,
    important ?: boolean,
    warn ?: ? Function,
    range ?: Range,
    dynamic ?: boolean
) {
    modifiers = modifiers || emptyObject
    // warn prevent and passive modifier
    /* istanbul ignore if */
    //   if (
    //     process.env.NODE_ENV !== 'production' && warn &&
    //     modifiers.prevent && modifiers.passive
    //   ) {
    //     warn(
    //       'passive and prevent can\'t be used together. ' +
    //       'Passive handler can\'t prevent default event.',
    //       range
    //     )
    //   }

    // normalize click.right and click.middle since they don't actually fire
    // this is technically browser-specific, but at least for now browsers are
    // the only target envs that have right/middle clicks.
    // 规范化click.right和click.middle，
    // 因为它们实际上不会触发，这在技术上是特定于浏览器的，
    // 但至少就目前而言，浏览器是唯一具有右键/中间点击的目标环境。
    if (modifiers.right) {
        if (dynamic) {
            name = `(${name})==='click'?'contextmenu':(${name})`
        } else if (name === 'click') {
            name = 'contextmenu'
            delete modifiers.right
        }
    } else if (modifiers.middle) {
        if (dynamic) {
            name = `(${name})==='click'?'mouseup':(${name})`
        } else if (name === 'click') {
            name = 'mouseup'
        }
    }

    // check capture modifier
    // 如果capture存在 则把其处理为!
    if (modifiers.capture) {
        delete modifiers.capture
        name = prependModifierMarker('!', name, dynamic)
    }

    // 如果once存在 则把其处理为~
    if (modifiers.once) {
        delete modifiers.once
        name = prependModifierMarker('~', name, dynamic)
    }

    /* istanbul ignore if */
    // 如果passive存在 则把其处理为&
    if (modifiers.passive) {
        delete modifiers.passive
        name = prependModifierMarker('&', name, dynamic)
    }

    // 处理native修饰符 并定义了events
    let events
    if (modifiers.native) {
        delete modifiers.native
        events = el.nativeEvents || (el.nativeEvents = {})
    } else {
        events = el.events || (el.events = {})
    }

    // 处理start end 值
    const newHandler: any = rangeSetItem({
        value: value.trim(),
        dynamic
    }, range)

    if (modifiers !== emptyObject) {
        newHandler.modifiers = modifiers
    }

    const handlers = events[name]
    /* istanbul ignore if */
    // 如果是一个数组 则important值决定添加到 事件数组的头部还是尾部
    if (Array.isArray(handlers)) {
        important ? handlers.unshift(newHandler) : handlers.push(newHandler)
    } else if (handlers) { // 存在但不是数组 则根据important值 拼接为一个数组
        events[name] = important ? [newHandler, handlers] : [handlers, newHandler]
    } else { // 否则把Handler添加的events对象上
        events[name] = newHandler
    }

    el.plain = false
}

export function getRawBindingAttr(
    el: ASTElement,
    name: string
) {
    return el.rawAttrsMap[':' + name] ||
        el.rawAttrsMap['v-bind:' + name] ||
        el.rawAttrsMap[name]
}

export function getBindingAttr(
    el: ASTElement,
    name: string,
    getStatic ?: boolean
): ? string {
    const dynamicValue =
        getAndRemoveAttr(el, ':' + name) ||
        getAndRemoveAttr(el, 'v-bind:' + name)
    if (dynamicValue != null) {
        return parseFilters(dynamicValue)
    } else if (getStatic !== false) {
        const staticValue = getAndRemoveAttr(el, name)
        if (staticValue != null) {
            return JSON.stringify(staticValue)
        }
    }
}

// note: this only removes the attr from the Array (attrsList) so that it
// doesn't get processed by processAttrs.
// By default it does NOT remove it from the map (attrsMap) because the map is
// needed during codegen.
// 注意：这只会从数组（attrsList）中删除attr，以便processAttrs不会对其进行处理。
// 默认情况下，它不会从map（attrsMap）中删除它，因为在代码生成期间需要map。
export function getAndRemoveAttr(
    el: ASTElement,
    name: string,
    removeFromMap ?: boolean
): ? string {
    let val

    if ((val = el.attrsMap[name]) != null) {
        const list = el.attrsList

        for (let i = 0, l = list.length; i < l; i++) {
            // 从attrsList中删除该属性
            if (list[i].name === name) {
                list.splice(i, 1)
                break
            }
        }
    }

    // 如果需要从map上删除 传第三个参数为true
    if (removeFromMap) {
        delete el.attrsMap[name]
    }

    // 返回要获取属性得值
    return val
}

export function getAndRemoveAttrByRegex(
    el: ASTElement,
    name: RegExp
) {
    const list = el.attrsList
    for (let i = 0, l = list.length; i < l; i++) {
        const attr = list[i]
        if (name.test(attr.name)) {
            list.splice(i, 1)
            return attr
        }
    }
}

function rangeSetItem(
    item: any,
    range ?: {
        start ?: number,
        end ?: number
    }
) {
    if (range) {
        if (range.start != null) {
            item.start = range.start
        }
        if (range.end != null) {
            item.end = range.end
        }
    }
    return item
}
