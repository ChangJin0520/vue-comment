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

### v-model
#### 修饰符
  * number -> _n(value)
  * lazy -> 使用input事件替代change事件
  * trim

#### v-model处理的大致流程:
parse -> genDirectives -> gen(model) -> genCheckboxModel/... -> addProp -> addHandler -> genProps --> updateDOMProps

#### type
1. select
   1. ast  
      和其他的指令处理没啥区别; 多了一个v-for判断, v-model不能与v-for一起使用
   2. render  
      会给该select添加一个change事件, render阶段主要是根据v-model的值和修饰符拼一个事件回调函数;
      ```js
        // v-model="value.a"
        var $$selectedVal = Array.prototype.filter.call($event.target.options, function(o){
          return o.selected
        }).map(function(o){
          var val = "_value" in o ? o._value : o.value;
          return val
        });
        $set(value, "a", $event.target.multiple ? $$selectedVal : $$selectedVal[0])
      ```
   3. DOM  
      inserted上会根据value setSelected更新界面DOM的值.  
      componentUpdated上也会setSelected更新界面DOM的值; 如果option是用v-for添加的, 也会在这里更新.

2. checkbox
   1. ast
      主要是关注处理后的props
      ```js
        props: [{
            checked: "Array.isArray(value)?_i(value,null)>-1:_q(value,"yes")"
        }]
      ```
      还有添加到input上的事件回调
      ```js
      var $$a = value,
        $$el = $event.target,
        $$c = $$el.checked ? (trueValueBinding) : (falseValueBinding);

        if(Array.isArray($$a)){
            var $$v = number ? '_n(' + valueBinding + ')' : valueBinding,
            $$i = _i($$a,$$v);

            if ($$c) {
                ($$i < 0 && value = $$a.concat($$v))
            } else {
                $$i > -1 && value = $$a.slice(0,$$i).concat($$a.slice($$i+1)))
            }
        } else {
            value = $$c
        }
      ```

3. radio
    1. ast
       和其他的差不多
       ```js
       props: [{
           name: "checked",
           value: "_q(value,"1")"
       }]

       // 事件回调
       value = "1"
       ```
    2. render
       domProps:{"checked":_q(value,"1")}

4. 其他类型的input textarea
主要处理逻辑:  
   1. 根据lazy判断需要绑定的事件类型, lazy绑定change事件, 否则绑定input事件
   2. 处理trim
   3. 添加对输入法模式的处理
   4. ast上添加props属性
      ```js
      props: [{
          name: "value",
          vlaue: "(value)"
      }]
      ```
    5. 添加事件处理
      ```js
      events: [{
        input: {
            dynamic: undefined,
            value: "if($event.target.composing)return;value=$event.target.value"
        },
        blur: {
            value: "$forceUpdate()"
        }
      }]
      ```
    6. trim和number的情况, 还会添加blur事件
    7. updateDOMProps

5. v-model用到自定义组件上
    ```html
    <!-- value: "哈哈" -->
    <my-component v-model="value"></my-component>
    ```
    1. ast  
        把自定义组件上的v-model属性解析为el.model
        ```js
        // v-model="value"
        el.model = {
            callback: "function ($$v) {value=$$v}",
            expression: ""value"",
            value: "(value)"
        }
        ```
    2. render  
        "_c('my-component',{model:{value:(value),callback:function ($$v) {value=$$v},expression:"value"}})"
    3. _c createComponent  
        生成组件阶段会把model进行转换, 最终会变为ast上的componentOptions的属性
        ```js
        componentOptions: {
            listeners: {input: function ($$v) {value=$$v}},
            propsData: {value: "哈哈"}
        }
        ```
        自定义组件的model event属性用来设置事件类型 默认为input prop属性用来设置v-model的值以何标识符传入自定义组件中

### slot
#### slot
1. 父组件
    ```html
    <div slot="xxx">xxx</div>
    ```
   1. html -> ast  
        会把slot="xxx"解析为el.slotTarget;  
        并且会把slot添加到el.attrs上;
   2. ast -> render  
        处理为"_c('div', {attrs:{"slot":"header"},slot:"header"})"
   3. render -> VNode  
        node.data = {
            attrs: {
                slot: "header"
            },
            slot: "header"
        }
2. 自定义组件
    1. 自定义组件init  
        初始化自定义组件的过程, 会把自定义组件内的子元素带过来, 分组处理为vm.$slot
        ```js
        vm.$slots = {
            default: [VNode, VNode....], // 为命名的内容用会当道default上
            xxx: [VNode]
            ....
        }
        ```
        ```html
        <slot name="xxx"></slot>
        ```
    2. html -> ast (处理slot元素) 
        el.slotName = "xxx"
    3. ast -> render
        "_t("xxx")"
    4. _t  
        根据slot上的name xxx, 获取自定义组件内对应子元素的VNode

#### 作用域插槽 slot-scope
1. 父组件
   ```html
    <app-out>
        <template slot="item" slot-scope="aaa">
            <li>{{ aaa.text }}{{ aaa.name }}</li>
        </template>
    </app-out>
   ```
   1. html -> ast  
        ```js
        el = {
            tag: "tempalte",
            slotTarget: ""item"",
            slotScope: "aaa"
        }
        ```
    2. 对template元素的特殊处理  
        会把当前template的ast添加到其父节点的scopedSlots属性上
        ```js
        el:parent = {
            scopedSlots: {
                ""item"": el:template
            }
        }
        ```
        然后会把整个template的ast从ast树中过滤掉
    3. el:parent ast -> render  
        ```js
        // render字符串对应的函数
        // 这里因为aaa是来自子组件的 所以以函数的方式放到scopeSlots中, 到自定义组件初始化的时候再执行
        _c('app-out', {
                // scopeSlots数组是自定义组件中包含的作用域插槽
                scopedSlots:_u([{ // _u把数组处理为键值对形式
                    key: "item",
                    // fn的返回值是对应作用域插槽中的children对应的VNode
                    fn: function(aaa){
                        return [_c('li',[_v(_s(aaa.text)+_s(aaa.name))])]
                    }
                }])
            }
        )
        ```
2. 子组件  
    ```html
    <ul>
        <slot name="item"
            v-for="item in items"
            :text="item.text" v-bind="{name: '123'}">
        </slot>
    </ul>
    ```
    1. 子组件render之前, 会从parentVnode中取到scopeSlots处理后赋值给vm.$scopeSlots
    2. html -> ast
        和slot中对slot标签的处理方式一样
    3. ast -> render
        ```js
        // render字符串对应的函数
        _c('ul', [_l(items, function(item) {
            return _t('item', null, {
                'text': item.text
            }, {
                name: '123'
            });
        })]);
        ```
    4. render -> VNode  
        主要是_t的处理.  
        根据_t的name, 执行对应的fn, 传入参数,返回对应的VNode

### keep-alive
1. keep-alive本身是一个抽象组件, 不渲染为DOM, 组件内会对内部的组件cache
2. keep-alive组件的render返回其内的第一个自定义组件的vnode
3. 经过keep-alive的组件, 其vnode上会添加vnode.data.keepAlive = true


## 参考
[vue2.0-source](https://github.com/liutao/vue2.0-source)
