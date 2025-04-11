function _class_call_check(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _defineProperties(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
}
export var ObjectPool = /*#__PURE__*/ function() {
    "use strict";
    function ObjectPool(createFn) {
        var _this = this;
        var initialSize = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 50;
        _class_call_check(this, ObjectPool);
        this.createFn = createFn;
        this.pool = Array(initialSize).fill(null).map(function() {
            return {
                object: _this.createFn(),
                active: false
            };
        });
    }
    _create_class(ObjectPool, [
        {
            key: "get",
            value: function get() {
                var poolItem = this.pool.find(function(item) {
                    return !item.active;
                });
                if (!poolItem) {
                    poolItem = {
                        object: this.createFn(),
                        active: false
                    };
                    this.pool.push(poolItem);
                }
                poolItem.active = true;
                return poolItem.object;
            }
        },
        {
            key: "release",
            value: function release(object) {
                var poolItem = this.pool.find(function(item) {
                    return item.object === object;
                });
                if (poolItem) {
                    poolItem.active = false;
                }
            }
        },
        {
            key: "reset",
            value: function reset() {
                this.pool.forEach(function(item) {
                    item.active = false;
                });
            }
        }
    ]);
    return ObjectPool;
}();
