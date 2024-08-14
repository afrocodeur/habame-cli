
const AbstractEvent = function() {

    const $listeners = {};


    this.on = (name, callback) => {
        $listeners[name] = $listeners[name] || [];
        $listeners[name].push(callback);
    };

    this.emit = (name, arg) => {
        if(!$listeners[name]) {
            return;
        }
        $listeners[name].map((callback) => {
            callback.apply(callback, [arg]);
        });
    };

};

export default AbstractEvent;