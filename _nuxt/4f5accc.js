(window.webpackJsonp=window.webpackJsonp||[]).push([[2],{230:function(e,t,r){var content=r(233);content.__esModule&&(content=content.default),"string"==typeof content&&(content=[[e.i,content,""]]),content.locals&&(e.exports=content.locals);(0,r(72).default)("fdeab8b0",content,!0,{sourceMap:!1})},232:function(e,t,r){"use strict";r(230)},233:function(e,t,r){var l=r(71)((function(i){return i[1]}));l.push([e.i,"/*purgecss start ignore*/\n.color-block[data-v-8efc40c2]{\n  display:inline-block;\n  width:20px;\n  height:20px\n}\n\n/*purgecss end ignore*/",""]),l.locals={},e.exports=l},236:function(e,t,r){"use strict";r.r(t);r(44),r(34),r(43),r(16),r(69),r(35),r(70);var l=r(26),n=r(101);function o(object,e){var t=Object.keys(object);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(object);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(object,e).enumerable}))),t.push.apply(t,r)}return t}var c={data:function(){return{colors:["blue","amber","red","green","white"]}},computed:function(e){for(var i=1;i<arguments.length;i++){var source=null!=arguments[i]?arguments[i]:{};i%2?o(Object(source),!0).forEach((function(t){Object(l.a)(e,t,source[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(source)):o(Object(source)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(source,t))}))}return e}({},Object(n.c)(["configuration.extras"]))},d=c,v=(r(232),r(45)),component=Object(v.a)(d,(function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("div",{staticClass:"flex flex-col justify-center h-full"},[e._m(0),e._v(" "),r("div",{staticClass:"p-3 overflow-x-auto"},[r("table",{staticClass:"table-auto w-full"},[e._m(1),e._v(" "),r("tbody",{staticClass:"text-sm divide-y divide-gray-100"},e._l(e.extras,(function(t){return r("tr",{key:t.id},[r("td",{staticClass:"font-bold"},[e._v("\n            Extra "+e._s(t.id)+"\n          ")]),e._v(" "),r("td",[r("label",{staticClass:"cb-label"},[r("input",{directives:[{name:"model",rawName:"v-model",value:t.enabled,expression:"extra.enabled"}],attrs:{type:"checkbox"},domProps:{checked:Array.isArray(t.enabled)?e._i(t.enabled,null)>-1:t.enabled},on:{change:function(r){var l=t.enabled,n=r.target,o=!!n.checked;if(Array.isArray(l)){var c=e._i(l,null);n.checked?c<0&&e.$set(t,"enabled",l.concat([null])):c>-1&&e.$set(t,"enabled",l.slice(0,c).concat(l.slice(c+1)))}else e.$set(t,"enabled",o)}}})])]),e._v(" "),r("td",[r("label",{staticClass:"cb-label"},[r("input",{directives:[{name:"model",rawName:"v-model",value:t.allowEnv,expression:"extra.allowEnv"}],attrs:{type:"checkbox"},domProps:{checked:Array.isArray(t.allowEnv)?e._i(t.allowEnv,null)>-1:t.allowEnv},on:{change:function(r){var l=t.allowEnv,n=r.target,o=!!n.checked;if(Array.isArray(l)){var c=e._i(l,null);n.checked?c<0&&e.$set(t,"allowEnv",l.concat([null])):c>-1&&e.$set(t,"allowEnv",l.slice(0,c).concat(l.slice(c+1)))}else e.$set(t,"allowEnv",o)}}})])]),e._v(" "),r("td",{staticClass:"flex items-center gap-4"},[r("div",{staticClass:"color-block",class:t.color}),e._v(" "),r("select",{directives:[{name:"model",rawName:"v-model",value:t.color,expression:"extra.color"}],attrs:{disabled:!t.allowEnv},on:{change:function(r){var l=Array.prototype.filter.call(r.target.options,(function(e){return e.selected})).map((function(e){return"_value"in e?e._value:e.value}));e.$set(t,"color",r.target.multiple?l:l[0])}}},[r("option",{domProps:{value:null}},[e._v("\n                Choose...\n              ")]),e._v(" "),e._l(e.colors,(function(t){return r("option",{key:t,domProps:{value:t}},[e._v("\n                "+e._s(t)+"\n              ")])}))],2)])])})),0)])])])}),[function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("header",{staticClass:"px-5 pt-3"},[r("h2",[e._v("Extras")])])},function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("thead",{staticClass:"text-xs font-semibold uppercase text-gray-400 bg-gray-50"},[r("tr",[r("th",[e._v("Extra")]),e._v(" "),r("th",[e._v("Is ELS controlled")]),e._v(" "),r("th",[e._v("Allow env light")]),e._v(" "),r("th",[e._v("Color")])])])}],!1,null,"8efc40c2",null);t.default=component.exports}}]);