# vm实例
```html
<div id="app">
    <p>{{message}}</p>
</div>
<script type="text/javascript">
    var vm = new Vue({
        el: '#app',
        data: {
            message: '第一个vue实例'
        }
    })
</script>
```
```js
vm = {
    _uid: 0, // 实例的唯一id标识
    _isVue: true, // Vue对象标识, 避免被observe

    /* 配置 */
    $options: {
        components: {}, // 原型上带keep-alive transition transition-group
        directives: {}, // 原型上带show和model
        filters: {},
        _base: Vue,
        el: "#app",
        data: Function:mergedInstanceDataFn
    },

    _renderProxy: vm, // 生产环境下为vm 非生产环境下为newProxy(vm, handlers)
    _self: vm,

    /* initLifecycle */
    $parent: [vm:child, ...],
    $root: vm, // 指向_uid为0的Vue实例
    $children: [vm, ...] // 非抽象的子实例
    $refs: {}
    _watcher: null,
    _inactive: null,
    _directInactive: false,
    _isMounted: false,
    _isDestroyed: false,
    _isBeingDestroyed: false,

    /* initEvents */
    _events: {},
    _hasHookEvent: false,

    /* initRender */
    _vnode: null,
    _staticTrees: null,
    $vnode: {},
    $slot: {},
    $scopedSlots: {}
    _c: Function,
    $createElement: Function,
    $attrs: [reactive value],
    $listeners: [reactive value],

    /* initInjections */

    /* initState */
    // props
    // methods
    // data
    _data: Object,
    "data-proxy": [definedProperty], // data中的所有数据都会代理到vm上
    // computed
    // watch

    /* initProvide */
    _provided: Object | () => Object,

    _name: String,

    $el: Object, // DOM

    // mount
    _watchers: [Watcher...]
}
```
