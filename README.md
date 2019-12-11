# vue-comment
学习vue源码，添加注释。

## 总结
### v-for的解析
1. 把v-for="(value, key, index) in object"解析为语法树上的属性  
   el = {
       for: "object",
       alias: "value",
       iterator1: "key",
       iterator2: "index"
   }

2. 根据ast语法树结果 生成对应的render字符串  
   "..._l((object),function(value,key,index){return _c('p',[_v(_s(index)+". "+_s(key)+" : "+_s(value))])}))"

3. 执行render字符串`_l` 返回一个VNode数组

### v-if的解析
1. 把v-if="exp1" v-else-if="exp2" v-else分别解析为ast上的属性
   ```js
   el1 = {
       ...
       if: exp1,
       ifConditions: [{ // v-if
           exp: 'exp1',
           block: el1 // v-if
       }, {
           exp: 'exp2',
           block: el2 // v-else-if
       }, {
           exp: undefined,
           block: el3 // v-else
       }],
       ...
   }

   el2 = {
        ...
        elseif: 'exp2'
        ...
   }

   el3 = {
        ...
        else: true
        ...
   }
   ```
2. 生成render字符串
'(value == 1)?_c('p',[_v("v-if块的内容")]):(value == 2)?_c('p',[_v("v-else-if块的内容")]):_c('p',[_v("v-else块的内容")])'

3. 注意这三个在ast中会和成一个, 添加到parent的children中.

### v-once指令解析
1. v-once其实更像一个标识作用，以在其他操作的时候进行特殊处理
2. ast阶段会把once指令解析为ast上的once:true属性
3. 在genOnce中大概有三种情况
   1. if 如果once与if同用，则优先处理if指令，if指令中再调用genOnce就走到第三种情况了
   2. for 在for上使用的时候，重点关注是否使用了key属性；为添加key则按普通处理，添加了key则用_o包裹生成的内容;
   3. 普通 和静态节点一样处理 genStatic
4. vnode阶段  
   v-once只解析一次，此后按静态元素处理；  
   _o执行的时候其实就是给vnode上添加了key属性,再执行个node.isStatic = true  node.isOnce = true

### v-show指令解析
1. v-show指令主要作用在vnode上
2. 其根据`value的值`来控制元素的display属性；如果有`过渡效果`则调用entry，leave添加过渡效果。

### v-text指令解析
```html
<!-- value = '祖国统一' -->
<span v-text="value"></span>
```
1. ast  
   会把v-text处理为ast上的el.directives数组中的一项  
   然后经过prop处理会添加到el.props中的一项值会被修改为"_s(value)"
``` js
el = {
    ....
    attrsList: [{
        end: 43,
        name: "v-text",
        start: 29,
        value: "value"
    }],
    attrsMap: {
        v-text: "value"
    },
    directives: [{
        arg: null,
        end: 43,
        isDynamicArg: false,
        modifiers: undefined,
        name: "text",
        rawName: "v-text",
        start: 29,
        value: "value"
    }],
    rawAttrsMap: {
        v-text: {name: "v-text", value: "value", start: 29, end: 43}
    },
    props: [{
        dynamic: undefined,
        end: 43,
        name: "textContent",
        start: 29,
        value: "_s(value)"
    }]
    ....
}
```
2. render字符串  
   通过genData被转化为"{domProps:{"textContent":_s(value)}}"
3. vnode  
```js
// VNode
{
    ....
    data: {
        domProps: {
            textContent: "祖国统一"
        }
    }
    ....
}
```
4. updateDOMProps

### v-html解析
和v-texet类似，把text变为html，textContent变为innerHTML大概就是v-html的处理过程了

### v-cloak
1. ast
   还是会解析为各种ast上的属性的, 但是不做处理
2. 重新render出来的DOM不再有此属性
配合`[v-cloak] { display: none }`, 在页面展示前把带有`v-cloak`的元素隐藏

### v-pre
1. ast  
   当解析到v-pre指令的时候会在ast上添加pre: true; 同时会设置inVPre为true, inVPre为true时, 会限制对文本的解析;  
   当处理当前元素end时, 会把inVPre设为false, 结束限制

## 参考
[vue2.0-source](https://github.com/liutao/vue2.0-source)
