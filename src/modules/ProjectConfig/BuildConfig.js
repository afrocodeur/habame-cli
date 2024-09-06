import FileSystem from "../../helpers/FileSystem.js";
import DefaultProjectConfig from "../../constants/DefaultProjectConfig.js";

function BuildConfig(config) {

    const $timestamp = (new Date()).getTime() / 1000;

    this.getUnresolvedDestinationPath = function() {
        return config.dir ?? DefaultProjectConfig.build.outputs.dir;
    };
    this.getDestinationPath = function() {
        const dir = config.dir ?? DefaultProjectConfig.build.outputs.dir;
        return FileSystem.pathFromCwd(dir);
    };

    this.getJsFileName = function() {
        return config.outputs?.files?.js || `${$timestamp}.main.js`;
    };

    this.getCssFileName = function() {
        return config.outputs?.files?.css || `${$timestamp}.main.css`;
    };

    this.getRollupConfig = function() {
        if(!config.rollup){
            return DefaultProjectConfig.build.rollup;
        }
        return  { ...DefaultProjectConfig.build.rollup, ...config.rollup };
    };

}

export default BuildConfig;