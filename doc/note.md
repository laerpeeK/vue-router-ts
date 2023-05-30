1. pushState比直接修改window.location的优势
从某种程度来说，调用 pushState() 类似于 window.location = "#foo"，它们都会在当前的文档中创建和激活一个新的历史条目。但是 pushState() 有以下优势：
新 URL 可以是与当前 URL 同源的任何 URL。 相反，设置 window.location 仅当您仅修改hash时才使您保持在同一文档中。
改变页面的 URL 是可选的。相反，设置 window.location = "#foo"; 仅仅会在当前 hash 不是 #foo 情况下，创建一条新的历史条目。
你可以使用你的新历史条目关联任意数据。使用基于 hash 的方式，你需要将所有相关的数据编码为一个短字符串。
注意，pushState() 从未引起 hashchange 事件的触发，即使新 URL 与旧 URL 仅在 hash 上不同。

2. 守卫执行流程查看 history/base.ts中comfirmTransition的实现。
包括什么样的守卫执行顺序`queue`，守卫执行针对哪些匹配到的route`activated, updated, deactivated`如何实现该顺序`runQueue`，以及单个守卫执行的包装函数`iterator`, 
守卫中next的实现`iterator入参hook执行时的最后一个入参函数`。守卫中注意事项包括`守卫解析顺序`。以及不执行next的话会有什么问题(next有入参，无入参的情况)。