class Watcher {

    constructor(vm, expr, cb) {
        this.vm = vm
        this.expr = expr
        this.cb = cb
        //先保存旧值
        this.oldVal = this.getOldVal()
    }
    getOldVal() {
        Dep.target = this
        const oldVal = compileUtil.getValue(this.expr, this.vm)
        Dep.target = null
        return oldVal
    }
    update(value, newvalue) {

        const newVal = compileUtil.getValue(this.expr, this.vm)
        if (newVal !== this.oldVal) {
            this.cb(newVal)
        }

    }
}
class Dep {

    constructor() {
        this.subs = []
    }
    //收集watcher
    addSub(watcher) {
        this.subs.push(watcher)
    }
    //通知观察者更新
    notify() {
        console.log('通知了观察者', this.subs)
        this.subs.forEach(w => w.update())
    }
}

class Observer {
    constructor(data) {
        this.observer(data)
    }
    observer(data) {

        // person: {
        //     name: 'Tien',
        //     age: '22'
        // },
        if (data && typeof data === 'object') {
            Object.keys(data).forEach(key => {
                this.defineReactive(data, key, data[key])
            })

        }
    }
    defineReactive(obj, key, value) {

        this.observer(value)
        const dep = new Dep()
        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,
            get() {
                //订阅数据变化时,往dep中添加观察者
                Dep.target && dep.addSub(Dep.target)
                return value
            },
            set: (newVal) => {
                this.observer(newVal)
                if (newVal !== value) {
                    value = newVal
                }
                // 告诉Dep通知变化
                dep.notify()
            }
        })
    }
}