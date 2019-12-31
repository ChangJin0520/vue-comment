# Vue实例从生成到销毁
Vue的生命周期其实就是

## new Vue(options)
首先肯定是new一个Vue实例

## 初始化this._init(options)
Vue的初始化
1. 合并配置
2. 初始化生命周期Lifecycle
3. 初始化事件Events
4. 初始化Render
5. 调用`beforeCreate`钩子
6. 初始化注入Injections
7. 初始化状态State
   1. 初始化props initProps
   2. 初始化方法 initmethods
        ```js
        vm[key] = bind(methods[key]);
        ```
   3. 初始化数据 initData
   4. 初始化计算属性 initComputed
   5. 初始化观察者 initWatch
8. 初始化依赖Provide
9.  调用`created`钩子

## 预处理mount, vm.$mount(vm.$options.el)
1. 获取DOM
2. 获取模板template
3. 编译模板
   1. 解析模板生成ast
   2. 优化ast
   3. 把ast生成render

## 挂载mount
1. 调用`beforeMount`钩子
2. 初始化一个`Watcher`实例
   1. new Watcher的时候, 内部调用getter方法
   2. vm._render()执行render函数, 返回一个虚拟DOM VNode
   3. vm._update执行更新函数, 创建vm.$el替换el
3. 调用`mounted`钩子

## 更新update

## 销毁destroy
