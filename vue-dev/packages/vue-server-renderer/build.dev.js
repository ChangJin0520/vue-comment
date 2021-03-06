'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var he = _interopDefault(require('he'));

/*  */

var emptyObject = Object.freeze({});

// These helpers produce better VM code in JS engines due to their
// explicitness and function inlining.
function isUndef(v) {
    return v === undefined || v === null
}

function isDef(v) {
    return v !== undefined && v !== null
}

function isTrue(v) {
    return v === true
}

function isFalse(v) {
    return v === false
}

/**
 * Check if value is primitive.
 */
function isPrimitive(value) {
    return (
        typeof value === 'string' ||
        typeof value === 'number' ||
        // $flow-disable-line
        typeof value === 'symbol' ||
        typeof value === 'boolean'
    )
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 */
function isObject(obj) {
    return obj !== null && typeof obj === 'object'
}

/**
 * Get the raw type string of a value, e.g., [object Object].
 */
var _toString = Object.prototype.toString;

function toRawType(value) {
    return _toString.call(value).slice(8, -1)
}

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 */
function isPlainObject(obj) {
    return _toString.call(obj) === '[object Object]'
}

/**
 * Check if val is a valid array index.
 */
function isValidArrayIndex(val) {
    var n = parseFloat(String(val));
    return n >= 0 && Math.floor(n) === n && isFinite(val)
}

function isPromise(val) {
    return (
        isDef(val) &&
        typeof val.then === 'function' &&
        typeof val.catch === 'function'
    )
}

/**
 * Convert a value to a string that is actually rendered.
 */
function toString(val) {
    return val == null ?
        '' :
        Array.isArray(val) || (isPlainObject(val) && val.toString === _toString) ?
        JSON.stringify(val, null, 2) :
        String(val)
}

/**
 * Convert an input value to a number for persistence.
 * If the conversion fails, return original string.
 */
function toNumber(val) {
    var n = parseFloat(val);
    return isNaN(n) ? val : n
}

/**
 * Make a map and return a function for checking if a key
 * is in that map.
 */
function makeMap(
    str,
    expectsLowerCase  
) {
    var map = Object.create(null);
    var list = str.split(',');
    for (var i = 0; i < list.length; i++) {
        map[list[i]] = true;
    }
    return expectsLowerCase ?
        function (val) { return map[val.toLowerCase()]; } :
        function (val) { return map[val]; }
}

/**
 * Check if a tag is a built-in tag.
 */
var isBuiltInTag = makeMap('slot,component', true);

/**
 * Check if an attribute is a reserved attribute.
 */
var isReservedAttribute = makeMap('key,ref,slot,slot-scope,is');

/**
 * Remove an item from an array.
 * 从数组中移除某项
 */
function remove(arr , item) {
    if (arr.length) {
        var index = arr.indexOf(item);
        if (index > -1) {
            return arr.splice(index, 1)
        }
    }
}

/**
 * Check whether an object has the property.
 */
var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn(obj , key) {
    return hasOwnProperty.call(obj, key)
}

/**
 * Create a cached version of a pure function.
 */
function cached  (fn) {
    var cache = Object.create(null);
    return (function cachedFn(str) {
        var hit = cache[str];
        return hit || (cache[str] = fn(str))
    })
}

/**
 * Camelize a hyphen-delimited string.
 */
var camelizeRE = /-(\w)/g;
var camelize = cached(function (str) {
    return str.replace(camelizeRE, function (_, c) { return c ? c.toUpperCase() : ''; })
});

/**
 * Capitalize a string.
 */
var capitalize = cached(function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
});

/**
 * Hyphenate a camelCase string.
 */
var hyphenateRE = /\B([A-Z])/g;
var hyphenate = cached(function (str) {
    return str.replace(hyphenateRE, '-$1').toLowerCase()
});

/**
 * Mix properties into target object.
 */
function extend(to, _from) {
    for (var key in _from) {
        to[key] = _from[key];
    }
    return to
}

/**
 * Merge an Array of Objects into a single Object.
 */
function toObject(arr ) {
    var res = {};
    for (var i = 0; i < arr.length; i++) {
        if (arr[i]) {
            extend(res, arr[i]);
        }
    }
    return res
}

/* eslint-disable no-unused-vars */

/**
 * Perform no operation.
 * Stubbing args to make Flow happy without leaving useless transpiled code
 * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/).
 */
function noop(a  , b  , c  ) {}

/**
 * Always return false.
 */
var no = function (a  , b  , c  ) { return false; };

/* eslint-enable no-unused-vars */

/**
 * Return the same value.
 */
var identity = function (_) { return _; };

/**
 * Generate a string containing static keys from compiler modules.
 */
function genStaticKeys(modules ) {
    return modules.reduce(function (keys, m) {
        return keys.concat(m.staticKeys || [])
    }, []).join(',')
}

/**
 * Check if two values are loosely equal - that is,
 * if they are plain objects, do they have the same shape?
 */
function looseEqual(a, b) {
    if (a === b) { return true }
    var isObjectA = isObject(a);
    var isObjectB = isObject(b);
    if (isObjectA && isObjectB) {
        try {
            var isArrayA = Array.isArray(a);
            var isArrayB = Array.isArray(b);
            if (isArrayA && isArrayB) {
                return a.length === b.length && a.every(function (e, i) {
                    return looseEqual(e, b[i])
                })
            } else if (a instanceof Date && b instanceof Date) {
                return a.getTime() === b.getTime()
            } else if (!isArrayA && !isArrayB) {
                var keysA = Object.keys(a);
                var keysB = Object.keys(b);
                return keysA.length === keysB.length && keysA.every(function (key) {
                    return looseEqual(a[key], b[key])
                })
            } else {
                /* istanbul ignore next */
                return false
            }
        } catch (e) {
            /* istanbul ignore next */
            return false
        }
    } else if (!isObjectA && !isObjectB) {
        return String(a) === String(b)
    } else {
        return false
    }
}

/**
 * Return the first index at which a loosely equal value can be
 * found in the array (if value is a plain object, the array must
 * contain an object of the same shape), or -1 if it is not present.
 */
function looseIndexOf(arr , val) {
    for (var i = 0; i < arr.length; i++) {
        if (looseEqual(arr[i], val)) { return i }
    }
    return -1
}

/**
 * Ensure a function is called only once.
 */
function once(fn) {
    var called = false;
    return function() {
        if (!called) {
            called = true;
            fn.apply(this, arguments);
        }
    }
}

/*  */

var isAttr = makeMap(
  'accept,accept-charset,accesskey,action,align,alt,async,autocomplete,' +
  'autofocus,autoplay,autosave,bgcolor,border,buffered,challenge,charset,' +
  'checked,cite,class,code,codebase,color,cols,colspan,content,http-equiv,' +
  'name,contenteditable,contextmenu,controls,coords,data,datetime,default,' +
  'defer,dir,dirname,disabled,download,draggable,dropzone,enctype,method,for,' +
  'form,formaction,headers,height,hidden,high,href,hreflang,http-equiv,' +
  'icon,id,ismap,itemprop,keytype,kind,label,lang,language,list,loop,low,' +
  'manifest,max,maxlength,media,method,GET,POST,min,multiple,email,file,' +
  'muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,' +
  'preload,radiogroup,readonly,rel,required,reversed,rows,rowspan,sandbox,' +
  'scope,scoped,seamless,selected,shape,size,type,text,password,sizes,span,' +
  'spellcheck,src,srcdoc,srclang,srcset,start,step,style,summary,tabindex,' +
  'target,title,type,usemap,value,width,wrap'
);

var unsafeAttrCharRE = /[>/="'\u0009\u000a\u000c\u0020]/; // eslint-disable-line no-control-regex
var isSSRUnsafeAttr = function (name) {
  return unsafeAttrCharRE.test(name)
};

/* istanbul ignore next */
var isRenderableAttr = function (name) {
  return (
    isAttr(name) ||
    name.indexOf('data-') === 0 ||
    name.indexOf('aria-') === 0
  )
};

var propsToAttrMap = {
  acceptCharset: 'accept-charset',
  className: 'class',
  htmlFor: 'for',
  httpEquiv: 'http-equiv'
};

var ESC = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '&': '&amp;'
};

function escape (s) {
  return s.replace(/[<>"&]/g, escapeChar)
}

function escapeChar (a) {
  return ESC[a] || a
}

var noUnitNumericStyleProps = {
  "animation-iteration-count": true,
  "border-image-outset": true,
  "border-image-slice": true,
  "border-image-width": true,
  "box-flex": true,
  "box-flex-group": true,
  "box-ordinal-group": true,
  "column-count": true,
  "columns": true,
  "flex": true,
  "flex-grow": true,
  "flex-positive": true,
  "flex-shrink": true,
  "flex-negative": true,
  "flex-order": true,
  "grid-row": true,
  "grid-row-end": true,
  "grid-row-span": true,
  "grid-row-start": true,
  "grid-column": true,
  "grid-column-end": true,
  "grid-column-span": true,
  "grid-column-start": true,
  "font-weight": true,
  "line-clamp": true,
  "line-height": true,
  "opacity": true,
  "order": true,
  "orphans": true,
  "tab-size": true,
  "widows": true,
  "z-index": true,
  "zoom": true,
  // SVG
  "fill-opacity": true,
  "flood-opacity": true,
  "stop-opacity": true,
  "stroke-dasharray": true,
  "stroke-dashoffset": true,
  "stroke-miterlimit": true,
  "stroke-opacity": true,
  "stroke-width": true
};

/*  */

// these are reserved for web because they are directly compiled away
// during template compilation
var isReservedAttr = makeMap('style,class');

// attributes that should be using props for binding
var acceptValue = makeMap('input,textarea,option,select,progress');
var mustUseProp = function (tag, type, attr) {
  return (
    (attr === 'value' && acceptValue(tag)) && type !== 'button' ||
    (attr === 'selected' && tag === 'option') ||
    (attr === 'checked' && tag === 'input') ||
    (attr === 'muted' && tag === 'video')
  )
};

var isEnumeratedAttr = makeMap('contenteditable,draggable,spellcheck');

var isValidContentEditableValue = makeMap('events,caret,typing,plaintext-only');

var convertEnumeratedValue = function (key, value) {
  return isFalsyAttrValue(value) || value === 'false'
    ? 'false'
    // allow arbitrary string value for contenteditable
    : key === 'contenteditable' && isValidContentEditableValue(value)
      ? value
      : 'true'
};

var isBooleanAttr = makeMap(
  'allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,' +
  'default,defaultchecked,defaultmuted,defaultselected,defer,disabled,' +
  'enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,' +
  'muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,' +
  'required,reversed,scoped,seamless,selected,sortable,translate,' +
  'truespeed,typemustmatch,visible'
);

var isFalsyAttrValue = function (val) {
  return val == null || val === false
};

/*  */

function renderAttrs (node) {
  var attrs = node.data.attrs;
  var res = '';

  var opts = node.parent && node.parent.componentOptions;
  if (isUndef(opts) || opts.Ctor.options.inheritAttrs !== false) {
    var parent = node.parent;
    while (isDef(parent)) {
      if (isDef(parent.data) && isDef(parent.data.attrs)) {
        attrs = extend(extend({}, attrs), parent.data.attrs);
      }
      parent = parent.parent;
    }
  }

  if (isUndef(attrs)) {
    return res
  }

  for (var key in attrs) {
    if (isSSRUnsafeAttr(key)) {
      continue
    }
    if (key === 'style') {
      // leave it to the style module
      continue
    }
    res += renderAttr(key, attrs[key]);
  }
  return res
}

function renderAttr (key, value) {
  if (isBooleanAttr(key)) {
    if (!isFalsyAttrValue(value)) {
      return (" " + key + "=\"" + key + "\"")
    }
  } else if (isEnumeratedAttr(key)) {
    return (" " + key + "=\"" + (escape(convertEnumeratedValue(key, value))) + "\"")
  } else if (!isFalsyAttrValue(value)) {
    return (" " + key + "=\"" + (escape(String(value))) + "\"")
  }
  return ''
}

/*  */
// VNode的构造函数 Chang-Jin 2019-11-18
var VNode = function VNode(
    tag ,
    data ,
    children  ,
    text ,
    elm ,
    context ,
    componentOptions ,
    asyncFactory 
) {
    this.tag = tag; // 标签名
    this.data = data; // 结点相关属性数据
    this.children = children; // 子节点
    this.text = text; // 文本
    this.elm = elm; // dom元素
    this.ns = undefined; // 命名空间
    this.context = context; // VNode所处Vue对象
    this.fnContext = undefined;
    this.fnOptions = undefined;
    this.fnScopeId = undefined;
    this.key = data && data.key;
    this.componentOptions = componentOptions; // VNode对象如果对应的是一个自定义组件，componentOptions保存组件相关事件、props数据等
    this.componentInstance = undefined; // VNode对象如果对应的是一个自定义组件，componentInstance保存相对应的vue实例
    this.parent = undefined; // 当前自定义组件在父组件中的vnode
    this.raw = false; // 包含原始HTML
    this.isStatic = false; // 是否是静态内容
    this.isRootInsert = true;
    this.isComment = false; // 空注释占位符
    this.isCloned = false; // 是否是clone的VNode对象
    this.isOnce = false; // 是否是v-once元素的VNode对象
    this.asyncFactory = asyncFactory;
    this.asyncMeta = undefined;
    this.isAsyncPlaceholder = false;
};

var prototypeAccessors = { child: { configurable: true } };

// DEPRECATED: alias for componentInstance for backwards compat.
// 不推荐使用：向后兼容的componentInstance的别名。
/* istanbul ignore next */
prototypeAccessors.child.get = function () {
    return this.componentInstance
};

Object.defineProperties( VNode.prototype, prototypeAccessors );

var createEmptyVNode = function (text) {
    if ( text === void 0 ) text = '';

    var node = new VNode();
    node.text = text;
    node.isComment = true;
    return node
};

function createTextVNode(val) {
    return new VNode(undefined, undefined, undefined, String(val))
}

// optimized shallow clone
// used for static nodes and slot nodes because they may be reused across
// multiple renders, cloning them avoids errors when DOM manipulations rely
// on their elm reference.
// 优化的浅克隆
// 用于静态节点和插槽节点，
// 因为它们可以在多个渲染中重复使用，
// 克隆它们可以避免在DOM操作依赖于它们的elm参考时出错。
function cloneVNode(vnode) {
    var cloned = new VNode(
        vnode.tag,
        vnode.data,
        // #7975
        // clone children array to avoid mutating original in case of cloning
        // a child.
        vnode.children && vnode.children.slice(),
        vnode.text,
        vnode.elm,
        vnode.context,
        vnode.componentOptions,
        vnode.asyncFactory
    );
    cloned.ns = vnode.ns;
    cloned.isStatic = vnode.isStatic;
    cloned.key = vnode.key;
    cloned.isComment = vnode.isComment;
    cloned.fnContext = vnode.fnContext;
    cloned.fnOptions = vnode.fnOptions;
    cloned.fnScopeId = vnode.fnScopeId;
    cloned.asyncMeta = vnode.asyncMeta;
    cloned.isCloned = true;
    return cloned
}

/*  */

function renderDOMProps (node) {
  var props = node.data.domProps;
  var res = '';

  var parent = node.parent;
  while (isDef(parent)) {
    if (parent.data && parent.data.domProps) {
      props = extend(extend({}, props), parent.data.domProps);
    }
    parent = parent.parent;
  }

  if (isUndef(props)) {
    return res
  }

  var attrs = node.data.attrs;
  for (var key in props) {
    if (key === 'innerHTML') {
      setText(node, props[key], true);
    } else if (key === 'textContent') {
      setText(node, props[key], false);
    } else if (key === 'value' && node.tag === 'textarea') {
      setText(node, props[key], false);
    } else {
      // $flow-disable-line (WTF?)
      var attr = propsToAttrMap[key] || key.toLowerCase();
      if (isRenderableAttr(attr) &&
        // avoid rendering double-bound props/attrs twice
        !(isDef(attrs) && isDef(attrs[attr]))
      ) {
        res += renderAttr(attr, props[key]);
      }
    }
  }
  return res
}

function setText (node, text, raw) {
  var child = new VNode(undefined, undefined, undefined, text);
  child.raw = raw;
  node.children = [child];
}

/*  */

/**
 * unicode letters used for parsing html tags, component names and property paths.
 * using https://www.w3.org/TR/html53/semantics-scripting.html#potentialcustomelementname
 * skipping \u10000-\uEFFFF due to it freezing up PhantomJS
 */
var unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;

/**
 * Define a property.
 */
function def (obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  });
}

/*  */

// can we use __proto__?
var hasProto = '__proto__' in {};

// Browser environment sniffing
var inBrowser = typeof window !== 'undefined';
var inWeex = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform;
var weexPlatform = inWeex && WXEnvironment.platform.toLowerCase();
var UA = inBrowser && window.navigator.userAgent.toLowerCase();
var isIE = UA && /msie|trident/.test(UA);
var isIE9 = UA && UA.indexOf('msie 9.0') > 0;
var isEdge = UA && UA.indexOf('edge/') > 0;
var isAndroid = (UA && UA.indexOf('android') > 0) || (weexPlatform === 'android');
var isIOS = (UA && /iphone|ipad|ipod|ios/.test(UA)) || (weexPlatform === 'ios');
var isChrome = UA && /chrome\/\d+/.test(UA) && !isEdge;
var isPhantomJS = UA && /phantomjs/.test(UA);
var isFF = UA && UA.match(/firefox\/(\d+)/);

// Firefox has a "watch" function on Object.prototype...
var nativeWatch = ({}).watch;

var supportsPassive = false;
if (inBrowser) {
  try {
    var opts = {};
    Object.defineProperty(opts, 'passive', ({
      get: function get () {
        /* istanbul ignore next */
        supportsPassive = true;
      }
    })); // https://github.com/facebook/flow/issues/285
    window.addEventListener('test-passive', null, opts);
  } catch (e) {}
}

// this needs to be lazy-evaled because vue may be required before
// vue-server-renderer can set VUE_ENV
var _isServer;
var isServerRendering = function () {
  if (_isServer === undefined) {
    /* istanbul ignore if */
    if (!inBrowser && !inWeex && typeof global !== 'undefined') {
      // detect presence of vue-server-renderer and avoid
      // Webpack shimming the process
      _isServer = global['process'] && global['process'].env.VUE_ENV === 'server';
    } else {
      _isServer = false;
    }
  }
  return _isServer
};

/* istanbul ignore next */
function isNative (Ctor) {
  return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
}

var hasSymbol =
  typeof Symbol !== 'undefined' && isNative(Symbol) &&
  typeof Reflect !== 'undefined' && isNative(Reflect.ownKeys);

var _Set;
/* istanbul ignore if */ // $flow-disable-line
if (typeof Set !== 'undefined' && isNative(Set)) {
  // use native Set when available.
  _Set = Set;
} else {
  // a non-standard Set polyfill that only works with primitive keys.
  _Set = /*@__PURE__*/(function () {
    function Set () {
      this.set = Object.create(null);
    }
    Set.prototype.has = function has (key) {
      return this.set[key] === true
    };
    Set.prototype.add = function add (key) {
      this.set[key] = true;
    };
    Set.prototype.clear = function clear () {
      this.set = Object.create(null);
    };

    return Set;
  }());
}

var SSR_ATTR = 'data-server-rendered';

var ASSET_TYPES = [
  'component',
  'directive',
  'filter'
];

var LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
  'activated',
  'deactivated',
  'errorCaptured',
  'serverPrefetch'
];

/*  */



var config = ({
  /**
   * Option merge strategies (used in core/util/options)
   */
  // $flow-disable-line
  optionMergeStrategies: Object.create(null),

  /**
   * Whether to suppress warnings.
   */
  silent: false,

  /**
   * Show production mode tip message on boot?
   */
  productionTip: "development" !== 'production',

  /**
   * Whether to enable devtools
   */
  devtools: "development" !== 'production',

  /**
   * Whether to record perf
   */
  performance: false,

  /**
   * Error handler for watcher errors
   */
  errorHandler: null,

  /**
   * Warn handler for watcher warns
   */
  warnHandler: null,

  /**
   * Ignore certain custom elements
   */
  ignoredElements: [],

  /**
   * Custom user key aliases for v-on
   */
  // $flow-disable-line
  keyCodes: Object.create(null),

  /**
   * Check if a tag is reserved so that it cannot be registered as a
   * component. This is platform-dependent and may be overwritten.
   */
  isReservedTag: no,

  /**
   * Check if an attribute is reserved so that it cannot be used as a component
   * prop. This is platform-dependent and may be overwritten.
   */
  isReservedAttr: no,

  /**
   * Check if a tag is an unknown element.
   * Platform-dependent.
   */
  isUnknownElement: no,

  /**
   * Get the namespace of an element
   */
  getTagNamespace: noop,

  /**
   * Parse the real tag name for the specific platform.
   */
  parsePlatformTagName: identity,

  /**
   * Check if an attribute must be bound using property, e.g. value
   * Platform-dependent.
   */
  mustUseProp: no,

  /**
   * Perform updates asynchronously. Intended to be used by Vue Test Utils
   * This will significantly reduce performance if set to false.
   */
  async: true,

  /**
   * Exposed for legacy reasons
   */
  _lifecycleHooks: LIFECYCLE_HOOKS
});

/*  */

var warn = noop;
var tip = noop;
var generateComponentTrace = (noop); // work around flow check
var formatComponentName = (noop);

{
  var hasConsole = typeof console !== 'undefined';
  var classifyRE = /(?:^|[-_])(\w)/g;
  var classify = function (str) { return str
    .replace(classifyRE, function (c) { return c.toUpperCase(); })
    .replace(/[-_]/g, ''); };

  warn = function (msg, vm) {
    var trace = vm ? generateComponentTrace(vm) : '';

    if (hasConsole && (!config.silent)) {
      console.error(("[Vue warn]: " + msg + trace));
    }
  };

  tip = function (msg, vm) {
    if (hasConsole && (!config.silent)) {
      console.warn("[Vue tip]: " + msg + (
        vm ? generateComponentTrace(vm) : ''
      ));
    }
  };

  formatComponentName = function (vm, includeFile) {
    if (vm.$root === vm) {
      return '<Root>'
    }
    var options = typeof vm === 'function' && vm.cid != null
      ? vm.options
      : vm._isVue
        ? vm.$options || vm.constructor.options
        : vm;
    var name = options.name || options._componentTag;
    var file = options.__file;
    if (!name && file) {
      var match = file.match(/([^/\\]+)\.vue$/);
      name = match && match[1];
    }

    return (
      (name ? ("<" + (classify(name)) + ">") : "<Anonymous>") +
      (file && includeFile !== false ? (" at " + file) : '')
    )
  };

  var repeat = function (str, n) {
    var res = '';
    while (n) {
      if (n % 2 === 1) { res += str; }
      if (n > 1) { str += str; }
      n >>= 1;
    }
    return res
  };

  generateComponentTrace = function (vm) {
    if (vm._isVue && vm.$parent) {
      var tree = [];
      var currentRecursiveSequence = 0;
      while (vm) {
        if (tree.length > 0) {
          var last = tree[tree.length - 1];
          if (last.constructor === vm.constructor) {
            currentRecursiveSequence++;
            vm = vm.$parent;
            continue
          } else if (currentRecursiveSequence > 0) {
            tree[tree.length - 1] = [last, currentRecursiveSequence];
            currentRecursiveSequence = 0;
          }
        }
        tree.push(vm);
        vm = vm.$parent;
      }
      return '\n\nfound in\n\n' + tree
        .map(function (vm, i) { return ("" + (i === 0 ? '---> ' : repeat(' ', 5 + i * 2)) + (Array.isArray(vm)
            ? ((formatComponentName(vm[0])) + "... (" + (vm[1]) + " recursive calls)")
            : formatComponentName(vm))); })
        .join('\n')
    } else {
      return ("\n\n(found in " + (formatComponentName(vm)) + ")")
    }
  };
}

/*  */

var uid = 0;

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
var Dep = function Dep () {
  this.id = uid++;
  this.subs = [];
};

Dep.prototype.addSub = function addSub (sub) {
  this.subs.push(sub);
};

Dep.prototype.removeSub = function removeSub (sub) {
  remove(this.subs, sub);
};

Dep.prototype.depend = function depend () {
  if (Dep.target) {
    Dep.target.addDep(this);
  }
};

Dep.prototype.notify = function notify () {
  // stabilize the subscriber list first
  var subs = this.subs.slice();
  for (var i = 0, l = subs.length; i < l; i++) {
    subs[i].update();
  }
};

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
Dep.target = null;
var targetStack = [];

function pushTarget (target) {
  targetStack.push(target);
  Dep.target = target;
}

function popTarget () {
  targetStack.pop();
  Dep.target = targetStack[targetStack.length - 1];
}

/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

var arrayProto = Array.prototype;
var arrayMethods = Object.create(arrayProto);

var methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
];

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  var original = arrayProto[method];
  def(arrayMethods, method, function mutator () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    var result = original.apply(this, args);
    var ob = this.__ob__;
    var inserted;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args;
        break
      case 'splice':
        inserted = args.slice(2);
        break
    }
    if (inserted) { ob.observeArray(inserted); }
    // notify change
    ob.dep.notify();
    return result
  });
});

/*  */

var arrayKeys = Object.getOwnPropertyNames(arrayMethods);

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
var shouldObserve = true;

function toggleObserving (value) {
  shouldObserve = value;
}

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
var Observer = function Observer (value) {
  this.value = value;
  this.dep = new Dep();
  this.vmCount = 0;
  def(value, '__ob__', this);
  if (Array.isArray(value)) {
    if (hasProto) {
      protoAugment(value, arrayMethods);
    } else {
      copyAugment(value, arrayMethods, arrayKeys);
    }
    this.observeArray(value);
  } else {
    this.walk(value);
  }
};

/**
 * Walk through all properties and convert them into
 * getter/setters. This method should only be called when
 * value type is Object.
 */
Observer.prototype.walk = function walk (obj) {
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    defineReactive(obj, keys[i]);
  }
};

/**
 * Observe a list of Array items.
 */
Observer.prototype.observeArray = function observeArray (items) {
  for (var i = 0, l = items.length; i < l; i++) {
    observe(items[i]);
  }
};

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src) {
  /* eslint-disable no-proto */
  target.__proto__ = src;
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target, src, keys) {
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    def(target, key, src[key]);
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
function observe (value, asRootData) {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  var ob;
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value);
  }
  if (asRootData && ob) {
    ob.vmCount++;
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 */
function defineReactive (
  obj,
  key,
  val,
  customSetter,
  shallow
) {
  var dep = new Dep();

  var property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  var getter = property && property.get;
  var setter = property && property.set;
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key];
  }

  var childOb = !shallow && observe(val);
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      var value = getter ? getter.call(obj) : val;
      if (Dep.target) {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
          if (Array.isArray(value)) {
            dependArray(value);
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      var value = getter ? getter.call(obj) : val;
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if ( customSetter) {
        customSetter();
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) { return }
      if (setter) {
        setter.call(obj, newVal);
      } else {
        val = newVal;
      }
      childOb = !shallow && observe(newVal);
      dep.notify();
    }
  });
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
function set (target, key, val) {
  if (
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(("Cannot set reactive property on undefined, null, or primitive value: " + ((target))));
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key);
    target.splice(key, 1, val);
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val;
    return val
  }
  var ob = (target).__ob__;
  if (target._isVue || (ob && ob.vmCount)) {
     warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    );
    return val
  }
  if (!ob) {
    target[key] = val;
    return val
  }
  defineReactive(ob.value, key, val);
  ob.dep.notify();
  return val
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value) {
  for (var e = (void 0), i = 0, l = value.length; i < l; i++) {
    e = value[i];
    e && e.__ob__ && e.__ob__.dep.depend();
    if (Array.isArray(e)) {
      dependArray(e);
    }
  }
}

/*  */

/**
 * Option overwriting strategies are functions that handle
 * how to merge a parent option value and a child option
 * value into the final value.
 */
var strats = config.optionMergeStrategies;

/**
 * Options with restrictions
 */
{
    strats.el = strats.propsData = function(parent, child, vm, key) {
        if (!vm) {
            warn(
                "option \"" + key + "\" can only be used during instance " +
                'creation with the `new` keyword.'
            );
        }
        return defaultStrat(parent, child)
    };
}

/**
 * Helper that recursively merges two data objects together.
 */
function mergeData(to, from) {
    if (!from) { return to }
    var key, toVal, fromVal;

    var keys = hasSymbol ?
        Reflect.ownKeys(from) :
        Object.keys(from);

    for (var i = 0; i < keys.length; i++) {
        key = keys[i];
        // in case the object is already observed...
        if (key === '__ob__') { continue }
        toVal = to[key];
        fromVal = from[key];
        if (!hasOwn(to, key)) {
            set(to, key, fromVal);
        } else if (
            toVal !== fromVal &&
            isPlainObject(toVal) &&
            isPlainObject(fromVal)
        ) {
            mergeData(toVal, fromVal);
        }
    }
    return to
}

/**
 * Data
 */
function mergeDataOrFn(
    parentVal,
    childVal,
    vm 
) {
    if (!vm) {
        // in a Vue.extend merge, both should be functions
        if (!childVal) {
            return parentVal
        }
        if (!parentVal) {
            return childVal
        }
        // when parentVal & childVal are both present,
        // we need to return a function that returns the
        // merged result of both functions... no need to
        // check if parentVal is a function here because
        // it has to be a function to pass previous merges.
        return function mergedDataFn() {
            return mergeData(
                typeof childVal === 'function' ? childVal.call(this, this) : childVal,
                typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
            )
        }
    } else {
        return function mergedInstanceDataFn() {
            // instance merge
            var instanceData = typeof childVal === 'function' ?
                childVal.call(vm, vm) :
                childVal;
            var defaultData = typeof parentVal === 'function' ?
                parentVal.call(vm, vm) :
                parentVal;
            if (instanceData) {
                return mergeData(instanceData, defaultData)
            } else {
                return defaultData
            }
        }
    }
}

strats.data = function(
    parentVal,
    childVal,
    vm 
) {
    if (!vm) {
        if (childVal && typeof childVal !== 'function') {
             warn(
                'The "data" option should be a function ' +
                'that returns a per-instance value in component ' +
                'definitions.',
                vm
            );

            return parentVal
        }
        return mergeDataOrFn(parentVal, childVal)
    }

    return mergeDataOrFn(parentVal, childVal, vm)
};

/**
 * Hooks and props are merged as arrays.
 */
function mergeHook(
    parentVal ,
    childVal
) {
    var res = childVal ?
        parentVal ?
        parentVal.concat(childVal) :
        Array.isArray(childVal) ?
        childVal : [childVal] : parentVal;
    return res ?
        dedupeHooks(res) : res
}

function dedupeHooks(hooks) {
    var res = [];
    for (var i = 0; i < hooks.length; i++) {
        if (res.indexOf(hooks[i]) === -1) {
            res.push(hooks[i]);
        }
    }
    return res
}

LIFECYCLE_HOOKS.forEach(function (hook) {
    strats[hook] = mergeHook;
});

/**
 * Assets
 *
 * When a vm is present (instance creation), we need to do
 * a three-way merge between constructor options, instance
 * options and parent options.
 */
function mergeAssets(
    parentVal,
    childVal,
    vm ,
    key
) {
    var res = Object.create(parentVal || null);
    if (childVal) {
         assertObjectType(key, childVal, vm);
        return extend(res, childVal)
    } else {
        return res
    }
}

ASSET_TYPES.forEach(function(type) {
    strats[type + 's'] = mergeAssets;
});

/**
 * Watchers.
 *
 * Watchers hashes should not overwrite one
 * another, so we merge them as arrays.
 */
strats.watch = function(
    parentVal,
    childVal,
    vm ,
    key
) {
    // work around Firefox's Object.prototype.watch...
    if (parentVal === nativeWatch) { parentVal = undefined; }
    if (childVal === nativeWatch) { childVal = undefined; }
    /* istanbul ignore if */
    if (!childVal) { return Object.create(parentVal || null) }
    {
        assertObjectType(key, childVal, vm);
    }
    if (!parentVal) { return childVal }
    var ret = {};
    extend(ret, parentVal);
    for (var key$1 in childVal) {
        var parent = ret[key$1];
        var child = childVal[key$1];
        if (parent && !Array.isArray(parent)) {
            parent = [parent];
        }
        ret[key$1] = parent ?
            parent.concat(child) :
            Array.isArray(child) ? child : [child];
    }
    return ret
};

/**
 * Other object hashes.
 */
strats.props =
    strats.methods =
    strats.inject =
    strats.computed = function(
        parentVal,
        childVal,
        vm ,
        key
    ) {
        if (childVal && "development" !== 'production') {
            assertObjectType(key, childVal, vm);
        }
        if (!parentVal) { return childVal }
        var ret = Object.create(null);
        extend(ret, parentVal);
        if (childVal) { extend(ret, childVal); }
        return ret
    };
strats.provide = mergeDataOrFn;

/**
 * Default strategy.
 */
var defaultStrat = function(parentVal, childVal) {
    return childVal === undefined ?
        parentVal :
        childVal
};

/**
 * Validate component names
 */
function checkComponents(options) {
    for (var key in options.components) {
        validateComponentName(key);
    }
}

function validateComponentName(name) {
    if (!new RegExp(("^[a-zA-Z][\\-\\.0-9_" + (unicodeRegExp.source) + "]*$")).test(name)) {
        warn(
            'Invalid component name: "' + name + '". Component names ' +
            'should conform to valid custom element name in html5 specification.'
        );
    }
    if (isBuiltInTag(name) || config.isReservedTag(name)) {
        warn(
            'Do not use built-in or reserved HTML elements as component ' +
            'id: ' + name
        );
    }
}

