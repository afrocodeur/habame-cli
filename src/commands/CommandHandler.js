import StartCommand from "./start/StartCommand.js";
import CommandArgValues from "./CommandArgValues.js";
import GenerateCommand from "./generate/GenerateCommand.js";


const COMMANDS = {
    start: StartCommand,
    generate: GenerateCommand,
    s: StartCommand
};

const CommandHandler = function() {

    this.exec = () => {
        const [,, ...args] = process.argv;

        if(args.length === 0) {
            this.showHelp();
            return;
        }

        const commandName = args.shift();
        const Command = COMMANDS[commandName];
        if(!Command) {
            this.commandNotFound(commandName);
            return;
        }
        const commandArgValues = new CommandArgValues();
        commandArgValues.load(args);

        const command = new Command(commandArgValues);
        command.exec();
    };

    this.commandNotFound = function(name) {
        console.log('Command ' +name+ ' not found');
    };

    this.showHelp = () => {
        console.log('Affichage de l aide');
    };

};

export default CommandHandler;