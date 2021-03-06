/* @flow */

import {
    genHandlers
} from './events'
import baseDirectives from '../directives/index'
import {
    camelize,
    no,
    extend
} from 'shared/util'
import {
    baseWarn,
    pluckModuleFunction
} from '../helpers'
import {
    emptySlotScopeToken
} from '../parser/index'

type TransformFunction = (el: ASTElement, code: string) => string;
type DataGenFunction = (el: ASTElement) => string;
type DirectiveFunction = (el: ASTElement, dir: ASTDirective, warn: Function) => boolean;

export class CodegenState {
    options: CompilerOptions;
    warn: Function;
    transforms: Array<TransformFunction> ;
    dataGenFns: Array<DataGenFunction> ;
    directives: {
        [key: string]: DirectiveFunction
    };
    maybeComponent: (el: ASTElement) => boolean;
    onceId: number;
    staticRenderFns: Array<string> ;
    pre: boolean;

    constructor(options: CompilerOptions) {
        this.options = options
        this.warn = options.warn || baseWarn
        this.transforms = pluckModuleFunction(options.modules, 'transformCode')
        this.dataGenFns = pluckModuleFunction(options.modules, 'genData')
        this.directives = extend(extend({}, baseDirectives), options.directives)
        const isReservedTag = options.isReservedTag || no
        this.maybeComponent = (el: ASTElement) => !!el.component || !isReservedTag(el.tag) // 是一个组件 或者 不标签名不是保留标签 Chang-Jin 2019-11-18
        this.onceId = 0
        this.staticRenderFns = []
        this.pre = false
    }
}

export type CodegenResult = {
    render: string,
    staticRenderFns: Array<string>
};

export function generate(
    ast: ASTElement | void,
    options: CompilerOptions
): CodegenResult {
    const state = new CodegenState(options)
    const code = ast ? genElement(ast, state) : '_c("div")'
    return {
        render: `with(this){return ${code}}`,
        staticRenderFns: state.staticRenderFns
    }
}

export function genElement(el: ASTElement, state: CodegenState): string {
    if (el.parent) {
        el.pre = el.pre || el.parent.pre
    }

    if (el.staticRoot && !el.staticProcessed) {
        return genStatic(el, state)
    } else if (el.once && !el.onceProcessed) {
        return genOnce(el, state)
    } else if (el.for && !el.forProcessed) {
        return genFor(el, state)
    } else if (el.if && !el.ifProcessed) {
        return genIf(el, state)
    } else if (el.tag === 'template' && !el.slotTarget && !state.pre) {
        return genChildren(el, state) || 'void 0'
    } else if (el.tag === 'slot') {
        return genSlot(el, state)
    } else {
        // component or element
        let code

        // el.component保存的是<component :is="xxx">标签上is指向的模板 Chang-Jin 2019-11-15
        if (el.component) {
            code = genComponent(el.component, el, state)
        } else {
            let data
            if (!el.plain || (el.pre && state.maybeComponent(el))) {
                data = genData(el, state) // genData 用来生成_c第二个参数--给元素添加的属性 Chang-Jin 2019-11-15
            }

            const children = el.inlineTemplate ? null : genChildren(el, state, true)
            code = `_c('${el.tag}'${
        data ? `,${data}` : '' // data
      }${
        children ? `,${children}` : '' // children
      })`
        }
        // module transforms
        for (let i = 0; i < state.transforms.length; i++) {
            code = state.transforms[i](el, code)
        }
        return code
    }
}

// hoist static sub-trees out
/**
 * 处理静态节点
 *
 * @param {ASTElement} el AST元素
 * @param {CodegenState} state
 * @returns {string} 一个处理静态节点的render函数字符串
 */
