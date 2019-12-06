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
## 参考
[vue2.0-source](https://github.com/liutao/vue2.0-source)
