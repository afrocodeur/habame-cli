import componentGenerator from "./generators/componentGenerator.js";
import serviceGenerator from "./generators/serviceGenerator.js";
import directiveGenerator from "./generators/directiveGenerator.js";

const GENERATORS = {
    component: componentGenerator,
    service: serviceGenerator,
    directive: directiveGenerator,
    model: null
};


const Generate = function($argv) {

    this.exec = function() {
        const values = $argv.values();
        const generatorName = values.shift();
        if(!GENERATORS[generatorName]) {
            throw new Error(`${generatorName} generator not found`);
        }
        const generator = GENERATORS[generatorName];
        const name = values.shift();

        generator(name, $argv);
        console.log('generate something', $argv);
    };

};

Generate.signature = '';
Generate.description = '';
Generate.help = '';

export default Generate;