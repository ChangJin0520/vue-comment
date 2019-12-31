# new Vue()之前的处理
## ...vue-dev\src\core\instance\index.js
### 定义Vue构造函数
```js
function Vue(options) {
    this._init(options)
}
```
### Mixin操作
1. initMixin初始化方法混入
   1. Vue.prototype._init = func...
2. stateMixin状态相关方法混入
   1. Vue.prototype.$data
        ```js
        {
            get() {
                return this._data
            },
            set() {
                warn(
                'Avoid replacing instance root $data. ' +
                'Use nested data properties instead.',
                this)
            }
        }
        ```
   2. Vue.prototype.$prop
        ```js
        {
            get() {
                return this._props
            },
            set() {
                warn(`$props is readonly.`, this)
            }
        }
        ```
   3. Vue.prototype.$set
      1. TODO
   4. Vue.prototype.$delete
      1. TODO
   5. Vue.prototype.$watch
      1. TODO
3. eventsMixin事件方法混入
   1. Vue.prototype.$on
   2. Vue.prototype.$once
   3. Vue.prototype.$off
   4. Vue.prototype.$emit
4. lifecycleMixin生命周期方法混入
   1. Vue.prototype._update
   2. Vue.prototype.$forceUpdate
   3. Vue.prototype.$destroy
5. renderMixin渲染相关方法混入
   1. Vue.prototype._o
   2. Vue.prototype._n
   3. Vue.prototype._s
   4. Vue.prototype._l
   5. Vue.prototype._t
   6. Vue.prototype._q
   7. Vue.prototype._i
   8. Vue.prototype._m
   9. Vue.prototype._f
   10. Vue.prototype._k
   11. Vue.prototype._b
   12. Vue.prototype._v
   13. Vue.prototype._e
   14. Vue.prototype._u
   15. Vue.prototype._g
   16. Vue.prototype._d
   17. Vue.prototype._p

   18. Vue.prototype.$nextTick
   19. Vue.prototype._render

## ...vue-dev\src\core\index.js
主要是添加Vue上的静态方法
1. initGlobalAPI定义全局API
   1. Vue.config
        ```js
        {
            get() {
                return {
                    optionMergeStrategies: Object.create(null), // 选项合并策略(用于core / util / options)
                    silent: false, // 是否取消警告
                    productionTip: process.env.NODE_ENV !== 'production', // 在启动时显示生产模式提示消息?
                    devtools: process.env.NODE_ENV !== 'production', // 是否启用devtools
                    performance: false, // 是否记录性能
                    errorHandler: null, // 观察者错误的错误处理程序
                    warnHandler: null, // 观察者的警告处理程序警告
                    ignoredElements: [], // 忽略某些自定义元素
                    keyCodes: Object.create(null), // v-on的自定义用户密钥别名
                    isReservedTag: no, // 检查标签是否已保留，以便不能将其注册为组件。 这与平台有关，可能会被覆盖。
                    isReservedAttr: no, // 检查属性是否已保留，以便不能用作组件属性。 这与平台有关，可能会被覆盖。
                    isUnknownElement: no, // 检查标签是否为未知元素。与平台有关。
                    getTagNamespace: noop, // 获取元素的名称空间
                    parsePlatformTagName: identity, // 解析特定平台的真实标签名称。
                    mustUseProp: no, // 检查是否必须使用属性来绑定属性，例如: value, 与平台有关。
                    async: true, // 异步执行更新。 打算由Vue Test Utils使用。如果设置为false，这将大大降低性能。
                    _lifecycleHooks: LIFECYCLE_HOOKS // 由于遗留原因而暴露
                }
            },
            set() {
                warn(
                'Do not replace the Vue.config object, set individual fields instead.')
            }
        }
        ```

   2. Vue.util
      1. warn // TODO
      2. extend // TODO
      3. mergeOptions // TODO
      4. defineReactive // TODO

   3. Vue.set
        与Vue.prototype.$set相同
   4. Vue.delete
        与Vue.prototype.$delete相同
   5. Vue.nextTick
        与Vue.prototype.$nextTick相同

   6. Vue.observable
        <!-- TODO -->

   7. Vue.options
      1. Vue.options.components
         1. extend(Vue.options.components, builtInComponents)
            builtInComponents: keep-alive
      2. Vue.options.directives
      3. Vue.options.filters
      4. Vue.options._base
            就是Vue

   8. Vue.use
   9.  Vue.mixin
   10. Vue.extend

   11. Vue.component:Function
       1. 借用了Vue.extend
       2. this.options[type +　's'][id] = definition
   12. Vue.directive:Function
       1. 会先处理一下处理为  
            ```js
            defintion = {
                bind: definition,
                update: definition
            }
            ```
       2. this.options[type +　's'][id] = definition
   13. Vue.filter:Function
       1. this.options[type +　's'][id] = definition

   14. Vue.prototype.$isServer 服务端渲染相关
   15. Vue.prototype.$ssrContext 服务端渲染相关
   16. Vue.FunctionalRenderContext 服务端渲染相关

   17. Vue.version = "__VERSION__"

## ...vue-dev\src\platforms\web\runtime\index.js
### 根据平台相关给Vue.config赋值
1. Vue.config.mustUseProp
2. Vue.config.isReservedTag
3. Vue.config.isReservedAttr
4. Vue.config.getTagNamespace
5. Vue.config.isUnknownElement

### 根据平台添加相关Vue.options
1. Vue.options.directives  
    v-model, v-show
2. Vue.options.components  
    transition, transition-group

### 根据平台添加__patch__方法
Vue.prototype.__patch__ = inBrowser ? patch : noop

### 添加$mount方法
Vue.prototype.$mount

## ...vue-dev\src\platforms\web\entry-runtime-with-compiler.js
添加编译相关方法
### 添加新的$mount方法
Vue.prototype.$mount = func...

### 添加Vue.compile
Vue.compile = compileToFunctions
