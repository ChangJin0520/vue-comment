import {
    initMixin
} from './init'
import {
    stateMixin
} from './state'
import {
    renderMixin
} from './render'
import {
    eventsMixin
} from './events'
import {
    lifecycleMixin
} from './lifecycle'
import {
    warn
} from '../util/index'

// Vue构造函数
function Vue(options) {
    if (process.env.NODE_ENV !== 'production' &&
        !(this instanceof Vue)
    ) {
        warn('Vue is a constructor and should be called with the `new` keyword')
    }
    this._init(options)
}

// 定义Vue.prototype._init
initMixin(Vue)

// 定义state相关方法
// Vue.prototype.$data/$props/$set/$delete/$watch
stateMixin(Vue)

// 定义事件相关方法
// Vue.prototype.$on/$once/$off/$emit
eventsMixin(Vue)

// 定义生命周期相关方法
// Vue.prototype._update/$forceUpdate/$destroy
lifecycleMixin(Vue)

// 定义渲染相关方法
// Vue.prototype.$nextTick/_render
renderMixin(Vue)

export default Vue
