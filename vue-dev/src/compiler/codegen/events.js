/* @flow */

// [A-Za-z_$]用来匹配首字母 [\w$]匹配所有单词字符 + $

const fnExpRE = /^([\w$_]+|\([^)]*?\))\s*=>|^function(?:\s+[\w$]+)?\s*\(/ // 匹配箭头函数或普通函数的函数定义
const fnInvokeRE = /\([^)]*?\);*$/ // 匹配函数调用 xxxx(foo);
// 匹配函数的路径，比如name、obj.name、obj["$^%#"]、obj[0]等
const simplePathRE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['[^']*?']|\["[^"]*?"]|\[\d+]|\[[A-Za-z_$][\w$]*])*$/

// KeyboardEvent.keyCode aliases
const keyCodes: {
    [key: string]: number | Array<number>
} = {
    esc: 27,
    tab: 9,
    enter: 13,
    space: 32,
    up: 38,
    left: 37,
    right: 39,
    down: 40,
    'delete': [8, 46]
}

// KeyboardEvent.key aliases
const keyNames: {
    [key: string]: string | Array<string>
} = {
    // #7880: IE11 and Edge use `Esc` for Escape key name.
    esc: ['Esc', 'Escape'],
    tab: 'Tab',
    enter: 'Enter',
    // #9112: IE11 uses `Spacebar` for Space key name.
    space: [' ', 'Spacebar'],
    // #7806: IE11 uses key names without `Arrow` prefix for arrow keys.
    up: ['Up', 'ArrowUp'],
    left: ['Left', 'ArrowLeft'],
    right: ['Right', 'ArrowRight'],
    down: ['Down', 'ArrowDown'],
    // #9112: IE11 uses `Del` for Delete key name.
    'delete': ['Backspace', 'Delete', 'Del']
}

// #4868: modifiers that prevent the execution of the listener
// need to explicitly return null so that we can determine whether to remove
// the listener for .once
// 阻止执行侦听器的修饰符需要显式返回null，
// 以便我们可以确定是否删除.once的侦听器
const genGuard = condition => `if(${condition})return null;`

// 修饰符代码处理map
const modifierCode: {
    [key: string]: string
} = {
    stop: '$event.stopPropagation();', // 停止冒泡
    prevent: '$event.preventDefault();', // 阻止默认行为
    self: genGuard(`$event.target !== $event.currentTarget`),

    ctrl: genGuard(`!$event.ctrlKey`),
    shift: genGuard(`!$event.shiftKey`),
    alt: genGuard(`!$event.altKey`),
    meta: genGuard(`!$event.metaKey`),

    left: genGuard(`'button' in $event && $event.button !== 0`),
    middle: genGuard(`'button' in $event && $event.button !== 1`),
    right: genGuard(`'button' in $event && $event.button !== 2`)
}

export function genHandlers(
    events: ASTElementHandlers,
    isNative: boolean
): string {
    const prefix = isNative ? 'nativeOn:' : 'on:' // 事件前缀
    let staticHandlers = ``
    let dynamicHandlers = ``

    // 循环调用 生成每个事件处理后的函数字符串
    for (const name in events) {
        const handlerCode = genHandler(events[name])

        if (events[name] && events[name].dynamic) {
            dynamicHandlers += `${name},${handlerCode},`
        } else {
            staticHandlers += `"${name}":${handlerCode},`
        }
    }

    staticHandlers = `{${staticHandlers.slice(0, -1)}}`

    if (dynamicHandlers) {
        return prefix + `_d(${staticHandlers},[${dynamicHandlers.slice(0, -1)}])`
    } else {
        return prefix + staticHandlers
    }
}

// Generate handler code with binding params on Weex
/* istanbul ignore next */
function genWeexHandler(params: Array<any> , handlerCode: string) {
    let innerHandlerCode = handlerCode
    const exps = params.filter(exp => simplePathRE.test(exp) && exp !== '$event')
    const bindings = exps.map(exp => ({
        '@binding': exp
    }))
    const args = exps.map((exp, i) => {
        const key = `$_${i + 1}`
        innerHandlerCode = innerHandlerCode.replace(exp, key)
        return key
    })
    args.push('$event')
    return '{\n' +
        `handler:function(${args.join(',')}){${innerHandlerCode}},\n` +
        `params:${JSON.stringify(bindings)}\n` +
        '}'
}