function genStatic(el: ASTElement, state: CodegenState): string {
    el.staticProcessed = true
    // Some elements (templates) need to behave differently inside of a v-pre
    // node.  All pre nodes are static roots, so we can use this as a location to
    // wrap a state change and reset it upon exiting the pre node.
    const originalPreState = state.pre
    if (el.pre) {
        state.pre = el.pre
    }

    // 对静态根节点及其子内容单独分离出来处理。 Chang-Jin 2019-11-15
    state.staticRenderFns.push(`with(this){return ${genElement(el, state)}}`)
    state.pre = originalPreState
    return `_m(${
    state.staticRenderFns.length - 1 // 注意这里传的正是当前静态文本在state.staticRenderFns中的索引 Chang-Jin 2019-11-15
  }${
    el.staticInFor ? ',true' : ''
  })`
}

// v-once
function genOnce(el: ASTElement, state: CodegenState): string {
    el.onceProcessed = true // 在ast上添加onceProcessed标识

    if (el.if && !el.ifProcessed) { // 如果和if一起使用 则调用genIf进行处理
        // genIf中还会处理genOnce 说明genIf的处理比genOnce优先
        return genIf(el, state)
    } else if (el.staticInFor) { // v-once用到v-for中
        let key = ''
        let parent = el.parent

        // 遍历父级取key值
        while (parent) {
            if (parent.for) {
                key = parent.key
                break
            }
            parent = parent.parent
        }

        // key值不存在 则提示错误 并直接返回genElement到的render字符串
        // 此时v-once其实是没用了
        if (!key) {
            process.env.NODE_ENV !== 'production' && state.warn(
                `v-once can only be used inside v-for that is keyed. `,
                el.rawAttrsMap['v-once']
            )

            return genElement(el, state)
        }

        // key值存在则返回 _o包着的一个render字符串
        // "_o(_c('p',[_v("v-once: "+_s(i))]),1,i)"
        // state.onceId是因为v-for中可能包含多个v-once 用于给vnode生成唯一的key
        return `_o(${genElement(el, state)},${state.onceId++},${key})`
    } else { // 不与if同用 且不再for中 则按静态节点处理
        return genStatic(el, state)
    }
}

export function genIf(
    el: any,
    state: CodegenState,
    altGen ?: Function,
    altEmpty ?: string
): string {
    el.ifProcessed = true // avoid recursion 防止递归
    return genIfConditions(el.ifConditions.slice(), state, altGen, altEmpty)
}

// 返回类似"(value == 1)?_c('p',[_v("v-if块的内容")]):(value == 2)?_c('p',[_v("v-else-if块的内容")]):_c('p',[_v("v-else块的内容")])"的render字符串
function genIfConditions(
    conditions: ASTIfConditions,
    state: CodegenState,
    altGen ?: Function,
    altEmpty ?: string
): string {
    // 如果ifCondition数组为空 则直接返回一个'_e()'
    if (!conditions.length) {
        return altEmpty || '_e()'
    }

    const condition = conditions.shift() // 取出第一个条件

    // 返回一个三目运算符字符串
    if (condition.exp) {
        return `(${condition.exp}) ?
                ${genTernaryExp(condition.block)} :
                ${genIfConditions(conditions, state, altGen, altEmpty)}`
    } else {
        return `${genTernaryExp(condition.block)}`
    }

    // v-if with v-once should generate code like (a)?_m(0):_m(1)
    // v-if与v-once应该生成类似(a)?_m(0):_m(1)的代码
    function genTernaryExp(el) {
        return altGen ?
            altGen(el, state) :
            el.once ? genOnce(el, state) : genElement(el, state)
    }
}

/**
 *
 *
 * @export
 * @param {*} el AST
 * @param {CodegenState} state
 * @param {Function} [altGen]
 * @param {string} [altHelper]
 * @returns {string}
 */
