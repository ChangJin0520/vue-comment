/* @flow */

import { makeMap, isBuiltInTag, cached, no } from 'shared/util'

let isStaticKey
let isPlatformReservedTag

const genStaticKeysCached = cached(genStaticKeys)

/**
 * Goal of the optimizer: walk the generated template AST tree
 * and detect sub-trees that are purely static, i.e. parts of
 * the DOM that never needs to change.
 *
 * Once we detect these sub-trees, we can:
 *
 * 1. Hoist them into constants, so that we no longer need to
 *    create fresh nodes for them on each re-render;
 * 2. Completely skip them in the patching process.
 */

// 优化器的目标：遍历生成的模板AST树
// 并检测纯静态的子树，即永远不需要更改的DOM。
// 一旦检测到这些子树，我们就可以：
// 1.将它们提升为常数，这样我们就不再需要在每次重新渲染时为它们创建新的节点；
// 2.在修补过程中完全跳过它们。
export function optimize (root: ?ASTElement, options: CompilerOptions) {
  if (!root) return
  // 判断传入的key是否为静态的 Chang-Jin 2019-11-13
  isStaticKey = genStaticKeysCached(options.staticKeys || '')
  isPlatformReservedTag = options.isReservedTag || no // 是不是平台保留tag Chang-Jin 2019-11-13

  // 标记所有的非静态节点 Chang-Jin 2019-11-13
  // first pass: mark all non-static nodes.
  markStatic(root)

  // 标记静态根节点 Chang-Jin 2019-11-13
  // second pass: mark static roots.
  markStaticRoots(root, false)
}

function genStaticKeys (keys: string): Function {
  return makeMap(
    'type,tag,attrsList,attrsMap,plain,parent,children,attrs,start,end,rawAttrsMap' +
    (keys ? ',' + keys : '')
  )
}

function markStatic (node: ASTNode) {
  node.static = isStatic(node)

  if (node.type === 1) {
    // do not make component slot content static. this avoids
    // 1. components not able to mutate slot nodes
    // 2. static slot content fails for hot-reloading
    if (
      !isPlatformReservedTag(node.tag) &&
      node.tag !== 'slot' &&
      node.attrsMap['inline-template'] == null
    ) {
      return
    }

    // 对子元素进行处理 如果child不是静态的 则此节点也置为非静态的 Chang-Jin 2019-11-13
    for (let i = 0, l = node.children.length; i < l; i++) {
      const child = node.children[i]
      markStatic(child)
      if (!child.static) {
        node.static = false
      }
    }
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        const block = node.ifConditions[i].block
        markStatic(block)
        if (!block.static) {
          node.static = false
        }
      }
    }
  }
}

/**
 * 标记静态根节点 Chang-Jin 2019-11-13
 *
 * @param {ASTNode} node ast
 * @param {boolean} isInFor ast是否在for循环中
 */
function markStaticRoots (node: ASTNode, isInFor: boolean) {
  // 只处理node.type === 1的结点
  if (node.type === 1) {
    // 给node.static = true或node.once = true的结点添加node.staticInFor属性，值为传入的isInFor
    if (node.static || node.once) {
      node.staticInFor = isInFor
    }

    // 对于一个静态根结点，它不应该只包含静态文本，否则消耗会超过获得的收益，更好的做法让它每次渲染时都刷新。
    // For a node to qualify as a static root, it should have children that
    // are not just static text. Otherwise the cost of hoisting out will
    // outweigh the benefits and it's better off to just always render it fresh.
    // !(node.children.length === 1 &&node.children[0].type === 3) // 不要只包含一个静态文本
    if (node.static && node.children.length && !(
      node.children.length === 1 &&
      node.children[0].type === 3
    )) {
      node.staticRoot = true
      return
    } else {
      node.staticRoot = false
    }

    // 递归地对子节点进行标记
    if (node.children) {
      for (let i = 0, l = node.children.length; i < l; i++) {
        markStaticRoots(node.children[i], isInFor || !!node.for)
      }
    }

    // 如果结点有if块，则对块儿内结点同样进行标记
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        markStaticRoots(node.ifConditions[i].block, isInFor)
      }
    }
  }
}

function isStatic (node: ASTNode): boolean {
  if (node.type === 2) { // expression 表达式
    return false
  }
  if (node.type === 3) { // text 文本
    return true
  }
  return !!(node.pre || (
    !node.hasBindings && // no dynamic bindings 没有动态属性
    !node.if && !node.for && // not v-if or v-for or v-else 没有 v-if v-else v-for
    !isBuiltInTag(node.tag) && // not a built-in 不是内置标签 slot component
    isPlatformReservedTag(node.tag) && // not a component 是平台保留标签 HTML 和 SVG 中的标签
    !isDirectChildOfTemplateFor(node) && // 不是template标签的直接子元素且没有包含在for循环中
    Object.keys(node).every(isStaticKey) // 结点包含的属性只能有isStaticKey中指定的几个
  ))
}

function isDirectChildOfTemplateFor (node: ASTElement): boolean {
  while (node.parent) {
    node = node.parent
    if (node.tag !== 'template') {
      return false
    }
    if (node.for) {
      return true
    }
  }
  return false
}
