import Fs from 'node:fs';
import Path from 'node:path';
import Module from 'node:module';

import Logger from "../Logger/Logger.js";
import CustomRequire from "../../helpers/CustomRequire.js";


/**
 *
 * @param {ScriptCodeBuilder} $scriptBuilder
 * @constructor
 */
const ModuleLoader = function($scriptBuilder) {
    const $caches = {
        fileSources: {},
        modules: {}
    };

    const loadModuleSources = async (filename, watch) => {
        const data = await CustomRequire.get(filename);
        if(!data) {
            return;
        }
        const dirname = Path.dirname(filename);

        if(typeof data.modules === 'object') {
            await this.loadSubModules(dirname, data.modules, watch);
        }
        const sourceFiles = [];

        data.components && sourceFiles.push(...data.components);
        data.services && sourceFiles.push(...data.services);
        data.directives && sourceFiles.push(...data.directives);

        if(sourceFiles.length) {
            await this.registerSourceFiles(dirname, sourceFiles);
        }
    }

    this.registerSourceFiles = async (dirname, files) => {
        const registerPromises = [];
        files.forEach((filename) => {
            const filePath = Path.resolve(dirname, filename);
            if($caches.fileSources[filePath]) {
                return;
            }
            registerPromises.push($scriptBuilder.addSourceFile(filePath));
            $caches.fileSources[filePath] = { filename };
        });
        await Promise.all(registerPromises);
        this.cleanSourceFileCache(files);
    };

    this.cleanSourceFileCache = function(files) {
        for(const filePath in $caches.fileSources) {
            const cacheItem = $caches.fileSources[filePath];
            if(!cacheItem || files.includes(cacheItem.filename)) {
                continue;
            }
            $scriptBuilder.removeSourceFiles(filePath);
            $caches.fileSources[filePath] = null;
        }
    };

    this.loadSubModules = async (dirname, modules, watch) => {
        const loadModulesPromises = [];
        modules.forEach((filename) => {
            const moduleFilePath = Path.resolve(dirname, filename);
            if(!Fs.existsSync(moduleFilePath)) {
                Logger.error('Submodule not found ' + filename);
                return;
            }
            if($caches.modules[moduleFilePath]) {
                return;
            }
            Logger.note(`Submodule ${filename} loaded`);
            const module = new ModuleLoader($scriptBuilder);
            loadModulesPromises.push(module.load(moduleFilePath, watch));
            $caches.modules[moduleFilePath] = {
                filename,
                module
            };
        });
        await Promise.all(loadModulesPromises);
        this.cleanModuleCache(modules);
    };

    this.cleanModuleCache = function(modules) {
        for(const filePath in $caches.modules) {
            const cacheItem = $caches.modules[filePath];
            if(!cacheItem || modules.includes(cacheItem.filename)) {
                continue;
            }
            $caches.modules[filePath] = null;
        }
    };


    this.load = async (filename, watch) => {
        if(!Fs.existsSync(filename)) {
            Logger.error('Module not found ' + filename);
            return;
        }
        await loadModuleSources(filename, watch);
        if(watch) {
            Fs.watchFile(filename, () => {
                loadModuleSources(filename, watch);
            });
        }
    };


};

export default ModuleLoader;