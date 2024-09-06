import Colors from "./Colors.js";


const TAG_SPACE_COUNT = 7;


const format = function(message) {
    if(Array.isArray(message)) {
        message = message.join('\n'+''.padEnd(TAG_SPACE_COUNT + 3));
    }
    return message;
};

const Logger =  {
    log: console.log,
    json: console.log,
    format: format,
    tag: (tag, color) => {
        return `${color + Colors.FgWhite} ${tag.padEnd(TAG_SPACE_COUNT)} ${Colors.Reset}`;
    },
    note: (message) => {
        console.log(`${Logger.tag('NOTE', Colors.BgGray)} ${Colors.FgGray}${format(message)}${Colors.Reset}`);
    },
    info: (message) => {
        console.log(`${Logger.tag('INFO', Colors.BgBlue)} ${Colors.FgBlue}${format(message)}${Colors.Reset}`);
    },
    success: (message) => {
        console.log(`${Logger.tag('SUCCESS', Colors.BgGreen)} ${Colors.FgGreen}${format(message)}${Colors.Reset}`);
    },
    error: (message) => {
        console.log(`${Logger.tag('ERROR', Colors.BgRed)} ${Colors.FgRed}${format(message)}${Colors.Reset}`);
    },
    alert: (message) => {
        console.log(`${Logger.tag('ALERT', Colors.BgRed)} ${Colors.FgRed}${format(message)}${Colors.Reset}`);
    },
    warning: (message) => {
        console.log(`${Logger.tag('WARN', Colors.BgYellow)} ${Colors.FgYellow}${format(message)}${Colors.Reset}`);
    },
    title: console.log,
};

export default Logger;

export const LoggerTitle = {
    BIG: 1
};