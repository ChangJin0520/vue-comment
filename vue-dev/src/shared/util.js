/* @flow */

// 定义一个被冻结的空对象 需要赋值空对象的就用它 也可以用===来方便的判断某个变量是否为此空对象
export const emptyObject = Object.freeze({})

// These helpers produce better VM code in JS engines due to their
// explicitness and function inlining.
// 这些helpers由于其明确性和功能内联性，因此可以在JS引擎中生成更好的VM代码。

// 未定义
export function isUndef(v: any): boolean {
    return v === undefined || v === null
}

// 以定义
export function isDef(v: any): boolean {
    return v !== undefined && v !== null
}

// 值true
export function isTrue(v: any): boolean {
    return v === true
}

// 值false
export function isFalse(v: any): boolean {
    return v === false
}

/**
 * Check if value is primitive.
 * 判断基本数据类型
 */
export function isPrimitive(value: any): boolean {
    return (
        typeof value === 'string' ||
        typeof value === 'number' ||
        // $flow-disable-line
        typeof value === 'symbol' ||
        typeof value === 'boolean'
    )
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 * 是否为不为null的对象
 */
export function isObject(obj: mixed): boolean {
    return obj !== null && typeof obj === 'object'
}

/**
 * Get the raw type string of a value, e.g., [object Object].
 * 获取值的原始类型字符串，例如[object Object]。
 */
const _toString = Object.prototype.toString

export function toRawType(value: any): string {
    return _toString.call(value).slice(8, -1)
}

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 * 严格的对象类型检查。 仅对纯JavaScript对象返回true。
 */
export function isPlainObject(obj: any): boolean {
    return _toString.call(obj) === '[object Object]'
}

// 判断正则表达式
export function isRegExp(v: any): boolean {
    return _toString.call(v) === '[object RegExp]'
}

/**
 * Check if val is a valid array index.
 * 检查val是否为有效的数组索引。
 */
export function isValidArrayIndex(val: any): boolean {
    const n = parseFloat(String(val))
    return n >= 0 && Math.floor(n) === n && isFinite(val)
}

// 使用thenable判断Promise
export function isPromise(val: any): boolean {
    return (
        isDef(val) &&
        typeof val.then === 'function' &&
        typeof val.catch === 'function'
    )
}

/**
 * Convert a value to a string that is actually rendered.
 * 将值转换为实际呈现的字符串。
 */
export function toString(val: any): string {
    return val == null ?
        '' :
        Array.isArray(val) || (isPlainObject(val) && val.toString === _toString) ?
        JSON.stringify(val, null, 2) :
        String(val)
}

/**
 * Convert an input value to a number for persistence.
 * If the conversion fails, return original string.
 * 将输入值转换为数字。
 * 如果转换失败，则返回原始字符串。
 */
export function toNumber(val: string): number | string {
    const n = parseFloat(val)
    return isNaN(n) ? val : n
}

/**
 * Make a map and return a function for checking if a key
 * is in that map.
 * 把字符串转为一个map，并返回一个用于检查键是否在该map中的函数。
 */
export function makeMap(
    str,
    expectsLowerCase
) {
    const map = Object.create(null)
    const list = str.split(',')

    for (let i = 0; i < list.length; i++) {
        map[list[i]] = true
    }
    return expectsLowerCase ?
        val => map[val.toLowerCase()] :
        val => map[val]
}

/**
 * Check if a tag is a built-in tag.
 * 检查标签是否为Vue内置标签。
 */
export const isBuiltInTag = makeMap('slot,component', true)

/**
 * Check if an attribute is a reserved attribute.
 * 检查属性是否为Vue保留属性
 */
export const isReservedAttribute = makeMap('key,ref,slot,slot-scope,is')

/**
 * Remove an item from an array.
 * 从数组中移除某项
 */
export function remove(arr: Array < any > , item: any): Array < any > | void {
    if (arr.length) {
        const index = arr.indexOf(item)
        if (index > -1) {
            return arr.splice(index, 1)
        }
    }
}

/**
 * Check whether an object has the property.
 * 检查处理下原生hasOwnProperty
 */
const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn(obj, key) {
    return hasOwnProperty.call(obj, key)
}

/**
 * Create a cached version of a pure function.
 * 创建纯函数的缓存版本。
 */
// 为传入函数的执行结果做一个缓存
// 如果已经执行过该传入str则直接从缓存中取，不用再执行一遍函数了 Chang-Jin 2019-12-19
export function cached(fn) {
    const cache = Object.create(null)

    return function cachedFn(str) {
        const hit = cache[str]
        return hit || (cache[str] = fn(str))
    }
}

/**
 * Camelize a hyphen-delimited string.
 * 把连字符分隔的字符串转化为驼峰式
 */
const camelizeRE = /-(\w)/g
export const camelize = cached((str) => {
    return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
})

/**
 * Capitalize a string.
 * 转大写
 */
export const capitalize = cached((str) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
})

/**
 * Hyphenate a camelCase string.
 * 驼峰式转为连字符式
 */
const hyphenateRE = /\B([A-Z])/g
export const hyphenate = cached((str) => {
    return str.replace(hyphenateRE, '-$1').toLowerCase()
})

