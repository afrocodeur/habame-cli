
import HttpServer from "../../modules/Servers/HttpServer/HttpServer.js";
import ProjectConfig from "../../modules/ProjectConfig/ProjectConfig.js";
import Logger from "../../modules/Logger/Logger.js";
import HabameProjectLiveBuilder from "../../modules/Builder/HabameProjectLiveBuilder.js";
import WsServer from "../../modules/Servers/WsServer/WsServer.js";
import {PROJECT_CONFIG_FILE_NAME} from "../../constants/App.js";

/**
 *
 * @param {CommandArgValues} argv
 * @constructor
 */
const Start = function($argv) {

    const $projectConfig = new ProjectConfig();
    const $projectBuilder = new HabameProjectLiveBuilder($projectConfig);
    const $httpServer = new HttpServer($projectConfig, $projectBuilder);
    const $wsServer = new WsServer($projectConfig, $projectBuilder);

    this.exec = async () => {

        if($argv.option('hostpot')) {
            Logger.error('Hostpot is Activated');
        }

        if(!$projectConfig.exists(PROJECT_CONFIG_FILE_NAME)) {
            Logger.info(PROJECT_CONFIG_FILE_NAME);
            Logger.error('project configuration file not found');
            return;
        }
        await $projectConfig.setConfigFile(PROJECT_CONFIG_FILE_NAME);

        $wsServer.serve();
        await $httpServer.serve();
    };

};

Start.signature = 'ng start';
Start.description = 'Builds and serves your application, rebuilding on file changes';
Start.help = '';

export default Start;