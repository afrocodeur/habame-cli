
import HttpServer from "../../modules/Servers/HttpServer/HttpServer.js";
import ProjectConfig from "../../modules/ProjectConfig/ProjectConfig.js";
import Logger from "../../modules/Logger/Logger.js";
import HabameProjectLiveBuilder from "../../modules/Builder/HabameProjectLiveBuilder.js";
import WsServer from "../../modules/Servers/WsServer/WsServer.js";

/**
 *
 * @param {CommandArgValues} argv
 * @constructor
 */
const StartCommand = function(argv) {

    const $projectConfig = new ProjectConfig();
    const $projectBuilder = new HabameProjectLiveBuilder($projectConfig);
    const $httpServer = new HttpServer($projectConfig, $projectBuilder);
    const $wsServer = new WsServer($projectConfig, $projectBuilder);

    this.exec = async () => {

        if(argv.option('hostpot')) {
            Logger.error('Hostpot is Activated');
        }

        const configFile = process.cwd()+'/hb.config.js';
        if(!$projectConfig.exists(configFile)) {
            Logger.info(configFile);
            Logger.error('project configuration not found');
            return;
        }
        await $projectConfig.setConfigFile(configFile);

        $wsServer.serve();
        await $httpServer.serve();

        console.log('start the websocket server');
    };

};

export default StartCommand;