/**
 * Simple bind polyfill for environments that do not support it,
 * e.g., PhantomJS 1.x. Technically, we don't need this anymore
 * since native bind is now performant enough in most browsers.
 * But removing it would mean breaking code that was able to run in
 * PhantomJS 1.x, so this must be kept for backward compatibility.
 * 简单bind polyfill用于不支持它的环境，
 * 例如，PhantomJS1.x。
 * 从技术上讲，我们不再需要此功能，因为在大多数浏览器中，本机绑定现在已足够高效。
 * 但是删除它意味着破坏可以在PhantomJS 1.x中运行的代码，因此必须保留此代码以实现向后兼容。
 */

/* istanbul ignore next */
function polyfillBind(fn: Function, ctx: Object): Function {
    function boundFn(a) {
        const l = arguments.length

        return l ?
            l > 1 ?
            fn.apply(ctx, arguments) :
            fn.call(ctx, a) :
            fn.call(ctx)
    }

    boundFn._length = fn.length

    return boundFn
}

function nativeBind(fn: Function, ctx: Object): Function {
    return fn.bind(ctx)
}

// 把bind方法处理为bind(fn, ctx)形式
export const bind = Function.prototype.bind ?
    nativeBind :
    polyfillBind


/**
 * Convert an Array-like object to a real Array.
 * 类数组转数组
 */
export function toArray(list, start) {
    start = start || 0
    let i = list.length - start
    const ret = new Array(i)

    // 这里把类数组中各项的引用拿过来
    while (i--) {
        ret[i] = list[i + start]
    }

    return ret
}

/**
 * Mix properties into target object.
 * 把属性添加到目标对象
 * 如果属性重名会修改的
 */
export function extend(to, _from) {
    for (const key in _from) {
        to[key] = _from[key]
    }

    return to
}

/**
 * Merge an Array of Objects into a single Object.
 * 把一个包含对象的数组 扁平化为一个对象
 */
export function toObject(arr: Array < any > ): Object {
    const res = {}

    for (let i = 0; i < arr.length; i++) {
        if (arr[i]) {
            extend(res, arr[i])
        }
    }

    return res
}

/* eslint-disable no-unused-vars */

/**
 * Perform no operation.
 * Stubbing args to make Flow happy without leaving useless transpiled code
 * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/).
 * 不执行任何操作。
 * 参数是为了make Flow happy 0.0
 */
export function noop(a ? : any, b ? : any, c ? : any) {}

/**
 * Always return false.
 * 总是返回false
 */
export const no = (a ? : any, b ? : any, c ? : any) => false

/* eslint-enable no-unused-vars */

/**
 * Return the same value.
 * 传什么就返回什么
 */
export const identity = (_: any) => _

/**
 * Generate a string containing static keys from compiler modules.
 * 从编译器模块生成包含静态键的字符串。
 * 把modules中每项的staticKeys累加, 然后返回一个`,`隔开字符串
 */
export function genStaticKeys(modules: Array < ModuleOptions > ): string {
    return modules.reduce((keys, m) => {
        return keys.concat(m.staticKeys || [])
    }, []).join(',')
}

/**
 * Check if two values are loosely equal - that is,
 * if they are plain objects, do they have the same shape?
 * 检查两个值是否大致相等
 * 也就是说，如果它们是普通对象，它们是否具有相同的形状？
 * 对基本数据类型调用的是String()方法
 */
export function looseEqual(a: any, b: any): boolean {
    if (a === b) return true

    const isObjectA = isObject(a)
    const isObjectB = isObject(b)

    if (isObjectA && isObjectB) {
        try {
            const isArrayA = Array.isArray(a)
            const isArrayB = Array.isArray(b)

            if (isArrayA && isArrayB) { // Array
                return a.length === b.length && a.every((e, i) => {
                    return looseEqual(e, b[i])
                })
            } else if (a instanceof Date && b instanceof Date) { // Date
                return a.getTime() === b.getTime()
            } else if (!isArrayA && !isArrayB) {
                const keysA = Object.keys(a)
                const keysB = Object.keys(b)

                return keysA.length === keysB.length && keysA.every(key => {
                    return looseEqual(a[key], b[key])
                })
            } else {
                /* istanbul ignore next */
                return false
            }
        } catch (e) {
            /* istanbul ignore next */
            return false
        }
    } else if (!isObjectA && !isObjectB) { // 非对象
        return String(a) === String(b) // String("") === String([])
    } else {
        return false
    }
}

/**
 * Return the first index at which a loosely equal value can be
 * found in the array (if value is a plain object, the array must
 * contain an object of the same shape), or -1 if it is not present.
 * 返回第一个索引
 * 可以在数组中找到一个大致相等的值（如果value是一个普通对象，则该数组必须包含相同形状的对象）；
 * 如果不存在，则返回-1。
 */
export function looseIndexOf(arr: Array < mixed > , val: mixed): number {
    for (let i = 0; i < arr.length; i++) {
        if (looseEqual(arr[i], val)) return i
    }

    return -1
}

/**
 * Ensure a function is called only once.
 * 保证一个函数只被调用一次
 */
export function once(fn: Function): Function {
    let called = false

    return function() {
        if (!called) {
            called = true
            fn.apply(this, arguments)
        }
    }
}
