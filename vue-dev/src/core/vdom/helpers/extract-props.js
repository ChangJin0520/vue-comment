/* @flow */

import {
    tip,
    hasOwn,
    isDef,
    isUndef,
    hyphenate,
    formatComponentName
} from 'core/util/index'

export function extractPropsFromVNodeData(
    data: VNodeData,
    Ctor: Class<Component> ,
    tag ?: string
): ? Object {
    // we are only extracting raw values here.
    // validation and default values are handled in the child
    // component itself.
    const propOptions = Ctor.options.props // 在子组件中指定的props
    if (isUndef(propOptions)) {
        return
    }
    const res = {}
    const {
        attrs, // 绑定在子元素上的属性值
        props
    } = data

    if (isDef(attrs) || isDef(props)) {
        // 遍历propsOptions中的属性，props中没有指定的属性，即使在父组件中绑定了，子组件也找不到
        for (const key in propOptions) {
            const altKey = hyphenate(key) // altKey是驼峰命名属性的中划线连接式，myName转换为my-name

            // 提示dom中的属性应该用kebab-case格式的值
            if (process.env.NODE_ENV !== 'production') {
                const keyInLowerCase = key.toLowerCase()

                if (
                    key !== keyInLowerCase &&
                    attrs && hasOwn(attrs, keyInLowerCase)
                ) {
                    tip(
                        `Prop "${keyInLowerCase}" is passed to component ` +
                        `${formatComponentName(tag || Ctor)}, but the declared prop name is` +
                        ` "${key}". ` +
                        `Note that HTML attributes are case-insensitive and camelCased ` +
                        `props need to use their kebab-case equivalents when using in-DOM ` +
                        `templates. You should probably use "${altKey}" instead of "${key}".`
                    )
                }
            }
            checkProp(res, props, key, altKey, true) ||
            checkProp(res, attrs, key, altKey, false)
        }
    }
    return res
}

function checkProp(
    res: Object,
    hash: ? Object,
    key: string,
    altKey: string,
    preserve: boolean
): boolean {
    if (isDef(hash)) {
        if (hasOwn(hash, key)) {
            res[key] = hash[key]
            if (!preserve) {
                delete hash[key]
            }
            return true
        } else if (hasOwn(hash, altKey)) {
            res[key] = hash[altKey]
            if (!preserve) {
                delete hash[altKey]
            }
            return true
        }
    }
    return false
}
