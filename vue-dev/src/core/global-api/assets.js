/* @flow */

import {
    ASSET_TYPES
} from 'shared/constants'
import {
    isPlainObject,
    validateComponentName
} from '../util/index'

export function initAssetRegisters(Vue: GlobalAPI) {
    /**
     * Create asset registration methods. 创建资源注册方法
     */
    // 全局指令的实现方式，和全局组件、全局过滤器一致。 ASSET_TYPES = ['component', 'directive', 'filter']
    ASSET_TYPES.forEach(type => {
        Vue[type] = function(
            id: string,
            definition: Function | Object
        ): Function | Object | void {
            // 如果未传第二个参数 则为取值 Chang-Jin 2019-12-03
            if (!definition) {
                return this.options[type + 's'][id]
            } else {
                /* istanbul ignore if */
                // 验证组件名
                if (process.env.NODE_ENV !== 'production' && type === 'component') {
                    validateComponentName(id)
                }

                if (type === 'component' && isPlainObject(definition)) {
                    definition.name = definition.name || id
                    definition = this.options._base.extend(definition) // this.options._base就是Vue
                }

                // definition为函数的时候 把其包装为一个对象 也算是归一化? Chang-Jin 2019-12-03
                if (type === 'directive' && typeof definition === 'function') {
                    definition = {
                        bind: definition,
                        update: definition
                    }
                }

                // 把需要定义的东西 放到Vue.options[components/directives/filters]上
                this.options[type + 's'][id] = definition

                return definition
            }
        }
    })
}