/**
 * Ensure all props option syntax are normalized into the
 * Object-based format.
 */
function normalizeProps(options, vm) {
    var props = options.props;
    if (!props) { return }
    var res = {};
    var i, val, name;
    if (Array.isArray(props)) {
        i = props.length;
        while (i--) {
            val = props[i];
            if (typeof val === 'string') {
                name = camelize(val);
                res[name] = {
                    type: null
                };
            } else {
                warn('props must be strings when using array syntax.');
            }
        }
    } else if (isPlainObject(props)) {
        for (var key in props) {
            val = props[key];
            name = camelize(key);
            res[name] = isPlainObject(val) ?
                val : {
                    type: val
                };
        }
    } else {
        warn(
            "Invalid value for option \"props\": expected an Array or an Object, " +
            "but got " + (toRawType(props)) + ".",
            vm
        );
    }
    options.props = res;
}

/**
 * Normalize all injections into Object-based format
 */
function normalizeInject(options, vm) {
    var inject = options.inject;
    if (!inject) { return }
    var normalized = options.inject = {};
    if (Array.isArray(inject)) {
        for (var i = 0; i < inject.length; i++) {
            normalized[inject[i]] = {
                from: inject[i]
            };
        }
    } else if (isPlainObject(inject)) {
        for (var key in inject) {
            var val = inject[key];
            normalized[key] = isPlainObject(val) ?
                extend({
                    from: key
                }, val) : {
                    from: val
                };
        }
    } else {
        warn(
            "Invalid value for option \"inject\": expected an Array or an Object, " +
            "but got " + (toRawType(inject)) + ".",
            vm
        );
    }
}

/**
 * Normalize raw function directives into object format.
 */
function normalizeDirectives(options) {
    var dirs = options.directives;
    if (dirs) {
        for (var key in dirs) {
            var def = dirs[key];
            if (typeof def === 'function') {
                dirs[key] = {
                    bind: def,
                    update: def
                };
            }
        }
    }
}

function assertObjectType(name, value, vm) {
    if (!isPlainObject(value)) {
        warn(
            "Invalid value for option \"" + name + "\": expected an Object, " +
            "but got " + (toRawType(value)) + ".",
            vm
        );
    }
}

/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 */
function mergeOptions(
    parent,
    child,
    vm 
) {
    {
        checkComponents(child);
    }

    if (typeof child === 'function') {
        child = child.options;
    }

    normalizeProps(child, vm);
    normalizeInject(child, vm);
    normalizeDirectives(child);

    // Apply extends and mixins on the child options,
    // but only if it is a raw options object that isn't
    // the result of another mergeOptions call.
    // Only merged options has the _base property.
    if (!child._base) {
        if (child.extends) {
            parent = mergeOptions(parent, child.extends, vm);
        }
        if (child.mixins) {
            for (var i = 0, l = child.mixins.length; i < l; i++) {
                parent = mergeOptions(parent, child.mixins[i], vm);
            }
        }
    }

    var options = {};
    var key;
    for (key in parent) {
        mergeField(key);
    }
    for (key in child) {
        if (!hasOwn(parent, key)) {
            mergeField(key);
        }
    }

    function mergeField(key) {
        var strat = strats[key] || defaultStrat;
        options[key] = strat(parent[key], child[key], vm, key);
    }
    return options
}

/**
 * Resolve an asset.
 * This function is used because child instances need access
 * to assets defined in its ancestor chain.
 */
// resolveAsset方法其实就是获取context.$options.components中xxxx所对应的值
function resolveAsset(
    options,
    type,
    id,
    warnMissing 
) {
    /* istanbul ignore if */
    if (typeof id !== 'string') {
        return
    }

    var assets = options[type];
    // check local registration variations first
    if (hasOwn(assets, id)) { return assets[id] }

    var camelizedId = camelize(id); // 驼峰式
    if (hasOwn(assets, camelizedId)) { return assets[camelizedId] }

    var PascalCaseId = capitalize(camelizedId); // Pascal式
    if (hasOwn(assets, PascalCaseId)) { return assets[PascalCaseId] }

    // fallback to prototype chain
    var res = assets[id] || assets[camelizedId] || assets[PascalCaseId];

    if ( warnMissing && !res) {
        warn(
            'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
            options
        );
    }

    return res
}

/*  */



function validateProp (
  key,
  propOptions,
  propsData,
  vm
) {
  var prop = propOptions[key];
  var absent = !hasOwn(propsData, key);
  var value = propsData[key];
  // boolean casting
  var booleanIndex = getTypeIndex(Boolean, prop.type);
  if (booleanIndex > -1) {
    if (absent && !hasOwn(prop, 'default')) {
      value = false;
    } else if (value === '' || value === hyphenate(key)) {
      // only cast empty string / same name to boolean if
      // boolean has higher priority
      var stringIndex = getTypeIndex(String, prop.type);
      if (stringIndex < 0 || booleanIndex < stringIndex) {
        value = true;
      }
    }
  }
  // check default value
  if (value === undefined) {
    value = getPropDefaultValue(vm, prop, key);
    // since the default value is a fresh copy,
    // make sure to observe it.
    var prevShouldObserve = shouldObserve;
    toggleObserving(true);
    observe(value);
    toggleObserving(prevShouldObserve);
  }
  {
    assertProp(prop, key, value, vm, absent);
  }
  return value
}

/**
 * Get the default value of a prop.
 */
function getPropDefaultValue (vm, prop, key) {
  // no default, return undefined
  if (!hasOwn(prop, 'default')) {
    return undefined
  }
  var def = prop.default;
  // warn against non-factory defaults for Object & Array
  if ( isObject(def)) {
    warn(
      'Invalid default value for prop "' + key + '": ' +
      'Props with type Object/Array must use a factory function ' +
      'to return the default value.',
      vm
    );
  }
  // the raw prop value was also undefined from previous render,
  // return previous default value to avoid unnecessary watcher trigger
  if (vm && vm.$options.propsData &&
    vm.$options.propsData[key] === undefined &&
    vm._props[key] !== undefined
  ) {
    return vm._props[key]
  }
  // call factory function for non-Function types
  // a value is Function if its prototype is function even across different execution context
  return typeof def === 'function' && getType(prop.type) !== 'Function'
    ? def.call(vm)
    : def
}

/**
 * Assert whether a prop is valid.
 */
function assertProp (
  prop,
  name,
  value,
  vm,
  absent
) {
  if (prop.required && absent) {
    warn(
      'Missing required prop: "' + name + '"',
      vm
    );
    return
  }
  if (value == null && !prop.required) {
    return
  }
  var type = prop.type;
  var valid = !type || type === true;
  var expectedTypes = [];
  if (type) {
    if (!Array.isArray(type)) {
      type = [type];
    }
    for (var i = 0; i < type.length && !valid; i++) {
      var assertedType = assertType(value, type[i]);
      expectedTypes.push(assertedType.expectedType || '');
      valid = assertedType.valid;
    }
  }

  if (!valid) {
    warn(
      getInvalidTypeMessage(name, value, expectedTypes),
      vm
    );
    return
  }
  var validator = prop.validator;
  if (validator) {
    if (!validator(value)) {
      warn(
        'Invalid prop: custom validator check failed for prop "' + name + '".',
        vm
      );
    }
  }
}

var simpleCheckRE = /^(String|Number|Boolean|Function|Symbol)$/;

function assertType (value, type) {
  var valid;
  var expectedType = getType(type);
  if (simpleCheckRE.test(expectedType)) {
    var t = typeof value;
    valid = t === expectedType.toLowerCase();
    // for primitive wrapper objects
    if (!valid && t === 'object') {
      valid = value instanceof type;
    }
  } else if (expectedType === 'Object') {
    valid = isPlainObject(value);
  } else if (expectedType === 'Array') {
    valid = Array.isArray(value);
  } else {
    valid = value instanceof type;
  }
  return {
    valid: valid,
    expectedType: expectedType
  }
}

/**
 * Use function string name to check built-in types,
 * because a simple equality check will fail when running
 * across different vms / iframes.
 */
function getType (fn) {
  var match = fn && fn.toString().match(/^\s*function (\w+)/);
  return match ? match[1] : ''
}

function isSameType (a, b) {
  return getType(a) === getType(b)
}

function getTypeIndex (type, expectedTypes) {
  if (!Array.isArray(expectedTypes)) {
    return isSameType(expectedTypes, type) ? 0 : -1
  }
  for (var i = 0, len = expectedTypes.length; i < len; i++) {
    if (isSameType(expectedTypes[i], type)) {
      return i
    }
  }
  return -1
}

function getInvalidTypeMessage (name, value, expectedTypes) {
  var message = "Invalid prop: type check failed for prop \"" + name + "\"." +
    " Expected " + (expectedTypes.map(capitalize).join(', '));
  var expectedType = expectedTypes[0];
  var receivedType = toRawType(value);
  var expectedValue = styleValue(value, expectedType);
  var receivedValue = styleValue(value, receivedType);
  // check if we need to specify expected value
  if (expectedTypes.length === 1 &&
      isExplicable(expectedType) &&
      !isBoolean(expectedType, receivedType)) {
    message += " with value " + expectedValue;
  }
  message += ", got " + receivedType + " ";
  // check if we need to specify received value
  if (isExplicable(receivedType)) {
    message += "with value " + receivedValue + ".";
  }
  return message
}

function styleValue (value, type) {
  if (type === 'String') {
    return ("\"" + value + "\"")
  } else if (type === 'Number') {
    return ("" + (Number(value)))
  } else {
    return ("" + value)
  }
}

function isExplicable (value) {
  var explicitTypes = ['string', 'number', 'boolean'];
  return explicitTypes.some(function (elem) { return value.toLowerCase() === elem; })
}

function isBoolean () {
  var args = [], len = arguments.length;
  while ( len-- ) args[ len ] = arguments[ len ];

  return args.some(function (elem) { return elem.toLowerCase() === 'boolean'; })
}

/*  */

function handleError(err, vm, info) {
    // Deactivate deps tracking while processing error handler to avoid possible infinite rendering.
    // See: https://github.com/vuejs/vuex/issues/1505
    pushTarget();
    try {
        if (vm) {
            var cur = vm;
            while ((cur = cur.$parent)) {
                var hooks = cur.$options.errorCaptured;
                if (hooks) {
                    for (var i = 0; i < hooks.length; i++) {
                        try {
                            var capture = hooks[i].call(cur, err, vm, info) === false;
                            if (capture) { return }
                        } catch (e) {
                            globalHandleError(e, cur, 'errorCaptured hook');
                        }
                    }
                }
            }
        }
        globalHandleError(err, vm, info);
    } finally {
        popTarget();
    }
}

/**
 * 带有错误处理的调用函数
 *
 * @export
 * @param {Function} handler 被调用的函数
 * @param {*} context 上下文环境
 * @param {(null | any[])} args 传参
 * @param {*} vm 当前实例
 * @param {string} info 错误信息
 * @returns 函数调用返回的值
 */
function invokeWithErrorHandling(
    handler,
    context,
    args,
    vm,
    info
) {
    var res;
    try {
        // 根据参数判断使用apply或call
        res = args ? handler.apply(context, args) : handler.call(context);

        if (res && !res._isVue && isPromise(res) && !res._handled) {
            res.catch(function (e) { return handleError(e, vm, info + " (Promise/async)"); });
            // issue #9511
            // avoid catch triggering multiple times when nested calls
            res._handled = true;
        }
    } catch (e) { // 执行函数报错的时候 收集错误
        handleError(e, vm, info);
    }

    return res
}

function globalHandleError(err, vm, info) {
    logError(err, vm, info);
}

function logError(err, vm, info) {
    {
        warn(("Error in " + info + ": \"" + (err.toString()) + "\""), vm);
    }
    /* istanbul ignore else */
    if ((inBrowser || inWeex) && typeof console !== 'undefined') {
        console.error(err);
    } else {
        throw err
    }
}

/*  */

var callbacks = [];

function flushCallbacks () {
  var copies = callbacks.slice(0);
  callbacks.length = 0;
  for (var i = 0; i < copies.length; i++) {
    copies[i]();
  }
}

// The nextTick behavior leverages the microtask queue, which can be accessed
// via either native Promise.then or MutationObserver.
// MutationObserver has wider support, however it is seriously bugged in
// UIWebView in iOS >= 9.3.3 when triggered in touch event handlers. It
// completely stops working after triggering a few times... so, if native
// Promise is available, we will use it:
/* istanbul ignore next, $flow-disable-line */
if (typeof Promise !== 'undefined' && isNative(Promise)) ; else if (!isIE && typeof MutationObserver !== 'undefined' && (
  isNative(MutationObserver) ||
  // PhantomJS and iOS 7.x
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  // Use MutationObserver where native Promise is not available,
  // e.g. PhantomJS, iOS7, Android 4.4
  // (#6466 MutationObserver is unreliable in IE11)
  var counter = 1;
  var observer = new MutationObserver(flushCallbacks);
  var textNode = document.createTextNode(String(counter));
  observer.observe(textNode, {
    characterData: true
  });
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) ;

/*  */

function genClassForVnode (vnode) {
  var data = vnode.data;
  var parentNode = vnode;
  var childNode = vnode;
  while (isDef(childNode.componentInstance)) {
    childNode = childNode.componentInstance._vnode;
    if (childNode && childNode.data) {
      data = mergeClassData(childNode.data, data);
    }
  }
  while (isDef(parentNode = parentNode.parent)) {
    if (parentNode && parentNode.data) {
      data = mergeClassData(data, parentNode.data);
    }
  }
  return renderClass(data.staticClass, data.class)
}

function mergeClassData (child, parent) {
  return {
    staticClass: concat(child.staticClass, parent.staticClass),
    class: isDef(child.class)
      ? [child.class, parent.class]
      : parent.class
  }
}

function renderClass (
  staticClass,
  dynamicClass
) {
  if (isDef(staticClass) || isDef(dynamicClass)) {
    return concat(staticClass, stringifyClass(dynamicClass))
  }
  /* istanbul ignore next */
  return ''
}

function concat (a, b) {
  return a ? b ? (a + ' ' + b) : a : (b || '')
}

function stringifyClass (value) {
  if (Array.isArray(value)) {
    return stringifyArray(value)
  }
  if (isObject(value)) {
    return stringifyObject(value)
  }
  if (typeof value === 'string') {
    return value
  }
  /* istanbul ignore next */
  return ''
}

function stringifyArray (value) {
  var res = '';
  var stringified;
  for (var i = 0, l = value.length; i < l; i++) {
    if (isDef(stringified = stringifyClass(value[i])) && stringified !== '') {
      if (res) { res += ' '; }
      res += stringified;
    }
  }
  return res
}

function stringifyObject (value) {
  var res = '';
  for (var key in value) {
    if (value[key]) {
      if (res) { res += ' '; }
      res += key;
    }
  }
  return res
}

/*  */

var isHTMLTag = makeMap(
  'html,body,base,head,link,meta,style,title,' +
  'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
  'div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,' +
  'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
  's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
  'embed,object,param,source,canvas,script,noscript,del,ins,' +
  'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
  'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
  'output,progress,select,textarea,' +
  'details,dialog,menu,menuitem,summary,' +
  'content,element,shadow,template,blockquote,iframe,tfoot'
);

// this map is intentionally selective, only covering SVG elements that may
// contain child elements.
var isSVG = makeMap(
  'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,' +
  'foreignObject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
  'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view',
  true
);

var isPreTag = function (tag) { return tag === 'pre'; };

var isReservedTag = function (tag) {
  return isHTMLTag(tag) || isSVG(tag)
};

function getTagNamespace (tag) {
  if (isSVG(tag)) {
    return 'svg'
  }
  // basic support for MathML
  // note it doesn't support other MathML elements being component roots
  if (tag === 'math') {
    return 'math'
  }
}

var isTextInputType = makeMap('text,number,password,search,email,tel,url');

/*  */

function renderClass$1 (node) {
  var classList = genClassForVnode(node);
  if (classList !== '') {
    return (" class=\"" + (escape(classList)) + "\"")
  }
}

/*  */

var parseStyleText = cached(function (cssText) {
  var res = {};
  var listDelimiter = /;(?![^(]*\))/g;
  var propertyDelimiter = /:(.+)/;
  cssText.split(listDelimiter).forEach(function (item) {
    if (item) {
      var tmp = item.split(propertyDelimiter);
      tmp.length > 1 && (res[tmp[0].trim()] = tmp[1].trim());
    }
  });
  return res
});

// merge static and dynamic style data on the same vnode
function normalizeStyleData (data) {
  var style = normalizeStyleBinding(data.style);
  // static style is pre-processed into an object during compilation
  // and is always a fresh object, so it's safe to merge into it
  return data.staticStyle
    ? extend(data.staticStyle, style)
    : style
}

// normalize possible array / string values into Object
function normalizeStyleBinding (bindingStyle) {
  if (Array.isArray(bindingStyle)) {
    return toObject(bindingStyle)
  }
  if (typeof bindingStyle === 'string') {
    return parseStyleText(bindingStyle)
  }
  return bindingStyle
}

/**
 * parent component style should be after child's
 * so that parent component's style could override it
 */
function getStyle (vnode, checkChild) {
  var res = {};
  var styleData;

  if (checkChild) {
    var childNode = vnode;
    while (childNode.componentInstance) {
      childNode = childNode.componentInstance._vnode;
      if (
        childNode && childNode.data &&
        (styleData = normalizeStyleData(childNode.data))
      ) {
        extend(res, styleData);
      }
    }
  }

  if ((styleData = normalizeStyleData(vnode.data))) {
    extend(res, styleData);
  }

  var parentNode = vnode;
  while ((parentNode = parentNode.parent)) {
    if (parentNode.data && (styleData = normalizeStyleData(parentNode.data))) {
      extend(res, styleData);
    }
  }
  return res
}

/*  */

function genStyle (style) {
  var styleText = '';
  for (var key in style) {
    var value = style[key];
    var hyphenatedKey = hyphenate(key);
    if (Array.isArray(value)) {
      for (var i = 0, len = value.length; i < len; i++) {
        styleText += normalizeValue(hyphenatedKey, value[i]);
      }
    } else {
      styleText += normalizeValue(hyphenatedKey, value);
    }
  }
  return styleText
}

function normalizeValue(key, value) {
  if (
    typeof value === 'string' ||
    (typeof value === 'number' && noUnitNumericStyleProps[key]) ||
    value === 0
  ) {
    return (key + ":" + value + ";")
  } else {
    // invalid values
    return ""
  }
}

function renderStyle (vnode) {
  var styleText = genStyle(getStyle(vnode, false));
  if (styleText !== '') {
    return (" style=" + (JSON.stringify(escape(styleText))))
  }
}

var modules = [
  renderAttrs,
  renderDOMProps,
  renderClass$1,
  renderStyle
];

/*  */

function show (node, dir) {
  if (!dir.value) {
    var style = node.data.style || (node.data.style = {});
    if (Array.isArray(style)) {
      style.push({ display: 'none' });
    } else {
      style.display = 'none';
    }
  }
}

/*  */

// this is only applied for <select v-model> because it is the only edge case
// that must be done at runtime instead of compile time.
function model (node, dir) {
  if (!node.children) { return }
  var value = dir.value;
  var isMultiple = node.data.attrs && node.data.attrs.multiple;
  for (var i = 0, l = node.children.length; i < l; i++) {
    var option = node.children[i];
    if (option.tag === 'option') {
      if (isMultiple) {
        var selected =
          Array.isArray(value) &&
          (looseIndexOf(value, getValue(option)) > -1);
        if (selected) {
          setSelected(option);
        }
      } else {
        if (looseEqual(value, getValue(option))) {
          setSelected(option);
          return
        }
      }
    }
  }
}

function getValue (option) {
  var data = option.data || {};
  return (
    (data.attrs && data.attrs.value) ||
    (data.domProps && data.domProps.value) ||
    (option.children && option.children[0] && option.children[0].text)
  )
}

function setSelected (option) {
  var data = option.data || (option.data = {});
  var attrs = data.attrs || (data.attrs = {});
  attrs.selected = '';
}

var baseDirectives = {
  show: show,
  model: model
};

/*  */

var isUnaryTag = makeMap(
  'area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
  'link,meta,param,source,track,wbr'
);

// Elements that you can, intentionally, leave open
// (and which close themselves)
var canBeLeftOpenTag = makeMap(
  'colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source'
);

// HTML5 tags https://html.spec.whatwg.org/multipage/indices.html#elements-3
// Phrasing Content https://html.spec.whatwg.org/multipage/dom.html#phrasing-content
var isNonPhrasingTag = makeMap(
  'address,article,aside,base,blockquote,body,caption,col,colgroup,dd,' +
  'details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,' +
  'h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,' +
  'optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,' +
  'title,tr,track'
);

/*  */

var MAX_STACK_DEPTH = 800;
var noop$1 = function (_) { return _; };

var defer = typeof process !== 'undefined' && process.nextTick
  ? process.nextTick
  : typeof Promise !== 'undefined'
    ? function (fn) { return Promise.resolve().then(fn); }
    : typeof setTimeout !== 'undefined'
      ? setTimeout
      : noop$1;

if (defer === noop$1) {
  throw new Error(
    'Your JavaScript runtime does not support any asynchronous primitives ' +
    'that are required by vue-server-renderer. Please use a polyfill for ' +
    'either Promise or setTimeout.'
  )
}

function createWriteFunction (
  write,
  onError
) {
  var stackDepth = 0;
  var cachedWrite = function (text, next) {
    if (text && cachedWrite.caching) {
      cachedWrite.cacheBuffer[cachedWrite.cacheBuffer.length - 1] += text;
    }
    var waitForNext = write(text, next);
    if (waitForNext !== true) {
      if (stackDepth >= MAX_STACK_DEPTH) {
        defer(function () {
          try { next(); } catch (e) {
            onError(e);
          }
        });
      } else {
        stackDepth++;
        next();
        stackDepth--;
      }
    }
  };
  cachedWrite.caching = false;
  cachedWrite.cacheBuffer = [];
  cachedWrite.componentBuffer = [];
  return cachedWrite
}

/*  */

/**
 * Original RenderStream implementation by Sasha Aickin (@aickin)
 * Licensed under the Apache License, Version 2.0
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Modified by Evan You (@yyx990803)
 */

var stream = require('stream');

var RenderStream = /*@__PURE__*/(function (superclass) {
  function RenderStream (render) {
    var this$1 = this;

    superclass.call(this);
    this.buffer = '';
    this.render = render;
    this.expectedSize = 0;

    this.write = createWriteFunction(function (text, next) {
      var n = this$1.expectedSize;
      this$1.buffer += text;
      if (this$1.buffer.length >= n) {
        this$1.next = next;
        this$1.pushBySize(n);
        return true // we will decide when to call next
      }
      return false
    }, function (err) {
      this$1.emit('error', err);
    });

    this.end = function () {
      this$1.emit('beforeEnd');
      // the rendering is finished; we should push out the last of the buffer.
      this$1.done = true;
      this$1.push(this$1.buffer);
    };
  }

  if ( superclass ) RenderStream.__proto__ = superclass;
  RenderStream.prototype = Object.create( superclass && superclass.prototype );
  RenderStream.prototype.constructor = RenderStream;

  RenderStream.prototype.pushBySize = function pushBySize (n) {
    var bufferToPush = this.buffer.substring(0, n);
    this.buffer = this.buffer.substring(n);
    this.push(bufferToPush);
  };

  RenderStream.prototype.tryRender = function tryRender () {
    try {
      this.render(this.write, this.end);
    } catch (e) {
      this.emit('error', e);
    }
  };

  RenderStream.prototype.tryNext = function tryNext () {
    try {
      this.next();
    } catch (e) {
      this.emit('error', e);
    }
  };

  RenderStream.prototype._read = function _read (n) {
    this.expectedSize = n;
    // it's possible that the last chunk added bumped the buffer up to > 2 * n,
    // which means we will need to go through multiple read calls to drain it
    // down to < n.
    if (isTrue(this.done)) {
      this.push(null);
      return
    }
    if (this.buffer.length >= n) {
      this.pushBySize(n);
      return
    }
    if (isUndef(this.next)) {
      // start the rendering chain.
      this.tryRender();
    } else {
      // continue with the rendering.
      this.tryNext();
    }
  };

  return RenderStream;
}(stream.Readable));

/*  */



var RenderContext = function RenderContext (options) {
  this.userContext = options.userContext;
  this.activeInstance = options.activeInstance;
  this.renderStates = [];

  this.write = options.write;
  this.done = options.done;
  this.renderNode = options.renderNode;

  this.isUnaryTag = options.isUnaryTag;
  this.modules = options.modules;
  this.directives = options.directives;

  var cache = options.cache;
  if (cache && (!cache.get || !cache.set)) {
    throw new Error('renderer cache must implement at least get & set.')
  }
  this.cache = cache;
  this.get = cache && normalizeAsync(cache, 'get');
  this.has = cache && normalizeAsync(cache, 'has');

  this.next = this.next.bind(this);
};

RenderContext.prototype.next = function next () {
  // eslint-disable-next-line
  while (true) {
    var lastState = this.renderStates[this.renderStates.length - 1];
    if (isUndef(lastState)) {
      return this.done()
    }
    /* eslint-disable no-case-declarations */
    switch (lastState.type) {
      case 'Element':
      case 'Fragment':
        var children = lastState.children;
      var total = lastState.total;
        var rendered = lastState.rendered++;
        if (rendered < total) {
          return this.renderNode(children[rendered], false, this)
        } else {
          this.renderStates.pop();
          if (lastState.type === 'Element') {
            return this.write(lastState.endTag, this.next)
          }
        }
        break
      case 'Component':
        this.renderStates.pop();
        this.activeInstance = lastState.prevActive;
        break
      case 'ComponentWithCache':
        this.renderStates.pop();
        var buffer = lastState.buffer;
      var bufferIndex = lastState.bufferIndex;
      var componentBuffer = lastState.componentBuffer;
      var key = lastState.key;
        var result = {
          html: buffer[bufferIndex],
          components: componentBuffer[bufferIndex]
        };
        this.cache.set(key, result);
        if (bufferIndex === 0) {
          // this is a top-level cached component,
          // exit caching mode.
          this.write.caching = false;
        } else {
          // parent component is also being cached,
          // merge self into parent's result
          buffer[bufferIndex - 1] += result.html;
          var prev = componentBuffer[bufferIndex - 1];
          result.components.forEach(function (c) { return prev.add(c); });
        }
        buffer.length = bufferIndex;
        componentBuffer.length = bufferIndex;
        break
    }
  }
};

function normalizeAsync (cache, method) {
  var fn = cache[method];
  if (isUndef(fn)) {
    return
  } else if (fn.length > 1) {
    return function (key, cb) { return fn.call(cache, key, cb); }
  } else {
    return function (key, cb) { return cb(fn.call(cache, key)); }
  }
}

/*  */

var validDivisionCharRE = /[\w).+\-_$\]]/; // 判断表达式是不是正则 Chang-Jin 2019-11-13

// 过滤器解析会在 解析 文本和属性的时候用到 Chang-Jin 2019-11-07
function parseFilters (exp) {
  var inSingle = false;
  var inDouble = false;
  var inTemplateString = false;
  var inRegex = false;
  var curly = 0;
  var square = 0;
  var paren = 0;
  var lastFilterIndex = 0;
  var c, prev, i, expression, filters;

  for (i = 0; i < exp.length; i++) {
    prev = c;
    c = exp.charCodeAt(i);

    // 以下逻辑 可以保证 ' " ` ( [ { 以及正则表达式 中的 | 无效 Chang-Jin 2019-11-07
    // prev !== 0x5C 保证了转义的正常 \ Chang-Jin 2019-11-07
    if (inSingle) {
      if (c === 0x27 && prev !== 0x5C) { inSingle = false; }
    } else if (inDouble) {
      if (c === 0x22 && prev !== 0x5C) { inDouble = false; }
    } else if (inTemplateString) {
      if (c === 0x60 && prev !== 0x5C) { inTemplateString = false; }
    } else if (inRegex) {
      if (c === 0x2f && prev !== 0x5C) { inRegex = false; }
    } else if (
      c === 0x7C && // pipe |
      exp.charCodeAt(i + 1) !== 0x7C && // 排查及||情况 Chang-Jin 2019-11-07
      exp.charCodeAt(i - 1) !== 0x7C &&
      !curly && !square && !paren // 排除([{ Chang-Jin 2019-11-07
    ) {
      if (expression === undefined) {
        // first filter, end of expression
        lastFilterIndex = i + 1;
        expression = exp.slice(0, i).trim();
      } else {
        pushFilter();
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
        var j = i - 1;
        var p = (void 0);
        // find first non-whitespace prev char
        for (; j >= 0; j--) {
          p = exp.charAt(j);
          if (p !== ' ') { break }
        }
        if (!p || !validDivisionCharRE.test(p)) {
          inRegex = true;
        }
      }
    }
  }

  if (expression === undefined) {
    expression = exp.slice(0, i).trim();
  } else if (lastFilterIndex !== 0) {
    pushFilter();
  }

  function pushFilter () {
    (filters || (filters = [])).push(exp.slice(lastFilterIndex, i).trim());
    lastFilterIndex = i + 1;
  }

  if (filters) {
    for (i = 0; i < filters.length; i++) {
      expression = wrapFilter(expression, filters[i]);
    }
  }

  return expression
}

function wrapFilter (exp, filter) {
  var i = filter.indexOf('(');
  if (i < 0) {
    // _f: resolveFilter
    return ("_f(\"" + filter + "\")(" + exp + ")")
  } else {
    // 处理过滤器传参
    var name = filter.slice(0, i);
    var args = filter.slice(i + 1);
    return ("_f(\"" + name + "\")(" + exp + (args !== ')' ? ',' + args : args))
  }
}

/*  */

var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // 默认模板分割符匹配 Chang-Jin 2019-11-13
var regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g; // 匹配需要转义的字符 Chang-Jin 2019-11-13

var buildRegex = cached(function (delimiters) {
  var open = delimiters[0].replace(regexEscapeRE, '\\$&');
  var close = delimiters[1].replace(regexEscapeRE, '\\$&');
  return new RegExp(open + '((?:.|\\n)+?)' + close, 'g')
});



function parseText (
  text,
  delimiters
) {
  var tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE; // 处理自定义分割符

  // 未找到模板语法直接返回
  if (!tagRE.test(text)) {
    return
  }
  var tokens = []; // 解析后的文本数组
  var rawTokens = []; // 原文本数组
  var lastIndex = tagRE.lastIndex = 0;
  var match, index, tokenValue;

  // 匹配模板语法
  while ((match = tagRE.exec(text))) {
    index = match.index; // 匹配到的索引

    // push text token
    if (index > lastIndex) {
      rawTokens.push(tokenValue = text.slice(lastIndex, index));
      tokens.push(JSON.stringify(tokenValue));
    }
    // tag token
    var exp = parseFilters(match[1].trim()); // 解析过滤器 得到 表达式

    tokens.push(("_s(" + exp + ")")); // _s是预定义的函数
    rawTokens.push({ '@binding': exp });
    lastIndex = index + match[0].length;
  }

  // 模板语法后的文本内容
  if (lastIndex < text.length) {
    rawTokens.push(tokenValue = text.slice(lastIndex));
    tokens.push(JSON.stringify(tokenValue));
  }
  return {
    expression: tokens.join('+'),
    tokens: rawTokens
  }
}

/*  */



/* eslint-disable no-unused-vars */
function baseWarn(msg, range ) {
    console.error(("[Vue compiler]: " + msg));
}
/* eslint-enable no-unused-vars */

function pluckModuleFunction  (
    modules ,
    key
) {
    return modules ?
        modules.map(function (m) { return m[key]; }).filter(function (_) { return _; }) : []
}

// 把标签上的属性等转化为属性添加到ast上的props属性中
function addProp(el, name, value, range , dynamic ) {
    (el.props || (el.props = [])).push(rangeSetItem({
        name: name,
        value: value,
        dynamic: dynamic
    }, range));
    el.plain = false;
}

function addAttr(el, name, value, range , dynamic ) {
    var attrs = dynamic ?
        (el.dynamicAttrs || (el.dynamicAttrs = [])) :
        (el.attrs || (el.attrs = []));
    attrs.push(rangeSetItem({
        name: name,
        value: value,
        dynamic: dynamic
    }, range));
    el.plain = false;
}

// add a raw attr (use this in preTransforms)
function addRawAttr(el, name, value, range ) {
    el.attrsMap[name] = value;
    el.attrsList.push(rangeSetItem({
        name: name,
        value: value
    }, range));
}

function addDirective(
    el,
    name,
    rawName,
    value,
    arg,
    isDynamicArg,
    modifiers,
    range 
) {
    (el.directives || (el.directives = [])).push(rangeSetItem({
        name: name,
        rawName: rawName,
        value: value,
        arg: arg,
        isDynamicArg: isDynamicArg,
        modifiers: modifiers
    }, range));
    el.plain = false;
}

function prependModifierMarker(symbol, name, dynamic ) {
    return dynamic ?
        ("_p(" + name + ",\"" + symbol + "\")") :
        symbol + name // mark the event as captured
}

