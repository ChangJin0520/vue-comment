/* @flow */

const validDivisionCharRE = /[\w).+\-_$\]]/

// 过滤器解析会在 解析 文本和属性的时候用到 Chang-Jin 2019-11-07
export function parseFilters (exp: string): string {
  let inSingle = false
  let inDouble = false
  let inTemplateString = false
  let inRegex = false
  let curly = 0
  let square = 0
  let paren = 0
  let lastFilterIndex = 0
  let c, prev, i, expression, filters

  for (i = 0; i < exp.length; i++) {
    prev = c
    c = exp.charCodeAt(i)

    // 以下逻辑 可以保证 ' " ` ( [ { 以及正则表达式 中的 | 无效 Chang-Jin 2019-11-07
    // prev !== 0x5C 保证了转义的正常 \ Chang-Jin 2019-11-07
    if (inSingle) {
      if (c === 0x27 && prev !== 0x5C) inSingle = false
    } else if (inDouble) {
      if (c === 0x22 && prev !== 0x5C) inDouble = false
    } else if (inTemplateString) {
      if (c === 0x60 && prev !== 0x5C) inTemplateString = false
    } else if (inRegex) {
      if (c === 0x2f && prev !== 0x5C) inRegex = false
    } else if (
      c === 0x7C && // pipe |
      exp.charCodeAt(i + 1) !== 0x7C && // 排查及||情况 Chang-Jin 2019-11-07
      exp.charCodeAt(i - 1) !== 0x7C &&
      !curly && !square && !paren // 排除([{ Chang-Jin 2019-11-07
    ) {
      if (expression === undefined) {
        // first filter, end of expression
        lastFilterIndex = i + 1
        expression = exp.slice(0, i).trim()
      } else {
        pushFilter()
      }
    } else {
      switch (c) {
        case 0x22: inDouble = true; break         // "
        case 0x27: inSingle = true; break         // '
        case 0x60: inTemplateString = true; break // `
        case 0x28: paren++; break                 // (
        case 0x29: paren--; break                 // )
        case 0x5B: square++; break                // [
        case 0x5D: square--; break                // ]
        case 0x7B: curly++; break                 // {
        case 0x7D: curly--; break                 // }
      }
      if (c === 0x2f) { // /
        let j = i - 1
        let p
        // find first non-whitespace prev char
        for (; j >= 0; j--) {
          p = exp.charAt(j)
          if (p !== ' ') break
        }
        if (!p || !validDivisionCharRE.test(p)) {
          inRegex = true
        }
      }
    }
  }

  if (expression === undefined) {
    expression = exp.slice(0, i).trim()
  } else if (lastFilterIndex !== 0) {
    pushFilter()
  }

  function pushFilter () {
    (filters || (filters = [])).push(exp.slice(lastFilterIndex, i).trim())
    lastFilterIndex = i + 1
  }

  if (filters) {
    for (i = 0; i < filters.length; i++) {
      expression = wrapFilter(expression, filters[i])
    }
  }

  return expression
}

function wrapFilter (exp: string, filter: string): string {
  const i = filter.indexOf('(')
  if (i < 0) {
    // _f: resolveFilter
    return `_f("${filter}")(${exp})`
  } else {
    // 处理过滤器传参
    const name = filter.slice(0, i)
    const args = filter.slice(i + 1)
    return `_f("${name}")(${exp}${args !== ')' ? ',' + args : args}`
  }
}
