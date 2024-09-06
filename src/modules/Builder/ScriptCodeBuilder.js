import Fs from 'node:fs';
import Path from 'node:path';

import AbstractEvent from "../../helpers/AbstractEvent.js";
import Logger from "../Logger/Logger.js";
import ModuleLoader from "./ModuleLoader.js";
import SourceFileBuilder from "./SourceFileBuilder.js";
import {END_SCRIPT_BLOCK} from "../../constants/Builder.js";
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

    let $dependenciesCode = null;

    AbstractEvent.apply(this);

    this.addSourceFile = async (filename) => {
        if($scriptSourceFiles[filename]) {
            return;
        }
        const builder = new SourceFileBuilder(filename, $config);
        await builder.load();
        const files = builder.files();

        files.forEach(({ filename, data }) => {
            $allSourceFiles[filename] = { builder, data };
        });
        $scriptSourceFiles[filename] = { builder };
    };

    this.removeSourceFiles = (filename) => {
        $scriptSourceFiles[filename] = null;
    };

    this.watch = async () => {
        // Load the main modules
        Fs.watch(Path.resolve(''), { recursive: true }, async (event, filename) => {
            const absolutePathName = Path.resolve(filename.trim());
            if(event !== 'change' || !Fs.existsSync(absolutePathName) || (/~$/.test(absolutePathName))) {
                return;
            }
            const stat = Fs.statSync(absolutePathName);
            if(stat.isDirectory() || !$allSourceFiles[absolutePathName]) {
                return;
            }
            const { builder, data } = $allSourceFiles[absolutePathName];
            const updatedData = await builder.update(data);
            if(!updatedData) {
                return;
            }
            this.emit(ScriptCodeBuilder.UPDATED, updatedData);
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
    };

    this.buildDependenciesScript = async function(options) {
        $dependenciesCode = null;
        const dependenciesFile = $config.getDependenciesFilename();
        if(!dependenciesFile) {
            return '';
        }

        Logger.info('Compile dependencies');

        let configOptions = $config.getBuildConfig().getRollupConfig();
        configOptions.plugins = configOptions.plugins || [];
        if(options) {
            configOptions = { ...configOptions, ...options };
            if(options.terser) {
                configOptions.plugins.push(terser());
            }
        } else {
            configOptions.plugins.push(terser());
        }

        let jsImportedCode = (await $rollupBuilder.build(dependenciesFile, configOptions)).code;
        if(!options) {
            return jsImportedCode;
        }
        $dependenciesCode = jsImportedCode +`;for(var a in ${options.name}){window[a]=${options.name}[a];}`;
        Logger.info('Compile dependencies completed');
        return $dependenciesCode;
    };

    this.getDependenciesScript = async function(options) {
        if($dependenciesCode) {
            return $dependenciesCode;
        }
        return this.buildDependenciesScript(options);
    }

    this.getScript = async function(importedCode = true) {
        const scriptPromises = [];
        for(const filename in $scriptSourceFiles) {
            const { builder } = $scriptSourceFiles[filename];
            scriptPromises.push(builder.getHbScript());
        }
        const scripts = await Promise.all(scriptPromises);
        if(importedCode) {
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
ScriptCodeBuilder.DEPENDENCES_DEFAULT_OPTION = { format: 'iife', name: 'dependenciesLiveImported' };

export default ScriptCodeBuilder;