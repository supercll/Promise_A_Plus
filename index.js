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

    // 不是function的时候直接用静态方法传递状态
    if (typeof resolveFunc !== "function") {
        resolveFunc = function (value) {
            return MyPromise.resolve(value);
        };
    }
    if (typeof rejectFunc !== "function") {
        rejectFunc = function (reason) {
            return MyPromise.reject(reason);
        };
    }

    var _this = this;
    return new MyPromise(function (resolve, reject) {
        // 返回的新实例的成功和失败
        // 由resolveFunc、rejectFunc执行是否报错来决定（或者返回值是否为新的promise实例）
        _this.resolveFunc = function (value) {
            // this 指向的是Promise实例
            // 包一层匿名函数是为了拿到resolveFunc或者resolveFunc的执行结果
            try {
                var x = resolveFunc(value);
                // 判断x是否为新的Promise实例，不是新实例就直接返回resolve(x)
                x instanceof MyPromise ? x.then(resolve, reject) : resolve(x);
            } catch (e) {
                // 执行失败就reject
                reject(e.message);
            }
        };
        _this.rejectFunc = function (reason) {
            try {
                var x = rejectFunc(reason);
                x instanceof MyPromise ? x.then(resolve, reject) : resolve(x);
            } catch (e) {
                reject(e.message);
            }
        };
    });
};
MyPromise.prototype.catch = function (rejectFunc) {
    return this.then(null, rejectFunc);
};

MyPromise.resolve = function (value) {
    return new MyPromise(function (resolve) {
        resolve(value);
    });
};
MyPromise.reject = function (reason) {
    return new MyPromise(function (resolve, reject) {
        reject(reason);
    });
};

MyPromise.all = function (promiseArr) {
    return new MyPromise(function (resolve, reject) {
        var index = 0;  // 记录成功的个数
        var values = [];    // 每一个成功的value
        for (var i = 0; i < promiseArr.length; i++) {
            // 利用闭包的方式保存循环的每一项索引

            (function (i) {
                var item = promiseArr[i];
                // 如果当前项不是Promise,直接算作成功
                !(item instanceof MyPromise) ? item = MyPromise.resolve(item) : null;
                item.then(function (value) {
                    index++;
                    values[i] = value;
                    if (index >= promiseArr.length) {
                        // 所有的实例都成功了
                        resolve(values);
                    }
                }).catch(function (reason) {
                    // 只要有一个失败，整体就是失败
                    reject(reason);
                });
            })(i);
        }
    });
};


function fn1() {
    return MyPromise.resolve(1);
}
function fn2() {
    return new MyPromise(function (resolve, reject) {
        setTimeout(() => {
            resolve(2);
        }, 1000);
    });
}
function fn3() {
    return new MyPromise(function (resolve, reject) {
        setTimeout(() => {
            resolve(3);
        }, 2000);
    });
}

MyPromise.all([fn1(), fn2(), fn3()])
    .then(function (values) {
        console.log("OK", values);
    })
    .catch(function (reason) {
        console.log("NO", reason);
    });