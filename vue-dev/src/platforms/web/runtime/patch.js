/* @flow */

import * as nodeOps from 'web/runtime/node-ops' // nodeOps封装了一些对原生dom操作的方法 Chang-Jin 2019-11-18
import { createPatchFunction } from 'core/vdom/patch'
import baseModules from 'core/vdom/modules/index' // directives和ref属性的处理 Chang-Jin 2019-11-18
import platformModules from 'web/runtime/modules/index'

// the directive module should be applied last, after all
// built-in modules have been applied.
// 指令模块应该在所有内置模块之后应用 Chang-Jin 2019-11-18
const modules = platformModules.concat(baseModules) // 对一些特殊内容的特殊处理 Chang-Jin 2019-11-18

export const patch: Function = createPatchFunction({ nodeOps, modules })
