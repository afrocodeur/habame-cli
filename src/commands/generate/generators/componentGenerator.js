import Path from 'node:path';
import Fs from 'node:fs';
import Logger from "../../../modules/Logger/Logger.js";
import StringHelper from "../../../helpers/StringHelper.js";
import addToExistingModule from "./helper.js";


const generateHtmlFile = function(filePath, name) {
    Fs.writeFileSync(filePath, "<div>\n\t"+ name +" Component\n</div>", { flag: 'w+' });
    Logger.success(`----> ${name}.template.html`);
};
const generateCssFile = function(filePath, name) {
    Fs.writeFileSync(filePath, '', { flag: 'w+' });
    Logger.success(`----> ${name}.scss`);
};
const generateJsFile = function(filePath, name) {
    const nameInKebabCase = StringHelper.kebabCase(name);
    const exportCode = [
        '\tname: "'+ name +'"',
        '\tcontroller: '+ name,
        '\ttemplateUrl: "'+ nameInKebabCase +'.template.html"',
        '\tstyleUrl: "'+ nameInKebabCase +'.scss"'
    ].join(',\n');

    Fs.writeFileSync(filePath, `const ${name} = function({ State, Actions }) {\n\t\n};\nexport default {\n${exportCode}\n}`, { flag: 'w+' });
    Logger.success(`----> ${name}.hb.js`);
};

const updateExistingModule = function(elementToAddPath, fileContent) {

    if(!(new RegExp(elementToAddPath)).test(fileContent)) {
        return fileContent.replace(
            /\bcomponents\b[\s]*:[\s]*\[/,
            "components: [\n\t\t'"+ elementToAddPath +"',\n\t\t",
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
    Logger.info(`----> In ${dirname}`);

};

export default componentGenerator;