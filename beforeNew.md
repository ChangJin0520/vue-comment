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
   1. Vue.prototype.init = func...
2. stateMixin状态相关方法混入
   1. Vue.prototype.$data
   2. Vue.prototype.$prop
   3. Vue.prototype.$set
   4. Vue.prototype.$delete
   5. Vue.prototype.$watch
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

   2. Vue.util

   3. Vue.set
   4. Vue.delete
   5. Vue.nextTick

   6. Vue.observable

   7. Vue.options
      1. Vue.options.components
      2. Vue.options.directives
      3. Vue.options.filters
      4. Vue.options._base

   8. Vue.use
   9.  Vue.mixin
   10. Vue.extend

   11. Vue.component
   12. Vue.directive
   13. Vue.filter

2. Vue.prototype.$isServer 服务端渲染相关
3. Vue.prototype.$ssrContext 服务端渲染相关
4. Vue.FunctionalRenderContext 服务端渲染相关

5. Vue.version

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