function genHandler(handler: ASTElementHandler | Array<ASTElementHandler> ): string {
    // handler为空，则返回一个空函数的字符串 Chang-Jin 2019-11-26
    if (!handler) {
        return 'function(){}'
    }

    // 如果handler是一个数组，说明一个事件添加了多个处理函数，依次调用genHandler生成字符串并合到一个数组中
    if (Array.isArray(handler)) {
        return `[${handler.map(handler => genHandler(handler)).join(',')}]`
    }

    const isMethodPath = simplePathRE.test(handler.value) // 匹配函数路径
    const isFunctionExpression = fnExpRE.test(handler.value) // 匹配函数表达式
    const isFunctionInvocation = simplePathRE.test(handler.value.replace(fnInvokeRE, '')) // 匹配函数调用

    // 没有修饰符
    if (!handler.modifiers) {
        if (isMethodPath || isFunctionExpression) {
            return handler.value
        }
        /* istanbul ignore if */
        // if (__WEEX__ && handler.params) {
        //     return genWeexHandler(handler.params, handler.value)
        // }
        return `function($event){${isFunctionInvocation ? `return ${handler.value}` : handler.value}}` // inline statement
    } else { // 存在修饰符
        let code = ''
        let genModifierCode = ''
        const keys = []
        for (const key in handler.modifiers) {
            // 如果修饰符为stop prevent self 等 则直接返回修饰符对应的字符串
            if (modifierCode[key]) {
                genModifierCode += modifierCode[key]

                // left/right
                // 如果是left或right 还需要添加到keys数组中
                if (keyCodes[key]) {
                    keys.push(key)
                }
            } else if (key === 'exact') { // 处理精确控制的情况
                const modifiers: ASTModifiers = (handler.modifiers: any)

                // 就是当有下列这些键一起触发时候不执行
                genModifierCode += genGuard(
                    ['ctrl', 'shift', 'alt', 'meta']
                    .filter(keyModifier => !modifiers[keyModifier])
                    .map(keyModifier => `$event.${keyModifier}Key`)
                    .join('||')
                )
            } else { // 不是以上修饰符则添加到keys中
                keys.push(key)
            }
        }

        // 处理keys
        if (keys.length) {
            code += genKeyFilter(keys)
        }

        // Make sure modifiers like prevent and stop get executed after key filtering
        // 确保在过滤键后执行诸如prevent和stop之类的修饰符
        if (genModifierCode) {
            code += genModifierCode
        }

        // 处理给事件传入的函数
        const handlerCode = isMethodPath ? `return ${handler.value}($event)` : isFunctionExpression ? `return (${handler.value})($event)` : isFunctionInvocation ? `return ${handler.value}` : handler.value
        /* istanbul ignore if */
        // if (__WEEX__ && handler.params) {
        //     return genWeexHandler(handler.params, code + handlerCode)
        // }

        // 把修饰符解析出的代码和给事件传入的函数合并 成一个render字符串
        return `function($event){${code}${handlerCode}}`
    }
}

// 返回一个判断不符合一定条件就return null字符串
function genKeyFilter(keys: Array<string> ): string {
    // eg: if(!$event.type.indexOf('key')&&_k($event.keyCode,"enter",13,$event.key,"Enter"))return null;
    return (
        // make sure the key filters only apply to KeyboardEvents
        // #9441: can't use 'keyCode' in $event because Chrome autofill fires fake
        // key events that do not have keyCode property...
        // 确保键过滤器仅适用于KeyboardEvents
        // 在$event中不能使用“ keyCode”，因为Chrome自动填充会触发不具有keyCode属性的假按键事件...
        `if(!$event.type.indexOf('key')&&${keys.map(genFilterCode).join('&&')})return null;`
    )
}

function genFilterCode(key: string): string {
    const keyVal = parseInt(key, 10)

    // key是数字则直接返回
    if (keyVal) {
        return `$event.keyCode!==${keyVal}`
    }

    const keyCode = keyCodes[key] // 字母转化为数字
    const keyName = keyNames[key] // 兼容不同浏览器的情况

    return (
        `_k($event.keyCode,${JSON.stringify(key)},${JSON.stringify(keyCode)},$event.key,${JSON.stringify(keyName)})`
    )
}
