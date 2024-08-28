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
        console.log('Create your first application ', $args.paramAt(0));
        const template = $args.option('template') ?? 'default';

        if(!Template.cloneTemplateFolder(template, $projectName)) {
            Logger.error(`Echec de la création d un project ${projectName} sous le template ${templateName}`);
            return;
        }

        const { stderr } = await CommandExecutor.exec('yarn -v');
        const installCommand = (!stderr) ? 'yarn' : 'npm';

        Logger.info(`${installCommand} will use to install project`);

        const installChild = await CommandExecutor.spawn(installCommand, ['install'], {
            cwd: FileSystem.pathFromCwd($projectName),
            stdio: 'inherit'
        });

        installChild.on('exit', function(code) {
            if(code !== 0) {
                return;
            }
            console.log(`Run cd ${$projectName} && hb start`);
        });

    };

};

CreateApp.signature = '';
CreateApp.description = '';
CreateApp.help = '';

export default CreateApp;