export function genFor(
    el: any,
    state: CodegenState,
    altGen ?: Function,
    altHelper ?: string
): string {
    const exp = el.for
    const alias = el.alias
    const iterator1 = el.iterator1 ? `,${el.iterator1}` : ''
    const iterator2 = el.iterator2 ? `,${el.iterator2}` : ''

    // 生产环境下 如果是自定义元素且不是slot和template，则必须有el.key
    if (process.env.NODE_ENV !== 'production' &&
        state.maybeComponent(el) &&
        el.tag !== 'slot' &&
        el.tag !== 'template' &&
        !el.key
    ) {
        state.warn(
            `<${el.tag} v-for="${alias} in ${exp}">: component lists rendered with ` +
            `v-for should have explicit keys. ` +
            `See https://vuejs.org/guide/list.html#key for more info.`,
            el.rawAttrsMap['v-for'],
            true /* tip */
        )
    }

    // 添加已处理标识
    el.forProcessed = true // avoid recursion 防止递归

    // 返回render字符串
    return `${altHelper || '_l'}((${exp}),` +
        `function(${alias}${iterator1}${iterator2}){` +
        `return ${(altGen || genElement)(el, state)}` +
        '})'
}

// 编译AST的属性
export function genData(el: ASTElement, state: CodegenState): string {
    let data = '{'

    // directives first.
    // directives may mutate the el's other properties before they are generated.
    // 指令可能会在生成el的其他属性之前对其进行更改。
    const dirs = genDirectives(el, state)
    if (dirs) data += dirs + ','

    // key
    if (el.key) {
        data += `key:${el.key},`
    }
    // ref
    if (el.ref) {
        data += `ref:${el.ref},`
    }
    if (el.refInFor) {
        data += `refInFor:true,`
    }
    // pre
    if (el.pre) {
        data += `pre:true,`
    }
    // record original tag name for components using "is" attribute
    if (el.component) {
        data += `tag:"${el.tag}",`
    }
    // module data generation functions
    for (let i = 0; i < state.dataGenFns.length; i++) {
        data += state.dataGenFns[i](el)
    }

    // attributes
    if (el.attrs) {
        data += `attrs:${genProps(el.attrs)},` // genProps把属性链接为字符串 Chang-Jin 2019-11-15
    }

    // DOM props
    // 处理DOM上的属性
    if (el.props) {
        data += `domProps:${genProps(el.props)},`
    }

    // event handlers
    // 处理事件相关属性 Chang-Jin 2019-11-26
    if (el.events) {
        data += `${genHandlers(el.events, false)},`
    }
    if (el.nativeEvents) {
        data += `${genHandlers(el.nativeEvents, true)},`
    }

    // slot target
    // only for non-scoped slots
    // 处理slot target
    if (el.slotTarget && !el.slotScope) {
        data += `slot:${el.slotTarget},`
    }

    // scoped slots
    // 处理scope-slot属性 返回一个到data上
    if (el.scopedSlots) {
        data += `${genScopedSlots(el, el.scopedSlots, state)},`
    }
    // component v-model
    if (el.model) {
        data += `model:{value:${
      el.model.value
    },callback:${
      el.model.callback
    },expression:${
      el.model.expression
    }},`
    }
    // inline-template
    if (el.inlineTemplate) {
        const inlineTemplate = genInlineTemplate(el, state)
        if (inlineTemplate) {
            data += `${inlineTemplate},`
        }
    }
    data = data.replace(/,$/, '') + '}'
    // v-bind dynamic argument wrap
    // v-bind with dynamic arguments must be applied using the same v-bind object
    // merge helper so that class/style/mustUseProp attrs are handled correctly.
    if (el.dynamicAttrs) {
        data = `_b(${data},"${el.tag}",${genProps(el.dynamicAttrs)})`
    }
    // v-bind data wrap
    if (el.wrapData) {
        data = el.wrapData(data)
    }
    // v-on data wrap
    if (el.wrapListeners) {
        data = el.wrapListeners(data)
    }
    return data
}

