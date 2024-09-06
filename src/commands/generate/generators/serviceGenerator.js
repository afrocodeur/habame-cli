import Path from 'node:path';
import Fs from 'node:fs';
import Logger from "../../../modules/Logger/Logger.js";
import Template from "../../../helpers/Template.js";
import addToExistingModule from "./helper.js";

const generateJsFile = function(filePath, name) {
    Template.cloneFile('files/service.js.template', filePath, {
        serviceName: name
    });
    Logger.success(`Create ${name}.service.hb.js file`);
};


const updateExistingModule = function(elementToAddPath, fileContent) {

    if(!(new RegExp(elementToAddPath)).test(fileContent)) {
        const regex = /\bservices\b[\s]*:[\s]*\[/;
        if(!regex.test(fileContent)) {
            return fileContent.replace(
                /\bexport[\s]+default[\s]+\{/,
                "export default {\n\tservices: [\n\t\t'"+ elementToAddPath +"',\n\t],",
                fileContent
            );
        }
        return fileContent.replace(
            /\bservices\b[\s]*:[\s]*\[/,
            "services: [\n\t\t'"+ elementToAddPath +"',",
            fileContent
        );
    }
    return fileContent;
};

const ServiceGenerator = function($name, $argv) {
    const serviceDir = Path.resolve(Path.dirname($name));

    const filename = Path.basename($name);
    const filePathAndBasename = Path.resolve($name);

    generateJsFile(filePathAndBasename + '.service.hb.js', filename);
    addToExistingModule(serviceDir, filename+ '.service.hb.js', updateExistingModule);
};

export default ServiceGenerator;