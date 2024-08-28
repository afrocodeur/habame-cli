import Fs from 'node:fs';
import Path from 'node:path';

import Logger from "../Logger/Logger.js";
import CustomRequire from "../../helpers/CustomRequire.js";
import DefaultProjectConfig from "../../constants/DefaultProjectConfig.js";
import FileSystem from "../../helpers/FileSystem.js";
import BuildConfig from "./BuildConfig.js";

const ProjectConfig =  function() {

    let $configFile = null;
    let $data = {};

    this.exists = (configFile) => {
        return FileSystem.existInCwd(configFile);
    };

    this.setConfigFile = async (configFile, watch = true) => {
        if($configFile) {
            return;
        }
        Logger.info('Chargement de la configuration du projet ');
        $configFile = FileSystem.pathFromCwd(configFile);

        if(watch) {
            Fs.watchFile(configFile, async () => {
                return this.load();
            });
        }
        return this.load();
    };

    this.getBuildConfig = function() {
        return new BuildConfig($data.build ||  {});
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

    this.getAssetsPath = () => {
        return Path.resolve($data.entry?.assets || DefaultProjectConfig.entry.assets);
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
                ...(DefaultProjectConfig.plugins[extension] ? DefaultProjectConfig.plugins[extension] : [])
            ];
        }
        return DefaultProjectConfig.plugins[extension];
    };

};

export default ProjectConfig;