function genDirectives(el: ASTElement, state: CodegenState): string | void {
    const dirs = el.directives // 获取ast上的directives数组

    if (!dirs) return // 不存在则直接返回

    let res = 'directives:['
    let hasRuntime = false
    let i, l, dir, needRuntime

    for (i = 0, l = dirs.length; i < l; i++) {
        dir = dirs[i]
        needRuntime = true

        // 判断指令是否已存在
        const gen: DirectiveFunction = state.directives[dir.name] // state.directives 默认包括bind cloak html model on text

        // 如果指令已存在 判断其是否需要运行时
        if (gen) {
            // compile-time directive that manipulates AST.
            // returns true if it also needs a runtime counterpart.
            // 操纵AST的编译时指令。
            // 如果还需要运行时副本，则返回true。
            needRuntime = !!gen(el, dir, state.warn)
        }

        if (needRuntime) {
            hasRuntime = true
            res += `{
                name:"${dir.name}",
                rawName:"${dir.rawName}"
                ${dir.value ?
                    `,value:(${dir.value}),expression:${JSON.stringify(dir.value)}` : 
                    ''}
                ${dir.arg ?
                    `,arg:${dir.isDynamicArg ? dir.arg : `"${dir.arg}"`}` :
                    ''}
                ${dir.modifiers ?
                    `,modifiers:${JSON.stringify(dir.modifiers)}` :
                    ''}},`
        }
    }

    if (hasRuntime) {
        return res.slice(0, -1) + ']'
    }
}

function genInlineTemplate(el: ASTElement, state: CodegenState): ? string {
    const ast = el.children[0]
    if (process.env.NODE_ENV !== 'production' && (
            el.children.length !== 1 || ast.type !== 1
        )) {
        state.warn(
            'Inline-template components must have exactly one child element.', {
                start: el.start
            }
        )
    }
    if (ast && ast.type === 1) {
        const inlineRenderFns = generate(ast, state.options)
        return `inlineTemplate:{render:function(){${
      inlineRenderFns.render
    }},staticRenderFns:[${
      inlineRenderFns.staticRenderFns.map(code => `function(){${code}}`).join(',')
    }]}`
    }
}

function genScopedSlots(
    el: ASTElement,
    slots: {
        [key: string]: ASTElement
    },
    state: CodegenState
): string {
    // by default scoped slots are considered "stable", this allows child
    // components with only scoped slots to skip forced updates from parent.
    // but in some cases we have to bail-out of this optimization
    // for example if the slot contains dynamic names, has v-if or v-for on them...
    // 默认情况下，作用域插槽被认为是“稳定的”，
    // 这允许仅具有作用域插槽的子组件跳过来自父代的强制更新。
    // 但在某些情况下，例如，如果slot包含动态名称，在其上带有v-if或v-for，则我们必须放弃这种优化措施...
    // 当前元素如果存在v-for循环/
    let needsForceUpdate = el.for || Object.keys(slots).some(key => {
        const slot = slots[key]

        return (
            slot.slotTargetDynamic ||
            slot.if ||
            slot.for ||
            containsSlotChild(slot) // is passing down slot from parent which may be dynamic 正在从父级传递slot，这可能是动态的
        )
    })

    // #9534: if a component with scoped slots is inside a conditional branch,
    // it's possible for the same component to be reused but with different
    // compiled slot content. To avoid that, we generate a unique key based on
    // the generated code of all the slot contents.
    // ＃9534：如果具有作用域插槽的组件位于条件分支中，
    // 有可能重复使用相同的组件，但编译后的插槽内容不同。
    // 为了避免这种情况，我们根据所有slot内容的生成代码生成唯一密钥。
    let needsKey = !!el.if

    // OR when it is inside another scoped slot or v-for (the reactivity may be
    // disconnected due to the intermediate scope variable)
    // #9438, #9506
    // TODO: this can be further optimized by properly analyzing in-scope bindings
    // and skip force updating ones that do not actually use scope variables.
    // 或者当它在另一个作用域插槽或v-for中时（由于中间作用域变量，反应性可能会断开）
    // ＃9438，＃9506
    // TODO：可以通过适当地分析范围内的绑定并跳过不实际使用范围变量的强制更新来进一步优化此绑定。
    if (!needsForceUpdate) {
        let parent = el.parent
        while (parent) {
            if (
                (parent.slotScope && parent.slotScope !== emptySlotScopeToken) ||
                parent.for
            ) {
                needsForceUpdate = true
                break
            }
            if (parent.if) {
                needsKey = true
            }
            parent = parent.parent
        }
    }

    const generatedSlots = Object.keys(slots)
        .map(key => genScopedSlot(slots[key], state))
        .join(',')

    return `scopedSlots:_u([${generatedSlots}]${needsForceUpdate ? `,null,true` : ``}${!needsForceUpdate && needsKey ? `,null,false,${hash(generatedSlots)}` : ``})`
}

