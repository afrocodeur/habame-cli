import CommandArgValues from "./CommandArgValues.js";
import { CommandList } from "./CommandList.js";
import Logger, { LoggerTitle } from "../modules/Logger/Logger.js";


const CommandHandler = function() {

    this.exec = () => {
        const [,, ...args] = process.argv;

        if(args.length === 0) {
            this.showHelp();
            return;
        }

        const commandName = args.shift();
        const Command = CommandList[commandName];
        if(!Command) {
            this.commandNotFound(commandName);
            return;
        }
        const commandArgValues = new CommandArgValues();
        commandArgValues.load(args);

        const command = new Command(commandArgValues);
        if(commandArgValues.option('help')) {
            return this.showCommandHelp(Command);
        }

        command.exec();
    };

    this.commandNotFound = function(name) {
        Logger.error('Command ' +name+ ' not found');
    };

    this.showCommandHelp = (command) => {
        Logger.info(command.signature);
        Logger.log(command.description);
    };

    this.showHelp = () => {
        Logger.title('Habame CLI V0.0.1', LoggerTitle.BIG);

        Logger.info('commands');

        for (const name in CommandList) {
            const command = CommandList[name];

            console.log(name.padEnd(30) + command.description);
        }
    };

};

export default CommandHandler;