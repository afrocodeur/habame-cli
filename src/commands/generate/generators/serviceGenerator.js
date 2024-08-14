import Path from 'node:path';
import Fs from 'node:fs';
import Logger from "../../../modules/Logger/Logger.js";
import addToExistingModule from "./helper.js";

const generateJsFile = function(filePath, name) {
    const exportCode = [
        '\tname: "'+ name +'"',
        '\tservice: '+ name,
        '\toptions: { isUniqueInstance: true }',
    ].join(',\n');

    Fs.writeFileSync(filePath, `const ${name} = function(State) {\n\t\n};\nexport default {\n${exportCode}\n}`, { flag: 'a+' });
    Logger.success(`----> ${name}.service.hb.js`);
};


const updateExistingModule = function(elementToAddPath, fileContent) {

    if(!(new RegExp(elementToAddPath)).test(fileContent)) {
        return fileContent.replace(
            /\bservices\b[\s]*:[\s]*\[/,
            "services: [\n\t\t'"+ elementToAddPath +"',\n\t\t",
            fileContent
        );
    }
    return fileContent;
};

const ServiceGenerator = function($name, $argv) {
    const serviceDir = Path.resolve(Path.dirname($name));

    console.log(`Generate ${$name} service source`);
    console.log(`----> Service ${$name}.hb.js`);

    const filename = Path.basename($name);
    const filePathAndBasename = Path.resolve($name);

    generateJsFile(filePathAndBasename + '.service.hb.js', filename);
    addToExistingModule(serviceDir, filename+ '.service.hb.js', updateExistingModule);


};

export default ServiceGenerator;