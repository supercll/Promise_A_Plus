function MyPromise(executor) {
    // executor必须是个函数
    if (typeof executor !== "function") {
        throw new TypeError('MyPromise resolver' + executor + ' is not a function');
    }

    // 实例初始化
    this.promiseStatus = "pending";
    this.promiseValue = undefined;
    // 将then中传递的resolve和reject方法设置为空函数，以便调用函数原型中的方法
    this.resolveFunc = function () { };
    this.rejectFunc = function () { };

    // change改变promise实例状态
    // 注意change函数的执行位置，this需要改变一下
    // 只要从pending状态改变之后，就不能再次变化了
    var _this = this;
    function change(status, value) {
        if (_this.promiseStatus !== 'pending') return;
        _this.promiseStatus = status;
        _this.promiseValue = value;
        // 异步调用then传入的方法，利用定时器来模拟微任务
        var timer = setTimeout(function () {
            clearTimeout(timer);
            timer = null;
            // 判断当前promise状态，执行对应then中传入的方法
            var status = _this.promiseStatus;
            var value = _this.promiseValue;
            status === "fulfilled" ?
                _this.resolveFunc(value) :
                _this.rejectFunc(value);

        }, 0);
    };

    // 执行executor函数
    try {
        // executor函数里传入了两个方法resolve与reject
        executor(function resolve(value) {
            // 封装一个函数change用于改变promise状态与value
            change("fulfilled", value);
        }, function reject(reason) {
            change("rejected", reason);
        });
    } catch (e) {
        // 如果函数执行失败就改变为rejected，value为失败的原因
        change("rejected", e.message);
    }

}

// then有两参数：rejectFunc，resolveFunc
MyPromise.prototype.then = function (resolveFunc, rejectFunc) {
    // 只传一个参数时的默认处理
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

    // 确定then的返回值，实现链式操作

    var _this = this;
    return new MyPromise(function (resolve, reject) {
        _this.resolveFunc = function (value) {
            try {
                var x = resolveFunc(value);
                // 返回的是个Promise对象就再调用一次then算出最终的Promise结果再返回，否则直接返回resolve(x)
                x instanceof MyPromise ? x.then(resolve, reject) : resolve(x);
            } catch (e) {
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

// 静态resolve与reject方法
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

var p = new MyPromise(function (resolve, reject) {
    // resolve("1");
    reject("2");
});
p.then(function (value) {
    console.log("OK", value);
}, function (reason) {
    console.log("NO", reason);
    return MyPromise.reject(3);
}).then(null, function (reason) {
    console.log("NO2", reason);
});

// console.log(MyPromise.resolve(3));
// console.log(MyPromise.reject(4));

console.log(p);