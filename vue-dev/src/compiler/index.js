/* @flow */

import {
    parse
} from './parser/index'
import {
    optimize
} from './optimizer'
import {
    generate
} from './codegen/index'
import {
    createCompilerCreator
} from './create-compiler'

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
export const createCompiler = createCompilerCreator(function baseCompile(
    template: string,
    options: CompilerOptions
): CompiledResult {
    // 把template解析为ast语法树
    const ast = parse(template.trim(), options)

    if (options.optimize !== false) {
        // 优化ast语法树
        optimize(ast, options)
    }
    const code = generate(ast, options) // 生成render

    return {
        ast,
        render: code.render,
        staticRenderFns: code.staticRenderFns
    }
})
