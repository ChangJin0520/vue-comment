import Vue from './instance/index'
import {
    initGlobalAPI
} from './global-api/index'
import {
    isServerRendering
} from 'core/util/env'
import {
    FunctionalRenderContext
} from 'core/vdom/create-functional-component'

// 定义Vue全局API
// Vue.config/util/set/delete/nextTick/observable/options
// Vue.use/mixin/extend/[ASSET_TYPES]
initGlobalAPI(Vue)

// Vue.prototype.$isServer
Object.defineProperty(Vue.prototype, '$isServer', {
    get: isServerRendering
})

// Vue.prototype.$ssrContext
Object.defineProperty(Vue.prototype, '$ssrContext', {
    get() {
        /* istanbul ignore next */
        return this.$vnode && this.$vnode.ssrContext
    }
})

// expose FunctionalRenderContext for ssr runtime helper installation
// 公开用于ssr运行时帮助程序安装的FunctionalRenderContext
// Vue.FunctionalRenderContext
Object.defineProperty(Vue, 'FunctionalRenderContext', {
    value: FunctionalRenderContext
})

Vue.version = '__VERSION__'

export default Vue
