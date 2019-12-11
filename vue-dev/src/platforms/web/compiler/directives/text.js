/* @flow */

import { addProp } from 'compiler/helpers'

// 解析v-text指令
export default function text (el: ASTElement, dir: ASTDirective) {
  if (dir.value) {
    addProp(el, 'textContent', `_s(${dir.value})`, dir)
  }
}
