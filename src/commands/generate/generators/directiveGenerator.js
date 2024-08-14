import Path from 'node:path';
import Fs from 'node:fs';
import Logger from "../../../modules/Logger/Logger.js";
import addToExistingModule from "./helper.js";

const generateJsFile = function(filePath, name) {
    const exportCode = [
        '\tname: "'+ name +'"',
        '\tdirective: '+ name,
        '\toptions: {}',
    ].join(',\n');

    Fs.writeFileSync(filePath, `const ${name} = function({ element, attribute, attrs }) {\n\tthis.created = function() {\n\t};\n};\nexport default {\n${exportCode}\n}`, { flag: 'a+' });
    Logger.success(`----> ${name}.directive.hb.js`);
};


const updateExistingModule = function(elementToAddPath, fileContent) {

    if(!(new RegExp(elementToAddPath)).test(fileContent)) {
        return fileContent.replace(
            /\bdirectives\b[\s]*:[\s]*\[/,
            "directives: [\n\t\t'"+ elementToAddPath +"',\n\t\t",
            fileContent
        );
    }
    return fileContent;
};



const DirectiveGenerator = function($name, $argv) {

    console.log(`Generate ${$name} directive source`);
    console.log(`----> Directive ${$name}.directive.hb.js`);
    const directiveDir = Path.resolve(Path.dirname($name));

    const filename = Path.basename($name);
    const filePathAndBasename = Path.resolve($name);

    generateJsFile(filePathAndBasename + '.directive.hb.js', filename);
    addToExistingModule(directiveDir, filename+ '.directive.hb.js', updateExistingModule);

};

export default DirectiveGenerator;