function MyPromise(executor) {
    // 参数合法校验
    if (typeof executor !== "function") {
        throw new TypeError('MyPromise resolver' + executor + ' is not a function');
    }

    // 设置实例的初始属性
    var _this = this;
    this.PromiseStatus = "pending";
    this.PromiseValue = undefined;
    this.resolveFunc = Function.prototype;
    this.rejectFunc = function () { };

    // 修改实例的状态和value，只有当前状态为pending时才能修改
    function change(status, value) {
        if (_this.PromiseStatus !== "pending") return;
        _this.PromiseStatus = status;
        _this.PromiseValue = value;
        // 通知基于.then传入的某个方法执行（异步）
        var timer = setTimeout(function () {
            // 定时器模拟微任务
            clearTimeout(timer);
            timer = null;
            var status = _this.PromiseStatus;
            var value = _this.PromiseValue;
            status === "fulfilled" ? _this.resolveFunc.call(_this, value) :
                _this.rejectFunc.call(_this, value);
        }, 0);
    }

    // new 的时候会立即执行executor函数
    // 设定传递给executor并且执行可以修改实例状态以及value的 resolve/reject函数
    // executor函数出现错误也会把实例的状态改为失败，并且value是失败的原因
    try {
        executor(function resolve(value) {
            change('fulfilled', value);

        }, function reject(reason) {
            change('rejected', reason);

        });
    } catch (e) {
        change('rejected', e.message);
    }
}

MyPromise.prototype.then = function (resolveFunc, rejectFunc) {
    this.resolveFunc = resolveFunc;
    this.rejectFunc = rejectFunc;
};
MyPromise.prototype.catch = function () { };

MyPromise.resolve = function (value) {
    return new MyPromise(function (resolve) {
        resolve(value);
    });
};
MyPromise.reject = function () {
    return new MyPromise(function (reject) {
        reject(reason);
    });
};


var p1 = new MyPromise(function (resolve, reject) {
    resolve(10);
    reject(20);
});

p1.then(function (value) {
    console.log("OK", value);
}, function (reason) {
    console.log("NO", reason);
});

console.log(p1);