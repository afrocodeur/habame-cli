import Fs from 'node:fs';
import Path from 'node:path';

import AbstractEvent from "../../helpers/AbstractEvent.js";
import Logger from "../Logger/Logger.js";
import ModuleLoader from "./ModuleLoader.js";
import SourceFileBuilder from "./SourceFileBuilder.js";
import {END_SCRIPT_BLOCK, FILE_SOURCE_STYLE_TYPE} from "../../constants/Builder.js";
import RollupBuilder from "./RollupBuilder.js";

import terser from '@rollup/plugin-terser';

/**
 *
 * @param {ProjectConfig} $config
 * @constructor
 */
const ScriptCodeBuilder = function($config) {

    const $scriptSourceFiles = {};
    const $allSourceFiles = {};
    const $moduleLoader = new ModuleLoader(this);
    const $rollupBuilder = new RollupBuilder();
    const App = {
        Logger,
        reload: () => {
            this.emit(ScriptCodeBuilder.UPDATED, { reload: true });
        },
        reloadStyles: async () => {
            const updates = [];
            for(const filename in $allSourceFiles) {
                const source = $allSourceFiles[filename];
                if(source.data.type === FILE_SOURCE_STYLE_TYPE) {
                    source.builder.removeCache(FILE_SOURCE_STYLE_TYPE);
                    updates.push(this.updateFile(filename));
                }
            }
            await Promise.all(updates);
        }
    };

    let $dependenciesCode = null;
    let $globalFunctionsCode = null;

    AbstractEvent.apply(this);

    const getConfigOptions = function(options) {
        let configOptions = $config.getBuildConfig().getRollupConfig();
        configOptions.plugins = configOptions.plugins || [];
        if (options) {
            configOptions = {...configOptions, ...options};
            if (options.terser) {
                configOptions.plugins.push(terser());
            }
        }
        else {
            configOptions.plugins.push(terser());
        }

        return configOptions;
    }

    this.addSourceFile = async (filename) => {
        if($scriptSourceFiles[filename]) {
            return;
        }
        const builder = new SourceFileBuilder(filename, $config, App);
        await builder.load();
        const files = builder.files();

        files.forEach(({ filename, data }) => {
            $allSourceFiles[filename] = { builder, data, mtime: null };
        });
        $scriptSourceFiles[filename] = { builder };
    };

    this.removeSourceFiles = (filename) => {
        $scriptSourceFiles[filename] = null;
    };

    this.updateFile = async (filename) => {
        const { builder, data } = $allSourceFiles[filename];
        const updatedData = await builder.update(data);
        if(!updatedData) {
            return;
        }
        this.emit(ScriptCodeBuilder.UPDATED, updatedData);
    };

    this.watch = async () => {
        // Load the main modules
        Fs.watch(Path.resolve(''), { recursive: true }, async (event, filename) => {
            const absolutePathName = Path.resolve(filename.trim());
            if(event !== 'change' || !Fs.existsSync(absolutePathName) || (/~$/.test(absolutePathName))) {
                return;
            }
            const stat = Fs.statSync(filename);
            if(stat.isDirectory() || !$allSourceFiles[absolutePathName]) {
                return;
            }
            if($allSourceFiles[absolutePathName].mtime === stat.mtime) {
                return;
            }
            $allSourceFiles[absolutePathName].mtime = stat.mtime;
            return this.updateFile(absolutePathName);
        });
        await this.build(true);
    };

    this.build = async (watch) => {
        await $moduleLoader.load(Path.resolve($config.getMainModule()), watch);
        const buildPromises = [];
        Object.values($scriptSourceFiles).forEach(({ builder }) => {
            buildPromises.push(builder.build());
        });

        if(watch) {
            this.watchDependenciesFile();
        }

        await Promise.all(buildPromises);
    };

    this.watchDependenciesFile = function() {
        const dependenciesFile = $config.getDependenciesFilename();
        if(dependenciesFile) {
            Fs.watch(dependenciesFile, async () => {
                await this.buildDependenciesScript(ScriptCodeBuilder.DEPENDENCES_DEFAULT_OPTION);
                this.emit(ScriptCodeBuilder.UPDATED, {
                    reload: true,
                    type: 'dependencies'
                });
            });
        }

        const globalsFile = $config.getGlobalsFunctionsFilename();
        if(globalsFile) {
            Fs.watch(globalsFile, async () => {
                const code = await this.buildGlobalsScript(ScriptCodeBuilder.GLOBALS_DEFAULT_OPTION, true);
                this.emit(ScriptCodeBuilder.UPDATED, {
                    name: 'globals',
                    type: 'globals',
                    code
                });
            });
        }
    };

    this.buildGlobalsScript = async function(options, isDevMode) {
        $globalFunctionsCode = '';
        const globalsFile = $config.getGlobalsFunctionsFilename();
        if(!globalsFile){
            return $globalFunctionsCode;
        }
        Logger.info('Compile globals');
        let configOptions = getConfigOptions(options);
        const build = (await $rollupBuilder.build(globalsFile, configOptions));
        $globalFunctionsCode = build.code;

        // trick to get only functions
        $globalFunctionsCode = $globalFunctionsCode.replace(`var ${configOptions.name}`, `${isDevMode ? 'var' : 'const'} {${build.exports.join(',')}}`);
        Logger.info('Compile globals completed');
        return $globalFunctionsCode;
    };

    this.buildDependenciesScript = async function(options) {
        $dependenciesCode = null;
        const dependenciesFile = $config.getDependenciesFilename();
        if(!dependenciesFile) {
            return '';
        }

        Logger.info('Compile dependencies');
        let configOptions = getConfigOptions(options);

        const build = (await $rollupBuilder.build(dependenciesFile, configOptions));
        let jsImportedCode = build.code;

        if(!options) {
            $dependenciesCode = jsImportedCode;
            Logger.info('Compile dependencies completed');
            return jsImportedCode;
        }
        jsImportedCode = jsImportedCode.replace(`var ${options.name}`, `var {${build.exports.join(',')}}`);
        Logger.info('Compile dependencies completed');
        return jsImportedCode;
    };

    this.getDependenciesScript = async function(options) {
        if($dependenciesCode) {
            return $dependenciesCode;
        }
        return this.buildDependenciesScript(options);
    }

    this.getGlobalFunctionsScript = async function(options, isDevMode = false) {
        if($globalFunctionsCode) {
            return $globalFunctionsCode;
        }
        return this.buildGlobalsScript(options, isDevMode);
    }

    this.getScript = async function(importedCode = true) {
        const scriptPromises = [];
        for(const filename in $scriptSourceFiles) {
            const { builder } = $scriptSourceFiles[filename];
            scriptPromises.push(builder.getHbScript());
        }
        const scripts = await Promise.all(scriptPromises);
        if(importedCode) {
            const globalsCode = await this.getGlobalFunctionsScript();
            if(globalsCode) {
                scripts.unshift(globalsCode);
            }
            const outputCode = await this.getDependenciesScript();
            if(outputCode) {
                scripts.unshift(outputCode);
            }
        }

        const entryMainScript = Fs.readFileSync(Path.resolve($config.getEntryMain()));
        scripts.push(entryMainScript);

        return scripts.join(END_SCRIPT_BLOCK) + END_SCRIPT_BLOCK;
    };

    this.getStyles = async function() {
        const stylePromises = [];
        for(const filename in $scriptSourceFiles) {
            const { builder, data } = $scriptSourceFiles[filename];
            stylePromises.push((async () => {
                const code = await builder.getStyle();
                return { code, component: builder.getComponentName() };
            })());
        }
        return await Promise.all(stylePromises);
    };

    this.getStyle = async function() {
        const cssCodes = await this.getStyles();
        return cssCodes.map((source) => source.code).join('');
    };

};

ScriptCodeBuilder.UPDATED = 'updated';
// DLI Dependencies Live Import
ScriptCodeBuilder.DEPENDENCES_DEFAULT_OPTION = { format: 'iife', name: '__DLI__' };
ScriptCodeBuilder.GLOBALS_DEFAULT_OPTION = { format: 'iife', name: '__GDI__' };

export default ScriptCodeBuilder;