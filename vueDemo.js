// <div v-text='msg'>{{msg}}</div>
const compileUtil = {
    getValue(expr, vm) {
        // console.log(expr.split('.'))
        return expr.split('.').reduce((data, currentVal) => {
            // console.log(currentVal) 
            return data[currentVal]
        }, vm.$data)

    },
    //缺少对象类的赋值
    setValue(expr, vm, inputVal) {
        // console.log(expr.split('.'))
        return expr.split('.').reduce((data, currentVal) => {
            // console.log(currentVal) 
            data[currentVal] = inputVal
        }, vm.$data)

    },
    getContentVal(expr, vm) {
        return value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {

            return this.getValue(args[1], vm)
        })
    },
    text(node, expr, vm) { //expr:msg 
        // const value = vm.$data[expr]
        let value
        if (expr.indexOf('{{') !== -1) {
            value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {

                new Watcher(vm, args[1], (newVal => {
                    this.updater.textUpdater(node, this.getContentVal(expr, vm))
                }
                ))
                return this.getValue(args[1], vm)
            })
        } else {
            value = this.getValue(expr, vm)
        }
        this.updater.textUpdater(node, value)
    },
    html(node, expr, vm) {
        const value = this.getValue(expr, vm)
        new Watcher(vm, expr, (newVal => {
            this.updater.htmlUpdater(node, newVal)
        }
        ))
        this.updater.htmlUpdater(node, value)
    },
    model(node, expr, vm) {

        const value = this.getValue(expr, vm)
        //绑定更新函数 数据驱动视图
        new Watcher(vm, expr, (newVal => {
            this.updater.modelUpdater(node, newVal)
        }
        ))
        //视图=>数据=>视图
        node.addEventListener('input', (e) => {
            this.setValue(expr, vm, e.target.value)
        })
        this.updater.modelUpdater(node, value)
    },
    on(node, expr, vm, eventName) {
        let fn = vm.$options.methods && vm.$options.methods[expr]
        node.addEventListener(eventName, fn.bind(vm), false)
    },
    bind(node, expr, vm, attrName) {

        const value = this.getValue(expr, vm)

        this.updater.bindUpdater(node, attrName, value)
    },
    updater: {
        textUpdater(node, value) {
            node.textContent = value
        },
        htmlUpdater(node, value) {
            node.innerHTML = value
        },
        modelUpdater(node, value) {
            node.value = value
        },
        bindUpdater(node, attrName, value) {
            node.setAttribute(attrName, value)
        },
    }
}

class Compile {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el)
        // console.log(this.el)
        this.vm = vm
        //1. 获取文件对象，放入内存中，减少页面回流
        const fragment = this.node2Fragment(this.el)
        // console.log(fragment)
        // 2.编译模板
        this.compile(fragment)
        // 3.追加子元素到根元素
        this.el.appendChild(fragment)

    }
    compile(fragment) {
        //1.获取到每个子结点
        const childNodes = fragment.childNodes

        childNodes.forEach(child => {
            // console.log(child)
            if (this.isElementNode(child)) {
                //表示是元素节点
                //编译元素节点
                // console.log('元素节点', child)
                this.compileElement(child)
            } else {
                //文本节点
                // console.log('文本节点', child)
                this.compileTxt(child)
            }
            if (child.childNodes && childNodes.length) {
                this.compile(child)
            }
        })
    }
    compileElement(node) {
        // console.log(node)

        const attributes = node.attributes;
        [...attributes].forEach(attr => {

            // console.log(attr)
            const name = attr.name;
            const value = attr.value;
            // console.log(name)
            if (this.isDiretive(name)) {//是一个指令  v-html ,v-text  v-on:click
                const [, dirctive] = name.split('-') //  html text on:click
                const [dirname, eventName] = dirctive.split(':') // html text on

                compileUtil[dirname](node, value, this.vm, eventName)
                // 删除有指令的标签上的属性
                // node.removeAttribute('v-' + dirctive)
                node.removeAttribute(name)
            } else if (this.isEventName(name)) {//@
                let [, eventName] = name.split('@')
                compileUtil['on'](node, value, this.vm, eventName)
                // const eventName

            } else if (this.isBind(name)) {//@
                let [, eventName] = name.split(':')
                compileUtil['bind'](node, value, this.vm, eventName)
                // const eventName

            }
        })
    }
    compileTxt(node) {
        // console.log(node.textContent)
        const content = node.textContent
        if (/\{\{(.+?)\}\}/.test(content)) {
            // console.log(content)
            compileUtil['text'](node, content, this.vm)
        }
    } isBind(attrName) {

        return attrName.startsWith(':')
    }
    isEventName(attrName) {

        return attrName.startsWith('@')
    }
    isDiretive(attrName) {
        return attrName.startsWith('v-')
    }
    node2Fragment(el) {
        // 创建文档碎片
        const f = document.createDocumentFragment()
        let firstChild;
        while (firstChild = el.firstChild) {
            f.appendChild(firstChild)
        }
        return f
    }

    isElementNode(node) {
        return node.nodeType === 1
    }
}
class mvue {
    constructor(options) {
        this.$el = options.el
        this.$data = options.data
        this.$options = options
        if (this.$el) {
            //1. 实现一个数据的观察者

            new Observer(this.$data)


            //  2.实现一个数据的解析器
            new Compile(this.$el, this)
            this.proxyData(this.$data)
        }
    }
    proxyData(data) {
        for (const key in data) {
            Object.defineProperty(this, key, {
                get() {
                    return data[key]
                },
                set(newVal) {
                    data[key] = newVal
                }
            })
        }

    }
}



//vue 采用数据劫持 配合发布者订阅者模式的方式通过Object.definedProperty() 来劫持各个属性的setter和getter ,
// 在数据变动时，发布消息给以来收集器，去通知观察者，做出对应的回调函数，去更新视图

// Mvvm 作为绑定的入口，整合Observer，compile 和watcher 三者，
// 通过Observer来 监听model 数据变化，通过compile 来解析编译模板指令
// ，最终利用watcher搭起 observe compile之间的通信桥梁，达到数据变化=> 视图更新；试图变化变化=>数据model变更的双向绑定效果



