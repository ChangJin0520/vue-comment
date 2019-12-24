/* @flow */
/**
 * @desc 使用插件
 * Vue.use(MyPlugin, { someOption: true })
 * @desc 开发插件
 * MyPlugin.install = function(Vue, options) {
 *     Vue.myGlobalMethod = ...,
 *     Vue.directive('my-directive', {
 *         bind() {}
 *     }),
 *     ...
 * }
 * @date 2019-12-23
 * @author Chang-Jin
 */


import {
    toArray
} from '../util/index'

export function initUse(Vue: GlobalAPI) {
    Vue.use = function(plugin: Function | Object) {
        const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))

        if (installedPlugins.indexOf(plugin) > -1) {
            return this
        }

        // additional parameters 附加参数
        const args = toArray(arguments, 1)
        args.unshift(this)

        if (typeof plugin.install === 'function') {
            plugin.install.apply(plugin, args)
        } else if (typeof plugin === 'function') {
            plugin.apply(null, args)
        }

        installedPlugins.push(plugin)

        return this
    }
}
