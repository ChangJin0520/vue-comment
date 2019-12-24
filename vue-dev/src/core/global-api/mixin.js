/* @flow */
/**
 * @desc mixin使用
 * Vue.mixin({
    created: function () {
        var myOption = this.$options.myOption

        if (myOption) {
            console.log(myOption)
        }
    }
   })
 * @date 2019-12-23
 * @author Chang-Jin
 */

import {
    mergeOptions
} from '../util/index'

export function initMixin(Vue: GlobalAPI) {
    Vue.mixin = function(mixin: Object) {
        this.options = mergeOptions(this.options, mixin)

        return this
    }
}