function addHandler(
    el,
    name,
    value,
    modifiers,
    important ,
    warn ,
    range ,
    dynamic 
) {
    modifiers = modifiers || emptyObject;
    // warn prevent and passive modifier
    /* istanbul ignore if */
    //   if (
    //     "development" !== 'production' && warn &&
    //     modifiers.prevent && modifiers.passive
    //   ) {
    //     warn(
    //       'passive and prevent can\'t be used together. ' +
    //       'Passive handler can\'t prevent default event.',
    //       range
    //     )
    //   }

    // normalize click.right and click.middle since they don't actually fire
    // this is technically browser-specific, but at least for now browsers are
    // the only target envs that have right/middle clicks.
    // 规范化click.right和click.middle，
    // 因为它们实际上不会触发，这在技术上是特定于浏览器的，
    // 但至少就目前而言，浏览器是唯一具有右键/中间点击的目标环境。
    if (modifiers.right) {
        if (dynamic) {
            name = "(" + name + ")==='click'?'contextmenu':(" + name + ")";
        } else if (name === 'click') {
            name = 'contextmenu';
            delete modifiers.right;
        }
    } else if (modifiers.middle) {
        if (dynamic) {
            name = "(" + name + ")==='click'?'mouseup':(" + name + ")";
        } else if (name === 'click') {
            name = 'mouseup';
        }
    }

    // check capture modifier
    // 如果capture存在 则把其处理为!
    if (modifiers.capture) {
        delete modifiers.capture;
        name = prependModifierMarker('!', name, dynamic);
    }

    // 如果once存在 则把其处理为~
    if (modifiers.once) {
        delete modifiers.once;
        name = prependModifierMarker('~', name, dynamic);
    }

    /* istanbul ignore if */
    // 如果passive存在 则把其处理为&
    if (modifiers.passive) {
        delete modifiers.passive;
        name = prependModifierMarker('&', name, dynamic);
    }

    // 处理native修饰符 并定义了events
    var events;
    if (modifiers.native) {
        delete modifiers.native;
        events = el.nativeEvents || (el.nativeEvents = {});
    } else {
        events = el.events || (el.events = {});
    }

    // 处理start end 值
    var newHandler = rangeSetItem({
        value: value.trim(),
        dynamic: dynamic
    }, range);

    if (modifiers !== emptyObject) {
        newHandler.modifiers = modifiers;
    }

    var handlers = events[name];
    /* istanbul ignore if */
    // 如果是一个数组 则important值决定添加到 事件数组的头部还是尾部
    if (Array.isArray(handlers)) {
        important ? handlers.unshift(newHandler) : handlers.push(newHandler);
    } else if (handlers) { // 存在但不是数组 则根据important值 拼接为一个数组
        events[name] = important ? [newHandler, handlers] : [handlers, newHandler];
    } else { // 否则把Handler添加的events对象上
        events[name] = newHandler;
    }

    el.plain = false;
}

function getRawBindingAttr(
    el,
    name
) {
    return el.rawAttrsMap[':' + name] ||
        el.rawAttrsMap['v-bind:' + name] ||
        el.rawAttrsMap[name]
}

function getBindingAttr(
    el,
    name,
    getStatic 
) {
    var dynamicValue =
        getAndRemoveAttr(el, ':' + name) ||
        getAndRemoveAttr(el, 'v-bind:' + name);
    if (dynamicValue != null) {
        return parseFilters(dynamicValue)
    } else if (getStatic !== false) {
        var staticValue = getAndRemoveAttr(el, name);
        if (staticValue != null) {
            return JSON.stringify(staticValue)
        }
    }
}

// note: this only removes the attr from the Array (attrsList) so that it
// doesn't get processed by processAttrs.
// By default it does NOT remove it from the map (attrsMap) because the map is
// needed during codegen.
// 注意：这只会从数组（attrsList）中删除attr，以便processAttrs不会对其进行处理。
// 默认情况下，它不会从map（attrsMap）中删除它，因为在代码生成期间需要map。
function getAndRemoveAttr(
    el,
    name,
    removeFromMap 
) {
    var val;

    if ((val = el.attrsMap[name]) != null) {
        var list = el.attrsList;

        for (var i = 0, l = list.length; i < l; i++) {
            // 从attrsList中删除该属性
            if (list[i].name === name) {
                list.splice(i, 1);
                break
            }
        }
    }

    // 如果需要从map上删除 传第三个参数为true
    if (removeFromMap) {
        delete el.attrsMap[name];
    }

    // 返回要获取属性得值
    return val
}

function getAndRemoveAttrByRegex(
    el,
    name
) {
    var list = el.attrsList;
    for (var i = 0, l = list.length; i < l; i++) {
        var attr = list[i];
        if (name.test(attr.name)) {
            list.splice(i, 1);
            return attr
        }
    }
}

function rangeSetItem(
    item,
    range 
) {
    if (range) {
        if (range.start != null) {
            item.start = range.start;
        }
        if (range.end != null) {
            item.end = range.end;
        }
    }
    return item
}

/*  */

function transformNode (el, options) {
  var warn = options.warn || baseWarn;
  var staticClass = getAndRemoveAttr(el, 'class');
  if ( staticClass) {
    var res = parseText(staticClass, options.delimiters);
    if (res) {
      warn(
        "class=\"" + staticClass + "\": " +
        'Interpolation inside attributes has been removed. ' +
        'Use v-bind or the colon shorthand instead. For example, ' +
        'instead of <div class="{{ val }}">, use <div :class="val">.',
        el.rawAttrsMap['class']
      );
    }
  }
  if (staticClass) {
    el.staticClass = JSON.stringify(staticClass);
  }
  var classBinding = getBindingAttr(el, 'class', false /* getStatic */);
  if (classBinding) {
    el.classBinding = classBinding;
  }
}

function genData (el) {
  var data = '';
  if (el.staticClass) {
    data += "staticClass:" + (el.staticClass) + ",";
  }
  if (el.classBinding) {
    data += "class:" + (el.classBinding) + ",";
  }
  return data
}

var klass = {
  staticKeys: ['staticClass'],
  transformNode: transformNode,
  genData: genData
};

/*  */

function transformNode$1 (el, options) {
  var warn = options.warn || baseWarn;
  var staticStyle = getAndRemoveAttr(el, 'style');
  if (staticStyle) {
    /* istanbul ignore if */
    {
      var res = parseText(staticStyle, options.delimiters);
      if (res) {
        warn(
          "style=\"" + staticStyle + "\": " +
          'Interpolation inside attributes has been removed. ' +
          'Use v-bind or the colon shorthand instead. For example, ' +
          'instead of <div style="{{ val }}">, use <div :style="val">.',
          el.rawAttrsMap['style']
        );
      }
    }
    el.staticStyle = JSON.stringify(parseStyleText(staticStyle));
  }

  var styleBinding = getBindingAttr(el, 'style', false /* getStatic */);
  if (styleBinding) {
    el.styleBinding = styleBinding;
  }
}

function genData$1 (el) {
  var data = '';
  if (el.staticStyle) {
    data += "staticStyle:" + (el.staticStyle) + ",";
  }
  if (el.styleBinding) {
    data += "style:(" + (el.styleBinding) + "),";
  }
  return data
}

var style = {
  staticKeys: ['staticStyle'],
  transformNode: transformNode$1,
  genData: genData$1
};

/**
 * Not type-checking this file because it's mostly vendor code.
 */

// Regular Expressions for parsing tags and attributes
var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
var dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配动态特性 Chang-Jin 2019-11-07

// 匹配其实标签名 Chang-Jin 2019-11-13
var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z" + (unicodeRegExp.source) + "]*";
var qnameCapture = "((?:" + ncname + "\\:)?" + ncname + ")";
var startTagOpen = new RegExp(("^<" + qnameCapture));

// 匹配起始标签的结束部分 做了一个单标签区分/ Chang-Jin 2019-11-13
var startTagClose = /^\s*(\/?)>/;

// 匹配双标签的结束标签 Chang-Jin 2019-11-13
var endTag = new RegExp(("^<\\/" + qnameCapture + "[^>]*>"));

// 文档声明 Chang-Jin 2019-11-13
var doctype = /^<!DOCTYPE [^>]+>/i;

// html注释 Chang-Jin 2019-11-13
// #7298: escape - to avoid being passed as HTML comment when inlined in page
var comment = /^<!\--/;
var conditionalComment = /^<!\[/;

// Special Elements (can contain anything)
var isPlainTextElement = makeMap('script,style,textarea', true);
var reCache = {};

var decodingMap = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&amp;': '&',
  '&#10;': '\n',
  '&#9;': '\t',
  '&#39;': "'"
};
var encodedAttr = /&(?:lt|gt|quot|amp|#39);/g;
var encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#39|#10|#9);/g;

// #5992
var isIgnoreNewlineTag = makeMap('pre,textarea', true);
var shouldIgnoreFirstNewline = function (tag, html) { return tag && isIgnoreNewlineTag(tag) && html[0] === '\n'; };

function decodeAttr (value, shouldDecodeNewlines) {
  var re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr;
  return value.replace(re, function (match) { return decodingMap[match]; })
}

function parseHTML (html, options) {
  var stack = [];
  var expectHTML = options.expectHTML;
  var isUnaryTag = options.isUnaryTag || no;
  var canBeLeftOpenTag = options.canBeLeftOpenTag || no;
  var index = 0;
  var last, lastTag;

  // html为模板 Chang-Jin 2019-11-13
  while (html) {
    last = html; // last保存还没解析的模板部分 Chang-Jin 2019-11-13
    // Make sure we're not in a plaintext content element like script/style
    if (!lastTag || !isPlainTextElement(lastTag)) {
      var textEnd = html.indexOf('<');
      if (textEnd === 0) {

        // 过滤注释 Chang-Jin 2019-11-13
        // Comment:
        if (comment.test(html)) {
          var commentEnd = html.indexOf('-->');

          if (commentEnd >= 0) {
            if (options.shouldKeepComment) {
              options.comment(html.substring(4, commentEnd), index, index + commentEnd + 3);
            }
            advance(commentEnd + 3);
            continue
          }
        }

        // 过滤html注释 Chang-Jin 2019-11-13
        // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
        if (conditionalComment.test(html)) {
          var conditionalEnd = html.indexOf(']>');

          if (conditionalEnd >= 0) {
            advance(conditionalEnd + 2);
            continue
          }
        }

        // 过滤doctype Chang-Jin 2019-11-13
        // Doctype:
        var doctypeMatch = html.match(doctype);
        if (doctypeMatch) {
          advance(doctypeMatch[0].length);
          continue
        }

        // 匹配结束标签 Chang-Jin 2019-11-13
        // End tag:
        var endTagMatch = html.match(endTag);
        if (endTagMatch) {
          var curIndex = index;
          advance(endTagMatch[0].length);
          parseEndTag(endTagMatch[1], curIndex, index);
          continue
        }

        // Start tag:
        var startTagMatch = parseStartTag();
        if (startTagMatch) {
          handleStartTag(startTagMatch);
          if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
            advance(1);
          }
          continue
        }
      }

      var text = (void 0), rest = (void 0), next = (void 0);
      if (textEnd >= 0) {
        rest = html.slice(textEnd);
        while (
          !endTag.test(rest) &&
          !startTagOpen.test(rest) &&
          !comment.test(rest) &&
          !conditionalComment.test(rest)
        ) {
          // < in plain text, be forgiving and treat it as text
          next = rest.indexOf('<', 1);
          if (next < 0) { break }
          textEnd += next;
          rest = html.slice(textEnd);
        }
        text = html.substring(0, textEnd);
      }

      if (textEnd < 0) {
        text = html;
      }

      if (text) {
        advance(text.length);
      }

      if (options.chars && text) {
        options.chars(text, index - text.length, index);
      }
    } else {
      var endTagLength = 0;
      var stackedTag = lastTag.toLowerCase();
      var reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'));
      var rest$1 = html.replace(reStackedTag, function (all, text, endTag) {
        endTagLength = endTag.length;
        if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
          text = text
            .replace(/<!\--([\s\S]*?)-->/g, '$1') // #7298
            .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1');
        }
        if (shouldIgnoreFirstNewline(stackedTag, text)) {
          text = text.slice(1);
        }
        if (options.chars) {
          options.chars(text);
        }
        return ''
      });
      index += html.length - rest$1.length;
      html = rest$1;
      parseEndTag(stackedTag, index - endTagLength, index);
    }

    if (html === last) {
      options.chars && options.chars(html);
      if ( !stack.length && options.warn) {
        options.warn(("Mal-formatted tag at end of template: \"" + html + "\""), { start: index + html.length });
      }
      break
    }
  }

  // Clean up any remaining tags
  parseEndTag();

  // 把html从n位截取 并记录索引index的位置 Chang-Jin 2019-11-13
  function advance (n) {
    index += n;
    html = html.substring(n);
  }

  function parseStartTag () {
    // 匹配标签名 Chang-Jin 2019-11-07
    var start = html.match(startTagOpen);
    if (start) {
      var match = {
        tagName: start[1],
        attrs: [],
        start: index
      };
      advance(start[0].length);
      var end, attr;

      // startTagClose是匹配标签的 /> 或 > dynamicArgAttribute是匹配动态属性 attribute 是匹配属性 Chang-Jin 2019-11-07
      while (!(end = html.match(startTagClose)) && (attr = html.match(dynamicArgAttribute) || html.match(attribute))) {
        attr.start = index;
        advance(attr[0].length);
        attr.end = index;
        match.attrs.push(attr);
      }

      // 如果匹配到开始标签的> 则根据是否匹配到/来判断是否是单标签 Chang-Jin 2019-11-07
      if (end) {
        match.unarySlash = end[1]; // 匹配到的/
        advance(end[0].length);
        match.end = index;
        return match
      }
    }
  }

  // 对匹配到的开始标签 进一步加工 Chang-Jin 2019-11-13
  function handleStartTag (match) {
    var tagName = match.tagName;
    var unarySlash = match.unarySlash;

    if (expectHTML) {
        // p标签中插入nonPhrasingTag p标签会在插入标签前自动闭合 Chang-Jin 2019-11-08
      if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
        parseEndTag(lastTag);
      }

      // 能够不闭合的标签?
      if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
        parseEndTag(tagName);
      }
    }

    var unary = isUnaryTag(tagName) || !!unarySlash;

    var l = match.attrs.length;
    var attrs = new Array(l);
    for (var i = 0; i < l; i++) {
      var args = match.attrs[i];
      // args[3]是匹配到""包含的属性值 args[4]是匹配到''包含的属性值 args[5]是无引号包含的属性值 Chang-Jin 2019-11-07
      var value = args[3] || args[4] || args[5] || '';
      var shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
        ? options.shouldDecodeNewlinesForHref
        : options.shouldDecodeNewlines;
      attrs[i] = {
        name: args[1],
        value: decodeAttr(value, shouldDecodeNewlines) //这里会对属性的值进行解码 防止IE上出BUG
      };

      // 不是开发环境下需要属性的start和end值
      if ( options.outputSourceRange) {
        attrs[i].start = args.start + args[0].match(/^\s*/).length;
        attrs[i].end = args.end;
      }
    }

    if (!unary) {
      stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs, start: match.start, end: match.end });
      lastTag = tagName;
    }

    if (options.start) {
      options.start(tagName, attrs, unary, match.start, match.end);
    }
  }

  function parseEndTag (tagName, start, end) {
    var pos, lowerCasedTagName;
    if (start == null) { start = index; }
    if (end == null) { end = index; }

    // Find the closest opened tag of the same type
    if (tagName) {
      lowerCasedTagName = tagName.toLowerCase();
      for (pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos].lowerCasedTag === lowerCasedTagName) {
          break
        }
      }
    } else {
      // If no tag name is provided, clean shop
      pos = 0;
    }

    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (var i = stack.length - 1; i >= pos; i--) {
        if (
          (i > pos || !tagName) &&
          options.warn
        ) {
          options.warn(
            ("tag <" + (stack[i].tag) + "> has no matching end tag."),
            { start: stack[i].start, end: stack[i].end }
          );
        }
        if (options.end) {
          options.end(stack[i].tag, start, end);
        }
      }

      // Remove the open elements from the stack
      stack.length = pos; // 修改数组长度实现出栈 Chang-Jin 2019-11-08
      lastTag = pos && stack[pos - 1].tag;
    } else if (lowerCasedTagName === 'br') {
      if (options.start) {
        options.start(tagName, [], true, start, end);
      }
    } else if (lowerCasedTagName === 'p') {
      if (options.start) {
        options.start(tagName, [], false, start, end);
      }
      if (options.end) {
        options.end(tagName, start, end);
      }
    }
  }
}

/*  */

/**
 * Cross-platform code generation for component v-model
 */
function genComponentModel(
    el,
    value,
    modifiers
) {
    var ref = modifiers || {};
    var number = ref.number;
    var trim = ref.trim;

    var baseValueExpression = '$$v';
    var valueExpression = baseValueExpression;
    if (trim) {
        valueExpression =
            "(typeof " + baseValueExpression + " === 'string'" +
            "? " + baseValueExpression + ".trim()" +
            ": " + baseValueExpression + ")";
    }
    if (number) {
        valueExpression = "_n(" + valueExpression + ")";
    }
    var assignment = genAssignmentCode(value, valueExpression);

    el.model = {
        value: ("(" + value + ")"),
        expression: JSON.stringify(value),
        callback: ("function (" + baseValueExpression + ") {" + assignment + "}")
    };
}

/**
 * Cross-platform codegen helper for generating v-model value assignment code.
 * 跨平台的代码生成助手，用于生成v-model值分配代码。
 */
function genAssignmentCode(
    value,
    assignment
) {
    var res = parseModel(value);

    if (res.key === null) {
        return (value + "=" + assignment)
    } else {
        return ("$set(" + (res.exp) + ", " + (res.key) + ", " + assignment + ")")
    }
}

/**
 * Parse a v-model expression into a base path and a final key segment.
 * Handles both dot-path and possible square brackets.
 *
 * Possible cases:
 *
 * - test
 * - test[key]
 * - test[test1[key]]
 * - test["a"][key]
 * - xxx.test[a[a].test1[key]]
 * - test.xxx.a["asa"][test1[key]]
 *
 */

var len, str, chr, index, expressionPos, expressionEndPos;



function parseModel(val) {
    // Fix https://github.com/vuejs/vue/pull/7730
    // allow v-model="obj.val " (trailing whitespace)
    val = val.trim();
    len = val.length;

    // 可以处理value、value.a、value['a']、value[0]等多种情况
    if (val.indexOf('[') < 0 || val.lastIndexOf(']') < len - 1) {
        index = val.lastIndexOf('.');
        if (index > -1) {
            return {
                exp: val.slice(0, index),
                key: '"' + val.slice(index + 1) + '"'
            }
        } else {
            return {
                exp: val,
                key: null
            }
        }
    }

    str = val;
    index = expressionPos = expressionEndPos = 0;

    while (!eof()) {
        chr = next();
        /* istanbul ignore if */
        if (isStringStart(chr)) {
            parseString(chr);
        } else if (chr === 0x5B) {
            parseBracket(chr);
        }
    }

    return {
        exp: val.slice(0, expressionPos),
        key: val.slice(expressionPos + 1, expressionEndPos)
    }
}

function next() {
    return str.charCodeAt(++index)
}

function eof() {
    return index >= len
}

function isStringStart(chr) {
    return chr === 0x22 || chr === 0x27
}

function parseBracket(chr) {
    var inBracket = 1;
    expressionPos = index;
    while (!eof()) {
        chr = next();
        if (isStringStart(chr)) {
            parseString(chr);
            continue
        }
        if (chr === 0x5B) { inBracket++; }
        if (chr === 0x5D) { inBracket--; }
        if (inBracket === 0) {
            expressionEndPos = index;
            break
        }
    }
}

function parseString(chr) {
    var stringQuote = chr;
    while (!eof()) {
        chr = next();
        if (chr === stringQuote) {
            break
        }
    }
}

/*  */

var onRE = /^@|^v-on:/; // 匹配添加事件的语法 Chang-Jin 2019-11-13
var dirRE = 
    /^v-|^@|^:|^#/;
var forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/; // 匹配v-for中的属性 如item in items、(item, index) of items Chang-Jin 2019-11-13
var forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/; // 对forAliasRE中第一个捕获内容的拆解 in | of 前的部分 Chang-Jin 2019-11-13
var stripParensRE = /^\(|\)$/g;
var dynamicArgRE = /^\[.*\]$/;

var argRE = /:(.*)$/; // :开头的属性 Chang-Jin 2019-11-13
var bindRE = /^:|^\.|^v-bind:/; // 匹配:或v-bind开头的属性 Chang-Jin 2019-11-13
var modifierRE = /\.[^.\]]+(?=[^\]]*$)/g; // 匹配事件指令的修饰符 Chang-Jin 2019-11-13

var slotRE = /^v-slot(:|$)|^#/;

var lineBreakRE = /[\r\n]/;
var whitespaceRE = /\s+/g;

var invalidAttributeRE = /[\s"'<>\/=]/;

var decodeHTMLCached = cached(he.decode);

var emptySlotScopeToken = "_empty_";

// configurable state
var warn$1;
var delimiters;
var transforms;
var preTransforms;
var postTransforms;
var platformIsPreTag;
var platformMustUseProp;
var platformGetTagNamespace;

function createASTElement(
    tag,
    attrs ,
    parent
) {
    return {
        type: 1,
        tag: tag,
        attrsList: attrs,
        attrsMap: makeAttrsMap(attrs),
        rawAttrsMap: {},
        parent: parent,
        children: []
    }
}

/**
 * Convert HTML string to AST.
 */
function parse(
    template,
    options
) {
    warn$1 = options.warn || baseWarn;

    platformIsPreTag = options.isPreTag || no; // 是不是pre标签 Chang-Jin 2019-11-13
    platformMustUseProp = options.mustUseProp || no; // 是否需要通过绑定prop来绑定属性 Chang-Jin 2019-11-13
    platformGetTagNamespace = options.getTagNamespace || no; // 获取tag的命名空间 svg或math Chang-Jin 2019-11-13
    var isReservedTag = options.isReservedTag || no;

    transforms = pluckModuleFunction(options.modules, 'transformNode');
    preTransforms = pluckModuleFunction(options.modules, 'preTransformNode');
    postTransforms = pluckModuleFunction(options.modules, 'postTransformNode');

    delimiters = options.delimiters; // 自定义模板字符

    var stack = [];
    var preserveWhitespace = options.preserveWhitespace !== false;
    var whitespaceOption = options.whitespace;
    var root;
    var currentParent;
    var inVPre = false;
    var inPre = false;
    var warned = false;

    function warnOnce(msg, range) {
        if (!warned) {
            warned = true;
            warn$1(msg, range);
        }
    }

    function closeElement(element) {
        trimEndingWhitespace(element);
        if (!inVPre && !element.processed) {
            element = processElement(element, options);
        }
        // tree management
        if (!stack.length && element !== root) {
            // allow root elements with v-if, v-else-if and v-else
            // 允许根节点上有v-if v-else-if和v-else
            // 其实就是因为v-if v-else-if v-else都会处理为ifConditions数组的一项
            if (root.if && (element.elseif || element.else)) {
                {
                    checkRootConstraints(element);
                }
                addIfCondition(root, {
                    exp: element.elseif,
                    block: element
                });
            } else {
                warnOnce(
                    "Component template should contain exactly one root element. " +
                    "If you are using v-if on multiple elements, " +
                    "use v-else-if to chain them instead.", {
                        start: element.start
                    }
                );
            }
        }
        if (currentParent && !element.forbidden) {
            // 当前AST上存在elseif属性或else属性为true 会处理当前ast
            // 此时不处理标签的父子关系 children中只有v-if对应的标签
            // 不会把v-else-if v-else对应的标签添加到父元素的children中
            if (element.elseif || element.else) {
                processIfConditions(element, currentParent);
            } else {
                // 处理slot-scope的情况 把当前ast节点按name放到父级的scopedSlots上
                if (element.slotScope) {
                    // scoped slot
                    // keep it in the children list so that v-else(-if) conditions can
                    // find it as the prev node.
                    // 作用域插槽
                    // 将其保留在子级列表中，以便v-else（-if）条件可以将其找到为上一个节点。
                    var name = element.slotTarget || '"default"';
                    (currentParent.scopedSlots || (currentParent.scopedSlots = {}))[name] = element;
                }

                // 标签父子关系 Chang-Jin 2019-11-13
                currentParent.children.push(element);
                element.parent = currentParent;
            }
        }

        // final children cleanup
        // filter out scoped slots
        // ast子节点处理 过滤掉scope-slot
        element.children = element.children.filter(function (c) { return !c.slotScope; });

        // remove trailing whitespace node again
        // 再次删除尾随空白节点
        trimEndingWhitespace(element);

        // check pre state
        // 校验pre状态
        if (element.pre) {
            inVPre = false;
        }

        // pre标记置false
        if (platformIsPreTag(element.tag)) {
            inPre = false;
        }

        // 后处理 Chang-Jin 2019-11-13
        // apply post-transforms
        for (var i = 0; i < postTransforms.length; i++) {
            postTransforms[i](element, options);
        }
    }

    function trimEndingWhitespace(el) {
        // remove trailing whitespace node
        if (!inPre) {
            var lastNode;
            while (
                (lastNode = el.children[el.children.length - 1]) &&
                lastNode.type === 3 &&
                lastNode.text === ' '
            ) {
                el.children.pop();
            }
        }
    }

    function checkRootConstraints(el) {
        if (el.tag === 'slot' || el.tag === 'template') {
            warnOnce(
                "Cannot use <" + (el.tag) + "> as component root element because it may " +
                'contain multiple nodes.', {
                    start: el.start
                }
            );
        }
        if (el.attrsMap.hasOwnProperty('v-for')) {
            warnOnce(
                'Cannot use v-for on stateful component root element because ' +
                'it renders multiple elements.',
                el.rawAttrsMap['v-for']
            );
        }
    }

    parseHTML(template, {
        warn: warn$1,
        expectHTML: options.expectHTML,
        isUnaryTag: options.isUnaryTag,
        canBeLeftOpenTag: options.canBeLeftOpenTag,
        shouldDecodeNewlines: options.shouldDecodeNewlines,
        shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
        shouldKeepComment: options.comments,
        outputSourceRange: options.outputSourceRange,
        start: function start(tag, attrs, unary, start$1, end) {
            // check namespace.
            // inherit parent ns if there is one
            var ns = (currentParent && currentParent.ns) || platformGetTagNamespace(tag);

            // handle IE svg bug
            /* istanbul ignore if */
            if (isIE && ns === 'svg') {
                attrs = guardIESVGBug(attrs);
            }

            // 定义基本的ast结构 Chang-Jin 2019-11-13
            var element = createASTElement(tag, attrs, currentParent);
            if (ns) {
                element.ns = ns;
            }

            {
                // 非生产环境 报错什么的需要提示位置
                if (options.outputSourceRange) {
                    element.start = start$1;
                    element.end = end;
                    element.rawAttrsMap = element.attrsList.reduce(function (cumulated, attr) {
                        cumulated[attr.name] = attr;
                        return cumulated
                    }, {});
                }

                // 检查属性值
                attrs.forEach(function (attr) {
                    if (invalidAttributeRE.test(attr.name)) {
                        warn$1(
                            "Invalid dynamic argument expression: attribute names cannot contain " +
                            "spaces, quotes, <, >, / or =.", {
                                start: attr.start + attr.name.indexOf("["),
                                end: attr.start + attr.name.length
                            }
                        );
                    }
                });
            }

            // 检查标签
            if (isForbiddenTag(element) && !isServerRendering()) {
                element.forbidden = true;
                 warn$1(
                    'Templates should only be responsible for mapping the state to the ' +
                    'UI. Avoid placing tags with side-effects in your templates, such as ' +
                    "<" + tag + ">" + ', as they will not be parsed.', {
                        start: element.start
                    }
                );
            }

            // 对ast进行预处理 Chang-Jin 2019-11-13
            // apply pre-transforms
            for (var i = 0; i < preTransforms.length; i++) {
                element = preTransforms[i](element, options) || element;
            }

            if (!inVPre) {
                // 解析v-pre指令 Chang-Jin 2019-11-13
                processPre(element);
                if (element.pre) {
                    inVPre = true;
                }
            }
            if (platformIsPreTag(element.tag)) {
                inPre = true;
            }
            if (inVPre) {
                processRawAttrs(element);
            } else if (!element.processed) {
                // 解析v-if v-for v-once指令 Chang-Jin 2019-11-13
                // structural directives
                processFor(element);
                processIf(element);
                processOnce(element);
            }

            if (!root) {
                root = element;
                {
                    checkRootConstraints(root);
                }
            }

            if (!unary) {
                currentParent = element;
                stack.push(element);
            } else {
                closeElement(element);
            }
        },

        end: function end(tag, start, end$1) {
            var element = stack[stack.length - 1];
            // 出栈 Chang-Jin 2019-11-13
            // pop stack
            stack.length -= 1;
            currentParent = stack[stack.length - 1];
            if ( options.outputSourceRange) {
                element.end = end$1;
            }
            closeElement(element);
        },

        chars: function chars(text, start, end) {
            // 文本错误提示
            if (!currentParent) {
                {
                    if (text === template) {
                        warnOnce(
                            'Component template requires a root element, rather than just text.', {
                                start: start
                            }
                        );
                    } else if ((text = text.trim())) {
                        warnOnce(
                            ("text \"" + text + "\" outside root element will be ignored."), {
                                start: start
                            }
                        );
                    }
                }
                return
            }

            // IE textarea bug处理
            // IE textarea placeholder bug
            /* istanbul ignore if */ // istanbul注释语法 在计算覆盖率的时候会被忽略
            if (isIE &&
                currentParent.tag === 'textarea' &&
                currentParent.attrsMap.placeholder === text
            ) {
                return
            }

            var children = currentParent.children;
            if (inPre || text.trim()) {
                text = isTextTag(currentParent) ? text : decodeHTMLCached(text); // decodeHTMLCached内部会调用一个npm包he进行解码；并且会把当前内容缓存起来
            } else if (!children.length) {
                // remove the whitespace-only node right after an opening tag
                text = '';
            } else if (whitespaceOption) {
                if (whitespaceOption === 'condense') {
                    // in condense mode, remove the whitespace node if it contains
                    // line break, otherwise condense to a single space
                    text = lineBreakRE.test(text) ? '' : ' ';
                } else {
                    text = ' ';
                }
            } else {
                text = preserveWhitespace ? ' ' : '';
            }
            if (text) {
                if (!inPre && whitespaceOption === 'condense') {
                    // condense consecutive whitespaces into single space
                    text = text.replace(whitespaceRE, ' ');
                }
                var res;
                var child;

                // 解析文本
                if (!inVPre && text !== ' ' && (res = parseText(text, delimiters))) {
                    child = {
                        type: 2,
                        expression: res.expression,
                        tokens: res.tokens,
                        text: text
                    };
                } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
                    child = {
                        type: 3,
                        text: text
                    };
                }
                if (child) {
                    if ( options.outputSourceRange) {
                        child.start = start;
                        child.end = end;
                    }
                    children.push(child);
                }
            }
        },
        comment: function comment(text, start, end) {
            // adding anyting as a sibling to the root node is forbidden
            // comments should still be allowed, but ignored
            if (currentParent) {
                var child = {
                    type: 3,
                    text: text,
                    isComment: true
                };
                if ( options.outputSourceRange) {
                    child.start = start;
                    child.end = end;
                }
                currentParent.children.push(child);
            }
        }
    });
    return root
}

// ast上添加pre: true
function processPre(el) {
    if (getAndRemoveAttr(el, 'v-pre') != null) {
        el.pre = true;
    }
}

function processRawAttrs(el) {
    var list = el.attrsList;
    var len = list.length;
    if (len) {
        var attrs = el.attrs = new Array(len);
        for (var i = 0; i < len; i++) {
            attrs[i] = {
                name: list[i].name,
                value: JSON.stringify(list[i].value)
            };
            if (list[i].start != null) {
                attrs[i].start = list[i].start;
                attrs[i].end = list[i].end;
            }
        }
    } else if (!el.pre) {
        // non root node in pre blocks with no attributes
        el.plain = true;
    }
}

function processElement(
    element,
    options
) {
    // 解析key指令 Chang-Jin 2019-11-13
    processKey(element);

    // determine whether this is a plain element after
    // removing structural attributes
    element.plain = (
        !element.key &&
        !element.scopedSlots &&
        !element.attrsList.length
    );

    // 解析ref slot component指令 Chang-Jin 2019-11-13
    processRef(element);
    processSlotContent(element);
    processSlotOutlet(element);
    processComponent(element);

    // 对ast处理 Chang-Jin 2019-11-13
    for (var i = 0; i < transforms.length; i++) {
        element = transforms[i](element, options) || element;
    }

    processAttrs(element);
    return element
}

function processKey(el) {
    var exp = getBindingAttr(el, 'key');
    if (exp) {
        {
            if (el.tag === 'template') {
                warn$1(
                    "<template> cannot be keyed. Place the key on real elements instead.",
                    getRawBindingAttr(el, 'key')
                );
            }
            if (el.for) {
                var iterator = el.iterator2 || el.iterator1;
                var parent = el.parent;
                if (iterator && iterator === exp && parent && parent.tag === 'transition-group') {
                    warn$1(
                        "Do not use v-for index as key on <transition-group> children, " +
                        "this is the same as not using keys.",
                        getRawBindingAttr(el, 'key'),
                        true /* tip */
                    );
                }
            }
        }
        el.key = exp;
    }
}

function processRef(el) {
    var ref = getBindingAttr(el, 'ref');
    if (ref) {
        el.ref = ref;
        el.refInFor = checkInFor(el);
    }
}

function processFor(el) {
    var exp;
    if ((exp = getAndRemoveAttr(el, 'v-for'))) {
        var res = parseFor(exp);

        if (res) {
            extend(el, res); // 把for相关的值绑到ast上
        } else {
            warn$1(
                ("Invalid v-for expression: " + exp),
                el.rawAttrsMap['v-for']
            );
        }
    }
}



/**
 *
 *
 * @export
 * @param {string} exp (value, key, index) in object
 * @returns {? ForParseResult} {alias: "value", for: "object", iterator1: "key", iterator2: "index"}
 */
