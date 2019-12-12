/* @flow */

import config from 'core/config'
import {
    addHandler,
    addProp,
    getBindingAttr
} from 'compiler/helpers'
import {
    genComponentModel,
    genAssignmentCode
} from 'compiler/directives/model'

let warn

// in some cases, the event used has to be determined at runtime
// so we used some reserved tokens during compile.
export const RANGE_TOKEN = '__r'
export const CHECKBOX_RADIO_TOKEN = '__c'

export default function model(
    el: ASTElement,
    dir: ASTDirective,
    _warn: Function
): ? boolean {
    warn = _warn
    const value = dir.value
    const modifiers = dir.modifiers
    const tag = el.tag
    const type = el.attrsMap.type

    if (process.env.NODE_ENV !== 'production') {
        // inputs with type="file" are read only and setting the input's
        // value will throw an error.
        // type="file"的输入是只读的，设置输入的值将引发错误。
        if (tag === 'input' && type === 'file') {
            warn(
                `<${el.tag} v-model="${value}" type="file">:\n` +
                `File inputs are read only. Use a v-on:change listener instead.`,
                el.rawAttrsMap['v-model']
            )
        }
    }

    if (el.component) { // 处理v-model用在自定义组件上的情况
        genComponentModel(el, value, modifiers)
        // component v-model doesn't need extra runtime
        // 组件v-model不需要额外的运行时
        return false
    } else if (tag === 'select') {
        genSelect(el, value, modifiers)
    } else if (tag === 'input' && type === 'checkbox') {
        genCheckboxModel(el, value, modifiers)
    } else if (tag === 'input' && type === 'radio') {
        genRadioModel(el, value, modifiers)
    } else if (tag === 'input' || tag === 'textarea') {
        genDefaultModel(el, value, modifiers)
    } else if (!config.isReservedTag(tag)) {
        genComponentModel(el, value, modifiers)
        // component v-model doesn't need extra runtime
        // 组件v-model不需要额外的运行时
        return false
    } else if (process.env.NODE_ENV !== 'production') {
        warn(
            `<${el.tag} v-model="${value}">: ` +
            `v-model is not supported on this element type. ` +
            'If you are working with contenteditable, it\'s recommended to ' +
            'wrap a library dedicated for that purpose inside a custom component.',
            el.rawAttrsMap['v-model']
        )
    }

    // ensure runtime directive metadata
    // 确保运行时指令元数据
    return true
}

function genCheckboxModel(
    el: ASTElement,
    value: string,
    modifiers: ? ASTModifiers
) {
    const number = modifiers && modifiers.number
    const valueBinding = getBindingAttr(el, 'value') || 'null'
    const trueValueBinding = getBindingAttr(el, 'true-value') || 'true'
    const falseValueBinding = getBindingAttr(el, 'false-value') || 'false'
    addProp(el, 'checked',
        `Array.isArray(${value})` +
        `?_i(${value},${valueBinding})>-1` + (
            trueValueBinding === 'true' ?
            `:(${value})` :
            `:_q(${value},${trueValueBinding})`
        )
    )
    addHandler(el, 'change',
        `var $$a=${value},` +
        '$$el=$event.target,' +
        `$$c=$$el.checked?(${trueValueBinding}):(${falseValueBinding});` +
        'if(Array.isArray($$a)){' +
        `var $$v=${number ? '_n(' + valueBinding + ')' : valueBinding},` +
        '$$i=_i($$a,$$v);' +
        `if($$el.checked){$$i<0&&(${genAssignmentCode(value, '$$a.concat([$$v])')})}` +
        `else{$$i>-1&&(${genAssignmentCode(value, '$$a.slice(0,$$i).concat($$a.slice($$i+1))')})}` +
        `}else{${genAssignmentCode(value, '$$c')}}`,
        null, true
    )
}

function genRadioModel(
    el: ASTElement,
    value: string,
    modifiers: ? ASTModifiers
) {
    const number = modifiers && modifiers.number
    let valueBinding = getBindingAttr(el, 'value') || 'null'
    valueBinding = number ? `_n(${valueBinding})` : valueBinding
    addProp(el, 'checked', `_q(${value},${valueBinding})`)
    addHandler(el, 'change', genAssignmentCode(value, valueBinding), null, true)
}

// 处理select
function genSelect(
    el: ASTElement,
    value: string,
    modifiers: ? ASTModifiers
) {
    const number = modifiers && modifiers.number
    // 如果添加了number修饰符 则把值用_n包一下
    const selectedVal = `Array.prototype.filter` +
        `.call($event.target.options,function(o){return o.selected})` +
        `.map(function(o){var val = "_value" in o ? o._value : o.value;` +
        `return ${number ? '_n(val)' : 'val'}})`

    const assignment = '$event.target.multiple ? $$selectedVal : $$selectedVal[0]'

    let code = `var $$selectedVal = ${selectedVal};`

    code = `${code} ${genAssignmentCode(value, assignment)}`
    addHandler(el, 'change', code, null, true)
}

function genDefaultModel(
    el: ASTElement,
    value: string,
    modifiers: ? ASTModifiers
): ? boolean {
    const type = el.attrsMap.type

    // warn if v-bind:value conflicts with v-model
    // except for inputs with v-bind:type
    // 如果v-bind：value与v-model冲突，则发出警告，但带有v-bind：type的输入除外
    if (process.env.NODE_ENV !== 'production') {
        const value = el.attrsMap['v-bind:value'] || el.attrsMap[':value']
        const typeBinding = el.attrsMap['v-bind:type'] || el.attrsMap[':type']
        if (value && !typeBinding) {
            const binding = el.attrsMap['v-bind:value'] ? 'v-bind:value' : ':value'
            warn(
                `${binding}="${value}" conflicts with v-model on the same element ` +
                'because the latter already expands to a value binding internally',
                el.rawAttrsMap[binding]
            )
        }
    }

    const {
        lazy,
        number,
        trim
    } = modifiers || {}

    const needCompositionGuard = !lazy && type !== 'range'
    // 根据lazy修饰符判断绑定什么事件
    const event = lazy ?
        'change' :
        type === 'range' ? RANGE_TOKEN : 'input'

    let valueExpression = '$event.target.value'

    // 处理trim修饰符
    if (trim) {
        valueExpression = `$event.target.value.trim()`
    }

    if (number) {
        valueExpression = `_n(${valueExpression})`
    }

    let code = genAssignmentCode(value, valueExpression)

    // 处理输入法模式情况
    if (needCompositionGuard) {
        code = `if($event.target.composing)return;${code}`
    }

    // 添加prop
    addProp(el, 'value', `(${value})`)

    // 添加事件
    addHandler(el, event, code, null, true)

    // 如果使用了trim和number添加blur事件
    if (trim || number) {
        addHandler(el, 'blur', '$forceUpdate()')
    }
}
