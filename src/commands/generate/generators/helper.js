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
        potentialModule = Path.resolve(currentDir, dirBasename.toLowerCase()+ '.module.js');

        if(Fs.existsSync(potentialModule)) {
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
        return;
    }

    const fileContent = Fs.readFileSync(potentialModule, 'utf8');
    const pathToAdd = fileRelativePathToAdd.reverse().join('/');

    const fileContentUpdated = callback ? callback(pathToAdd, fileContent) : fileContent;
    Fs.writeFileSync(potentialModule, fileContentUpdated);

    Logger.success(`${potentialModule} updated with success`);
};

export default addToExistingModule;