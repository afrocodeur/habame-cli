import Path from 'node:path';
import Fs from 'node:fs';
import Logger from "../../../modules/Logger/Logger.js";
import StringHelper from "../../../helpers/StringHelper.js";
import Template from "../../../helpers/Template.js";
import addToExistingModule from "./helper.js";


const generateHtmlFile = function(filePath, name) {
    Template.cloneFile('files/view.html.template', filePath, {
        componentName: name
    });
    Logger.success(`Create ${name}.template.html file`);
};
const generateCssFile = function(filePath, name) {
    Template.cloneFile('files/style.scss.template', filePath, {});
    Logger.success(`Create ${name}.scss file`);
};
const generateJsFile = function(filePath, name) {
    const nameInKebabCase = StringHelper.kebabCase(name);
    Template.cloneFile('files/component.js.template', filePath, {
        styleName: nameInKebabCase+ '.scss',
        templateName: nameInKebabCase+ '.template.html',
        componentName: name
    });
    Logger.success(`Create ${name}.hb.js file`);
};

const updateExistingModule = function(elementToAddPath, fileContent) {

    if(!(new RegExp(elementToAddPath)).test(fileContent)) {
        return fileContent.replace(
            /\bcomponents\b[\s]*:[\s]*\[/,
            "components: [\n\t\t'"+ elementToAddPath +"',",
            fileContent
        );
    }
    return fileContent;
};

const componentGenerator = function($name, $argv) {

    const filename = Path.basename($name);
    const filenameInKebabCase = StringHelper.kebabCase(filename);
    const dirname = Path.resolve(Path.dirname($name));
    const componentDir = Path.resolve(dirname, filename);
    if(!Fs.existsSync(componentDir)) {
        Fs.mkdirSync(componentDir, { recursive: true });
    }
    const filePathAndBasename = Path.resolve(componentDir, filename);
    const filePathAndBasenameInKebabCase = Path.resolve(componentDir, filenameInKebabCase);


    Logger.info(`Generate ${filename} component source`);
    generateJsFile(filePathAndBasename + '.hb.js', filename);

    generateHtmlFile(filePathAndBasenameInKebabCase + '.template.html', filenameInKebabCase);
    generateCssFile(filePathAndBasenameInKebabCase + '.scss', filenameInKebabCase);
    addToExistingModule(componentDir, filename+ '.hb.js', updateExistingModule);
};

export default componentGenerator;