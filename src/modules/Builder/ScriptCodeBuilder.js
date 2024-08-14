import Fs from 'node:fs';
import Path from 'node:path';

import AbstractEvent from "../../helpers/AbstractEvent.js";
import Logger from "../Logger/Logger.js";
import ModuleLoader from "./ModuleLoader.js";
import SourceFileBuilder from "./SourceFileBuilder.js";
import {END_SCRIPT_BLOCK} from "../../constants/Builder.js";
import RollupBuilder from "./RollupBuilder.js";

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
        Logger.log('lets watch this project: '+ Path.resolve(''));
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
            Fs.watch(dependenciesFile, () => {
                this.emit(ScriptCodeBuilder.UPDATED, {
                    reload: true,
                    type: 'dependencies'
                });
            });
        }
    };

    this.getDependenciesScript = async function() {
        const dependenciesFile = $config.getDependenciesFilename();
        if(!dependenciesFile) {
            return '';
        }

        return (await $rollupBuilder.build(dependenciesFile)).code;
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
            scripts.unshift(outputCode);
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

};

ScriptCodeBuilder.UPDATED = 'updated';

export default ScriptCodeBuilder;