function hash(str) {
    let hash = 5381
    let i = str.length
    while (i) {
        hash = (hash * 33) ^ str.charCodeAt(--i)
    }
    return hash >>> 0
}

function containsSlotChild(el: ASTNode): boolean {
    if (el.type === 1) {
        if (el.tag === 'slot') {
            return true
        }
        return el.children.some(containsSlotChild)
    }
    return false
}

function genScopedSlot(
    el: ASTElement,
    state: CodegenState
): string {
    const isLegacySyntax = el.attrsMap['slot-scope']

    // 如果存在if 则if优先处理
    if (el.if && !el.ifProcessed && !isLegacySyntax) {
        return genIf(el, state, genScopedSlot, `null`)
    }

    // 存在for 则for优先处理
    if (el.for && !el.forProcessed) {
        return genFor(el, state, genScopedSlot)
    }

    const slotScope = el.slotScope === emptySlotScopeToken ? `` : String(el.slotScope)

    // 这里会处理template中的子元素
    const fn = `function(${slotScope}){` +
        `return ${el.tag === 'template' ?
            el.if && isLegacySyntax ?
                `(${el.if})?${genChildren(el, state) || 'undefined'}:undefined` :
                genChildren(el, state) || 'undefined' :
            genElement(el, state)
    }}`

    // reverse proxy v-slot without scope on this.$slots
    const reverseProxy = slotScope ? `` : `,proxy:true`

    return `{key:${el.slotTarget || `"default"`},fn:${fn}${reverseProxy}}`
}

export function genChildren(
    el: ASTElement,
    state: CodegenState,
    checkSkip ?: boolean,
    altGenElement ?: Function,
    altGenNode ?: Function
): string | void {
    const children = el.children
    if (children.length) {
        const el: any = children[0]
        // optimize single v-for
        if (children.length === 1 &&
            el.for &&
            el.tag !== 'template' &&
            el.tag !== 'slot'
        ) {
            const normalizationType = checkSkip ?
                state.maybeComponent(el) ? `,1` : `,0` :
                ``
            return `${(altGenElement || genElement)(el, state)}${normalizationType}`
        }
        const normalizationType = checkSkip ?
            getNormalizationType(children, state.maybeComponent) :
            0
        const gen = altGenNode || genNode

        // 返回的字符串中对children依次执行getNode，并通过,相连
        return `[${children.map(c => gen(c, state)).join(',')}]${
      normalizationType ? `,${normalizationType}` : ''
    }`
    }
}

