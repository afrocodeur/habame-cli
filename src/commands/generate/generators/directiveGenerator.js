import Path from 'node:path';
import Fs from 'node:fs';
import Logger from "../../../modules/Logger/Logger.js";
import Template from "../../../helpers/Template.js";
import addToExistingModule from "./helper.js";

const generateJsFile = function(filePath, name) {
    Template.cloneFile('files/directive.js.template', filePath, {
        directiveName: name
    });
    Logger.success(`Create ${name}.directive.hb.js file`);
};


const updateExistingModule = function(elementToAddPath, fileContent) {

    if(!(new RegExp(elementToAddPath)).test(fileContent)) {
        const regex = /\bdirectives\b[\s]*:[\s]*\[/;
        if(!regex.test(fileContent)) {
            return fileContent.replace(
                /\bexport[\s]+default[\s]+\{/,
                "export default {\n\tdirectives: [\n\t\t'"+ elementToAddPath +"',\n\t],",
                fileContent
            );
        }
        return fileContent.replace(regex,
            "directives: [\n\t\t'"+ elementToAddPath +"',",
            fileContent
        );
    }
    return fileContent;
};



const DirectiveGenerator = function($name, $argv) {
    const directiveDir = Path.resolve(Path.dirname($name));

    const filename = Path.basename($name);
    const filePathAndBasename = Path.resolve($name);

    generateJsFile(filePathAndBasename + '.directive.hb.js', filename);
    addToExistingModule(directiveDir, filename+ '.directive.hb.js', updateExistingModule);
};

export default DirectiveGenerator;