function parseFor(exp) {
    // 匹配v-for的值 inMatch第2项是in/of左侧的值 第3项是右侧的值
    var inMatch = exp.match(forAliasRE);
    if (!inMatch) { return }

    var res = {};
    res.for = inMatch[2].trim();
    var alias = inMatch[1].trim().replace(stripParensRE, ''); // 去左侧值"(value, key, index)"的左右括号
    var iteratorMatch = alias.match(forIteratorRE); // 获取"value, key, index"中的key和index

    if (iteratorMatch) {
        res.alias = alias.replace(forIteratorRE, '').trim(); // 获取"value, key, index"中的value
        res.iterator1 = iteratorMatch[1].trim(); // 获取key
        if (iteratorMatch[2]) {
            res.iterator2 = iteratorMatch[2].trim(); // 获取index
        }
    } else {
        res.alias = alias;
    }

    return res
}

// 处理v-if v-else-if v-else 三种情况 Chang-Jin 2019-12-06
function processIf(el) {
    var exp = getAndRemoveAttr(el, 'v-if');

    // el = {
    //     ...
    //     if: exp,
    //     ifConditions: [{
    //         exp: exp,
    //         block: el
    //     }]
    //     ...
    // }
    if (exp) {
        el.if = exp; // 添加表达式到AST的if属性上

        addIfCondition(el, {
            exp: exp,
            block: el
        });
    } else {
        // 存在v-else属性则在AST上添加else: true
        if (getAndRemoveAttr(el, 'v-else') != null) {
            el.else = true;
        }

        // 存在v-else-if属性则在AST上添加elseif: exp
        var elseif = getAndRemoveAttr(el, 'v-else-if');
        if (elseif) {
            el.elseif = elseif;
        }
    }
}

function processIfConditions(el, parent) {
    var prev = findPrevElement(parent.children);

    // 如果前一个ast是v-if 否则提示报错
    if (prev && prev.if) {
        // 添加当前ast到ifCondition
        addIfCondition(prev, {
            exp: el.elseif,
            block: el
        });
    } else {
        warn$1(
            "v-" + (el.elseif ? ('else-if="' + el.elseif + '"') : 'else') + " " +
            "used on element <" + (el.tag) + "> without corresponding v-if.",
            el.rawAttrsMap[el.elseif ? 'v-else-if' : 'v-else']
        );
    }
}

// 返回前一个元素
function findPrevElement(children ) {
    var i = children.length;

    while (i--) {
        if (children[i].type === 1) {
            return children[i]
        } else {
            // 如果前一个ast元素不是' ' 则会提示到控制台  v-if与v-else之间的元素会被删除
            if ( children[i].text !== ' ') {
                warn$1(
                    "text \"" + (children[i].text.trim()) + "\" between v-if and v-else(-if) " +
                    "will be ignored.",
                    children[i]
                );
            }

            // 删除该元素
            children.pop();
        }
    }
}

// 添加ifConditions数组到AST上
function addIfCondition(el, condition) {
    if (!el.ifConditions) {
        el.ifConditions = [];
    }

    el.ifConditions.push(condition);
}

// 处理v-once指令 添加once属性到ast元素上
function processOnce(el) {
    var once = getAndRemoveAttr(el, 'v-once');
    if (once != null) {
        el.once = true;
    }
}

// handle content being passed to a component as slot,
// e.g. <template slot="xxx">, <div slot-scope="xxx">
// 处理作为插槽传递到组件的内容
function processSlotContent(el) {
    var slotScope;
    if (el.tag === 'template') {
        slotScope = getAndRemoveAttr(el, 'scope'); // 处理template上的scope属性

        /* istanbul ignore if */
        // if ("development" !== 'production' && slotScope) {
        //     warn(
        //         `the "scope" attribute for scoped slots have been deprecated and ` +
        //         `replaced by "slot-scope" since 2.5. The new "slot-scope" attribute ` +
        //         `can also be used on plain elements in addition to <template> to ` +
        //         `denote scoped slots.`,
        //         el.rawAttrsMap['scope'],
        //         true
        //     )
        // }

        el.slotScope = slotScope || getAndRemoveAttr(el, 'slot-scope'); // 处理template上的slot-scope属性
    } else if ((slotScope = getAndRemoveAttr(el, 'slot-scope'))) {
        /* istanbul ignore if */
        // if ("development" !== 'production' && el.attrsMap['v-for']) {
        //     warn(
        //         `Ambiguous combined usage of slot-scope and v-for on <${el.tag}> ` +
        //         `(v-for takes higher priority). Use a wrapper <template> for the ` +
        //         `scoped slot to make it clearer.`,
        //         el.rawAttrsMap['slot-scope'],
        //         true
        //     )
        // }
        el.slotScope = slotScope;
    }

    // slot="xxx"
    // 获取slot属性的值 并添加到ast语法树上
    var slotTarget = getBindingAttr(el, 'slot');
    if (slotTarget) {
        el.slotTarget = slotTarget === '""' ? '"default"' : slotTarget;
        el.slotTargetDynamic = !!(el.attrsMap[':slot'] || el.attrsMap['v-bind:slot']);
        // preserve slot as an attribute for native shadow DOM compat
        // only for non-scoped slots.
        if (el.tag !== 'template' && !el.slotScope) {
            addAttr(el, 'slot', slotTarget, getRawBindingAttr(el, 'slot'));
        }
    }

    // 2.6 v-slot syntax
    {
        if (el.tag === 'template') {
            // v-slot on <template>
            var slotBinding = getAndRemoveAttrByRegex(el, slotRE);
            if (slotBinding) {
                // if ("development" !== 'production') {
                //     if (el.slotTarget || el.slotScope) {
                //         warn(
                //             `Unexpected mixed usage of different slot syntaxes.`,
                //             el
                //         )
                //     }
                //     if (el.parent && !maybeComponent(el.parent)) {
                //         warn(
                //             `<template v-slot> can only appear at the root level inside ` +
                //             `the receiving component`,
                //             el
                //         )
                //     }
                // }
                var ref = getSlotName(slotBinding);
                var name = ref.name;
                var dynamic = ref.dynamic;
                el.slotTarget = name;
                el.slotTargetDynamic = dynamic;
                el.slotScope = slotBinding.value || emptySlotScopeToken; // force it into a scoped slot for perf
            }
        } else {
            // v-slot on component, denotes default slot
            var slotBinding$1 = getAndRemoveAttrByRegex(el, slotRE);
            if (slotBinding$1) {
                // if ("development" !== 'production') {
                //     if (!maybeComponent(el)) {
                //         warn(
                //             `v-slot can only be used on components or <template>.`,
                //             slotBinding
                //         )
                //     }
                //     if (el.slotScope || el.slotTarget) {
                //         warn(
                //             `Unexpected mixed usage of different slot syntaxes.`,
                //             el
                //         )
                //     }
                //     if (el.scopedSlots) {
                //         warn(
                //             `To avoid scope ambiguity, the default slot should also use ` +
                //             `<template> syntax when there are other named slots.`,
                //             slotBinding
                //         )
                //     }
                // }
                // add the component's children to its default slot
                var slots = el.scopedSlots || (el.scopedSlots = {});
                var ref$1 = getSlotName(slotBinding$1);
                var name$1 = ref$1.name;
                var dynamic$1 = ref$1.dynamic;
                var slotContainer = slots[name$1] = createASTElement('template', [], el);
                slotContainer.slotTarget = name$1;
                slotContainer.slotTargetDynamic = dynamic$1;
                slotContainer.children = el.children.filter(function (c) {
                    if (!c.slotScope) {
                        c.parent = slotContainer;
                        return true
                    }
                });
                slotContainer.slotScope = slotBinding$1.value || emptySlotScopeToken;
                // remove children as they are returned from scopedSlots now
                el.children = [];
                // mark el non-plain so data gets generated
                el.plain = false;
            }
        }
    }
}

function getSlotName(binding) {
    var name = binding.name.replace(slotRE, '');
    if (!name) {
        if (binding.name[0] !== '#') {
            name = 'default';
        } else {
            warn$1(
                "v-slot shorthand syntax requires a slot name.",
                binding
            );
        }
    }
    return dynamicArgRE.test(name)
        // dynamic [name]
        ?
        {
            name: name.slice(1, -1),
            dynamic: true
        }
        // static name
        :
        {
            name: ("\"" + name + "\""),
            dynamic: false
        }
}

// handle <slot/> outlets
// 处理插槽标签 slot ast上添加slotName属性
function processSlotOutlet(el) {
    if (el.tag === 'slot') {
        el.slotName = getBindingAttr(el, 'name');
        // if ("development" !== 'production' && el.key) {
        //     warn(
        //         `\`key\` does not work on <slot> because slots are abstract outlets ` +
        //         `and can possibly expand into multiple elements. ` +
        //         `Use the key on a wrapping element instead.`,
        //         getRawBindingAttr(el, 'key')
        //     )
        // }
    }
}

function processComponent(el) {
    var binding;

    if ((binding = getBindingAttr(el, 'is'))) {
        el.component = binding;
    }

    if (getAndRemoveAttr(el, 'inline-template') != null) {
        el.inlineTemplate = true;
    }
}

function processAttrs(el) {
    var list = el.attrsList;
    var i, l, name, rawName, value, modifiers, syncGen, isDynamic;
    for (i = 0, l = list.length; i < l; i++) {
        name = rawName = list[i].name;
        value = list[i].value;

        // 判断是否为指令
        if (dirRE.test(name)) {
            // mark element as dynamic
            el.hasBindings = true;

            // modifiers 获取修饰符
            modifiers = parseModifiers(name.replace(dirRE, ''));

            // support .foo shorthand syntax for the .prop modifier
            // 为.prop修饰符支持.foo速记语法
            if (modifiers) {
                name = name.replace(modifierRE, '');
            }

            // 解析v-bind属性 Chang-Jin 2019-11-13
            if (bindRE.test(name)) { // v-bind
                name = name.replace(bindRE, '');
                value = parseFilters(value);
                isDynamic = dynamicArgRE.test(name);

                if (isDynamic) {
                    name = name.slice(1, -1);
                }

                // if (
                //   "development" !== 'production' &&
                //   value.trim().length === 0
                // ) {
                //   warn(
                //     `The value for a v-bind expression cannot be empty. Found in "v-bind:${name}"`
                //   )
                // }

                if (modifiers) {
                    if (modifiers.prop && !isDynamic) {
                        name = camelize(name);
                        if (name === 'innerHtml') { name = 'innerHTML'; }
                    }
                    if (modifiers.camel && !isDynamic) {
                        name = camelize(name);
                    }
                    if (modifiers.sync) {
                        syncGen = genAssignmentCode(value, "$event");
                        if (!isDynamic) {
                            addHandler(
                                el,
                                ("update:" + (camelize(name))),
                                syncGen,
                                null,
                                false,
                                warn$1,
                                list[i]
                            );
                            if (hyphenate(name) !== camelize(name)) {
                                addHandler(
                                    el,
                                    ("update:" + (hyphenate(name))),
                                    syncGen,
                                    null,
                                    false,
                                    warn$1,
                                    list[i]
                                );
                            }
                        } else {
                            // handler w/ dynamic event name
                            addHandler(
                                el,
                                ("\"update:\"+(" + name + ")"),
                                syncGen,
                                null,
                                false,
                                warn$1,
                                list[i],
                                true // dynamic
                            );
                        }
                    }
                }
                if ((modifiers && modifiers.prop) || (
                        !el.component && platformMustUseProp(el.tag, el.attrsMap.type, name)
                    )) {
                    addProp(el, name, value, list[i], isDynamic);
                } else {
                    addAttr(el, name, value, list[i], isDynamic);
                }

                // 解析v-on属性 Chang-Jin 2019-11-13
            } else if (onRE.test(name)) { // v-on
                name = name.replace(onRE, ''); // onRE = /^@|^v-on:/
                isDynamic = dynamicArgRE.test(name); // dynamicArgRE = /^\[.*\]$/

                if (isDynamic) {
                    name = name.slice(1, -1);
                }

                addHandler(el, name, value, modifiers, false, warn$1, list[i], isDynamic);
            } else { // normal directives 普通指令
                name = name.replace(dirRE, '');

                // parse arg 获取指令的参数
                var argMatch = name.match(argRE);
                var arg = argMatch && argMatch[1];

                isDynamic = false;

                if (arg) {
                    name = name.slice(0, -(arg.length + 1));
                    // 处理动态指令参数
                    if (dynamicArgRE.test(arg)) {
                        arg = arg.slice(1, -1);
                        isDynamic = true;
                    }
                }

                addDirective(el, name, rawName, value, arg, isDynamic, modifiers, list[i]); // 添加指令到el.directives上

                // v-model不与v-for同用
                if ( name === 'model') {
                    checkForAliasModel(el, value);
                }
            }
        } else {
            // 普通属性 Chang-Jin 2019-11-13
            // literal attribute
            {
                var res = parseText(value, delimiters);
                if (res) {
                    warn$1(
                        name + "=\"" + value + "\": " +
                        'Interpolation inside attributes has been removed. ' +
                        'Use v-bind or the colon shorthand instead. For example, ' +
                        'instead of <div id="{{ val }}">, use <div :id="val">.',
                        list[i]
                    );
                }
            }

            // 把属性添加到ast的element上 Chang-Jin 2019-11-13
            addAttr(el, name, JSON.stringify(value), list[i]);
            // #6887 firefox doesn't update muted state if set via attribute
            // even immediately after element creation
            if (!el.component &&
                name === 'muted' &&
                platformMustUseProp(el.tag, el.attrsMap.type, name)) {
                addProp(el, name, 'true', list[i]);
            }
        }
    }
}

function checkInFor(el) {
    var parent = el;
    while (parent) {
        if (parent.for !== undefined) {
            return true
        }
        parent = parent.parent;
    }
    return false
}

function parseModifiers(name) {
    var match = name.match(modifierRE);
    if (match) {
        var ret = {};
        match.forEach(function (m) {
            ret[m.slice(1)] = true;
        });
        return ret
    }
}

function makeAttrsMap(attrs ) {
    var map = {};
    for (var i = 0, l = attrs.length; i < l; i++) {
        if (
            
            map[attrs[i].name] && !isIE && !isEdge
        ) {
            warn$1('duplicate attribute: ' + attrs[i].name, attrs[i]);
        }
        map[attrs[i].name] = attrs[i].value;
    }
    return map
}

// for script (e.g. type="x/template") or style, do not decode content
function isTextTag(el) {
    return el.tag === 'script' || el.tag === 'style'
}

function isForbiddenTag(el) {
    return (
        el.tag === 'style' ||
        (el.tag === 'script' && (
            !el.attrsMap.type ||
            el.attrsMap.type === 'text/javascript'
        ))
    )
}

var ieNSBug = /^xmlns:NS\d+/;
var ieNSPrefix = /^NS\d+:/;

/* istanbul ignore next */
function guardIESVGBug(attrs) {
    var res = [];
    for (var i = 0; i < attrs.length; i++) {
        var attr = attrs[i];
        if (!ieNSBug.test(attr.name)) {
            attr.name = attr.name.replace(ieNSPrefix, '');
            res.push(attr);
        }
    }
    return res
}

// v-model与v-for的校验
function checkForAliasModel(el, value) {
    var _el = el;
    while (_el) {
        if (_el.for && _el.alias === value) {
            warn$1(
                "<" + (el.tag) + " v-model=\"" + value + "\">: " +
                "You are binding v-model directly to a v-for iteration alias. " +
                "This will not be able to modify the v-for source array because " +
                "writing to the alias is like modifying a function local variable. " +
                "Consider using an array of objects and use v-model on an object property instead.",
                el.rawAttrsMap['v-model']
            );
        }
        _el = _el.parent;
    }
}

/*  */

function preTransformNode (el, options) {
  if (el.tag === 'input') {
    var map = el.attrsMap;
    if (!map['v-model']) {
      return
    }

    var typeBinding;
    if (map[':type'] || map['v-bind:type']) {
      typeBinding = getBindingAttr(el, 'type');
    }
    if (!map.type && !typeBinding && map['v-bind']) {
      typeBinding = "(" + (map['v-bind']) + ").type";
    }

    if (typeBinding) {
      var ifCondition = getAndRemoveAttr(el, 'v-if', true);
      var ifConditionExtra = ifCondition ? ("&&(" + ifCondition + ")") : "";
      var hasElse = getAndRemoveAttr(el, 'v-else', true) != null;
      var elseIfCondition = getAndRemoveAttr(el, 'v-else-if', true);
      // 1. checkbox
      var branch0 = cloneASTElement(el);
      // process for on the main node
      processFor(branch0);
      addRawAttr(branch0, 'type', 'checkbox');
      processElement(branch0, options);
      branch0.processed = true; // prevent it from double-processed
      branch0.if = "(" + typeBinding + ")==='checkbox'" + ifConditionExtra;
      addIfCondition(branch0, {
        exp: branch0.if,
        block: branch0
      });
      // 2. add radio else-if condition
      var branch1 = cloneASTElement(el);
      getAndRemoveAttr(branch1, 'v-for', true);
      addRawAttr(branch1, 'type', 'radio');
      processElement(branch1, options);
      addIfCondition(branch0, {
        exp: "(" + typeBinding + ")==='radio'" + ifConditionExtra,
        block: branch1
      });
      // 3. other
      var branch2 = cloneASTElement(el);
      getAndRemoveAttr(branch2, 'v-for', true);
      addRawAttr(branch2, ':type', typeBinding);
      processElement(branch2, options);
      addIfCondition(branch0, {
        exp: ifCondition,
        block: branch2
      });

      if (hasElse) {
        branch0.else = true;
      } else if (elseIfCondition) {
        branch0.elseif = elseIfCondition;
      }

      return branch0
    }
  }
}

function cloneASTElement (el) {
  return createASTElement(el.tag, el.attrsList.slice(), el.parent)
}

var model$1 = {
  preTransformNode: preTransformNode
};

var modules$1 = [
  klass,
  style,
  model$1
];

/*  */

var warn$2;

// in some cases, the event used has to be determined at runtime
// so we used some reserved tokens during compile.
var RANGE_TOKEN = '__r';

function model$2(
    el,
    dir,
    _warn
) {
    warn$2 = _warn;
    var value = dir.value;
    var modifiers = dir.modifiers;
    var tag = el.tag;
    var type = el.attrsMap.type;

    {
        // inputs with type="file" are read only and setting the input's
        // value will throw an error.
        // type="file"的输入是只读的，设置输入的值将引发错误。
        if (tag === 'input' && type === 'file') {
            warn$2(
                "<" + (el.tag) + " v-model=\"" + value + "\" type=\"file\">:\n" +
                "File inputs are read only. Use a v-on:change listener instead.",
                el.rawAttrsMap['v-model']
            );
        }
    }

    if (el.component) { // 处理v-model用在自定义组件上的情况
        genComponentModel(el, value, modifiers);
        // component v-model doesn't need extra runtime
        // 组件v-model不需要额外的运行时
        return false
    } else if (tag === 'select') {
        genSelect(el, value, modifiers);
    } else if (tag === 'input' && type === 'checkbox') {
        genCheckboxModel(el, value, modifiers);
    } else if (tag === 'input' && type === 'radio') {
        genRadioModel(el, value, modifiers);
    } else if (tag === 'input' || tag === 'textarea') {
        genDefaultModel(el, value, modifiers);
    } else {
        genComponentModel(el, value, modifiers);
        // component v-model doesn't need extra runtime
        // 组件v-model不需要额外的运行时
        return false
    }

    // ensure runtime directive metadata
    // 确保运行时指令元数据
    return true
}

function genCheckboxModel(
    el,
    value,
    modifiers
) {
    var number = modifiers && modifiers.number;
    var valueBinding = getBindingAttr(el, 'value') || 'null';
    var trueValueBinding = getBindingAttr(el, 'true-value') || 'true';
    var falseValueBinding = getBindingAttr(el, 'false-value') || 'false';
    addProp(el, 'checked',
        "Array.isArray(" + value + ")" +
        "?_i(" + value + "," + valueBinding + ")>-1" + (
            trueValueBinding === 'true' ?
            (":(" + value + ")") :
            (":_q(" + value + "," + trueValueBinding + ")")
        )
    );
    addHandler(el, 'change',
        "var $$a=" + value + "," +
        '$$el=$event.target,' +
        "$$c=$$el.checked?(" + trueValueBinding + "):(" + falseValueBinding + ");" +
        'if(Array.isArray($$a)){' +
        "var $$v=" + (number ? '_n(' + valueBinding + ')' : valueBinding) + "," +
        '$$i=_i($$a,$$v);' +
        "if($$el.checked){$$i<0&&(" + (genAssignmentCode(value, '$$a.concat([$$v])')) + ")}" +
        "else{$$i>-1&&(" + (genAssignmentCode(value, '$$a.slice(0,$$i).concat($$a.slice($$i+1))')) + ")}" +
        "}else{" + (genAssignmentCode(value, '$$c')) + "}",
        null, true
    );
}

function genRadioModel(
    el,
    value,
    modifiers
) {
    var number = modifiers && modifiers.number;
    var valueBinding = getBindingAttr(el, 'value') || 'null';
    valueBinding = number ? ("_n(" + valueBinding + ")") : valueBinding;
    addProp(el, 'checked', ("_q(" + value + "," + valueBinding + ")"));
    addHandler(el, 'change', genAssignmentCode(value, valueBinding), null, true);
}

// 处理select
function genSelect(
    el,
    value,
    modifiers
) {
    var number = modifiers && modifiers.number;
    // 如果添加了number修饰符 则把值用_n包一下
    var selectedVal = "Array.prototype.filter" +
        ".call($event.target.options,function(o){return o.selected})" +
        ".map(function(o){var val = \"_value\" in o ? o._value : o.value;" +
        "return " + (number ? '_n(val)' : 'val') + "})";

    var assignment = '$event.target.multiple ? $$selectedVal : $$selectedVal[0]';

    var code = "var $$selectedVal = " + selectedVal + ";";

    code = code + " " + (genAssignmentCode(value, assignment));
    addHandler(el, 'change', code, null, true);
}

function genDefaultModel(
    el,
    value,
    modifiers
) {
    var type = el.attrsMap.type;

    // warn if v-bind:value conflicts with v-model
    // except for inputs with v-bind:type
    // 如果v-bind：value与v-model冲突，则发出警告，但带有v-bind：type的输入除外
    {
        var value$1 = el.attrsMap['v-bind:value'] || el.attrsMap[':value'];
        var typeBinding = el.attrsMap['v-bind:type'] || el.attrsMap[':type'];
        if (value$1 && !typeBinding) {
            var binding = el.attrsMap['v-bind:value'] ? 'v-bind:value' : ':value';
            warn$2(
                binding + "=\"" + value$1 + "\" conflicts with v-model on the same element " +
                'because the latter already expands to a value binding internally',
                el.rawAttrsMap[binding]
            );
        }
    }

    var ref = modifiers || {};
    var lazy = ref.lazy;
    var number = ref.number;
    var trim = ref.trim;

    var needCompositionGuard = !lazy && type !== 'range';
    // 根据lazy修饰符判断绑定什么事件
    var event = lazy ?
        'change' :
        type === 'range' ? RANGE_TOKEN : 'input';

    var valueExpression = '$event.target.value';

    // 处理trim修饰符
    if (trim) {
        valueExpression = "$event.target.value.trim()";
    }

    if (number) {
        valueExpression = "_n(" + valueExpression + ")";
    }

    var code = genAssignmentCode(value, valueExpression);

    // 处理输入法模式情况
    if (needCompositionGuard) {
        code = "if($event.target.composing)return;" + code;
    }

    // 添加prop
    addProp(el, 'value', ("(" + value + ")"));

    // 添加事件
    addHandler(el, event, code, null, true);

    // 如果使用了trim和number添加blur事件
    if (trim || number) {
        addHandler(el, 'blur', '$forceUpdate()');
    }
}

/*  */

// 解析v-text指令
function text (el, dir) {
  if (dir.value) {
    addProp(el, 'textContent', ("_s(" + (dir.value) + ")"), dir);
  }
}

/*  */

function html (el, dir) {
  if (dir.value) {
    addProp(el, 'innerHTML', ("_s(" + (dir.value) + ")"), dir);
  }
}

var directives = {
  model: model$2,
  text: text,
  html: html
};

/*  */

var baseOptions = {
  expectHTML: true,
  modules: modules$1,
  directives: directives,
  isPreTag: isPreTag,
  isUnaryTag: isUnaryTag,
  mustUseProp: mustUseProp,
  canBeLeftOpenTag: canBeLeftOpenTag,
  isReservedTag: isReservedTag,
  getTagNamespace: getTagNamespace,
  staticKeys: genStaticKeys(modules$1)
};

/*  */

// [A-Za-z_$]用来匹配首字母 [\w$]匹配所有单词字符 + $

var fnExpRE = /^([\w$_]+|\([^)]*?\))\s*=>|^function(?:\s+[\w$]+)?\s*\(/; // 匹配箭头函数或普通函数的函数定义
var fnInvokeRE = /\([^)]*?\);*$/; // 匹配函数调用 xxxx(foo);
// 匹配函数的路径，比如name、obj.name、obj["$^%#"]、obj[0]等
var simplePathRE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['[^']*?']|\["[^"]*?"]|\[\d+]|\[[A-Za-z_$][\w$]*])*$/;

// KeyboardEvent.keyCode aliases
var keyCodes = {
    esc: 27,
    tab: 9,
    enter: 13,
    space: 32,
    up: 38,
    left: 37,
    right: 39,
    down: 40,
    'delete': [8, 46]
};

// KeyboardEvent.key aliases
var keyNames = {
    // #7880: IE11 and Edge use `Esc` for Escape key name.
    esc: ['Esc', 'Escape'],
    tab: 'Tab',
    enter: 'Enter',
    // #9112: IE11 uses `Spacebar` for Space key name.
    space: [' ', 'Spacebar'],
    // #7806: IE11 uses key names without `Arrow` prefix for arrow keys.
    up: ['Up', 'ArrowUp'],
    left: ['Left', 'ArrowLeft'],
    right: ['Right', 'ArrowRight'],
    down: ['Down', 'ArrowDown'],
    // #9112: IE11 uses `Del` for Delete key name.
    'delete': ['Backspace', 'Delete', 'Del']
};

// #4868: modifiers that prevent the execution of the listener
// need to explicitly return null so that we can determine whether to remove
// the listener for .once
// 阻止执行侦听器的修饰符需要显式返回null，
// 以便我们可以确定是否删除.once的侦听器
var genGuard = function (condition) { return ("if(" + condition + ")return null;"); };

// 修饰符代码处理map
var modifierCode = {
    stop: '$event.stopPropagation();', // 停止冒泡
    prevent: '$event.preventDefault();', // 阻止默认行为
    self: genGuard("$event.target !== $event.currentTarget"),

    ctrl: genGuard("!$event.ctrlKey"),
    shift: genGuard("!$event.shiftKey"),
    alt: genGuard("!$event.altKey"),
    meta: genGuard("!$event.metaKey"),

    left: genGuard("'button' in $event && $event.button !== 0"),
    middle: genGuard("'button' in $event && $event.button !== 1"),
    right: genGuard("'button' in $event && $event.button !== 2")
};

function genHandlers(
    events,
    isNative
) {
    var prefix = isNative ? 'nativeOn:' : 'on:'; // 事件前缀
    var staticHandlers = "";
    var dynamicHandlers = "";

    // 循环调用 生成每个事件处理后的函数字符串
    for (var name in events) {
        var handlerCode = genHandler(events[name]);

        if (events[name] && events[name].dynamic) {
            dynamicHandlers += name + "," + handlerCode + ",";
        } else {
            staticHandlers += "\"" + name + "\":" + handlerCode + ",";
        }
    }

    staticHandlers = "{" + (staticHandlers.slice(0, -1)) + "}";

    if (dynamicHandlers) {
        return prefix + "_d(" + staticHandlers + ",[" + (dynamicHandlers.slice(0, -1)) + "])"
    } else {
        return prefix + staticHandlers
    }
}

function genHandler(handler ) {
    // handler为空，则返回一个空函数的字符串 Chang-Jin 2019-11-26
    if (!handler) {
        return 'function(){}'
    }

    // 如果handler是一个数组，说明一个事件添加了多个处理函数，依次调用genHandler生成字符串并合到一个数组中
    if (Array.isArray(handler)) {
        return ("[" + (handler.map(function (handler) { return genHandler(handler); }).join(',')) + "]")
    }

    var isMethodPath = simplePathRE.test(handler.value); // 匹配函数路径
    var isFunctionExpression = fnExpRE.test(handler.value); // 匹配函数表达式
    var isFunctionInvocation = simplePathRE.test(handler.value.replace(fnInvokeRE, '')); // 匹配函数调用

    // 没有修饰符
    if (!handler.modifiers) {
        if (isMethodPath || isFunctionExpression) {
            return handler.value
        }
        /* istanbul ignore if */
        // if (false && handler.params) {
        //     return genWeexHandler(handler.params, handler.value)
        // }
        return ("function($event){" + (isFunctionInvocation ? ("return " + (handler.value)) : handler.value) + "}") // inline statement
    } else { // 存在修饰符
        var code = '';
        var genModifierCode = '';
        var keys = [];
        for (var key in handler.modifiers) {
            // 如果修饰符为stop prevent self 等 则直接返回修饰符对应的字符串
            if (modifierCode[key]) {
                genModifierCode += modifierCode[key];

                // left/right
                // 如果是left或right 还需要添加到keys数组中
                if (keyCodes[key]) {
                    keys.push(key);
                }
            } else if (key === 'exact') { // 处理精确控制的情况
                var modifiers = (handler.modifiers);

                // 就是当有下列这些键一起触发时候不执行
                genModifierCode += genGuard(
                    ['ctrl', 'shift', 'alt', 'meta']
                    .filter(function (keyModifier) { return !modifiers[keyModifier]; })
                    .map(function (keyModifier) { return ("$event." + keyModifier + "Key"); })
                    .join('||')
                );
            } else { // 不是以上修饰符则添加到keys中
                keys.push(key);
            }
        }

        // 处理keys
        if (keys.length) {
            code += genKeyFilter(keys);
        }

        // Make sure modifiers like prevent and stop get executed after key filtering
        // 确保在过滤键后执行诸如prevent和stop之类的修饰符
        if (genModifierCode) {
            code += genModifierCode;
        }

        // 处理给事件传入的函数
        var handlerCode = isMethodPath ? ("return " + (handler.value) + "($event)") : isFunctionExpression ? ("return (" + (handler.value) + ")($event)") : isFunctionInvocation ? ("return " + (handler.value)) : handler.value;
        /* istanbul ignore if */
        // if (false && handler.params) {
        //     return genWeexHandler(handler.params, code + handlerCode)
        // }

        // 把修饰符解析出的代码和给事件传入的函数合并 成一个render字符串
        return ("function($event){" + code + handlerCode + "}")
    }
}

// 返回一个判断不符合一定条件就return null字符串
function genKeyFilter(keys ) {
    // eg: if(!$event.type.indexOf('key')&&_k($event.keyCode,"enter",13,$event.key,"Enter"))return null;
    return (
        // make sure the key filters only apply to KeyboardEvents
        // #9441: can't use 'keyCode' in $event because Chrome autofill fires fake
        // key events that do not have keyCode property...
        // 确保键过滤器仅适用于KeyboardEvents
        // 在$event中不能使用“ keyCode”，因为Chrome自动填充会触发不具有keyCode属性的假按键事件...
        ("if(!$event.type.indexOf('key')&&" + (keys.map(genFilterCode).join('&&')) + ")return null;")
    )
}

function genFilterCode(key) {
    var keyVal = parseInt(key, 10);

    // key是数字则直接返回
    if (keyVal) {
        return ("$event.keyCode!==" + keyVal)
    }

    var keyCode = keyCodes[key]; // 字母转化为数字
    var keyName = keyNames[key]; // 兼容不同浏览器的情况

    return (
        ("_k($event.keyCode," + (JSON.stringify(key)) + "," + (JSON.stringify(keyCode)) + ",$event.key," + (JSON.stringify(keyName)) + ")")
    )
}

/*  */

function on (el, dir) {
  if ( dir.modifiers) {
    warn("v-on without argument does not support modifiers.");
  }
  el.wrapListeners = function (code) { return ("_g(" + code + "," + (dir.value) + ")"); };
}

/*  */

function bind (el, dir) {
  el.wrapData = function (code) {
    return ("_b(" + code + ",'" + (el.tag) + "'," + (dir.value) + "," + (dir.modifiers && dir.modifiers.prop ? 'true' : 'false') + (dir.modifiers && dir.modifiers.sync ? ',true' : '') + ")")
  };
}

/*  */

var baseDirectives$1 = {
  on: on,
  bind: bind,
  cloak: noop
};

/*  */





var CodegenState = function CodegenState(options) {
      this.options = options;
      this.warn = options.warn || baseWarn;
      this.transforms = pluckModuleFunction(options.modules, 'transformCode');
      this.dataGenFns = pluckModuleFunction(options.modules, 'genData');
      this.directives = extend(extend({}, baseDirectives$1), options.directives);
      var isReservedTag = options.isReservedTag || no;
      this.maybeComponent = function (el) { return !!el.component || !isReservedTag(el.tag); }; // 是一个组件 或者 不标签名不是保留标签 Chang-Jin 2019-11-18
      this.onceId = 0;
      this.staticRenderFns = [];
      this.pre = false;
  };



function generate(
    ast,
    options
) {
    var state = new CodegenState(options);
    var code = ast ? genElement(ast, state) : '_c("div")';
    return {
        render: ("with(this){return " + code + "}"),
        staticRenderFns: state.staticRenderFns
    }
}

