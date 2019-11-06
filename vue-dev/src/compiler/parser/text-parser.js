/* @flow */

import { cached } from 'shared/util'
import { parseFilters } from './filter-parser'

const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g
const regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g

const buildRegex = cached(delimiters => {
  const open = delimiters[0].replace(regexEscapeRE, '\\$&')
  const close = delimiters[1].replace(regexEscapeRE, '\\$&')
  return new RegExp(open + '((?:.|\\n)+?)' + close, 'g')
})

type TextParseResult = {
  expression: string,
  tokens: Array<string | { '@binding': string }>
}

export function parseText (
  text: string,
  delimiters?: [string, string]
): TextParseResult | void {
  const tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE // 处理自定义分割符

  // 未找到模板语法直接返回
  if (!tagRE.test(text)) {
    return
  }
  const tokens = [] // 解析后的文本数组
  const rawTokens = [] // 原文本数组
  let lastIndex = tagRE.lastIndex = 0
  let match, index, tokenValue

  // 匹配模板语法
  while ((match = tagRE.exec(text))) {
    index = match.index // 匹配到的索引

    // push text token
    if (index > lastIndex) {
      rawTokens.push(tokenValue = text.slice(lastIndex, index))
      tokens.push(JSON.stringify(tokenValue))
    }
    // tag token
    const exp = parseFilters(match[1].trim()) // 解析过滤器 得到 表达式

    tokens.push(`_s(${exp})`) // _s是预定义的函数
    rawTokens.push({ '@binding': exp })
    lastIndex = index + match[0].length
  }

  // 模板语法后的文本内容
  if (lastIndex < text.length) {
    rawTokens.push(tokenValue = text.slice(lastIndex))
    tokens.push(JSON.stringify(tokenValue))
  }
  return {
    expression: tokens.join('+'),
    tokens: rawTokens
  }
}
