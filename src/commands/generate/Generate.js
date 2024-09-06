import componentGenerator from "./generators/componentGenerator.js";
import serviceGenerator from "./generators/serviceGenerator.js";
import directiveGenerator from "./generators/directiveGenerator.js";
import Logger from "../../modules/Logger/Logger.js";
import moduleGenerator from "./generators/moduleGenerator.js";

const GENERATORS = {
    component: componentGenerator,
    service: serviceGenerator,
    directive: directiveGenerator,
    module: moduleGenerator,
    model: null
};


const Generate = function($argv) {

    this.exec = function() {
        const values = $argv.values();
        const generatorName = values.shift();
        if(!GENERATORS[generatorName]) {
            Logger.error(`${generatorName} generator not found`);
            return;
        }
        const generator = GENERATORS[generatorName];
        const name = values.shift();

        generator(name, $argv);
    };

};

Generate.signature = 'ng generate <component,service,directive> {destination}';
Generate.description = 'Generates and/or modifies files based on a schematic';
Generate.help = 'eg: hb generate component src/User';

export default Generate;