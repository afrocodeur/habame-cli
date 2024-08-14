import Fs from 'node:fs';
import Path from 'node:path';

import Logger from "../Logger/Logger.js";
import CustomRequire from "../../helpers/CustomRequire.js";
import DefaultProjectConfig from "../../constants/DefaultProjectConfig.js";

const ProjectConfig =  function() {

    let $configFile = null;
    let $data = {};

    this.exists = (configFile) => {
        return Fs.existsSync(configFile);
    };

    this.setConfigFile = async (configFile) => {
        if($configFile) {
            return;
        }
        Logger.info('Chargement de la configuration du projet ');
        $configFile = Path.resolve(configFile);

        Fs.watchFile(configFile, async () => {
            return this.load();
        });
        return this.load();
    };

    this.load = async () => {
        $data = await CustomRequire.get($configFile);
    };

    this.getDependenciesFilename = () => {
        const filename = Path.resolve(process.cwd(), 'dependencies.hb.js');
        if(Fs.existsSync(filename)) {
            return filename;
        }
        return null;
    };

    this.getEntryHtml = () => {
        return Path.resolve($data.entry?.html || DefaultProjectConfig.entry.html);
    };

    this.getEntryMain = () => {
        return Path.resolve($data.entry?.script || DefaultProjectConfig.entry.script);
    };

    this.getMainModule = () => {
        return $data.entry?.modules || DefaultProjectConfig.entry.modules;
    };

    this.getHost = () => {
        return 'localhost';
    };

    this.getWsServerPort = () => {
        return $data.server?.wsPort || DefaultProjectConfig.server.wsPort;
    };

    this.getServerPort = () => {
        return $data.server?.port || DefaultProjectConfig.server.port;
    };

    this.getPlugins =  function(extension) {
        if($data.plugins[extension]) {
            return [
                ...($data.plugins ? $data.plugins[extension] : []),
                ...DefaultProjectConfig.plugins[extension]
            ];
        }
        return DefaultProjectConfig.plugins[extension];
    };

};

export default ProjectConfig;