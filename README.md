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

## 参考
[vue2.0-source](https://github.com/liutao/vue2.0-source)
