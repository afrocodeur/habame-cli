import Path from 'node:path';
import Fs from 'node:fs';

import CustomRequire from "../../helpers/CustomRequire.js";
import FileSystem from "../../helpers/FileSystem.js";
import {FILE_SOURCE_SCRIPT_TYPE, FILE_SOURCE_STYLE_TYPE, FILE_SOURCE_VIEW_TYPE} from "../../constants/Builder.js";

/**
 *
 * @param {string} $filename
 * @param {ProjectConfig} $config
 * @constructor
 */
const SourceFileBuilder = function($filename, $config) {

    const $dirname = Path.dirname($filename);

    let $description = {};
    let $isOnUpdate = false;
    const $files = { templateUrl: null, styleUrl: null };

    const executePlugins = async function(type, sourceCode) {
        const plugins = $config.getPlugins(type);
        for await (const plugin of plugins) {
            if(typeof plugin.callback === 'function' && plugin.callback.constructor.name === 'AsyncFunction') {
                sourceCode = await plugin.callback(sourceCode, plugin.options || {});
                continue;
            }
            sourceCode = plugin.callback(sourceCode, plugin.options || {});
        }
        return sourceCode;
    };

    this.load = async function() {
        $description = await CustomRequire.get($filename);
    };

    this.update = async function(data) {
        if($isOnUpdate) {
            return;
        }
        const updatedData = { ...data };
        try {
            $isOnUpdate = true;
            if(data.type === FILE_SOURCE_SCRIPT_TYPE) {
                const currentDescription = { ...$description };

                await this.load();
                updatedData.code = await this.getFunction();
                if(updatedData.isComponent) {
                    const isSameTemplateValue = currentDescription.templateUrl === $description.templateUrl
                        && currentDescription.template === $description.template;
                    const isSameStyleValue = currentDescription.styleUrl === $description.styleUrl
                        && currentDescription.style === $description.style;

                    updatedData.reload = !(isSameTemplateValue && isSameStyleValue);
                }
                else {
                    updatedData.reload = true;
                }
            }
            else if(data.type === FILE_SOURCE_VIEW_TYPE) {
                updatedData.code = await this.getJsonView();
            }
            else if(data.type === FILE_SOURCE_STYLE_TYPE) {
                updatedData.code = await this.getStyle();
            }
        } catch (e) {
            $isOnUpdate = false;
        }
        $isOnUpdate = false;
        return updatedData;
    };

    this.files = function() {
        const files = [{
            filename: $filename,
            data: {
                type: FILE_SOURCE_SCRIPT_TYPE,
                name: $description.name,
                isDirective: (typeof $description.directive === 'function'),
                isService: (typeof $description.service === 'function'),
                isComponent: (typeof $description.controller === 'function'),
            }
        }];
        if($description.templateUrl) {
            $files.templateUrl = Path.resolve($dirname, $description.templateUrl);
            files.push({
                filename: $files.templateUrl,
                data: { type: FILE_SOURCE_VIEW_TYPE, name: $description.name },
                builder: this,
            });
        }
        if($description.styleUrl) {
            $files.styleUrl = Path.resolve($dirname, $description.styleUrl);
            files.push({
                filename: Path.resolve($dirname, $description.styleUrl),
                data: { type: FILE_SOURCE_STYLE_TYPE, name: $description.name },
                builder: this
            })
        }
        return files;
    };

    this.build = async function() {

    };

    this.getHbScript = async function() {
        const theFunction = await this.getFunction();
        const jsonViewEncoded = await this.getJsonViewEncoded();
        if($description.directive) {
            const options = typeof $description.options === 'object' ? $description.options : {};
            return `Habame.createDirective("${$description.name}", ${theFunction}, ${JSON.stringify(options)})`;
        }
        if($description.service) {
            return `Habame.createService("${$description.name}", ${theFunction})`;
        }

        return `Habame.createComponent("${$description.name}", ${theFunction}, ${jsonViewEncoded})`;
    };

    this.getFunction = async function() {
        const functionSourceCode = ($description.controller || $description.directive || $description.service).toString();
        // handle the source code
        return await executePlugins('script', functionSourceCode);
    };

    this.getNativeView = function() {
        return $files.templateUrl
            ? Fs.readFileSync(Path.resolve($dirname, $files.templateUrl), 'utf8')
            : $description.template || '';
    };

    this.getNativeStyle = function() {
        return $files.styleUrl
            ? Fs.readFileSync(Path.resolve($dirname, $files.styleUrl), 'utf8')
            : $description.style || '';
    };

    this.getJsonView = async function() {
        let view = this.getNativeView();
        if($files.templateUrl && FileSystem.isJsonFile($files.templateUrl)) {
            return view;
        }
        view = await executePlugins('view', view);
        if(typeof view === 'object') {
            return view;
        }
        return {};
    };

    this.getJsonViewEncoded = async function() {
        const view = await this.getJsonView();
        return JSON.stringify(view);
    };

    this.getStyle = async function() {
        return await executePlugins('style', this.getNativeStyle());
    };

    this.getComponentName = function() {
        return $description.name;
    };

};

export default SourceFileBuilder;