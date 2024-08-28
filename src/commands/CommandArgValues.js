import Logger from "../modules/Logger/Logger.js";


const CommandArgValues = function() {

    let $data = [];

    const data = {
        options: {},
        params: {}
    };

    this.load = function(params) {
        $data = params;
        for(const param of params) {
            const [name, value] = param.split('=');
            if(/^--/.test(name)) {
                const optionName = name.replace(/^--/, '');
                data.options[optionName] = value ?? true;
                continue;
            }
            data.params[name] = value ?? true;
        }
    };

    this.option = function(name, defaultValue) {
        if(data.options[name] !== undefined) {
            return data.options[name];
        }
        return defaultValue ?? null;
    };

    this.param = function(name, defaultValue) {
        if(data.params[name] !== undefined) {
            return data.params[name];
        }
        return defaultValue;
    };

    this.values = function() {
        return $data;
    };

    this.paramAt = function(index) {
        return $data[index] ?? null;
    };

};

export default CommandArgValues;