// determine the normalization needed for the children array.
// 0: no normalization needed
// 1: simple normalization needed (possible 1-level deep nested array)
// 2: full normalization needed
// 确定子数组所需的归一化。
// 0：无需归一化
// 1：需要简单的归一化（可能的1级深度嵌套数组）
// 2：需要完全归一化
function getNormalizationType(
    children: Array<ASTNode> ,
    maybeComponent: (el: ASTElement) => boolean
): number {
    let res = 0
    for (let i = 0; i < children.length; i++) {
        const el: ASTNode = children[i]
        if (el.type !== 1) {
            continue
        }

        // el需要归一化 用来判断级别
        // el是if块，但块内元素有内容符合上述三个条件的 Chang-Jin 2019-11-18
        if (needsNormalization(el) ||
            (el.ifConditions && el.ifConditions.some(c => needsNormalization(c.block)))) {
            res = 2
            break
        }

        // el是自定义组件或el是if块，但块内元素有自定义组件的 Chang-Jin 2019-11-18
        if (maybeComponent(el) ||
            (el.ifConditions && el.ifConditions.some(c => maybeComponent(c.block)))) {
            res = 1
        }
    }
    return res
}

// el上有`v-for`或标签名是`template`或`slot` Chang-Jin 2019-11-18
function needsNormalization(el: ASTElement): boolean {
    return el.for !== undefined || el.tag === 'template' || el.tag === 'slot'
}

function genNode(node: ASTNode, state: CodegenState): string {
    if (node.type === 1) {
        return genElement(node, state)
    } else if (node.type === 3 && node.isComment) {
        return genComment(node)
    } else {
        return genText(node)
    }
}

export function genText(text: ASTText | ASTExpression): string {
    return `_v(${text.type === 2
    ? text.expression // no need for () because already wrapped in _s()
    : transformSpecialNewlines(JSON.stringify(text.text))
  })`
}

export function genComment(comment: ASTText): string {
    return `_e(${JSON.stringify(comment.text)})`
}

// 处理slot元素
function genSlot(el: ASTElement, state: CodegenState): string {
    const slotName = el.slotName || '"default"'
    const children = genChildren(el, state) // 处理slot中的子元素
    let res = `_t(${slotName}${children ? `,${children}` : ''}`
    const attrs = el.attrs || el.dynamicAttrs ?
        genProps((el.attrs || []).concat(el.dynamicAttrs || []).map(attr => ({
            // slot props are camelized 转化为驼峰式
            name: camelize(attr.name),
            value: attr.value,
            dynamic: attr.dynamic
        }))) :
        null
    const bind = el.attrsMap['v-bind']

    if ((attrs || bind) && !children) {
        res += `,null`
    }

    // 处理slot上其他属性
    if (attrs) {
        res += `,${attrs}`
    }

    // 处理slot上的bind
    if (bind) {
        res += `${attrs ? '' : ',null'},${bind}`
    }

    return res + ')'
}

// componentName is el.component, take it as argument to shun flow's pessimistic refinement
function genComponent(
    componentName: string,
    el: ASTElement,
    state: CodegenState
): string {
    const children = el.inlineTemplate ? null : genChildren(el, state, true)
    return `_c(${componentName},${genData(el, state)}${
    children ? `,${children}` : ''
  })`
}

// 把Props数组的值转化为键值形式的render字符串 例: "{"textContent":_s(value)}" Chang-Jin 2019-11-18
function genProps(props: Array<ASTAttr> ): string {
    let staticProps = ``
    let dynamicProps = ``

    for (let i = 0; i < props.length; i++) {
        const prop = props[i]
        const value = __WEEX__ ?
            generateValue(prop.value) :
            transformSpecialNewlines(prop.value)

        if (prop.dynamic) {
            dynamicProps += `${prop.name},${value},`
        } else {
            staticProps += `"${prop.name}":${value},`
        }
    }

    staticProps = `{${staticProps.slice(0, -1)}}`

    // 如果是动态类型则用_d包裹 Chang-Jin 2019-11-18
    if (dynamicProps) {
        return `_d(${staticProps},[${dynamicProps.slice(0, -1)}])`
    } else {
        return staticProps
    }
}

/* istanbul ignore next */
function generateValue(value) {
    if (typeof value === 'string') {
        return transformSpecialNewlines(value)
    }
    return JSON.stringify(value)
}

// #3895, #4268
function transformSpecialNewlines(text: string): string {
    return text
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029')
}
