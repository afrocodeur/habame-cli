import Path from 'node:path';
import Fs from 'node:fs';

import Logger from "../../../modules/Logger/Logger.js";
import StringHelper from "../../../helpers/StringHelper.js";
import Template from "../../../helpers/Template.js";
import addToExistingModule from "./helper.js";

const updateExistingModule = function(elementToAddPath, fileContent) {

    if(!(new RegExp(elementToAddPath)).test(fileContent)) {
        return fileContent.replace(
            /\bmodules\b[\s]*:[\s]*\[/,
            "modules: [\n\t\t'"+ elementToAddPath +"',",
            fileContent
        );
    }
    return fileContent;
};

function moduleGenerator($name) {
    const filename = Path.basename($name);
    const filenameInKebabCase = StringHelper.kebabCase(filename);
    // const dirname = Path.resolve();
    const destinationDir = Path.resolve($name);

    const moduleFileName = `${filenameInKebabCase}.module.js`;

    if(!Fs.existsSync(destinationDir)) {
        Fs.mkdirSync(destinationDir, { recursive: true });
    }

    Logger.note([
        'dir : '+ destinationDir,
        'module : '+ moduleFileName,
    ]);

    Template.cloneFile('files/module.js.template', Path.resolve(destinationDir, moduleFileName));
    Logger.success(`${$name} module generated`);

    addToExistingModule(destinationDir, moduleFileName, updateExistingModule);
}

export default moduleGenerator;