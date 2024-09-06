import Logger from "../../modules/Logger/Logger.js";
import FileSystem from "../../helpers/FileSystem.js";
import Template from "../../helpers/Template.js";
import CommandExecutor from "../../helpers/CommandExecutor.js";


/**
 * @param {CommandArgValues} $args
 * @constructor
 */
const CreateApp = function($args) {

    let $projectName = '';

    this.exec = async function() {
        $projectName = $args.paramAt(0);
        if(FileSystem.existInCwd($projectName)) {
            Logger.error(`Project ${$projectName} already exists`);
            process.exit();
        }
        Logger.note('Create first application ' + $args.paramAt(0));
        const template = $args.option('template') ?? 'default';

        if(!Template.cloneTemplateFolder(template, $projectName)) {
            Logger.error(`Echec de la création du project ${$projectName}`);
            return;
        }

        let installCommand = 'npm';
        try {
            const { stderr } = await CommandExecutor.exec('yarn -v');
            if(!stderr) {
                installCommand = 'yarn';
            }
        } catch (e) {}

        Logger.info(`${installCommand} will use to install project`);

        const installChild = await CommandExecutor.spawn(installCommand, ['install'], {
            cwd: FileSystem.pathFromCwd($projectName),
            stdio: 'inherit'
        });

        installChild.on('exit', function(code) {
            if(code !== 0) {
                return;
            }
            Logger.note([`Run cd ${$projectName}`, 'hb start']);
        });

    };

};

CreateApp.signature = 'ng create {ProjectName}';
CreateApp.description = 'Creates a new Habame workspace.';
CreateApp.help = '';

export default CreateApp;