import Fs from 'node:fs';
import Logger from "../modules/Logger/Logger.js";
import FileSystem from "./FileSystem.js";
import fileSystem from "./FileSystem.js";


const Template = {

    cloneTemplateFolder: function(templateName, projectName) {
        let isSuccess = true;
        const templatePath = FileSystem.pathFromRoot('templates/applications/' + templateName);
        const tempDestinationPath = FileSystem.pathFromRoot('templates/caches/' + (new Date()).getTime());
        const destinationPath = FileSystem.pathFromCwd(projectName);

        try {
            Fs.cpSync(templatePath, tempDestinationPath, { recursive: true }, function() {
                isSuccess = false;
                FileSystem.removeDir(tempDestinationPath);
            });

            const dataSource = { projectName };

            FileSystem.eachFileFrom(tempDestinationPath, function(file) {
                Template.updateContent(file.path, dataSource);
                const filename = file.path.replace(/\.template$/, '');
                const relativeFilePath = filename.replace(tempDestinationPath, '').replace(/^\/+/, '');
                Fs.renameSync(file.path, filename);
                Logger.log(`CREATE : ${relativeFilePath}`);
            });

            Fs.renameSync(tempDestinationPath, FileSystem.pathFromCwd(projectName));
        } catch (e) {
            isSuccess = false;
            if(Fs.existsSync(tempDestinationPath)) {
                FileSystem.removeDir(tempDestinationPath);
            }
        }

        return isSuccess;
    },

    updateContent: function(filePath, data) {
        let content = FileSystem.getContent(filePath);

        for(const key in data) {
            content = content.replace(new RegExp('%'+ key +'%', 'g'), data[key]);
        }

        FileSystem.putContent(filePath, content);
    }
};


export default Template;