function genElement(el, state) {
    if (el.parent) {
        el.pre = el.pre || el.parent.pre;
    }

    if (el.staticRoot && !el.staticProcessed) {
        return genStatic(el, state)
    } else if (el.once && !el.onceProcessed) {
        return genOnce(el, state)
    } else if (el.for && !el.forProcessed) {
        return genFor(el, state)
    } else if (el.if && !el.ifProcessed) {
        return genIf(el, state)
    } else if (el.tag === 'template' && !el.slotTarget && !state.pre) {
        return genChildren(el, state) || 'void 0'
    } else if (el.tag === 'slot') {
        return genSlot(el, state)
    } else {
        // component or element
        var code;

        // el.component保存的是<component :is="xxx">标签上is指向的模板 Chang-Jin 2019-11-15
        if (el.component) {
            code = genComponent(el.component, el, state);
        } else {
            var data;
            if (!el.plain || (el.pre && state.maybeComponent(el))) {
                data = genData$2(el, state); // genData 用来生成_c第二个参数--给元素添加的属性 Chang-Jin 2019-11-15
            }

            var children = el.inlineTemplate ? null : genChildren(el, state, true);
            code = "_c('" + (el.tag) + "'" + (data ? ("," + data) : '') + (children ? ("," + children) : '') + ")";
        }
        // module transforms
        for (var i = 0; i < state.transforms.length; i++) {
            code = state.transforms[i](el, code);
        }
        return code
    }
}

// hoist static sub-trees out
/**
 * 处理静态节点
 *
 * @param {ASTElement} el AST元素
 * @param {CodegenState} state
 * @returns {string} 一个处理静态节点的render函数字符串
 */
function genStatic(el, state) {
    el.staticProcessed = true;
    // Some elements (templates) need to behave differently inside of a v-pre
    // node.  All pre nodes are static roots, so we can use this as a location to
    // wrap a state change and reset it upon exiting the pre node.
    var originalPreState = state.pre;
    if (el.pre) {
        state.pre = el.pre;
    }

    // 对静态根节点及其子内容单独分离出来处理。 Chang-Jin 2019-11-15
    state.staticRenderFns.push(("with(this){return " + (genElement(el, state)) + "}"));
    state.pre = originalPreState;
    return ("_m(" + (state.staticRenderFns.length - 1) + (el.staticInFor ? ',true' : '') + ")")
}

// v-once
function genOnce(el, state) {
    el.onceProcessed = true; // 在ast上添加onceProcessed标识

    if (el.if && !el.ifProcessed) { // 如果和if一起使用 则调用genIf进行处理
        // genIf中还会处理genOnce 说明genIf的处理比genOnce优先
        return genIf(el, state)
    } else if (el.staticInFor) { // v-once用到v-for中
        var key = '';
        var parent = el.parent;

        // 遍历父级取key值
        while (parent) {
            if (parent.for) {
                key = parent.key;
                break
            }
            parent = parent.parent;
        }

        // key值不存在 则提示错误 并直接返回genElement到的render字符串
        // 此时v-once其实是没用了
        if (!key) {
             state.warn(
                "v-once can only be used inside v-for that is keyed. ",
                el.rawAttrsMap['v-once']
            );

            return genElement(el, state)
        }

        // key值存在则返回 _o包着的一个render字符串
        // "_o(_c('p',[_v("v-once: "+_s(i))]),1,i)"
        // state.onceId是因为v-for中可能包含多个v-once 用于给vnode生成唯一的key
        return ("_o(" + (genElement(el, state)) + "," + (state.onceId++) + "," + key + ")")
    } else { // 不与if同用 且不再for中 则按静态节点处理
        return genStatic(el, state)
    }
}

function genIf(
    el,
    state,
    altGen ,
    altEmpty 
) {
    el.ifProcessed = true; // avoid recursion 防止递归
    return genIfConditions(el.ifConditions.slice(), state, altGen, altEmpty)
}

// 返回类似"(value == 1)?_c('p',[_v("v-if块的内容")]):(value == 2)?_c('p',[_v("v-else-if块的内容")]):_c('p',[_v("v-else块的内容")])"的render字符串
function genIfConditions(
    conditions,
    state,
    altGen ,
    altEmpty 
) {
    // 如果ifCondition数组为空 则直接返回一个'_e()'
    if (!conditions.length) {
        return altEmpty || '_e()'
    }

    var condition = conditions.shift(); // 取出第一个条件

    // 返回一个三目运算符字符串
    if (condition.exp) {
        return ("(" + (condition.exp) + ") ?\n                " + (genTernaryExp(condition.block)) + " :\n                " + (genIfConditions(conditions, state, altGen, altEmpty)))
    } else {
        return ("" + (genTernaryExp(condition.block)))
    }

    // v-if with v-once should generate code like (a)?_m(0):_m(1)
    // v-if与v-once应该生成类似(a)?_m(0):_m(1)的代码
    function genTernaryExp(el) {
        return altGen ?
            altGen(el, state) :
            el.once ? genOnce(el, state) : genElement(el, state)
    }
}

/**
 *
 *
 * @export
 * @param {*} el AST
 * @param {CodegenState} state
 * @param {Function} [altGen]
 * @param {string} [altHelper]
 * @returns {string}
 */
function genFor(
    el,
    state,
    altGen ,
    altHelper 
) {
    var exp = el.for;
    var alias = el.alias;
    var iterator1 = el.iterator1 ? ("," + (el.iterator1)) : '';
    var iterator2 = el.iterator2 ? ("," + (el.iterator2)) : '';

    // 生产环境下 如果是自定义元素且不是slot和template，则必须有el.key
    if (
        state.maybeComponent(el) &&
        el.tag !== 'slot' &&
        el.tag !== 'template' &&
        !el.key
    ) {
        state.warn(
            "<" + (el.tag) + " v-for=\"" + alias + " in " + exp + "\">: component lists rendered with " +
            "v-for should have explicit keys. " +
            "See https://vuejs.org/guide/list.html#key for more info.",
            el.rawAttrsMap['v-for'],
            true /* tip */
        );
    }

    // 添加已处理标识
    el.forProcessed = true; // avoid recursion 防止递归

    // 返回render字符串
    return (altHelper || '_l') + "((" + exp + ")," +
        "function(" + alias + iterator1 + iterator2 + "){" +
        "return " + ((altGen || genElement)(el, state)) +
        '})'
}

// 编译AST的属性
function genData$2(el, state) {
    var data = '{';

    // directives first.
    // directives may mutate the el's other properties before they are generated.
    // 指令可能会在生成el的其他属性之前对其进行更改。
    var dirs = genDirectives(el, state);
    if (dirs) { data += dirs + ','; }

    // key
    if (el.key) {
        data += "key:" + (el.key) + ",";
    }
    // ref
    if (el.ref) {
        data += "ref:" + (el.ref) + ",";
    }
    if (el.refInFor) {
        data += "refInFor:true,";
    }
    // pre
    if (el.pre) {
        data += "pre:true,";
    }
    // record original tag name for components using "is" attribute
    if (el.component) {
        data += "tag:\"" + (el.tag) + "\",";
    }
    // module data generation functions
    for (var i = 0; i < state.dataGenFns.length; i++) {
        data += state.dataGenFns[i](el);
    }

    // attributes
    if (el.attrs) {
        data += "attrs:" + (genProps(el.attrs)) + ","; // genProps把属性链接为字符串 Chang-Jin 2019-11-15
    }

    // DOM props
    // 处理DOM上的属性
    if (el.props) {
        data += "domProps:" + (genProps(el.props)) + ",";
    }

    // event handlers
    // 处理事件相关属性 Chang-Jin 2019-11-26
    if (el.events) {
        data += (genHandlers(el.events, false)) + ",";
    }
    if (el.nativeEvents) {
        data += (genHandlers(el.nativeEvents, true)) + ",";
    }

    // slot target
    // only for non-scoped slots
    // 处理slot target
    if (el.slotTarget && !el.slotScope) {
        data += "slot:" + (el.slotTarget) + ",";
    }

    // scoped slots
    // 处理scope-slot属性 返回一个到data上
    if (el.scopedSlots) {
        data += (genScopedSlots(el, el.scopedSlots, state)) + ",";
    }
    // component v-model
    if (el.model) {
        data += "model:{value:" + (el.model.value) + ",callback:" + (el.model.callback) + ",expression:" + (el.model.expression) + "},";
    }
    // inline-template
    if (el.inlineTemplate) {
        var inlineTemplate = genInlineTemplate(el, state);
        if (inlineTemplate) {
            data += inlineTemplate + ",";
        }
    }
    data = data.replace(/,$/, '') + '}';
    // v-bind dynamic argument wrap
    // v-bind with dynamic arguments must be applied using the same v-bind object
    // merge helper so that class/style/mustUseProp attrs are handled correctly.
    if (el.dynamicAttrs) {
        data = "_b(" + data + ",\"" + (el.tag) + "\"," + (genProps(el.dynamicAttrs)) + ")";
    }
    // v-bind data wrap
    if (el.wrapData) {
        data = el.wrapData(data);
    }
    // v-on data wrap
    if (el.wrapListeners) {
        data = el.wrapListeners(data);
    }
    return data
}

function genDirectives(el, state) {
    var dirs = el.directives; // 获取ast上的directives数组

    if (!dirs) { return } // 不存在则直接返回

    var res = 'directives:[';
    var hasRuntime = false;
    var i, l, dir, needRuntime;

    for (i = 0, l = dirs.length; i < l; i++) {
        dir = dirs[i];
        needRuntime = true;

        // 判断指令是否已存在
        var gen = state.directives[dir.name]; // state.directives 默认包括bind cloak html model on text

        // 如果指令已存在 判断其是否需要运行时
        if (gen) {
            // compile-time directive that manipulates AST.
            // returns true if it also needs a runtime counterpart.
            // 操纵AST的编译时指令。
            // 如果还需要运行时副本，则返回true。
            needRuntime = !!gen(el, dir, state.warn);
        }

        if (needRuntime) {
            hasRuntime = true;
            res += "{\n                name:\"" + (dir.name) + "\",\n                rawName:\"" + (dir.rawName) + "\"\n                " + (dir.value ?
                    (",value:(" + (dir.value) + "),expression:" + (JSON.stringify(dir.value))) : 
                    '') + "\n                " + (dir.arg ?
                    (",arg:" + (dir.isDynamicArg ? dir.arg : ("\"" + (dir.arg) + "\""))) :
                    '') + "\n                " + (dir.modifiers ?
                    (",modifiers:" + (JSON.stringify(dir.modifiers))) :
                    '') + "},";
        }
    }

    if (hasRuntime) {
        return res.slice(0, -1) + ']'
    }
}

function genInlineTemplate(el, state) {
    var ast = el.children[0];
    if ( (
            el.children.length !== 1 || ast.type !== 1
        )) {
        state.warn(
            'Inline-template components must have exactly one child element.', {
                start: el.start
            }
        );
    }
    if (ast && ast.type === 1) {
        var inlineRenderFns = generate(ast, state.options);
        return ("inlineTemplate:{render:function(){" + (inlineRenderFns.render) + "},staticRenderFns:[" + (inlineRenderFns.staticRenderFns.map(function (code) { return ("function(){" + code + "}"); }).join(',')) + "]}")
    }
}

function genScopedSlots(
    el,
    slots,
    state
) {
    // by default scoped slots are considered "stable", this allows child
    // components with only scoped slots to skip forced updates from parent.
    // but in some cases we have to bail-out of this optimization
    // for example if the slot contains dynamic names, has v-if or v-for on them...
    // 默认情况下，作用域插槽被认为是“稳定的”，
    // 这允许仅具有作用域插槽的子组件跳过来自父代的强制更新。
    // 但在某些情况下，例如，如果slot包含动态名称，在其上带有v-if或v-for，则我们必须放弃这种优化措施...
    // 当前元素如果存在v-for循环/
    var needsForceUpdate = el.for || Object.keys(slots).some(function (key) {
        var slot = slots[key];

        return (
            slot.slotTargetDynamic ||
            slot.if ||
            slot.for ||
            containsSlotChild(slot) // is passing down slot from parent which may be dynamic 正在从父级传递slot，这可能是动态的
        )
    });

    // #9534: if a component with scoped slots is inside a conditional branch,
    // it's possible for the same component to be reused but with different
    // compiled slot content. To avoid that, we generate a unique key based on
    // the generated code of all the slot contents.
    // ＃9534：如果具有作用域插槽的组件位于条件分支中，
    // 有可能重复使用相同的组件，但编译后的插槽内容不同。
    // 为了避免这种情况，我们根据所有slot内容的生成代码生成唯一密钥。
    var needsKey = !!el.if;

    // OR when it is inside another scoped slot or v-for (the reactivity may be
    // disconnected due to the intermediate scope variable)
    // #9438, #9506
    // TODO: this can be further optimized by properly analyzing in-scope bindings
    // and skip force updating ones that do not actually use scope variables.
    // 或者当它在另一个作用域插槽或v-for中时（由于中间作用域变量，反应性可能会断开）
    // ＃9438，＃9506
    // TODO：可以通过适当地分析范围内的绑定并跳过不实际使用范围变量的强制更新来进一步优化此绑定。
    if (!needsForceUpdate) {
        var parent = el.parent;
        while (parent) {
            if (
                (parent.slotScope && parent.slotScope !== emptySlotScopeToken) ||
                parent.for
            ) {
                needsForceUpdate = true;
                break
            }
            if (parent.if) {
                needsKey = true;
            }
            parent = parent.parent;
        }
    }

    var generatedSlots = Object.keys(slots)
        .map(function (key) { return genScopedSlot(slots[key], state); })
        .join(',');

    return ("scopedSlots:_u([" + generatedSlots + "]" + (needsForceUpdate ? ",null,true" : "") + (!needsForceUpdate && needsKey ? (",null,false," + (hash(generatedSlots))) : "") + ")")
}

function hash(str) {
    var hash = 5381;
    var i = str.length;
    while (i) {
        hash = (hash * 33) ^ str.charCodeAt(--i);
    }
    return hash >>> 0
}

function containsSlotChild(el) {
    if (el.type === 1) {
        if (el.tag === 'slot') {
            return true
        }
        return el.children.some(containsSlotChild)
    }
    return false
}

function genScopedSlot(
    el,
    state
) {
    var isLegacySyntax = el.attrsMap['slot-scope'];

    // 如果存在if 则if优先处理
    if (el.if && !el.ifProcessed && !isLegacySyntax) {
        return genIf(el, state, genScopedSlot, "null")
    }

    // 存在for 则for优先处理
    if (el.for && !el.forProcessed) {
        return genFor(el, state, genScopedSlot)
    }

    var slotScope = el.slotScope === emptySlotScopeToken ? "" : String(el.slotScope);

    // 这里会处理template中的子元素
    var fn = "function(" + slotScope + "){" +
        "return " + (el.tag === 'template' ?
            el.if && isLegacySyntax ?
                ("(" + (el.if) + ")?" + (genChildren(el, state) || 'undefined') + ":undefined") :
                genChildren(el, state) || 'undefined' :
            genElement(el, state)) + "}";

    // reverse proxy v-slot without scope on this.$slots
    var reverseProxy = slotScope ? "" : ",proxy:true";

    return ("{key:" + (el.slotTarget || "\"default\"") + ",fn:" + fn + reverseProxy + "}")
}

function genChildren(
    el,
    state,
    checkSkip ,
    altGenElement ,
    altGenNode 
) {
    var children = el.children;
    if (children.length) {
        var el$1 = children[0];
        // optimize single v-for
        if (children.length === 1 &&
            el$1.for &&
            el$1.tag !== 'template' &&
            el$1.tag !== 'slot'
        ) {
            var normalizationType = checkSkip ?
                state.maybeComponent(el$1) ? ",1" : ",0" :
                "";
            return ("" + ((altGenElement || genElement)(el$1, state)) + normalizationType)
        }
        var normalizationType$1 = checkSkip ?
            getNormalizationType(children, state.maybeComponent) :
            0;
        var gen = altGenNode || genNode;

        // 返回的字符串中对children依次执行getNode，并通过,相连
        return ("[" + (children.map(function (c) { return gen(c, state); }).join(',')) + "]" + (normalizationType$1 ? ("," + normalizationType$1) : ''))
    }
}

// determine the normalization needed for the children array.
// 0: no normalization needed
// 1: simple normalization needed (possible 1-level deep nested array)
// 2: full normalization needed
// 确定子数组所需的归一化。
// 0：无需归一化
// 1：需要简单的归一化（可能的1级深度嵌套数组）
// 2：需要完全归一化
function getNormalizationType(
    children ,
    maybeComponent
) {
    var res = 0;
    for (var i = 0; i < children.length; i++) {
        var el = children[i];
        if (el.type !== 1) {
            continue
        }

        // el需要归一化 用来判断级别
        // el是if块，但块内元素有内容符合上述三个条件的 Chang-Jin 2019-11-18
        if (needsNormalization(el) ||
            (el.ifConditions && el.ifConditions.some(function (c) { return needsNormalization(c.block); }))) {
            res = 2;
            break
        }

        // el是自定义组件或el是if块，但块内元素有自定义组件的 Chang-Jin 2019-11-18
        if (maybeComponent(el) ||
            (el.ifConditions && el.ifConditions.some(function (c) { return maybeComponent(c.block); }))) {
            res = 1;
        }
    }
    return res
}

// el上有`v-for`或标签名是`template`或`slot` Chang-Jin 2019-11-18
function needsNormalization(el) {
    return el.for !== undefined || el.tag === 'template' || el.tag === 'slot'
}

function genNode(node, state) {
    if (node.type === 1) {
        return genElement(node, state)
    } else if (node.type === 3 && node.isComment) {
        return genComment(node)
    } else {
        return genText(node)
    }
}

function genText(text) {
    return ("_v(" + (text.type === 2
    ? text.expression // no need for () because already wrapped in _s()
    : transformSpecialNewlines(JSON.stringify(text.text))) + ")")
}

function genComment(comment) {
    return ("_e(" + (JSON.stringify(comment.text)) + ")")
}

// 处理slot元素
function genSlot(el, state) {
    var slotName = el.slotName || '"default"';
    var children = genChildren(el, state); // 处理slot中的子元素
    var res = "_t(" + slotName + (children ? ("," + children) : '');
    var attrs = el.attrs || el.dynamicAttrs ?
        genProps((el.attrs || []).concat(el.dynamicAttrs || []).map(function (attr) { return ({
            // slot props are camelized 转化为驼峰式
            name: camelize(attr.name),
            value: attr.value,
            dynamic: attr.dynamic
        }); })) :
        null;
    var bind = el.attrsMap['v-bind'];

    if ((attrs || bind) && !children) {
        res += ",null";
    }

    // 处理slot上其他属性
    if (attrs) {
        res += "," + attrs;
    }

    // 处理slot上的bind
    if (bind) {
        res += (attrs ? '' : ',null') + "," + bind;
    }

    return res + ')'
}

// componentName is el.component, take it as argument to shun flow's pessimistic refinement
function genComponent(
    componentName,
    el,
    state
) {
    var children = el.inlineTemplate ? null : genChildren(el, state, true);
    return ("_c(" + componentName + "," + (genData$2(el, state)) + (children ? ("," + children) : '') + ")")
}

// 把Props数组的值转化为键值形式的render字符串 例: "{"textContent":_s(value)}" Chang-Jin 2019-11-18
function genProps(props ) {
    var staticProps = "";
    var dynamicProps = "";

    for (var i = 0; i < props.length; i++) {
        var prop = props[i];
        var value = 
            transformSpecialNewlines(prop.value);

        if (prop.dynamic) {
            dynamicProps += (prop.name) + "," + value + ",";
        } else {
            staticProps += "\"" + (prop.name) + "\":" + value + ",";
        }
    }

    staticProps = "{" + (staticProps.slice(0, -1)) + "}";

    // 如果是动态类型则用_d包裹 Chang-Jin 2019-11-18
    if (dynamicProps) {
        return ("_d(" + staticProps + ",[" + (dynamicProps.slice(0, -1)) + "])")
    } else {
        return staticProps
    }
}

// #3895, #4268
function transformSpecialNewlines(text) {
    return text
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029')
}

/*  */




var plainStringRE = /^"(?:[^"\\]|\\.)*"$|^'(?:[^'\\]|\\.)*'$/;

// let the model AST transform translate v-model into appropriate
// props bindings
function applyModelTransform (el, state) {
  if (el.directives) {
    for (var i = 0; i < el.directives.length; i++) {
      var dir = el.directives[i];
      if (dir.name === 'model') {
        state.directives.model(el, dir, state.warn);
        // remove value for textarea as its converted to text
        if (el.tag === 'textarea' && el.props) {
          el.props = el.props.filter(function (p) { return p.name !== 'value'; });
        }
        break
      }
    }
  }
}

function genAttrSegments (
  attrs
) {
  return attrs.map(function (ref) {
    var name = ref.name;
    var value = ref.value;

    return genAttrSegment(name, value);
  })
}

function genDOMPropSegments (
  props,
  attrs
) {
  var segments = [];
  props.forEach(function (ref) {
    var name = ref.name;
    var value = ref.value;

    name = propsToAttrMap[name] || name.toLowerCase();
    if (isRenderableAttr(name) &&
      !(attrs && attrs.some(function (a) { return a.name === name; }))
    ) {
      segments.push(genAttrSegment(name, value));
    }
  });
  return segments
}

function genAttrSegment (name, value) {
  if (plainStringRE.test(value)) {
    // force double quote
    value = value.replace(/^'|'$/g, '"');
    // force enumerated attr to "true"
    if (isEnumeratedAttr(name) && value !== "\"false\"") {
      value = "\"true\"";
    }
    return {
      type: RAW,
      value: isBooleanAttr(name)
        ? (" " + name + "=\"" + name + "\"")
        : value === '""'
          ? (" " + name)
          : (" " + name + "=\"" + (JSON.parse(value)) + "\"")
    }
  } else {
    return {
      type: EXPRESSION,
      value: ("_ssrAttr(" + (JSON.stringify(name)) + "," + value + ")")
    }
  }
}

function genClassSegments (
  staticClass,
  classBinding
) {
  if (staticClass && !classBinding) {
    return [{ type: RAW, value: (" class=\"" + (JSON.parse(staticClass)) + "\"") }]
  } else {
    return [{
      type: EXPRESSION,
      value: ("_ssrClass(" + (staticClass || 'null') + "," + (classBinding || 'null') + ")")
    }]
  }
}

function genStyleSegments (
  staticStyle,
  parsedStaticStyle,
  styleBinding,
  vShowExpression
) {
  if (staticStyle && !styleBinding && !vShowExpression) {
    return [{ type: RAW, value: (" style=" + (JSON.stringify(staticStyle))) }]
  } else {
    return [{
      type: EXPRESSION,
      value: ("_ssrStyle(" + (parsedStaticStyle || 'null') + "," + (styleBinding || 'null') + ", " + (vShowExpression
          ? ("{ display: (" + vShowExpression + ") ? '' : 'none' }")
          : 'null') + ")")
    }]
  }
}

/*  */

// optimizability constants
var optimizability = {
  FALSE: 0,    // whole sub tree un-optimizable
  FULL: 1,     // whole sub tree optimizable
  SELF: 2,     // self optimizable but has some un-optimizable children
  CHILDREN: 3, // self un-optimizable but have fully optimizable children
  PARTIAL: 4   // self un-optimizable with some un-optimizable children
};

var isPlatformReservedTag;

function optimize (root, options) {
  if (!root) { return }
  isPlatformReservedTag = options.isReservedTag || no;
  walk(root, true);
}

function walk (node, isRoot) {
  if (isUnOptimizableTree(node)) {
    node.ssrOptimizability = optimizability.FALSE;
    return
  }
  // root node or nodes with custom directives should always be a VNode
  var selfUnoptimizable = isRoot || hasCustomDirective(node);
  var check = function (child) {
    if (child.ssrOptimizability !== optimizability.FULL) {
      node.ssrOptimizability = selfUnoptimizable
        ? optimizability.PARTIAL
        : optimizability.SELF;
    }
  };
  if (selfUnoptimizable) {
    node.ssrOptimizability = optimizability.CHILDREN;
  }
  if (node.type === 1) {
    for (var i = 0, l = node.children.length; i < l; i++) {
      var child = node.children[i];
      walk(child);
      check(child);
    }
    if (node.ifConditions) {
      for (var i$1 = 1, l$1 = node.ifConditions.length; i$1 < l$1; i$1++) {
        var block = node.ifConditions[i$1].block;
        walk(block, isRoot);
        check(block);
      }
    }
    if (node.ssrOptimizability == null ||
      (!isRoot && (node.attrsMap['v-html'] || node.attrsMap['v-text']))
    ) {
      node.ssrOptimizability = optimizability.FULL;
    } else {
      node.children = optimizeSiblings(node);
    }
  } else {
    node.ssrOptimizability = optimizability.FULL;
  }
}

function optimizeSiblings (el) {
  var children = el.children;
  var optimizedChildren = [];

  var currentOptimizableGroup = [];
  var pushGroup = function () {
    if (currentOptimizableGroup.length) {
      optimizedChildren.push({
        type: 1,
        parent: el,
        tag: 'template',
        attrsList: [],
        attrsMap: {},
        rawAttrsMap: {},
        children: currentOptimizableGroup,
        ssrOptimizability: optimizability.FULL
      });
    }
    currentOptimizableGroup = [];
  };

  for (var i = 0; i < children.length; i++) {
    var c = children[i];
    if (c.ssrOptimizability === optimizability.FULL) {
      currentOptimizableGroup.push(c);
    } else {
      // wrap fully-optimizable adjacent siblings inside a template tag
      // so that they can be optimized into a single ssrNode by codegen
      pushGroup();
      optimizedChildren.push(c);
    }
  }
  pushGroup();
  return optimizedChildren
}

function isUnOptimizableTree (node) {
  if (node.type === 2 || node.type === 3) { // text or expression
    return false
  }
  return (
    isBuiltInTag(node.tag) || // built-in (slot, component)
    !isPlatformReservedTag(node.tag) || // custom component
    !!node.component || // "is" component
    isSelectWithModel(node) // <select v-model> requires runtime inspection
  )
}

var isBuiltInDir = makeMap('text,html,show,on,bind,model,pre,cloak,once');

function hasCustomDirective (node) {
  return (
    node.type === 1 &&
    node.directives &&
    node.directives.some(function (d) { return !isBuiltInDir(d.name); })
  )
}

// <select v-model> cannot be optimized because it requires a runtime check
// to determine proper selected option
function isSelectWithModel (node) {
  return (
    node.type === 1 &&
    node.tag === 'select' &&
    node.directives != null &&
    node.directives.some(function (d) { return d.name === 'model'; })
  )
}

/*  */




// segment types
var RAW = 0;
var INTERPOLATION = 1;
var EXPRESSION = 2;

function generate$1 (
  ast,
  options
) {
  var state = new CodegenState(options);
  var code = ast ? genSSRElement(ast, state) : '_c("div")';
  return {
    render: ("with(this){return " + code + "}"),
    staticRenderFns: state.staticRenderFns
  }
}

function genSSRElement (el, state) {
  if (el.for && !el.forProcessed) {
    return genFor(el, state, genSSRElement)
  } else if (el.if && !el.ifProcessed) {
    return genIf(el, state, genSSRElement)
  } else if (el.tag === 'template' && !el.slotTarget) {
    return el.ssrOptimizability === optimizability.FULL
      ? genChildrenAsStringNode(el, state)
      : genSSRChildren(el, state) || 'void 0'
  }

  switch (el.ssrOptimizability) {
    case optimizability.FULL:
      // stringify whole tree
      return genStringElement(el, state)
    case optimizability.SELF:
      // stringify self and check children
      return genStringElementWithChildren(el, state)
    case optimizability.CHILDREN:
      // generate self as VNode and stringify children
      return genNormalElement(el, state, true)
    case optimizability.PARTIAL:
      // generate self as VNode and check children
      return genNormalElement(el, state, false)
    default:
      // bail whole tree
      return genElement(el, state)
  }
}

function genNormalElement (el, state, stringifyChildren) {
  var data = el.plain ? undefined : genData$2(el, state);
  var children = stringifyChildren
    ? ("[" + (genChildrenAsStringNode(el, state)) + "]")
    : genSSRChildren(el, state, true);
  return ("_c('" + (el.tag) + "'" + (data ? ("," + data) : '') + (children ? ("," + children) : '') + ")")
}

function genSSRChildren (el, state, checkSkip) {
  return genChildren(el, state, checkSkip, genSSRElement, genSSRNode)
}

function genSSRNode (el, state) {
  return el.type === 1
    ? genSSRElement(el, state)
    : genText(el)
}

function genChildrenAsStringNode (el, state) {
  return el.children.length
    ? ("_ssrNode(" + (flattenSegments(childrenToSegments(el, state))) + ")")
    : ''
}

function genStringElement (el, state) {
  return ("_ssrNode(" + (elementToString(el, state)) + ")")
}

function genStringElementWithChildren (el, state) {
  var children = genSSRChildren(el, state, true);
  return ("_ssrNode(" + (flattenSegments(elementToOpenTagSegments(el, state))) + ",\"</" + (el.tag) + ">\"" + (children ? ("," + children) : '') + ")")
}

function elementToString (el, state) {
  return ("(" + (flattenSegments(elementToSegments(el, state))) + ")")
}

function elementToSegments (el, state) {
  // v-for / v-if
  if (el.for && !el.forProcessed) {
    el.forProcessed = true;
    return [{
      type: EXPRESSION,
      value: genFor(el, state, elementToString, '_ssrList')
    }]
  } else if (el.if && !el.ifProcessed) {
    el.ifProcessed = true;
    return [{
      type: EXPRESSION,
      value: genIf(el, state, elementToString, '"<!---->"')
    }]
  } else if (el.tag === 'template') {
    return childrenToSegments(el, state)
  }

  var openSegments = elementToOpenTagSegments(el, state);
  var childrenSegments = childrenToSegments(el, state);
  var ref = state.options;
  var isUnaryTag = ref.isUnaryTag;
  var close = (isUnaryTag && isUnaryTag(el.tag))
    ? []
    : [{ type: RAW, value: ("</" + (el.tag) + ">") }];
  return openSegments.concat(childrenSegments, close)
}

function elementToOpenTagSegments (el, state) {
  applyModelTransform(el, state);
  var binding;
  var segments = [{ type: RAW, value: ("<" + (el.tag)) }];
  // attrs
  if (el.attrs) {
    segments.push.apply(segments, genAttrSegments(el.attrs));
  }
  // domProps
  if (el.props) {
    segments.push.apply(segments, genDOMPropSegments(el.props, el.attrs));
  }
  // v-bind="object"
  if ((binding = el.attrsMap['v-bind'])) {
    segments.push({ type: EXPRESSION, value: ("_ssrAttrs(" + binding + ")") });
  }
  // v-bind.prop="object"
  if ((binding = el.attrsMap['v-bind.prop'])) {
    segments.push({ type: EXPRESSION, value: ("_ssrDOMProps(" + binding + ")") });
  }
  // class
  if (el.staticClass || el.classBinding) {
    segments.push.apply(
      segments,
      genClassSegments(el.staticClass, el.classBinding)
    );
  }
  // style & v-show
  if (el.staticStyle || el.styleBinding || el.attrsMap['v-show']) {
    segments.push.apply(
      segments,
      genStyleSegments(
        el.attrsMap.style,
        el.staticStyle,
        el.styleBinding,
        el.attrsMap['v-show']
      )
    );
  }
  // _scopedId
  if (state.options.scopeId) {
    segments.push({ type: RAW, value: (" " + (state.options.scopeId)) });
  }
  segments.push({ type: RAW, value: ">" });
  return segments
}

function childrenToSegments (el, state) {
  var binding;
  if ((binding = el.attrsMap['v-html'])) {
    return [{ type: EXPRESSION, value: ("_s(" + binding + ")") }]
  }
  if ((binding = el.attrsMap['v-text'])) {
    return [{ type: INTERPOLATION, value: ("_s(" + binding + ")") }]
  }
  if (el.tag === 'textarea' && (binding = el.attrsMap['v-model'])) {
    return [{ type: INTERPOLATION, value: ("_s(" + binding + ")") }]
  }
  return el.children
    ? nodesToSegments(el.children, state)
    : []
}

function nodesToSegments (
  children,
  state
) {
  var segments = [];
  for (var i = 0; i < children.length; i++) {
    var c = children[i];
    if (c.type === 1) {
      segments.push.apply(segments, elementToSegments(c, state));
    } else if (c.type === 2) {
      segments.push({ type: INTERPOLATION, value: c.expression });
    } else if (c.type === 3) {
      var text = escape(c.text);
      if (c.isComment) {
        text = '<!--' + text + '-->';
      }
      segments.push({ type: RAW, value: text });
    }
  }
  return segments
}

function flattenSegments (segments) {
  var mergedSegments = [];
  var textBuffer = '';

  var pushBuffer = function () {
    if (textBuffer) {
      mergedSegments.push(JSON.stringify(textBuffer));
      textBuffer = '';
    }
  };

  for (var i = 0; i < segments.length; i++) {
    var s = segments[i];
    if (s.type === RAW) {
      textBuffer += s.value;
    } else if (s.type === INTERPOLATION) {
      pushBuffer();
      mergedSegments.push(("_ssrEscape(" + (s.value) + ")"));
    } else if (s.type === EXPRESSION) {
      pushBuffer();
      mergedSegments.push(("(" + (s.value) + ")"));
    }
  }
  pushBuffer();

  return mergedSegments.join('+')
}

/*  */



// these keywords should not appear inside expressions, but operators like
// typeof, instanceof and in are allowed
var prohibitedKeywordRE = new RegExp('\\b' + (
  'do,if,for,let,new,try,var,case,else,with,await,break,catch,class,const,' +
  'super,throw,while,yield,delete,export,import,return,switch,default,' +
  'extends,finally,continue,debugger,function,arguments'
).split(',').join('\\b|\\b') + '\\b');

