import Fs from 'node:fs';
import Path from 'node:path';
import Logger from "../../../modules/Logger/Logger.js";

export const addToExistingModule = function(dirname, filename, callback) {
    const fileRelativePathToAdd = [filename];
    let currentDir = dirname, deep = 10;
    let lastDir = currentDir
    let potentialModule = null;

    do {
        const dirBasename = Path.basename(currentDir);
        const potentialModuleName = (dirBasename === 'src' ? 'main.module.js' : dirBasename.toLowerCase()+ '.module.js');
        potentialModule = Path.resolve(currentDir, potentialModuleName);

        if(Fs.existsSync(potentialModule) && (filename !== potentialModuleName)) {
            break;
        }
        lastDir = currentDir;
        currentDir = Path.dirname(currentDir);
        fileRelativePathToAdd.push(dirBasename);
        if(lastDir === currentDir) {
            return;
        }
        deep--;
    } while (currentDir && deep > 0);

    if(!potentialModule) {
        Logger.alert([
            'No module found to update',
            'Please add manually your component to the module file'
        ]);
        return;
    }

    const fileContent = Fs.readFileSync(potentialModule, 'utf8');
    const pathToAdd = fileRelativePathToAdd.reverse().join('/');

    const fileContentUpdated = callback ? callback(pathToAdd, fileContent) : fileContent;
    Fs.writeFileSync(potentialModule, fileContentUpdated);

    Logger.success(`${potentialModule} updated with success`);
};

export default addToExistingModule;