// these unary operators should not be used as property/method names
var unaryOperatorsRE = new RegExp('\\b' + (
  'delete,typeof,void'
).split(',').join('\\s*\\([^\\)]*\\)|\\b') + '\\s*\\([^\\)]*\\)');

// strip strings in expressions
var stripStringRE = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*\$\{|\}(?:[^`\\]|\\.)*`|`(?:[^`\\]|\\.)*`/g;

// detect problematic expressions in a template
function detectErrors (ast, warn) {
  if (ast) {
    checkNode(ast, warn);
  }
}

function checkNode (node, warn) {
  if (node.type === 1) {
    for (var name in node.attrsMap) {
      if (dirRE.test(name)) {
        var value = node.attrsMap[name];
        if (value) {
          var range = node.rawAttrsMap[name];
          if (name === 'v-for') {
            checkFor(node, ("v-for=\"" + value + "\""), warn, range);
          } else if (name === 'v-slot' || name[0] === '#') {
            checkFunctionParameterExpression(value, (name + "=\"" + value + "\""), warn, range);
          } else if (onRE.test(name)) {
            checkEvent(value, (name + "=\"" + value + "\""), warn, range);
          } else {
            checkExpression(value, (name + "=\"" + value + "\""), warn, range);
          }
        }
      }
    }
    if (node.children) {
      for (var i = 0; i < node.children.length; i++) {
        checkNode(node.children[i], warn);
      }
    }
  } else if (node.type === 2) {
    checkExpression(node.expression, node.text, warn, node);
  }
}

function checkEvent (exp, text, warn, range) {
  var stripped = exp.replace(stripStringRE, '');
  var keywordMatch = stripped.match(unaryOperatorsRE);
  if (keywordMatch && stripped.charAt(keywordMatch.index - 1) !== '$') {
    warn(
      "avoid using JavaScript unary operator as property name: " +
      "\"" + (keywordMatch[0]) + "\" in expression " + (text.trim()),
      range
    );
  }
  checkExpression(exp, text, warn, range);
}

function checkFor (node, text, warn, range) {
  checkExpression(node.for || '', text, warn, range);
  checkIdentifier(node.alias, 'v-for alias', text, warn, range);
  checkIdentifier(node.iterator1, 'v-for iterator', text, warn, range);
  checkIdentifier(node.iterator2, 'v-for iterator', text, warn, range);
}

function checkIdentifier (
  ident,
  type,
  text,
  warn,
  range
) {
  if (typeof ident === 'string') {
    try {
      new Function(("var " + ident + "=_"));
    } catch (e) {
      warn(("invalid " + type + " \"" + ident + "\" in expression: " + (text.trim())), range);
    }
  }
}

function checkExpression (exp, text, warn, range) {
  try {
    new Function(("return " + exp));
  } catch (e) {
    var keywordMatch = exp.replace(stripStringRE, '').match(prohibitedKeywordRE);
    if (keywordMatch) {
      warn(
        "avoid using JavaScript keyword as property name: " +
        "\"" + (keywordMatch[0]) + "\"\n  Raw expression: " + (text.trim()),
        range
      );
    } else {
      warn(
        "invalid expression: " + (e.message) + " in\n\n" +
        "    " + exp + "\n\n" +
        "  Raw expression: " + (text.trim()) + "\n",
        range
      );
    }
  }
}

function checkFunctionParameterExpression (exp, text, warn, range) {
  try {
    new Function(exp, '');
  } catch (e) {
    warn(
      "invalid function parameter expression: " + (e.message) + " in\n\n" +
      "    " + exp + "\n\n" +
      "  Raw expression: " + (text.trim()) + "\n",
      range
    );
  }
}

/*  */

var range = 2;

function generateCodeFrame (
  source,
  start,
  end
) {
  if ( start === void 0 ) start = 0;
  if ( end === void 0 ) end = source.length;

  var lines = source.split(/\r?\n/);
  var count = 0;
  var res = [];
  for (var i = 0; i < lines.length; i++) {
    count += lines[i].length + 1;
    if (count >= start) {
      for (var j = i - range; j <= i + range || end > count; j++) {
        if (j < 0 || j >= lines.length) { continue }
        res.push(("" + (j + 1) + (repeat$1(" ", 3 - String(j + 1).length)) + "|  " + (lines[j])));
        var lineLength = lines[j].length;
        if (j === i) {
          // push underline
          var pad = start - (count - lineLength) + 1;
          var length = end > count ? lineLength - pad : end - start;
          res.push("   |  " + repeat$1(" ", pad) + repeat$1("^", length));
        } else if (j > i) {
          if (end > count) {
            var length$1 = Math.min(end - count, lineLength);
            res.push("   |  " + repeat$1("^", length$1));
          }
          count += lineLength + 1;
        }
      }
      break
    }
  }
  return res.join('\n')
}

function repeat$1 (str, n) {
  var result = '';
  if (n > 0) {
    while (true) { // eslint-disable-line
      if (n & 1) { result += str; }
      n >>>= 1;
      if (n <= 0) { break }
      str += str;
    }
  }
  return result
}

/*  */



// 利用了new Function生成render函数 并catch错误。 Chang-Jin 2019-11-12
function createFunction (code, errors) {
  try {
    return new Function(code)
  } catch (err) {
    errors.push({ err: err, code: code });
    return noop
  }
}

function createCompileToFunctionFn (compile) {
  // 缓存编译之后的模板，方便之后复用 Chang-Jin 2019-11-12
  var cache = Object.create(null);

  return function compileToFunctions (
    template,
    options,
    vm
  ) {
    options = extend({}, options);
    var warn$1 = options.warn || warn;
    delete options.warn;

    /* istanbul ignore if */
    {
      // detect possible CSP restriction
      try {
        new Function('return 1');
      } catch (e) {
        if (e.toString().match(/unsafe-eval|CSP/)) {
          warn$1(
            'It seems you are using the standalone build of Vue.js in an ' +
            'environment with Content Security Policy that prohibits unsafe-eval. ' +
            'The template compiler cannot work in this environment. Consider ' +
            'relaxing the policy to allow unsafe-eval or pre-compiling your ' +
            'templates into render functions.'
          );
        }
      }
    }

    // check cache
    var key = options.delimiters
      ? String(options.delimiters) + template
      : template;

    // 从缓存中获取编译结果，没有则调用compile函数来编译 Chang-Jin 2019-11-12
    if (cache[key]) {
      return cache[key]
    }

    // compile 把模板编译为ast语法树和render字符串
    var compiled = compile(template, options);

    // 非生产环境下，这里会抛出编译过程中产生的错误
    // check compilation errors/tips
    {
      if (compiled.errors && compiled.errors.length) {
        if (options.outputSourceRange) {
          compiled.errors.forEach(function (e) {
            warn$1(
              "Error compiling template:\n\n" + (e.msg) + "\n\n" +
              generateCodeFrame(template, e.start, e.end),
              vm
            );
          });
        } else {
          warn$1(
            "Error compiling template:\n\n" + template + "\n\n" +
            compiled.errors.map(function (e) { return ("- " + e); }).join('\n') + '\n',
            vm
          );
        }
      }
      if (compiled.tips && compiled.tips.length) {
        if (options.outputSourceRange) {
          compiled.tips.forEach(function (e) { return tip(e.msg, vm); });
        } else {
          compiled.tips.forEach(function (msg) { return tip(msg, vm); });
        }
      }
    }

    // turn code into functions
    var res = {};
    var fnGenErrors = [];

    // 通过new Function的方式把render字符串 转化为 render函数 Chang-Jin 2019-11-12
    res.render = createFunction(compiled.render, fnGenErrors);

    res.staticRenderFns = compiled.staticRenderFns.map(function (code) {
      return createFunction(code, fnGenErrors)
    });

    // check function generation errors.
    // this should only happen if there is a bug in the compiler itself.
    // mostly for codegen development use
    /* istanbul ignore if */
    {
      if ((!compiled.errors || !compiled.errors.length) && fnGenErrors.length) {
        warn$1(
          "Failed to generate render function:\n\n" +
          fnGenErrors.map(function (ref) {
            var err = ref.err;
            var code = ref.code;

            return ((err.toString()) + " in\n\n" + code + "\n");
        }).join('\n'),
          vm
        );
      }
    }

    return (cache[key] = res)
  }
}

/*  */

function createCompilerCreator (baseCompile) {
  return function createCompiler (baseOptions) {
    function compile (
      template,
      options
    ) {
      var finalOptions = Object.create(baseOptions);
      var errors = [];
      var tips = [];

      var warn = function (msg, range, tip) {
        (tip ? tips : errors).push(msg);
      };

      if (options) {
        if ( options.outputSourceRange) {
          // $flow-disable-line
          var leadingSpaceLength = template.match(/^\s*/)[0].length;

          warn = function (msg, range, tip) {
            var data = { msg: msg };
            if (range) {
              if (range.start != null) {
                data.start = range.start + leadingSpaceLength;
              }
              if (range.end != null) {
                data.end = range.end + leadingSpaceLength;
              }
            }
            (tip ? tips : errors).push(data);
          };
        }
        // merge custom modules
        if (options.modules) {
          finalOptions.modules =
            (baseOptions.modules || []).concat(options.modules);
        }
        // merge custom directives
        if (options.directives) {
          finalOptions.directives = extend(
            Object.create(baseOptions.directives || null),
            options.directives
          );
        }
        // copy other options
        for (var key in options) {
          if (key !== 'modules' && key !== 'directives') {
            finalOptions[key] = options[key];
          }
        }
      }

      finalOptions.warn = warn;

      var compiled = baseCompile(template.trim(), finalOptions);
      {
        detectErrors(compiled.ast, warn);
      }
      compiled.errors = errors;
      compiled.tips = tips;
      return compiled
    }

    return {
      compile: compile,
      compileToFunctions: createCompileToFunctionFn(compile)
    }
  }
}

/*  */

var createCompiler = createCompilerCreator(function baseCompile (
  template,
  options
) {
  var ast = parse(template.trim(), options);
  optimize(ast, options);
  var code = generate$1(ast, options);
  return {
    ast: ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
});

/*  */

var ref = createCompiler(baseOptions);
var compileToFunctions = ref.compileToFunctions;

/*  */

// The template compiler attempts to minimize the need for normalization by
// statically analyzing the template at compile time.
//
// For plain HTML markup, normalization can be completely skipped because the
// generated render function is guaranteed to return Array<VNode>. There are
// two cases where extra normalization is needed:

// 1. When the children contains components - because a functional component
// may return an Array instead of a single root. In this case, just a simple
// normalization is needed - if any child is an Array, we flatten the whole
// thing with Array.prototype.concat. It is guaranteed to be only 1-level deep
// because functional components already normalize their own children.
function simpleNormalizeChildren(children) {
    for (var i = 0; i < children.length; i++) {
        if (Array.isArray(children[i])) {
            return Array.prototype.concat.apply([], children)
        }
    }
    return children
}

// 2. When the children contains constructs that always generated nested Arrays,
// e.g. <template>, <slot>, v-for, or when the children is provided by user
// with hand-written render functions / JSX. In such cases a full normalization
// is needed to cater to all possible types of children values.
// 2.当子级包含始终生成嵌套数组的构造时，
// 例如 <template>，<slot>，v-for或用户为子代提供手写的渲染功能/ JSX时。
// 在这种情况下，需要完全规范化以适应所有可能类型的子代值。
function normalizeChildren(children) {
    return isPrimitive(children) ?
        [createTextVNode(children)] :
        Array.isArray(children) ?
            normalizeArrayChildren(children) :
            undefined
}

function isTextNode(node) {
    return isDef(node) && isDef(node.text) && isFalse(node.isComment)
}

function normalizeArrayChildren(children, nestedIndex ) {
    var res = [];
    var i, c, lastIndex, last;
    for (i = 0; i < children.length; i++) {
        c = children[i];
        if (isUndef(c) || typeof c === 'boolean') { continue }
        lastIndex = res.length - 1;
        last = res[lastIndex];
        //  nested
        if (Array.isArray(c)) {
            if (c.length > 0) {
                c = normalizeArrayChildren(c, ((nestedIndex || '') + "_" + i));
                // merge adjacent text nodes
                if (isTextNode(c[0]) && isTextNode(last)) {
                    res[lastIndex] = createTextVNode(last.text + (c[0]).text);
                    c.shift();
                }
                res.push.apply(res, c);
            }
        } else if (isPrimitive(c)) {
            if (isTextNode(last)) {
                // merge adjacent text nodes
                // this is necessary for SSR hydration because text nodes are
                // essentially merged when rendered to HTML strings
                res[lastIndex] = createTextVNode(last.text + c);
            } else if (c !== '') {
                // convert primitive to vnode
                res.push(createTextVNode(c));
            }
        } else {
            if (isTextNode(c) && isTextNode(last)) {
                // merge adjacent text nodes
                res[lastIndex] = createTextVNode(last.text + c.text);
            } else {
                // default key for nested array children (likely generated by v-for)
                // _isVList 为v-for遍历添加的标识
                if (isTrue(children._isVList) &&
                    isDef(c.tag) &&
                    isUndef(c.key) &&
                    isDef(nestedIndex)) {
                    c.key = "__vlist" + nestedIndex + "_" + i + "__";
                }
                res.push(c);
            }
        }
    }
    return res
}

/*  */

var ssrHelpers = {
  _ssrEscape: escape,
  _ssrNode: renderStringNode,
  _ssrList: renderStringList,
  _ssrAttr: renderAttr,
  _ssrAttrs: renderAttrs$1,
  _ssrDOMProps: renderDOMProps$1,
  _ssrClass: renderSSRClass,
  _ssrStyle: renderSSRStyle
};

function installSSRHelpers (vm) {
  if (vm._ssrNode) {
    return
  }
  var Vue = vm.constructor;
  while (Vue.super) {
    Vue = Vue.super;
  }
  extend(Vue.prototype, ssrHelpers);
  if (Vue.FunctionalRenderContext) {
    extend(Vue.FunctionalRenderContext.prototype, ssrHelpers);
  }
}

var StringNode = function StringNode (
  open,
  close,
  children,
  normalizationType
) {
  this.isString = true;
  this.open = open;
  this.close = close;
  if (children) {
    this.children = normalizationType === 1
      ? simpleNormalizeChildren(children)
      : normalizationType === 2
        ? normalizeChildren(children)
        : children;
  } else {
    this.children = void 0;
  }
};

function renderStringNode (
  open,
  close,
  children,
  normalizationType
) {
  return new StringNode(open, close, children, normalizationType)
}

function renderStringList (
  val,
  render
) {
  var ret = '';
  var i, l, keys, key;
  if (Array.isArray(val) || typeof val === 'string') {
    for (i = 0, l = val.length; i < l; i++) {
      ret += render(val[i], i);
    }
  } else if (typeof val === 'number') {
    for (i = 0; i < val; i++) {
      ret += render(i + 1, i);
    }
  } else if (isObject(val)) {
    keys = Object.keys(val);
    for (i = 0, l = keys.length; i < l; i++) {
      key = keys[i];
      ret += render(val[key], key, i);
    }
  }
  return ret
}

function renderAttrs$1 (obj) {
  var res = '';
  for (var key in obj) {
    if (isSSRUnsafeAttr(key)) {
      continue
    }
    res += renderAttr(key, obj[key]);
  }
  return res
}

function renderDOMProps$1 (obj) {
  var res = '';
  for (var key in obj) {
    var attr = propsToAttrMap[key] || key.toLowerCase();
    if (isRenderableAttr(attr)) {
      res += renderAttr(attr, obj[key]);
    }
  }
  return res
}

function renderSSRClass (
  staticClass,
  dynamic
) {
  var res = renderClass(staticClass, dynamic);
  return res === '' ? res : (" class=\"" + (escape(res)) + "\"")
}

function renderSSRStyle (
  staticStyle,
  dynamic,
  extra
) {
  var style = {};
  if (staticStyle) { extend(style, staticStyle); }
  if (dynamic) { extend(style, normalizeStyleBinding(dynamic)); }
  if (extra) { extend(style, extra); }
  var res = genStyle(style);
  return res === '' ? res : (" style=" + (JSON.stringify(escape(res))))
}

/* not type checking this file because flow doesn't play well with Proxy */

{
  var allowedGlobals = makeMap(
    'Infinity,undefined,NaN,isFinite,isNaN,' +
    'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
    'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
    'require' // for Webpack/Browserify
  );

  var hasProxy =
    typeof Proxy !== 'undefined' && isNative(Proxy);

  if (hasProxy) {
    var isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta,exact');
    config.keyCodes = new Proxy(config.keyCodes, {
      set: function set (target, key, value) {
        if (isBuiltInModifier(key)) {
          warn(("Avoid overwriting built-in modifier in config.keyCodes: ." + key));
          return false
        } else {
          target[key] = value;
          return true
        }
      }
    });
  }
}

/*  */

var seenObjects = new _Set();

/**
 * Recursively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 */
function traverse (val) {
  _traverse(val, seenObjects);
  seenObjects.clear();
}

function _traverse (val, seen) {
  var i, keys;
  var isA = Array.isArray(val);
  if ((!isA && !isObject(val)) || Object.isFrozen(val) || val instanceof VNode) {
    return
  }
  if (val.__ob__) {
    var depId = val.__ob__.dep.id;
    if (seen.has(depId)) {
      return
    }
    seen.add(depId);
  }
  if (isA) {
    i = val.length;
    while (i--) { _traverse(val[i], seen); }
  } else {
    keys = Object.keys(val);
    i = keys.length;
    while (i--) { _traverse(val[keys[i]], seen); }
  }
}

{
  var perf = inBrowser && window.performance;
  /* istanbul ignore if */
  if (
    perf &&
    perf.mark &&
    perf.measure &&
    perf.clearMarks &&
    perf.clearMeasures
  ) ;
}

/*  */

// 对name之前的符号进行处理
var normalizeEvent = cached(function (name) {
    var passive = name.charAt(0) === '&';
    name = passive ? name.slice(1) : name;
    var once = name.charAt(0) === '~'; // Prefixed last, checked first
    name = once ? name.slice(1) : name;
    var capture = name.charAt(0) === '!';
    name = capture ? name.slice(1) : name;
    return {
        name: name,
        once: once,
        capture: capture,
        passive: passive
    }
});

// 构建函数调用器
function createFnInvoker(fns , vm) {
    function invoker() {
        var arguments$1 = arguments;

        var fns = invoker.fns;
        if (Array.isArray(fns)) {
            var cloned = fns.slice();
            for (var i = 0; i < cloned.length; i++) {
                invokeWithErrorHandling(cloned[i], null, arguments$1, vm, "v-on handler");
            }
        } else {
            // return handler return value for single handlers
            return invokeWithErrorHandling(fns, null, arguments, vm, "v-on handler")
        }
    }
    invoker.fns = fns;
    return invoker
}

// 遍历处理新添加进来的事件
function updateListeners(
    on,
    oldOn,
    add,
    remove,
    createOnceHandler,
    vm
) {
    var name, def, cur, old, event;

    for (name in on) {
        // cur 和 old 其实是name对应的函数调用器
        def = cur = on[name];
        old = oldOn[name];

        event = normalizeEvent(name);
        /* istanbul ignore if */
        // if (false && isPlainObject(def)) {
        //     cur = def.handler
        //     event.params = def.params
        // }

        if (isUndef(cur)) { //  新事件未定义 则报错处理
             warn(
                "Invalid handler for event \"" + (event.name) + "\": got " + String(cur),
                vm
            );
        } else if (isUndef(old)) { // 旧事件未定义 添加事件
            // 新事件方法未定义 调用createFnInvoker对事件函数进行封装
            if (isUndef(cur.fns)) {
                cur = on[name] = createFnInvoker(cur, vm);
            }

            // 事件为once 调用createOnceHandler对事件进行封装
            if (isTrue(event.once)) {
                cur = on[name] = createOnceHandler(event.name, cur, event.capture);
            }

            add(event.name, cur, event.capture, event.passive, event.params);
        } else if (cur !== old) { // 新事件不等于旧事件
            // 替换事件的回调
            old.fns = cur;
            on[name] = old;
        }
    }

    // 旧事件独有的 则调用remove销毁
    for (name in oldOn) {
        if (isUndef(on[name])) {
            event = normalizeEvent(name);
            remove(event.name, oldOn[name], event.capture);
        }
    }
}

/*  */

function extractPropsFromVNodeData(
    data,
    Ctor ,
    tag 
) {
    // we are only extracting raw values here.
    // validation and default values are handled in the child
    // component itself.
    var propOptions = Ctor.options.props; // 在子组件中指定的props
    if (isUndef(propOptions)) {
        return
    }
    var res = {};
    var attrs = data.attrs;
    var props = data.props;

    if (isDef(attrs) || isDef(props)) {
        // 遍历propsOptions中的属性，props中没有指定的属性，即使在父组件中绑定了，子组件也找不到
        for (var key in propOptions) {
            var altKey = hyphenate(key); // altKey是驼峰命名属性的中划线连接式，myName转换为my-name

            // 提示dom中的属性应该用kebab-case格式的值
            {
                var keyInLowerCase = key.toLowerCase();

                if (
                    key !== keyInLowerCase &&
                    attrs && hasOwn(attrs, keyInLowerCase)
                ) {
                    tip(
                        "Prop \"" + keyInLowerCase + "\" is passed to component " +
                        (formatComponentName(tag || Ctor)) + ", but the declared prop name is" +
                        " \"" + key + "\". " +
                        "Note that HTML attributes are case-insensitive and camelCased " +
                        "props need to use their kebab-case equivalents when using in-DOM " +
                        "templates. You should probably use \"" + altKey + "\" instead of \"" + key + "\"."
                    );
                }
            }
            checkProp(res, props, key, altKey, true) ||
            checkProp(res, attrs, key, altKey, false);
        }
    }
    return res
}

function checkProp(
    res,
    hash,
    key,
    altKey,
    preserve
) {
    if (isDef(hash)) {
        if (hasOwn(hash, key)) {
            res[key] = hash[key];
            if (!preserve) {
                delete hash[key];
            }
            return true
        } else if (hasOwn(hash, altKey)) {
            res[key] = hash[altKey];
            if (!preserve) {
                delete hash[altKey];
            }
            return true
        }
    }
    return false
}

/*  */

/**
 * Runtime helper for rendering v-for lists.
 * 渲染v-for列表的运行时helper
 * @return 返回一个VNode数组
 */
function renderList(
    val,
    render
){
    var ret , i, l, keys, key;

    // 遍历对象为字符串的处理
    if (Array.isArray(val) || typeof val === 'string') {
        ret = new Array(val.length);
        for (i = 0, l = val.length; i < l; i++) {
            ret[i] = render(val[i], i);
        }
    } else if (typeof val === 'number') { // 被遍历对象为数字的处理
        ret = new Array(val);

        for (i = 0; i < val; i++) {
            ret[i] = render(i + 1, i);
        }
    } else if (isObject(val)) { // 被遍历对象为对象的处理
        if (hasSymbol && val[Symbol.iterator]) { // 含有迭代器
            ret = [];
            var iterator = val[Symbol.iterator]();
            var result = iterator.next();

            while (!result.done) {
                ret.push(render(result.value, ret.length));
                result = iterator.next();
            }
        } else { // 普通对象
            keys = Object.keys(val);
            ret = new Array(keys.length);

            for (i = 0, l = keys.length; i < l; i++) {
                key = keys[i];
                ret[i] = render(val[key], key, i);
            }
        }
    }

    // 处理未定义
    if (!isDef(ret)) {
        ret = [];
    }

    // 添加_isVList标识
    ret._isVList = true;

    return ret
}

/*  */

var SIMPLE_NORMALIZE = 1;
var ALWAYS_NORMALIZE = 2;

// wrapper function for providing a more flexible interface
// without getting yelled at by flow
function createElement(
    context, // 当前的vm对象
    tag, // 标签名
    data, // 节点相关的属性
    children, // 子元素
    normalizationType, // 子元素归一化的处理的级别
    alwaysNormalize // 是否总是归一化处理
) {

    // 判断是否有相关属性 没有属性 则向前取值
    if (Array.isArray(data) || isPrimitive(data)) {
        normalizationType = children;
        children = data;
        data = undefined;
    }

    if (isTrue(alwaysNormalize)) {
        normalizationType = ALWAYS_NORMALIZE;
    }

    return _createElement(context, tag, data, children, normalizationType)
}

function _createElement(
    context,
    tag ,
    data ,
    children ,
    normalizationType 
) {
    // 数据已被Oberser
    if (isDef(data) && isDef((data).__ob__)) {
         warn(
            "Avoid using observed data object as vnode data: " + (JSON.stringify(data)) + "\n" +
            'Always create fresh vnode data objects in each render!',
            context
        );
        return createEmptyVNode()
    }
    // object syntax in v-bind
    // is语法用在component上 Chang-Jin 2019-11-19
    if (isDef(data) && isDef(data.is)) {
        tag = data.is;
    }

    // 判断tag是不是为空，如果为空则直接返回一个空的VNode Chang-Jin 2019-11-18
    if (!tag) {
        // in case of component :is set to falsy value
        return createEmptyVNode()
    }

    // warn against non-primitive key
    if (
        isDef(data) && isDef(data.key) && !isPrimitive(data.key)
    ) {
        {
            warn(
                'Avoid using non-primitive value as key, ' +
                'use string/number value instead.',
                context
            );
        }
    }

    // support single function children as default scoped slot
    // 子元素第一个参数为函数，则作为默认的slot Chang-Jin 2019-11-18
    if (Array.isArray(children) &&
        typeof children[0] === 'function'
    ) {
        data = data || {};
        data.scopedSlots = {
            default: children[0]
        };
        children.length = 0;
    }

    // 对子元素进行归一化 Chang-Jin 2019-11-18
    if (normalizationType === ALWAYS_NORMALIZE) {
        children = normalizeChildren(children);
    } else if (normalizationType === SIMPLE_NORMALIZE) {
        children = simpleNormalizeChildren(children);
    }

    var vnode, ns;

    if (typeof tag === 'string') {
        var Ctor;
        ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag);
        // tag是字符串又是平台保留标签名。则直接创建VNode对象 Chang-Jin 2019-11-18
        if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
            // component
            vnode = createComponent(Ctor, data, context, children, tag);

        // tag是字符串，但既不是平台保留标签名，也不是components中的自定义标签 Chang-Jin 2019-11-18
        } else {
            // unknown or unlisted namespaced elements
            // check at runtime because it may get assigned a namespace when its
            // parent normalizes children
            vnode = new VNode(
                tag, data, children,
                undefined, undefined, context
            );
        }
    } else {
        // tag不是字符串 可能直接是一个Vue的子类 Chang-Jin 2019-11-18
        // new Vue({
        //     render: function(h) {
        //         return h(Vue.extend({
        //             template: '<div>test</div>'
        //         }))
        //     }
        // }).$mount('#app')
        // direct component options / constructor
        vnode = createComponent(tag, data, context, children);
    }
    if (Array.isArray(vnode)) {
        return vnode
    } else if (isDef(vnode)) {
        if (isDef(ns)) { applyNS(vnode, ns); }
        if (isDef(data)) { registerDeepBindings(data); }
        return vnode
    } else {
        return createEmptyVNode()
    }
}

function applyNS(vnode, ns, force) {
    vnode.ns = ns;
    if (vnode.tag === 'foreignObject') {
        // use default namespace inside foreignObject
        ns = undefined;
        force = true;
    }
    if (isDef(vnode.children)) {
        for (var i = 0, l = vnode.children.length; i < l; i++) {
            var child = vnode.children[i];
            if (isDef(child.tag) && (
                    isUndef(child.ns) || (isTrue(force) && child.tag !== 'svg'))) {
                applyNS(child, ns, force);
            }
        }
    }
}

// ref #5318
// necessary to ensure parent re-render when deep bindings like :style and
// :class are used on slot nodes
function registerDeepBindings(data) {
    if (isObject(data.style)) {
        traverse(data.style);
    }
    if (isObject(data.class)) {
        traverse(data.class);
    }
}

/*  */

/**
 * Runtime helper for rendering <slot>
 * render slot元素时的运行时助手
 */
function renderSlot(
    name, // slot的那么属性值
    fallback, // 降级用的vnode数组
    props, // slot的传参
    bindObject // bind
) {
    var scopedSlotFn = this.$scopedSlots[name];
    var nodes;

    if (scopedSlotFn) { // scoped slot
        props = props || {};
        if (bindObject) {
            // if ("development" !== 'production' && !isObject(bindObject)) {
            //     warn(
            //         'slot v-bind without argument expects an Object',
            //         this
            //     )
            // }
            props = extend(extend({}, bindObject), props);
        }
        nodes = scopedSlotFn(props) || fallback;
    } else {
        nodes = this.$slots[name] || fallback; // 从$slot上获取slot的name随影的VNode
    }

    var target = props && props.slot;

    if (target) {
        return this.$createElement('template', {
            slot: target
        }, nodes)
    } else {
        return nodes
    }
}

/*  */

/**
 * Runtime helper for resolving filters
 */
function resolveFilter (id) {
  return resolveAsset(this.$options, 'filters', id, true) || identity
}

/*  */

function isKeyNotMatch (expect, actual) {
  if (Array.isArray(expect)) {
    return expect.indexOf(actual) === -1
  } else {
    return expect !== actual
  }
}

/**
 * Runtime helper for checking keyCodes from config.
 * exposed as Vue.prototype._k
 * passing in eventKeyName as last argument separately for backwards compat
 */

// 运行时帮助程序，用于从配置中检查keyCodes。
// 暴露为Vue.prototype._k
// 将eventKeyName作为最后一个参数传递，以便向后兼容
function checkKeyCodes (
  eventKeyCode,
  key,
  builtInKeyCode,
  eventKeyName,
  builtInKeyName
) {
  var mappedKeyCode = config.keyCodes[key] || builtInKeyCode;
  if (builtInKeyName && eventKeyName && !config.keyCodes[key]) {
    return isKeyNotMatch(builtInKeyName, eventKeyName)
  } else if (mappedKeyCode) {
    return isKeyNotMatch(mappedKeyCode, eventKeyCode)
  } else if (eventKeyName) {
    return hyphenate(eventKeyName) !== key
  }
}

/*  */

/**
 * Runtime helper for merging v-bind="object" into a VNode's data.
 */
function bindObjectProps (
  data,
  tag,
  value,
  asProp,
  isSync
) {
  if (value) {
    if (!isObject(value)) {
       warn(
        'v-bind without argument expects an Object or Array value',
        this
      );
    } else {
      if (Array.isArray(value)) {
        value = toObject(value);
      }
      var hash;
      var loop = function ( key ) {
        if (
          key === 'class' ||
          key === 'style' ||
          isReservedAttribute(key)
        ) {
          hash = data;
        } else {
          var type = data.attrs && data.attrs.type;
          hash = asProp || config.mustUseProp(tag, type, key)
            ? data.domProps || (data.domProps = {})
            : data.attrs || (data.attrs = {});
        }
        var camelizedKey = camelize(key);
        var hyphenatedKey = hyphenate(key);
        if (!(camelizedKey in hash) && !(hyphenatedKey in hash)) {
          hash[key] = value[key];

          if (isSync) {
            var on = data.on || (data.on = {});
            on[("update:" + key)] = function ($event) {
              value[key] = $event;
            };
          }
        }
      };

      for (var key in value) loop( key );
    }
  }
  return data
}

/*  */

/**
 * Runtime helper for rendering static trees.
 */
/**
 * 渲染静态内容
 *
 * @export
 * @param {number} index 索引值 指向最终生成的staticRenderFns数组中对应的内容
 * @param {boolean} isInFor 标识元素是否包裹在for循环中
 * @returns {(VNode | Array<VNode>)}
 */
function renderStatic(
    index,
    isInFor
) {
    var cached = this._staticTrees || (this._staticTrees = []);
    var tree = cached[index];

    // if has already-rendered static tree and not inside v-for,
    // we can reuse the same tree.
    // 如果已经渲染了静态树并且不在v-for中，
    // 我们可以重用同一棵树。
    if (tree && !isInFor) {
        return tree
    }

    // otherwise, render a fresh tree.
    // 否则，重新渲染树。
    tree = cached[index] = this.$options.staticRenderFns[index].call(
        this._renderProxy,
        null,
        this // for render fns generated for functional component templates
    );

    markStatic(tree, ("__static__" + index), false);
    return tree
}

/**
 * Runtime helper for v-once.
 * Effectively it means marking the node as static with a unique key.
 * v-once的运行时帮助程序。
 * 实际上，这意味着使用唯一key将节点标记为静态。
 */
function markOnce( // markOnce其实就是给vnode添加了key, 同时给isStatic, isOnce赋值为true
    tree ,
    index,
    key
) {
    // `__once__${index}${key ? `_${key}` : ``}` 使用index和key 拼接出一个唯一key
    markStatic(tree, ("__once__" + index + (key ? ("_" + key) : "")), true);
    return tree
}

function markStatic(
    tree ,
    key,
    isOnce
) {
    if (Array.isArray(tree)) {
        for (var i = 0; i < tree.length; i++) {
            if (tree[i] && typeof tree[i] !== 'string') {
                markStaticNode(tree[i], (key + "_" + i), isOnce);
            }
        }
    } else {
        markStaticNode(tree, key, isOnce);
    }
}

function markStaticNode(node, key, isOnce) {
    node.isStatic = true;
    node.key = key;
    node.isOnce = isOnce;
}

/*  */

function bindObjectListeners (data, value) {
  if (value) {
    if (!isPlainObject(value)) {
       warn(
        'v-on without argument expects an Object value',
        this
      );
    } else {
      var on = data.on = data.on ? extend({}, data.on) : {};
      for (var key in value) {
        var existing = on[key];
        var ours = value[key];
        on[key] = existing ? [].concat(existing, ours) : ours;
      }
    }
  }
  return data
}

/*  */

function resolveScopedSlots(
    fns, // see flow/vnode
    res ,
    // the following are added in 2.6
    hasDynamicKeys ,
    contentHashKey 
) {
    res = res || {
        $stable: !hasDynamicKeys
    };

    for (var i = 0; i < fns.length; i++) {
        var slot = fns[i];
        if (Array.isArray(slot)) {
            resolveScopedSlots(slot, res, hasDynamicKeys);
        } else if (slot) {
            // marker for reverse proxying v-slot without scope on this.$slots
            // 反向代理v-slot的标记，此范围无作用。
            if (slot.proxy) {
                slot.fn.proxy = true;
            }
            res[slot.key] = slot.fn;
        }
    }

    if (contentHashKey) {
        res.$key = contentHashKey;
    }

    return res
}

/*  */

function bindDynamicKeys (baseObj, values) {
  for (var i = 0; i < values.length; i += 2) {
    var key = values[i];
    if (typeof key === 'string' && key) {
      baseObj[values[i]] = values[i + 1];
    } else if ( key !== '' && key !== null) {
      // null is a special value for explicitly removing a binding
      warn(
        ("Invalid value for dynamic directive argument (expected string or null): " + key),
        this
      );
    }
  }
  return baseObj
}

// helper to dynamically append modifier runtime markers to event names.
// ensure only append when value is already string, otherwise it will be cast
// to string and cause the type check to miss.
function prependModifier (value, symbol) {
  return typeof value === 'string' ? symbol + value : value
}

/*  */

function installRenderHelpers (target) {
  target._o = markOnce; // v-once会用到
  target._n = toNumber; // 转换数字 v-model会用到
  target._s = toString; // 把一个值转换为字符串
  target._l = renderList; // v-for会用到
  target._t = renderSlot; // 渲染<slot> 解析slot标签时会用到
  target._q = looseEqual;
  target._i = looseIndexOf;
  target._m = renderStatic; // 渲染静态内容
  target._f = resolveFilter;
  target._k = checkKeyCodes;
  target._b = bindObjectProps;
  target._v = createTextVNode; // 创建一个文本节点
  target._e = createEmptyVNode; // 返回一个空的VNode
  target._u = resolveScopedSlots;
  target._g = bindObjectListeners;
  target._d = bindDynamicKeys;
  target._p = prependModifier;
}

/*  */



/**
 * Runtime helper for resolving raw children VNodes into a slot object.
 * 用于把原始子元素VNodes解析为slot对象的运行时助手
 */
function resolveSlots(
    children ,
    context
) {
    if (!children || !children.length) {
        return {}
    }

    var slots = {};
    for (var i = 0, l = children.length; i < l; i++) {
        var child = children[i];
        var data = child.data;

        // remove slot attribute if the node is resolved as a Vue slot node
        // 如果节点解析为Vue插槽节点，则删除插槽属性
        if (data && data.attrs && data.attrs.slot) {
            delete data.attrs.slot;
        }

        // named slots should only be respected if the vnode was rendered in the
        // same context.
        // 仅当在同一上下文中呈现vnode时，才应使用命名插槽。
        // 把插入内容根据命名进行分离
        if ((child.context === context || child.fnContext === context) &&
            data && data.slot != null
        ) {
            var name = data.slot;
            var slot = (slots[name] || (slots[name] = []));

            if (child.tag === 'template') {
                slot.push.apply(slot, child.children || []);
            } else {
                slot.push(child);
            }
        } else {
            (slots.default || (slots.default = [])).push(child);
        }
    }

    // ignore slots that contains only whitespace
    // 忽略仅包含空格的插槽
    for (var name$1 in slots) {
        if (slots[name$1].every(isWhitespace)) {
            delete slots[name$1];
        }
    }

    return slots
}

function isWhitespace(node) {
    return (node.isComment && !node.asyncFactory) || node.text === ' '
}

/*  */

function normalizeScopedSlots(
    slots,
    normalSlots,
    prevSlots 
) {
    var res;
    var hasNormalSlots = Object.keys(normalSlots).length > 0;
    var isStable = slots ? !!slots.$stable : !hasNormalSlots;
    var key = slots && slots.$key;

    if (!slots) {
        res = {};
    } else if (slots._normalized) { // 已做过归一化处理
        // fast path 1: child component re-render only, parent did not change
        // 快捷方式1: 仅重新渲染子组件，父组件未更改
        return slots._normalized
    } else if (
        isStable &&
        prevSlots &&
        prevSlots !== emptyObject &&
        key === prevSlots.$key &&
        !hasNormalSlots &&
        !prevSlots.$hasNormal
    ) {
        // fast path 2: stable scoped slots w/ no normal slots to proxy,
        // only need to normalize once
        // 快捷方式2：具有/没有用于代理的常规插槽的稳定范围的插槽，
        // 只需要标准化一次
        return prevSlots
    } else {
        res = {};

        for (var key$1 in slots) {
            if (slots[key$1] && key$1[0] !== '$') {
                res[key$1] = normalizeScopedSlot(normalSlots, key$1, slots[key$1]);
            }
        }
    }

    // expose normal slots on scopedSlots
    // 在scopedSlots上暴露普通插槽
    for (var key$2 in normalSlots) {
        if (!(key$2 in res)) {
            res[key$2] = proxyNormalSlot(normalSlots, key$2);
        }
    }

    // avoriaz seems to mock a non-extensible $scopedSlots object
    // and when that is passed down this would cause an error
    // avoriaz似乎模拟了一个不可扩展的$ scopedSlots对象
    // 当该对象向下传递时，将导致错误
    if (slots && Object.isExtensible(slots)) {
        slots._normalized = res;
    }

    def(res, '$stable', isStable);
    def(res, '$key', key);
    def(res, '$hasNormal', hasNormalSlots);

    return res
}

function normalizeScopedSlot(normalSlots, key, fn) {
    var normalized = function() {
        var res = arguments.length ? fn.apply(null, arguments) : fn({});

        res = res && typeof res === 'object' && !Array.isArray(res) ?
            [res] : // single vnode
            normalizeChildren(res);
        return res && (
                res.length === 0 ||
                (res.length === 1 && res[0].isComment) // #9658
            ) ? undefined :
            res
    };
    // this is a slot using the new v-slot syntax without scope. although it is
    // compiled as a scoped slot, render fn users would expect it to be present
    // on this.$slots because the usage is semantically a normal slot.
    if (fn.proxy) {
        Object.defineProperty(normalSlots, key, {
            get: normalized,
            enumerable: true,
            configurable: true
        });
    }
    return normalized
}

function proxyNormalSlot(slots, key) {
    return function () { return slots[key]; }
}

/*  */

var currentRenderingInstance = null;

/*  */

function ensureCtor (comp, base) {
  if (
    comp.__esModule ||
    (hasSymbol && comp[Symbol.toStringTag] === 'Module')
  ) {
    comp = comp.default;
  }
  return isObject(comp)
    ? base.extend(comp)
    : comp
}

function createAsyncPlaceholder (
  factory,
  data,
  context,
  children,
  tag
) {
  var node = createEmptyVNode();
  node.asyncFactory = factory;
  node.asyncMeta = { data: data, context: context, children: children, tag: tag };
  return node
}

function resolveAsyncComponent (
  factory,
  baseCtor
) {
  if (isTrue(factory.error) && isDef(factory.errorComp)) {
    return factory.errorComp
  }

  if (isDef(factory.resolved)) {
    return factory.resolved
  }

  var owner = currentRenderingInstance;
  if (owner && isDef(factory.owners) && factory.owners.indexOf(owner) === -1) {
    // already pending
    factory.owners.push(owner);
  }

  if (isTrue(factory.loading) && isDef(factory.loadingComp)) {
    return factory.loadingComp
  }

  if (owner && !isDef(factory.owners)) {
    var owners = factory.owners = [owner];
    var sync = true;
    var timerLoading = null;
    var timerTimeout = null

    ;(owner).$on('hook:destroyed', function () { return remove(owners, owner); });

    var forceRender = function (renderCompleted) {
      for (var i = 0, l = owners.length; i < l; i++) {
        (owners[i]).$forceUpdate();
      }

      if (renderCompleted) {
        owners.length = 0;
        if (timerLoading !== null) {
          clearTimeout(timerLoading);
          timerLoading = null;
        }
        if (timerTimeout !== null) {
          clearTimeout(timerTimeout);
          timerTimeout = null;
        }
      }
    };

    var resolve = once(function (res) {
      // cache resolved
      factory.resolved = ensureCtor(res, baseCtor);
      // invoke callbacks only if this is not a synchronous resolve
      // (async resolves are shimmed as synchronous during SSR)
      if (!sync) {
        forceRender(true);
      } else {
        owners.length = 0;
      }
    });

    var reject = once(function (reason) {
       warn(
        "Failed to resolve async component: " + (String(factory)) +
        (reason ? ("\nReason: " + reason) : '')
      );
      if (isDef(factory.errorComp)) {
        factory.error = true;
        forceRender(true);
      }
    });

    var res = factory(resolve, reject);

    if (isObject(res)) {
      if (isPromise(res)) {
        // () => Promise
        if (isUndef(factory.resolved)) {
          res.then(resolve, reject);
        }
      } else if (isPromise(res.component)) {
        res.component.then(resolve, reject);

        if (isDef(res.error)) {
          factory.errorComp = ensureCtor(res.error, baseCtor);
        }

        if (isDef(res.loading)) {
          factory.loadingComp = ensureCtor(res.loading, baseCtor);
          if (res.delay === 0) {
            factory.loading = true;
          } else {
            timerLoading = setTimeout(function () {
              timerLoading = null;
              if (isUndef(factory.resolved) && isUndef(factory.error)) {
                factory.loading = true;
                forceRender(false);
              }
            }, res.delay || 200);
          }
        }

        if (isDef(res.timeout)) {
          timerTimeout = setTimeout(function () {
            timerTimeout = null;
            if (isUndef(factory.resolved)) {
              reject(
                 ("timeout (" + (res.timeout) + "ms)")
                  
              );
            }
          }, res.timeout);
        }
      }
    }

    sync = false;
    // return in case resolved synchronously
    return factory.loading
      ? factory.loadingComp
      : factory.resolved
  }
}

/*  */

var target;

function add(event, fn) {
    target.$on(event, fn);
}

function remove$1(event, fn) {
    target.$off(event, fn);
}

function createOnceHandler(event, fn) {
    var _target = target;
    return function onceHandler() {
        var res = fn.apply(null, arguments);
        if (res !== null) {
            _target.$off(event, onceHandler);
        }
    }
}

function updateComponentListeners(
    vm,
    listeners,
    oldListeners
) {
    target = vm;
    updateListeners(listeners, oldListeners || {}, add, remove$1, createOnceHandler, vm);
    target = undefined;
}

/*  */

var activeInstance = null;

function updateChildComponent(
    vm,
    propsData,
    listeners,
    parentVnode,
    renderChildren
) {

    // determine whether component has slot children
    // we need to do this before overwriting $options._renderChildren.
    // 确定组件是否具有插槽子代，
    // 我们需要在覆盖$ options._renderChildren之前执行此操作。

    // check if there are dynamic scopedSlots (hand-written or compiled but with
    // dynamic slot names). Static scoped slots compiled from template has the
    // "$stable" marker.
    // 检查是否有动态scopedSlot（手写或编译的但具有动态插槽名称）。
    // 从模板编译的静态作用域插槽具有“ $ stable”标记。
    var newScopedSlots = parentVnode.data.scopedSlots;
    var oldScopedSlots = vm.$scopedSlots;
    var hasDynamicScopedSlot = !!(
        (newScopedSlots && !newScopedSlots.$stable) ||
        (oldScopedSlots !== emptyObject && !oldScopedSlots.$stable) ||
        (newScopedSlots && vm.$scopedSlots.$key !== newScopedSlots.$key)
    );

    // Any static slot children from the parent may have changed during parent's
    // update. Dynamic scoped slots may also have changed. In such cases, a forced
    // update is necessary to ensure correctness.
    // 父级的任何静态插槽子级可能在父级更新期间已更改。
    // 动态范围的插槽也可能已更改。
    // 在这种情况下，必须进行强制更新以确保正确性。
    var needsForceUpdate = !!(
        renderChildren || // has new static slots 有新的静态插槽
        vm.$options._renderChildren || // has old static slots 有旧的静态插槽
        hasDynamicScopedSlot
    );

    // 更新vnode相关关系
    vm.$options._parentVnode = parentVnode;
    vm.$vnode = parentVnode; // update vm's placeholder node without re-render 更新vm的占位符节点，而无需重新渲染
    if (vm._vnode) { // update child tree's parent 更新子树的父级
        vm._vnode.parent = parentVnode;
    }
    vm.$options._renderChildren = renderChildren;

    // update $attrs and $listeners hash
    // these are also reactive so they may trigger child update if the child
    // used them during render
    // 更新$attrs和$listeners哈希值也是响应式的
    // 因此如果子代在渲染期间使用它们，它们可能会触发子代更新
    vm.$attrs = parentVnode.data.attrs || emptyObject;
    vm.$listeners = listeners || emptyObject;

    // update props // 更新 props
    if (propsData && vm.$options.props) {
        toggleObserving(false);
        var props = vm._props;
        var propKeys = vm.$options._propKeys || [];
        for (var i = 0; i < propKeys.length; i++) {
            var key = propKeys[i];
            var propOptions = vm.$options.props; // wtf flow?
            props[key] = validateProp(key, propOptions, propsData, vm); // 对传递的数据类型等进行校验。
        }
        toggleObserving(true);
        // keep a copy of raw propsData 保留原始propsData的副本
        vm.$options.propsData = propsData;
    }

    // update listeners // 更新 listeners
    listeners = listeners || emptyObject;
    var oldListeners = vm.$options._parentListeners;
    vm.$options._parentListeners = listeners;
    updateComponentListeners(vm, listeners, oldListeners);

    // resolve slots + force update if has children
    // 处理slots并如果有子级强制更新
    if (needsForceUpdate) {
        vm.$slots = resolveSlots(renderChildren, parentVnode.context);
        vm.$forceUpdate();
    }
}

function isInInactiveTree(vm) {
    while (vm && (vm = vm.$parent)) {
        if (vm._inactive) { return true }
    }
    return false
}

function activateChildComponent(vm, direct ) {
    if (direct) {
        vm._directInactive = false;
        if (isInInactiveTree(vm)) {
            return
        }
    } else if (vm._directInactive) {
        return
    }
    if (vm._inactive || vm._inactive === null) {
        vm._inactive = false;
        for (var i = 0; i < vm.$children.length; i++) {
            activateChildComponent(vm.$children[i]);
        }
        callHook(vm, 'activated');
    }
}

function deactivateChildComponent(vm, direct ) {
    if (direct) {
        vm._directInactive = true;
        if (isInInactiveTree(vm)) {
            return
        }
    }
    if (!vm._inactive) {
        vm._inactive = true;
        for (var i = 0; i < vm.$children.length; i++) {
            deactivateChildComponent(vm.$children[i]);
        }
        callHook(vm, 'deactivated');
    }
}

function callHook(vm, hook) {
    // #7573 disable dep collection when invoking lifecycle hooks
    pushTarget();
    var handlers = vm.$options[hook];
    var info = hook + " hook";
    if (handlers) {
        for (var i = 0, j = handlers.length; i < j; i++) {
            invokeWithErrorHandling(handlers[i], vm, null, vm, info);
        }
    }
    if (vm._hasHookEvent) {
        vm.$emit('hook:' + hook);
    }
    popTarget();
}

/*  */

// Async edge case fix requires storing an event listener's attach timestamp.
var getNow = Date.now;

// Determine what event timestamp the browser is using. Annoyingly, the
// timestamp can either be hi-res (relative to page load) or low-res
// (relative to UNIX epoch), so in order to compare time we have to use the
// same timestamp type when saving the flush timestamp.
// All IE versions use low-res event timestamps, and have problematic clock
// implementations (#9632)
if (inBrowser && !isIE) {
    var performance = window.performance;
    if (
        performance &&
        typeof performance.now === 'function' &&
        getNow() > document.createEvent('Event').timeStamp
    ) {
        // if the event timestamp, although evaluated AFTER the Date.now(), is
        // smaller than it, it means the event is using a hi-res timestamp,
        // and we need to use the hi-res version for event listener timestamps as
        // well.
        getNow = function () { return performance.now(); };
    }
}

/**
 * Queue a kept-alive component that was activated during patch.
 * The queue will be processed after the entire tree has been patched.
 * 对在patch中激活的保持活动的组件进行排队。
 * patch整个树后，将处理该队列。
 */
function queueActivatedComponent(vm) {
    // setting _inactive to false here so that a render function can
    // rely on checking whether it's in an inactive tree (e.g. router-view)
    // 在这里将_inactive设置为false
    // 以便渲染功能可以依靠检查它是否在非活动树中（例如router-view）
    vm._inactive = false;
}

/*  */

function resolveInject (inject, vm) {
  if (inject) {
    // inject is :any because flow is not smart enough to figure out cached
    var result = Object.create(null);
    var keys = hasSymbol
      ? Reflect.ownKeys(inject)
      : Object.keys(inject);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      // #6574 in case the inject object is observed...
      if (key === '__ob__') { continue }
      var provideKey = inject[key].from;
      var source = vm;
      while (source) {
        if (source._provided && hasOwn(source._provided, provideKey)) {
          result[key] = source._provided[provideKey];
          break
        }
        source = source.$parent;
      }
      if (!source) {
        if ('default' in inject[key]) {
          var provideDefault = inject[key].default;
          result[key] = typeof provideDefault === 'function'
            ? provideDefault.call(vm)
            : provideDefault;
        } else {
          warn(("Injection \"" + key + "\" not found"), vm);
        }
      }
    }
    return result
  }
}

/*  */

function resolveConstructorOptions (Ctor) {
  var options = Ctor.options;
  if (Ctor.super) {
    var superOptions = resolveConstructorOptions(Ctor.super);
    var cachedSuperOptions = Ctor.superOptions;
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions;
      // check if there are any late-modified/attached options (#4976)
      var modifiedOptions = resolveModifiedOptions(Ctor);
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions);
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
      if (options.name) {
        options.components[options.name] = Ctor;
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor) {
  var modified;
  var latest = Ctor.options;
  var sealed = Ctor.sealedOptions;
  for (var key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) { modified = {}; }
      modified[key] = latest[key];
    }
  }
  return modified
}

/*  */

function FunctionalRenderContext (
  data,
  props,
  children,
  parent,
  Ctor
) {
  var this$1 = this;

  var options = Ctor.options;
  // ensure the createElement function in functional components
  // gets a unique context - this is necessary for correct named slot check
  var contextVm;
  if (hasOwn(parent, '_uid')) {
    contextVm = Object.create(parent);
    // $flow-disable-line
    contextVm._original = parent;
  } else {
    // the context vm passed in is a functional context as well.
    // in this case we want to make sure we are able to get a hold to the
    // real context instance.
    contextVm = parent;
    // $flow-disable-line
    parent = parent._original;
  }
  var isCompiled = isTrue(options._compiled);
  var needNormalization = !isCompiled;

  this.data = data;
  this.props = props;
  this.children = children;
  this.parent = parent;
  this.listeners = data.on || emptyObject;
  this.injections = resolveInject(options.inject, parent);
  this.slots = function () {
    if (!this$1.$slots) {
      normalizeScopedSlots(
        data.scopedSlots,
        this$1.$slots = resolveSlots(children, parent)
      );
    }
    return this$1.$slots
  };

  Object.defineProperty(this, 'scopedSlots', ({
    enumerable: true,
    get: function get () {
      return normalizeScopedSlots(data.scopedSlots, this.slots())
    }
  }));

  // support for compiled functional template
  if (isCompiled) {
    // exposing $options for renderStatic()
    this.$options = options;
    // pre-resolve slots for renderSlot()
    this.$slots = this.slots();
    this.$scopedSlots = normalizeScopedSlots(data.scopedSlots, this.$slots);
  }

  if (options._scopeId) {
    this._c = function (a, b, c, d) {
      var vnode = createElement(contextVm, a, b, c, d, needNormalization);
      if (vnode && !Array.isArray(vnode)) {
        vnode.fnScopeId = options._scopeId;
        vnode.fnContext = parent;
      }
      return vnode
    };
  } else {
    this._c = function (a, b, c, d) { return createElement(contextVm, a, b, c, d, needNormalization); };
  }
}

installRenderHelpers(FunctionalRenderContext.prototype);

function createFunctionalComponent (
  Ctor,
  propsData,
  data,
  contextVm,
  children
) {
  var options = Ctor.options;
  var props = {};
  var propOptions = options.props;
  if (isDef(propOptions)) {
    for (var key in propOptions) {
      props[key] = validateProp(key, propOptions, propsData || emptyObject);
    }
  } else {
    if (isDef(data.attrs)) { mergeProps(props, data.attrs); }
    if (isDef(data.props)) { mergeProps(props, data.props); }
  }

  var renderContext = new FunctionalRenderContext(
    data,
    props,
    children,
    contextVm,
    Ctor
  );

  var vnode = options.render.call(null, renderContext._c, renderContext);

  if (vnode instanceof VNode) {
    return cloneAndMarkFunctionalResult(vnode, data, renderContext.parent, options, renderContext)
  } else if (Array.isArray(vnode)) {
    var vnodes = normalizeChildren(vnode) || [];
    var res = new Array(vnodes.length);
    for (var i = 0; i < vnodes.length; i++) {
      res[i] = cloneAndMarkFunctionalResult(vnodes[i], data, renderContext.parent, options, renderContext);
    }
    return res
  }
}

function cloneAndMarkFunctionalResult (vnode, data, contextVm, options, renderContext) {
  // #7817 clone node before setting fnContext, otherwise if the node is reused
  // (e.g. it was from a cached normal slot) the fnContext causes named slots
  // that should not be matched to match.
  var clone = cloneVNode(vnode);
  clone.fnContext = contextVm;
  clone.fnOptions = options;
  {
    (clone.devtoolsMeta = clone.devtoolsMeta || {}).renderContext = renderContext;
  }
  if (data.slot) {
    (clone.data || (clone.data = {})).slot = data.slot;
  }
  return clone
}

function mergeProps (to, from) {
  for (var key in from) {
    to[camelize(key)] = from[key];
  }
}

/*  */

// inline hooks to be invoked on component VNodes during patch
// patch执行期间在组件VNode上调用内联挂钩
var componentVNodeHooks = {
    init: function init(vnode, hydrating) {
        // 如果componentInstance存在 且 未被销毁 且 需要keepAlive; 则直接调用prepatch
        if (
            vnode.componentInstance &&
            !vnode.componentInstance._isDestroyed &&
            vnode.data.keepAlive
        ) {
            // kept-alive components, treat as a patch
            // 保持活动的组件，视为patch
            var mountedNode = vnode;
            componentVNodeHooks.prepatch(mountedNode, mountedNode);
        } else {
            // vnode.componentInstance不存在 或 已经销毁 或 非keepAlive
            // 则通过createComponentInstanceForVnode方法来创建新的Vue实例
            var child = vnode.componentInstance = createComponentInstanceForVnode(
                vnode,
                activeInstance
            );

            // 调用vue实例上的$mount方法
            child.$mount(hydrating ? vnode.elm : undefined, hydrating);
        }
    },

    // 调用prepatch钩子函数的前提，说明该自定义组件得到了复
    // 也就是说该自定义组件本身没有被替换
    // 我们只需要根据传入的props或者slots等来更新子模板的内容
    prepatch: function prepatch(oldVnode, vnode) {
        var options = vnode.componentOptions;
        var child = vnode.componentInstance = oldVnode.componentInstance;

        // 更新子组件
        updateChildComponent(
            child,
            options.propsData, // updated props
            options.listeners, // updated listeners
            vnode, // new parent vnode
            options.children // new children
        );
    },

    insert: function insert(vnode) {
        var context = vnode.context;
        var componentInstance = vnode.componentInstance;

        // 如果未挂载则修改标识 并调用mounted钩子函数
        if (!componentInstance._isMounted) {
            componentInstance._isMounted = true;
            callHook(componentInstance, 'mounted');
        }

        // 组件插入页面后如果是keep-alive的组件
        if (vnode.data.keepAlive) {
            if (context._isMounted) {
                // vue-router#1212
                // During updates, a kept-alive component's child components may
                // change, so directly walking the tree here may call activated hooks
                // on incorrect children. Instead we push them into a queue which will
                // be processed after the whole patch process ended.
                // 在更新期间，保持活动的组件的子组件可能会更改，
                // 因此直接walking the tree可能会在不正确的子组件上调用激活的钩子。
                // 相反，我们将它们推入队列，整个patch过程结束后将对其进行处理。
                queueActivatedComponent(componentInstance);
            } else {
                activateChildComponent(componentInstance, true /* direct */ );
            }
        }
    },

    destroy: function destroy(vnode) {
        var componentInstance = vnode.componentInstance;

        // 如果未销毁则进行销毁
        if (!componentInstance._isDestroyed) {
            // 如果组件不是keep-alive 则调用$destory进行销毁
            // 否则对子组件进行deactivate处理
            if (!vnode.data.keepAlive) {
                componentInstance.$destroy();
            } else {
                deactivateChildComponent(componentInstance, true /* direct */ );
            }
        }
    }
};

// hooksToMerge共有四个值init、prepatch、insert、destroy
var hooksToMerge = Object.keys(componentVNodeHooks);

/**
 * 生成组件对应的VNode
 *
 * @export
 * @param {(Class<Component> | Function | Object | void)} Ctor 组件的配置项
 * @param {? VNodeData} data 组件标签上的属性
 * @param {Component} context 组件所在的vm对象
 * @param {? Array<VNode>} children 组件内的children 应该就是slot了
 * @param {string} [tag] 标签名
 * @returns {(VNode | Array<VNode> | void)} 返回组件对应的VNode对象
 */
function createComponent(
    Ctor,
    data,
    context,
    children ,
    tag 
) {
    // Ctor为空表示从context的components属性上没找到tag对应的属性 Chang-Jin 2019-11-19
    if (isUndef(Ctor)) {
        return
    }

    var baseCtor = context.$options._base; // _base就是Vue

    // plain options object: turn it into a constructor
    // 普通选项对象：将其转换为构造函数
    if (isObject(Ctor)) {
        Ctor = baseCtor.extend(Ctor); // 通过extend得到一个Vue的子类 Chang-Jin 2019-11-19
    }

    // if at this stage it's not a constructor or an async component factory,
    // reject.
    if (typeof Ctor !== 'function') {
        {
            warn(("Invalid Component definition: " + (String(Ctor))), context);
        }
        return
    }

    // async component
    // 处理异步组件
    var asyncFactory;
    if (isUndef(Ctor.cid)) {
        asyncFactory = Ctor;
        Ctor = resolveAsyncComponent(asyncFactory, baseCtor);
        if (Ctor === undefined) {
            // return a placeholder node for async component, which is rendered
            // as a comment node but preserves all the raw information for the node.
            // the information will be used for async server-rendering and hydration.
            return createAsyncPlaceholder(
                asyncFactory,
                data,
                context,
                children,
                tag
            )
        }
    }

    data = data || {};

    // resolve constructor options in case global mixins are applied after
    // component constructor creation
    // 递归合并父对象上的options属性
    resolveConstructorOptions(Ctor);

    // transform component v-model data into props & events
    // 对自定义组件上v-model指令的处理
    if (isDef(data.model)) {
        transformModel(Ctor.options, data);
    }

    // extract props
    // 根据子组件定义的props 抽取子组件上传递的数据  如果没有在props上定义 不会抽取
    var propsData = extractPropsFromVNodeData(data, Ctor, tag);

    // functional component
    if (isTrue(Ctor.options.functional)) {
        return createFunctionalComponent(Ctor, propsData, data, context, children)
    }

    // extract listeners, since these needs to be treated as
    // child component listeners instead of DOM listeners
    // 提取listener，因为这些需要被视为
    // 子组件listener，而不是DOM listener
    var listeners = data.on;
    // replace with listeners with .native modifier
    // so it gets processed during parent component patch.
    // 用.native修饰符替换为listener
    // 因此会在父组件patch期间对其进行处理。
    data.on = data.nativeOn;

    if (isTrue(Ctor.options.abstract)) { // Ctor.options.abstract是KeepLive等抽象组件
        // abstract components do not keep anything
        // other than props & listeners & slot
        // 抽象组件除了保留props，监听器和插槽之外，不保留其他任何东西
        // work around flow
        var slot = data.slot;
        data = {};
        if (slot) {
            data.slot = slot;
        }
    }

    // install component management hooks onto the placeholder node
    // 将组件管理挂钩安装到占位符节点上
    installComponentHooks(data);

    // return a placeholder vnode
    var name = Ctor.options.name || tag;
    var vnode = new VNode(
        ("vue-component-" + (Ctor.cid) + (name ? ("-" + name) : '')),
        data, undefined, undefined, undefined, context, {
            Ctor: Ctor,
            propsData: propsData,
            listeners: listeners,
            tag: tag,
            children: children
        },
        asyncFactory
    );

    return vnode
}

function createComponentInstanceForVnode(
    vnode, // 我们知道它是MountedComponentVNode，但flow不知道
    parent // activeInstance处于生命周期状态
) {
    var options = {
        _isComponent: true,
        _parentVnode: vnode,
        parent: parent
    };

    // 校验内联模板渲染功能
    var inlineTemplate = vnode.data.inlineTemplate;
    if (isDef(inlineTemplate)) {
        options.render = inlineTemplate.render;
        options.staticRenderFns = inlineTemplate.staticRenderFns;
    }

    // 调用new vnodeComponentOptions.Ctor(options)来创建一个新的Vue实例
    return new vnode.componentOptions.Ctor(options)
}

function installComponentHooks(data) {
    var hooks = data.hook || (data.hook = {});
    for (var i = 0; i < hooksToMerge.length; i++) {
        var key = hooksToMerge[i];
        var existing = hooks[key];
        var toMerge = componentVNodeHooks[key];

        // 如果data.hook上已经有了同名的钩子函数
        // 则创建一个新的函数，其内部分别调用这两个同名函数
        // 否则直接添加到data.hook对象上
        if (existing !== toMerge && !(existing && existing._merged)) {
            hooks[key] = existing ? mergeHook$1(toMerge, existing) : toMerge;
        }
    }
}

function mergeHook$1(f1, f2) {
    var merged = function (a, b) {
        // flow complains about extra args which is why we use any
        f1(a, b);
        f2(a, b);
    };
    merged._merged = true;
    return merged
}

// transform component v-model info (value and callback) into
// prop and event handler respectively.
function transformModel(options, data) {
    var prop = (options.model && options.model.prop) || 'value';
    var event = (options.model && options.model.event) || 'input';
    (data.attrs || (data.attrs = {}))[prop] = data.model.value;
    var on = data.on || (data.on = {});
    var existing = on[event];
    var callback = data.model.callback;
    if (isDef(existing)) {
        if (
            Array.isArray(existing) ?
            existing.indexOf(callback) === -1 :
            existing !== callback
        ) {
            on[event] = [callback].concat(existing);
        }
    } else {
        on[event] = callback;
    }
}

/*  */

var warned = Object.create(null);
var warnOnce = function (msg) {
  if (!warned[msg]) {
    warned[msg] = true;
    // eslint-disable-next-line no-console
    console.warn(("\n\u001b[31m" + msg + "\u001b[39m\n"));
  }
};

var onCompilationError = function (err, vm) {
  var trace = vm ? generateComponentTrace(vm) : '';
  throw new Error(("\n\u001b[31m" + err + trace + "\u001b[39m\n"))
};

var normalizeRender = function (vm) {
  var ref = vm.$options;
  var render = ref.render;
  var template = ref.template;
  var _scopeId = ref._scopeId;
  if (isUndef(render)) {
    if (template) {
      var compiled = compileToFunctions(template, {
        scopeId: _scopeId,
        warn: onCompilationError
      }, vm);

      vm.$options.render = compiled.render;
      vm.$options.staticRenderFns = compiled.staticRenderFns;
    } else {
      throw new Error(
        ("render function or template not defined in component: " + (vm.$options.name || vm.$options._componentTag || 'anonymous'))
      )
    }
  }
};

function waitForServerPrefetch (vm, resolve, reject) {
  var handlers = vm.$options.serverPrefetch;
  if (isDef(handlers)) {
    if (!Array.isArray(handlers)) { handlers = [handlers]; }
    try {
      var promises = [];
      for (var i = 0, j = handlers.length; i < j; i++) {
        var result = handlers[i].call(vm, vm);
        if (result && typeof result.then === 'function') {
          promises.push(result);
        }
      }
      Promise.all(promises).then(resolve).catch(reject);
      return
    } catch (e) {
      reject(e);
    }
  }
  resolve();
}

function renderNode (node, isRoot, context) {
  if (node.isString) {
    renderStringNode$1(node, context);
  } else if (isDef(node.componentOptions)) {
    renderComponent(node, isRoot, context);
  } else if (isDef(node.tag)) {
    renderElement(node, isRoot, context);
  } else if (isTrue(node.isComment)) {
    if (isDef(node.asyncFactory)) {
      // async component
      renderAsyncComponent(node, isRoot, context);
    } else {
      context.write(("<!--" + (node.text) + "-->"), context.next);
    }
  } else {
    context.write(
      node.raw ? node.text : escape(String(node.text)),
      context.next
    );
  }
}

function registerComponentForCache (options, write) {
  // exposed by vue-loader, need to call this if cache hit because
  // component lifecycle hooks will not be called.
  var register = options._ssrRegister;
  if (write.caching && isDef(register)) {
    write.componentBuffer[write.componentBuffer.length - 1].add(register);
  }
  return register
}

function renderComponent (node, isRoot, context) {
  var write = context.write;
  var next = context.next;
  var userContext = context.userContext;

  // check cache hit
  var Ctor = node.componentOptions.Ctor;
  var getKey = Ctor.options.serverCacheKey;
  var name = Ctor.options.name;
  var cache = context.cache;
  var registerComponent = registerComponentForCache(Ctor.options, write);

  if (isDef(getKey) && isDef(cache) && isDef(name)) {
    var rawKey = getKey(node.componentOptions.propsData);
    if (rawKey === false) {
      renderComponentInner(node, isRoot, context);
      return
    }
    var key = name + '::' + rawKey;
    var has = context.has;
    var get = context.get;
    if (isDef(has)) {
      has(key, function (hit) {
        if (hit === true && isDef(get)) {
          get(key, function (res) {
            if (isDef(registerComponent)) {
              registerComponent(userContext);
            }
            res.components.forEach(function (register) { return register(userContext); });
            write(res.html, next);
          });
        } else {
          renderComponentWithCache(node, isRoot, key, context);
        }
      });
    } else if (isDef(get)) {
      get(key, function (res) {
        if (isDef(res)) {
          if (isDef(registerComponent)) {
            registerComponent(userContext);
          }
          res.components.forEach(function (register) { return register(userContext); });
          write(res.html, next);
        } else {
          renderComponentWithCache(node, isRoot, key, context);
        }
      });
    }
  } else {
    if (isDef(getKey) && isUndef(cache)) {
      warnOnce(
        "[vue-server-renderer] Component " + (Ctor.options.name || '(anonymous)') + " implemented serverCacheKey, " +
        'but no cache was provided to the renderer.'
      );
    }
    if (isDef(getKey) && isUndef(name)) {
      warnOnce(
        "[vue-server-renderer] Components that implement \"serverCacheKey\" " +
        "must also define a unique \"name\" option."
      );
    }
    renderComponentInner(node, isRoot, context);
  }
}

function renderComponentWithCache (node, isRoot, key, context) {
  var write = context.write;
  write.caching = true;
  var buffer = write.cacheBuffer;
  var bufferIndex = buffer.push('') - 1;
  var componentBuffer = write.componentBuffer;
  componentBuffer.push(new Set());
  context.renderStates.push({
    type: 'ComponentWithCache',
    key: key,
    buffer: buffer,
    bufferIndex: bufferIndex,
    componentBuffer: componentBuffer
  });
  renderComponentInner(node, isRoot, context);
}

function renderComponentInner (node, isRoot, context) {
  var prevActive = context.activeInstance;
  // expose userContext on vnode
  node.ssrContext = context.userContext;
  var child = context.activeInstance = createComponentInstanceForVnode(
    node,
    context.activeInstance
  );
  normalizeRender(child);

  var resolve = function () {
    var childNode = child._render();
    childNode.parent = node;
    context.renderStates.push({
      type: 'Component',
      prevActive: prevActive
    });
    renderNode(childNode, isRoot, context);
  };

  var reject = context.done;

  waitForServerPrefetch(child, resolve, reject);
}

function renderAsyncComponent (node, isRoot, context) {
  var factory = node.asyncFactory;

  var resolve = function (comp) {
    if (comp.__esModule && comp.default) {
      comp = comp.default;
    }
    var ref = node.asyncMeta;
    var data = ref.data;
    var children = ref.children;
    var tag = ref.tag;
    var nodeContext = node.asyncMeta.context;
    var resolvedNode = createComponent(
      comp,
      data,
      nodeContext,
      children,
      tag
    );
    if (resolvedNode) {
      if (resolvedNode.componentOptions) {
        // normal component
        renderComponent(resolvedNode, isRoot, context);
      } else if (!Array.isArray(resolvedNode)) {
        // single return node from functional component
        renderNode(resolvedNode, isRoot, context);
      } else {
        // multiple return nodes from functional component
        context.renderStates.push({
          type: 'Fragment',
          children: resolvedNode,
          rendered: 0,
          total: resolvedNode.length
        });
        context.next();
      }
    } else {
      // invalid component, but this does not throw on the client
      // so render empty comment node
      context.write("<!---->", context.next);
    }
  };

  if (factory.resolved) {
    resolve(factory.resolved);
    return
  }

  var reject = context.done;
  var res;
  try {
    res = factory(resolve, reject);
  } catch (e) {
    reject(e);
  }
  if (res) {
    if (typeof res.then === 'function') {
      res.then(resolve, reject).catch(reject);
    } else {
      // new syntax in 2.3
      var comp = res.component;
      if (comp && typeof comp.then === 'function') {
        comp.then(resolve, reject).catch(reject);
      }
    }
  }
}

function renderStringNode$1 (el, context) {
  var write = context.write;
  var next = context.next;
  if (isUndef(el.children) || el.children.length === 0) {
    write(el.open + (el.close || ''), next);
  } else {
    var children = el.children;
    context.renderStates.push({
      type: 'Element',
      children: children,
      rendered: 0,
      total: children.length,
      endTag: el.close
    });
    write(el.open, next);
  }
}

function renderElement (el, isRoot, context) {
  var write = context.write;
  var next = context.next;

  if (isTrue(isRoot)) {
    if (!el.data) { el.data = {}; }
    if (!el.data.attrs) { el.data.attrs = {}; }
    el.data.attrs[SSR_ATTR] = 'true';
  }

  if (el.fnOptions) {
    registerComponentForCache(el.fnOptions, write);
  }

  var startTag = renderStartingTag(el, context);
  var endTag = "</" + (el.tag) + ">";
  if (context.isUnaryTag(el.tag)) {
    write(startTag, next);
  } else if (isUndef(el.children) || el.children.length === 0) {
    write(startTag + endTag, next);
  } else {
    var children = el.children;
    context.renderStates.push({
      type: 'Element',
      children: children,
      rendered: 0,
      total: children.length,
      endTag: endTag
    });
    write(startTag, next);
  }
}

function hasAncestorData (node) {
  var parentNode = node.parent;
  return isDef(parentNode) && (isDef(parentNode.data) || hasAncestorData(parentNode))
}

function getVShowDirectiveInfo (node) {
  var dir;
  var tmp;

  while (isDef(node)) {
    if (node.data && node.data.directives) {
      tmp = node.data.directives.find(function (dir) { return dir.name === 'show'; });
      if (tmp) {
        dir = tmp;
      }
    }
    node = node.parent;
  }
  return dir
}

function renderStartingTag (node, context) {
  var markup = "<" + (node.tag);
  var directives = context.directives;
  var modules = context.modules;

  // construct synthetic data for module processing
  // because modules like style also produce code by parent VNode data
  if (isUndef(node.data) && hasAncestorData(node)) {
    node.data = {};
  }
  if (isDef(node.data)) {
    // check directives
    var dirs = node.data.directives;
    if (dirs) {
      for (var i = 0; i < dirs.length; i++) {
        var name = dirs[i].name;
        if (name !== 'show') {
          var dirRenderer = resolveAsset(context, 'directives', name);
          if (dirRenderer) {
            // directives mutate the node's data
            // which then gets rendered by modules
            dirRenderer(node, dirs[i]);
          }
        }
      }
    }

    // v-show directive needs to be merged from parent to child
    var vshowDirectiveInfo = getVShowDirectiveInfo(node);
    if (vshowDirectiveInfo) {
      directives.show(node, vshowDirectiveInfo);
    }

    // apply other modules
    for (var i$1 = 0; i$1 < modules.length; i$1++) {
      var res = modules[i$1](node);
      if (res) {
        markup += res;
      }
    }
  }
  // attach scoped CSS ID
  var scopeId;
  var activeInstance = context.activeInstance;
  if (isDef(activeInstance) &&
    activeInstance !== node.context &&
    isDef(scopeId = activeInstance.$options._scopeId)
  ) {
    markup += " " + ((scopeId));
  }
  if (isDef(node.fnScopeId)) {
    markup += " " + (node.fnScopeId);
  } else {
    while (isDef(node)) {
      if (isDef(scopeId = node.context.$options._scopeId)) {
        markup += " " + scopeId;
      }
      node = node.parent;
    }
  }
  return markup + '>'
}

function createRenderFunction (
  modules,
  directives,
  isUnaryTag,
  cache
) {
  return function render (
    component,
    write,
    userContext,
    done
  ) {
    warned = Object.create(null);
    var context = new RenderContext({
      activeInstance: component,
      userContext: userContext,
      write: write, done: done, renderNode: renderNode,
      isUnaryTag: isUnaryTag, modules: modules, directives: directives,
      cache: cache
    });
    installSSRHelpers(component);
    normalizeRender(component);

    var resolve = function () {
      renderNode(component._render(), true, context);
    };
    waitForServerPrefetch(component, resolve, done);
  }
}

/*  */

var isJS = function (file) { return /\.js(\?[^.]+)?$/.test(file); };

var isCSS = function (file) { return /\.css(\?[^.]+)?$/.test(file); };

function createPromiseCallback () {
  var resolve, reject;
  var promise = new Promise(function (_resolve, _reject) {
    resolve = _resolve;
    reject = _reject;
  });
  var cb = function (err, res) {
    if (err) { return reject(err) }
    resolve(res || '');
  };
  return { promise: promise, cb: cb }
}

/*  */

var Transform = require('stream').Transform;



var TemplateStream = /*@__PURE__*/(function (Transform) {
  function TemplateStream (
    renderer,
    template,
    context
  ) {
    Transform.call(this);
    this.started = false;
    this.renderer = renderer;
    this.template = template;
    this.context = context || {};
    this.inject = renderer.inject;
  }

  if ( Transform ) TemplateStream.__proto__ = Transform;
  TemplateStream.prototype = Object.create( Transform && Transform.prototype );
  TemplateStream.prototype.constructor = TemplateStream;

  TemplateStream.prototype._transform = function _transform (data, encoding, done) {
    if (!this.started) {
      this.emit('beforeStart');
      this.start();
    }
    this.push(data);
    done();
  };

  TemplateStream.prototype.start = function start () {
    this.started = true;
    this.push(this.template.head(this.context));

    if (this.inject) {
      // inline server-rendered head meta information
      if (this.context.head) {
        this.push(this.context.head);
      }

      // inline preload/prefetch directives for initial/async chunks
      var links = this.renderer.renderResourceHints(this.context);
      if (links) {
        this.push(links);
      }

      // CSS files and inline server-rendered CSS collected by vue-style-loader
      var styles = this.renderer.renderStyles(this.context);
      if (styles) {
        this.push(styles);
      }
    }

    this.push(this.template.neck(this.context));
  };

  TemplateStream.prototype._flush = function _flush (done) {
    this.emit('beforeEnd');

    if (this.inject) {
      // inline initial store state
      var state = this.renderer.renderState(this.context);
      if (state) {
        this.push(state);
      }

      // embed scripts needed
      var scripts = this.renderer.renderScripts(this.context);
      if (scripts) {
        this.push(scripts);
      }
    }

    this.push(this.template.tail(this.context));
    done();
  };

  return TemplateStream;
}(Transform));

/*  */

var compile = require('lodash.template');
var compileOptions = {
  escape: /{{([^{][\s\S]+?[^}])}}/g,
  interpolate: /{{{([\s\S]+?)}}}/g
};



function parseTemplate (
  template,
  contentPlaceholder
) {
  if ( contentPlaceholder === void 0 ) contentPlaceholder = '<!--vue-ssr-outlet-->';

  if (typeof template === 'object') {
    return template
  }

  var i = template.indexOf('</head>');
  var j = template.indexOf(contentPlaceholder);

  if (j < 0) {
    throw new Error("Content placeholder not found in template.")
  }

  if (i < 0) {
    i = template.indexOf('<body>');
    if (i < 0) {
      i = j;
    }
  }

  return {
    head: compile(template.slice(0, i), compileOptions),
    neck: compile(template.slice(i, j), compileOptions),
    tail: compile(template.slice(j + contentPlaceholder.length), compileOptions)
  }
}

/*  */

/**
 * Creates a mapper that maps components used during a server-side render
 * to async chunk files in the client-side build, so that we can inline them
 * directly in the rendered HTML to avoid waterfall requests.
 */





function createMapper (
  clientManifest
) {
  var map = createMap(clientManifest);
  // map server-side moduleIds to client-side files
  return function mapper (moduleIds) {
    var res = new Set();
    for (var i = 0; i < moduleIds.length; i++) {
      var mapped = map.get(moduleIds[i]);
      if (mapped) {
        for (var j = 0; j < mapped.length; j++) {
          res.add(mapped[j]);
        }
      }
    }
    return Array.from(res)
  }
}

function createMap (clientManifest) {
  var map = new Map();
  Object.keys(clientManifest.modules).forEach(function (id) {
    map.set(id, mapIdToFile(id, clientManifest));
  });
  return map
}

function mapIdToFile (id, clientManifest) {
  var files = [];
  var fileIndices = clientManifest.modules[id];
  if (fileIndices) {
    fileIndices.forEach(function (index) {
      var file = clientManifest.all[index];
      // only include async files or non-js, non-css assets
      if (clientManifest.async.indexOf(file) > -1 || !(/\.(js|css)($|\?)/.test(file))) {
        files.push(file);
      }
    });
  }
  return files
}

/*  */

var path = require('path');
var serialize = require('serialize-javascript');









var TemplateRenderer = function TemplateRenderer (options) {
  this.options = options;
  this.inject = options.inject !== false;
  // if no template option is provided, the renderer is created
  // as a utility object for rendering assets like preload links and scripts.
    
  var template = options.template;
  this.parsedTemplate = template
    ? typeof template === 'string'
      ? parseTemplate(template)
      : template
    : null;

  // function used to serialize initial state JSON
  this.serialize = options.serializer || (function (state) {
    return serialize(state, { isJSON: true })
  });

  // extra functionality with client manifest
  if (options.clientManifest) {
    var clientManifest = this.clientManifest = options.clientManifest;
    // ensure publicPath ends with /
    this.publicPath = clientManifest.publicPath === ''
      ? ''
      : clientManifest.publicPath.replace(/([^\/])$/, '$1/');
    // preload/prefetch directives
    this.preloadFiles = (clientManifest.initial || []).map(normalizeFile);
    this.prefetchFiles = (clientManifest.async || []).map(normalizeFile);
    // initial async chunk mapping
    this.mapFiles = createMapper(clientManifest);
  }
};

TemplateRenderer.prototype.bindRenderFns = function bindRenderFns (context) {
  var renderer = this
  ;['ResourceHints', 'State', 'Scripts', 'Styles'].forEach(function (type) {
    context[("render" + type)] = renderer[("render" + type)].bind(renderer, context);
  });
  // also expose getPreloadFiles, useful for HTTP/2 push
  context.getPreloadFiles = renderer.getPreloadFiles.bind(renderer, context);
};

// render synchronously given rendered app content and render context
TemplateRenderer.prototype.render = function render (content, context) {
  var template = this.parsedTemplate;
  if (!template) {
    throw new Error('render cannot be called without a template.')
  }
  context = context || {};

  if (typeof template === 'function') {
    return template(content, context)
  }

  if (this.inject) {
    return (
      template.head(context) +
      (context.head || '') +
      this.renderResourceHints(context) +
      this.renderStyles(context) +
      template.neck(context) +
      content +
      this.renderState(context) +
      this.renderScripts(context) +
      template.tail(context)
    )
  } else {
    return (
      template.head(context) +
      template.neck(context) +
      content +
      template.tail(context)
    )
  }
};

TemplateRenderer.prototype.renderStyles = function renderStyles (context) {
    var this$1 = this;

  var initial = this.preloadFiles || [];
  var async = this.getUsedAsyncFiles(context) || [];
  var cssFiles = initial.concat(async).filter(function (ref) {
      var file = ref.file;

      return isCSS(file);
    });
  return (
    // render links for css files
    (cssFiles.length
      ? cssFiles.map(function (ref) {
          var file = ref.file;

          return ("<link rel=\"stylesheet\" href=\"" + (this$1.publicPath) + file + "\">");
    }).join('')
      : '') +
    // context.styles is a getter exposed by vue-style-loader which contains
    // the inline component styles collected during SSR
    (context.styles || '')
  )
};

TemplateRenderer.prototype.renderResourceHints = function renderResourceHints (context) {
  return this.renderPreloadLinks(context) + this.renderPrefetchLinks(context)
};

TemplateRenderer.prototype.getPreloadFiles = function getPreloadFiles (context) {
  var usedAsyncFiles = this.getUsedAsyncFiles(context);
  if (this.preloadFiles || usedAsyncFiles) {
    return (this.preloadFiles || []).concat(usedAsyncFiles || [])
  } else {
    return []
  }
};

TemplateRenderer.prototype.renderPreloadLinks = function renderPreloadLinks (context) {
    var this$1 = this;

  var files = this.getPreloadFiles(context);
  var shouldPreload = this.options.shouldPreload;
  if (files.length) {
    return files.map(function (ref) {
        var file = ref.file;
        var extension = ref.extension;
        var fileWithoutQuery = ref.fileWithoutQuery;
        var asType = ref.asType;

      var extra = '';
      // by default, we only preload scripts or css
      if (!shouldPreload && asType !== 'script' && asType !== 'style') {
        return ''
      }
      // user wants to explicitly control what to preload
      if (shouldPreload && !shouldPreload(fileWithoutQuery, asType)) {
        return ''
      }
      if (asType === 'font') {
        extra = " type=\"font/" + extension + "\" crossorigin";
      }
      return ("<link rel=\"preload\" href=\"" + (this$1.publicPath) + file + "\"" + (asType !== '' ? (" as=\"" + asType + "\"") : '') + extra + ">")
    }).join('')
  } else {
    return ''
  }
};

TemplateRenderer.prototype.renderPrefetchLinks = function renderPrefetchLinks (context) {
    var this$1 = this;

  var shouldPrefetch = this.options.shouldPrefetch;
  if (this.prefetchFiles) {
    var usedAsyncFiles = this.getUsedAsyncFiles(context);
    var alreadyRendered = function (file) {
      return usedAsyncFiles && usedAsyncFiles.some(function (f) { return f.file === file; })
    };
    return this.prefetchFiles.map(function (ref) {
        var file = ref.file;
        var fileWithoutQuery = ref.fileWithoutQuery;
        var asType = ref.asType;

      if (shouldPrefetch && !shouldPrefetch(fileWithoutQuery, asType)) {
        return ''
      }
      if (alreadyRendered(file)) {
        return ''
      }
      return ("<link rel=\"prefetch\" href=\"" + (this$1.publicPath) + file + "\">")
    }).join('')
  } else {
    return ''
  }
};

TemplateRenderer.prototype.renderState = function renderState (context, options) {
  var ref = options || {};
    var contextKey = ref.contextKey; if ( contextKey === void 0 ) contextKey = 'state';
    var windowKey = ref.windowKey; if ( windowKey === void 0 ) windowKey = '__INITIAL_STATE__';
  var state = this.serialize(context[contextKey]);
  var autoRemove =  '';
  var nonceAttr = context.nonce ? (" nonce=\"" + (context.nonce) + "\"") : '';
  return context[contextKey]
    ? ("<script" + nonceAttr + ">window." + windowKey + "=" + state + autoRemove + "</script>")
    : ''
};

TemplateRenderer.prototype.renderScripts = function renderScripts (context) {
    var this$1 = this;

  if (this.clientManifest) {
    var initial = this.preloadFiles.filter(function (ref) {
        var file = ref.file;

        return isJS(file);
      });
    var async = (this.getUsedAsyncFiles(context) || []).filter(function (ref) {
        var file = ref.file;

        return isJS(file);
      });
    var needed = [initial[0]].concat(async, initial.slice(1));
    return needed.map(function (ref) {
        var file = ref.file;

      return ("<script src=\"" + (this$1.publicPath) + file + "\" defer></script>")
    }).join('')
  } else {
    return ''
  }
};

TemplateRenderer.prototype.getUsedAsyncFiles = function getUsedAsyncFiles (context) {
  if (!context._mappedFiles && context._registeredComponents && this.mapFiles) {
    var registered = Array.from(context._registeredComponents);
    context._mappedFiles = this.mapFiles(registered).map(normalizeFile);
  }
  return context._mappedFiles
};

// create a transform stream
TemplateRenderer.prototype.createStream = function createStream (context) {
  if (!this.parsedTemplate) {
    throw new Error('createStream cannot be called without a template.')
  }
  return new TemplateStream(this, this.parsedTemplate, context || {})
};

function normalizeFile (file) {
  var withoutQuery = file.replace(/\?.*/, '');
  var extension = path.extname(withoutQuery).slice(1);
  return {
    file: file,
    extension: extension,
    fileWithoutQuery: withoutQuery,
    asType: getPreloadType(extension)
  }
}

function getPreloadType (ext) {
  if (ext === 'js') {
    return 'script'
  } else if (ext === 'css') {
    return 'style'
  } else if (/jpe?g|png|svg|gif|webp|ico/.test(ext)) {
    return 'image'
  } else if (/woff2?|ttf|otf|eot/.test(ext)) {
    return 'font'
  } else {
    // not exhausting all possibilities here, but above covers common cases
    return ''
  }
}

/*  */








function createRenderer (ref) {
  if ( ref === void 0 ) ref = {};
  var modules = ref.modules; if ( modules === void 0 ) modules = [];
  var directives = ref.directives; if ( directives === void 0 ) directives = {};
  var isUnaryTag = ref.isUnaryTag; if ( isUnaryTag === void 0 ) isUnaryTag = (function () { return false; });
  var template = ref.template;
  var inject = ref.inject;
  var cache = ref.cache;
  var shouldPreload = ref.shouldPreload;
  var shouldPrefetch = ref.shouldPrefetch;
  var clientManifest = ref.clientManifest;
  var serializer = ref.serializer;

  var render = createRenderFunction(modules, directives, isUnaryTag, cache);
  var templateRenderer = new TemplateRenderer({
    template: template,
    inject: inject,
    shouldPreload: shouldPreload,
    shouldPrefetch: shouldPrefetch,
    clientManifest: clientManifest,
    serializer: serializer
  });

  return {
    renderToString: function renderToString (
      component,
      context,
      cb
    ) {
      var assign;

      if (typeof context === 'function') {
        cb = context;
        context = {};
      }
      if (context) {
        templateRenderer.bindRenderFns(context);
      }

      // no callback, return Promise
      var promise;
      if (!cb) {
        ((assign = createPromiseCallback(), promise = assign.promise, cb = assign.cb));
      }

      var result = '';
      var write = createWriteFunction(function (text) {
        result += text;
        return false
      }, cb);
      try {
        render(component, write, context, function (err) {
          if (err) {
            return cb(err)
          }
          if (context && context.rendered) {
            context.rendered(context);
          }
          if (template) {
            try {
              var res = templateRenderer.render(result, context);
              if (typeof res !== 'string') {
                // function template returning promise
                res
                  .then(function (html) { return cb(null, html); })
                  .catch(cb);
              } else {
                cb(null, res);
              }
            } catch (e) {
              cb(e);
            }
          } else {
            cb(null, result);
          }
        });
      } catch (e) {
        cb(e);
      }

      return promise
    },

    renderToStream: function renderToStream (
      component,
      context
    ) {
      if (context) {
        templateRenderer.bindRenderFns(context);
      }
      var renderStream = new RenderStream(function (write, done) {
        render(component, write, context, done);
      });
      if (!template) {
        if (context && context.rendered) {
          var rendered = context.rendered;
          renderStream.once('beforeEnd', function () {
            rendered(context);
          });
        }
        return renderStream
      } else if (typeof template === 'function') {
        throw new Error("function template is only supported in renderToString.")
      } else {
        var templateStream = templateRenderer.createStream(context);
        renderStream.on('error', function (err) {
          templateStream.emit('error', err);
        });
        renderStream.pipe(templateStream);
        if (context && context.rendered) {
          var rendered$1 = context.rendered;
          renderStream.once('beforeEnd', function () {
            rendered$1(context);
          });
        }
        return templateStream
      }
    }
  }
}

var vm = require('vm');
var path$1 = require('path');
var resolve = require('resolve');
var NativeModule = require('module');

function createSandbox (context) {
  var sandbox = {
    Buffer: Buffer,
    console: console,
    process: process,
    setTimeout: setTimeout,
    setInterval: setInterval,
    setImmediate: setImmediate,
    clearTimeout: clearTimeout,
    clearInterval: clearInterval,
    clearImmediate: clearImmediate,
    __VUE_SSR_CONTEXT__: context
  };
  sandbox.global = sandbox;
  return sandbox
}

function compileModule (files, basedir, runInNewContext) {
  var compiledScripts = {};
  var resolvedModules = {};

  function getCompiledScript (filename) {
    if (compiledScripts[filename]) {
      return compiledScripts[filename]
    }
    var code = files[filename];
    var wrapper = NativeModule.wrap(code);
    var script = new vm.Script(wrapper, {
      filename: filename,
      displayErrors: true
    });
    compiledScripts[filename] = script;
    return script
  }

  function evaluateModule (filename, sandbox, evaluatedFiles) {
    if ( evaluatedFiles === void 0 ) evaluatedFiles = {};

    if (evaluatedFiles[filename]) {
      return evaluatedFiles[filename]
    }

    var script = getCompiledScript(filename);
    var compiledWrapper = runInNewContext === false
      ? script.runInThisContext()
      : script.runInNewContext(sandbox);
    var m = { exports: {}};
    var r = function (file) {
      file = path$1.posix.join('.', file);
      if (files[file]) {
        return evaluateModule(file, sandbox, evaluatedFiles)
      } else if (basedir) {
        return require(
          resolvedModules[file] ||
          (resolvedModules[file] = resolve.sync(file, { basedir: basedir }))
        )
      } else {
        return require(file)
      }
    };
    compiledWrapper.call(m.exports, m.exports, r, m);

    var res = Object.prototype.hasOwnProperty.call(m.exports, 'default')
      ? m.exports.default
      : m.exports;
    evaluatedFiles[filename] = res;
    return res
  }
  return evaluateModule
}

function deepClone (val) {
  if (isPlainObject(val)) {
    var res = {};
    for (var key in val) {
      res[key] = deepClone(val[key]);
    }
    return res
  } else if (Array.isArray(val)) {
    return val.slice()
  } else {
    return val
  }
}

function createBundleRunner (entry, files, basedir, runInNewContext) {
  var evaluate = compileModule(files, basedir, runInNewContext);
  if (runInNewContext !== false && runInNewContext !== 'once') {
    // new context mode: creates a fresh context and re-evaluate the bundle
    // on each render. Ensures entire application state is fresh for each
    // render, but incurs extra evaluation cost.
    return function (userContext) {
      if ( userContext === void 0 ) userContext = {};

      return new Promise(function (resolve) {
      userContext._registeredComponents = new Set();
      var res = evaluate(entry, createSandbox(userContext));
      resolve(typeof res === 'function' ? res(userContext) : res);
    });
    }
  } else {
    // direct mode: instead of re-evaluating the whole bundle on
    // each render, it simply calls the exported function. This avoids the
    // module evaluation costs but requires the source code to be structured
    // slightly differently.
    var runner; // lazy creation so that errors can be caught by user
    var initialContext;
    return function (userContext) {
      if ( userContext === void 0 ) userContext = {};

      return new Promise(function (resolve) {
      if (!runner) {
        var sandbox = runInNewContext === 'once'
          ? createSandbox()
          : global;
        // the initial context is only used for collecting possible non-component
        // styles injected by vue-style-loader.
        initialContext = sandbox.__VUE_SSR_CONTEXT__ = {};
        runner = evaluate(entry, sandbox);
        // On subsequent renders, __VUE_SSR_CONTEXT__ will not be available
        // to prevent cross-request pollution.
        delete sandbox.__VUE_SSR_CONTEXT__;
        if (typeof runner !== 'function') {
          throw new Error(
            'bundle export should be a function when using ' +
            '{ runInNewContext: false }.'
          )
        }
      }
      userContext._registeredComponents = new Set();

      // vue-style-loader styles imported outside of component lifecycle hooks
      if (initialContext._styles) {
        userContext._styles = deepClone(initialContext._styles);
        // #6353 ensure "styles" is exposed even if no styles are injected
        // in component lifecycles.
        // the renderStyles fn is exposed by vue-style-loader >= 3.0.3
        var renderStyles = initialContext._renderStyles;
        if (renderStyles) {
          Object.defineProperty(userContext, 'styles', {
            enumerable: true,
            get: function get () {
              return renderStyles(userContext._styles)
            }
          });
        }
      }

      resolve(runner(userContext));
    });
    }
  }
}

/*  */

var SourceMapConsumer = require('source-map').SourceMapConsumer;

var filenameRE = /\(([^)]+\.js):(\d+):(\d+)\)$/;

function createSourceMapConsumers (rawMaps) {
  var maps = {};
  Object.keys(rawMaps).forEach(function (file) {
    maps[file] = new SourceMapConsumer(rawMaps[file]);
  });
  return maps
}

function rewriteErrorTrace (e, mapConsumers) {
  if (e && typeof e.stack === 'string') {
    e.stack = e.stack.split('\n').map(function (line) {
      return rewriteTraceLine(line, mapConsumers)
    }).join('\n');
  }
}

function rewriteTraceLine (trace, mapConsumers) {
  var m = trace.match(filenameRE);
  var map = m && mapConsumers[m[1]];
  if (m != null && map) {
    var originalPosition = map.originalPositionFor({
      line: Number(m[2]),
      column: Number(m[3])
    });
    if (originalPosition.source != null) {
      var source = originalPosition.source;
      var line = originalPosition.line;
      var column = originalPosition.column;
      var mappedPosition = "(" + (source.replace(/^webpack:\/\/\//, '')) + ":" + (String(line)) + ":" + (String(column)) + ")";
      return trace.replace(filenameRE, mappedPosition)
    } else {
      return trace
    }
  } else {
    return trace
  }
}

/*  */

var fs = require('fs');
var path$2 = require('path');
var PassThrough = require('stream').PassThrough;

var INVALID_MSG =
  'Invalid server-rendering bundle format. Should be a string ' +
  'or a bundle Object of type:\n\n' +
"{\n  entry: string;\n  files: { [filename: string]: string; };\n  maps: { [filename: string]: string; };\n}\n";

// The render bundle can either be a string (single bundled file)
// or a bundle manifest object generated by vue-ssr-webpack-plugin.


function createBundleRendererCreator (
  createRenderer
) {
  return function createBundleRenderer (
    bundle,
    rendererOptions
  ) {
    if ( rendererOptions === void 0 ) rendererOptions = {};

    var files, entry, maps;
    var basedir = rendererOptions.basedir;

    // load bundle if given filepath
    if (
      typeof bundle === 'string' &&
      /\.js(on)?$/.test(bundle) &&
      path$2.isAbsolute(bundle)
    ) {
      if (fs.existsSync(bundle)) {
        var isJSON = /\.json$/.test(bundle);
        basedir = basedir || path$2.dirname(bundle);
        bundle = fs.readFileSync(bundle, 'utf-8');
        if (isJSON) {
          try {
            bundle = JSON.parse(bundle);
          } catch (e) {
            throw new Error(("Invalid JSON bundle file: " + bundle))
          }
        }
      } else {
        throw new Error(("Cannot locate bundle file: " + bundle))
      }
    }

    if (typeof bundle === 'object') {
      entry = bundle.entry;
      files = bundle.files;
      basedir = basedir || bundle.basedir;
      maps = createSourceMapConsumers(bundle.maps);
      if (typeof entry !== 'string' || typeof files !== 'object') {
        throw new Error(INVALID_MSG)
      }
    } else if (typeof bundle === 'string') {
      entry = '__vue_ssr_bundle__';
      files = { '__vue_ssr_bundle__': bundle };
      maps = {};
    } else {
      throw new Error(INVALID_MSG)
    }

    var renderer = createRenderer(rendererOptions);

    var run = createBundleRunner(
      entry,
      files,
      basedir,
      rendererOptions.runInNewContext
    );

    return {
      renderToString: function (context, cb) {
        var assign;

        if (typeof context === 'function') {
          cb = context;
          context = {};
        }

        var promise;
        if (!cb) {
          ((assign = createPromiseCallback(), promise = assign.promise, cb = assign.cb));
        }

        run(context).catch(function (err) {
          rewriteErrorTrace(err, maps);
          cb(err);
        }).then(function (app) {
          if (app) {
            renderer.renderToString(app, context, function (err, res) {
              rewriteErrorTrace(err, maps);
              cb(err, res);
            });
          }
        });

        return promise
      },

      renderToStream: function (context) {
        var res = new PassThrough();
        run(context).catch(function (err) {
          rewriteErrorTrace(err, maps);
          // avoid emitting synchronously before user can
          // attach error listener
          process.nextTick(function () {
            res.emit('error', err);
          });
        }).then(function (app) {
          if (app) {
            var renderStream = renderer.renderToStream(app, context);

            renderStream.on('error', function (err) {
              rewriteErrorTrace(err, maps);
              res.emit('error', err);
            });

            // relay HTMLStream special events
            if (rendererOptions && rendererOptions.template) {
              renderStream.on('beforeStart', function () {
                res.emit('beforeStart');
              });
              renderStream.on('beforeEnd', function () {
                res.emit('beforeEnd');
              });
            }

            renderStream.pipe(res);
          }
        });

        return res
      }
    }
  }
}

/*  */

process.env.VUE_ENV = 'server';

function createRenderer$1 (options) {
  if ( options === void 0 ) options = {};

  return createRenderer(extend(extend({}, options), {
    isUnaryTag: isUnaryTag,
    canBeLeftOpenTag: canBeLeftOpenTag,
    modules: modules,
    // user can provide server-side implementations for custom directives
    // when creating the renderer.
    directives: extend(baseDirectives, options.directives)
  }))
}

var createBundleRenderer = createBundleRendererCreator(createRenderer$1);

exports.createBundleRenderer = createBundleRenderer;
exports.createRenderer = createRenderer$1;
