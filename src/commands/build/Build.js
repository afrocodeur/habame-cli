import Fs from 'node:fs';
import Path from 'node:path';
import { minify } from "terser"
import { minify as Minify } from 'minify';

import ProjectConfig from "../../modules/ProjectConfig/ProjectConfig.js";
import Logger from "../../modules/Logger/Logger.js";
import {PROJECT_CONFIG_FILE_NAME} from "../../constants/App.js";
import FileSystem from "../../helpers/FileSystem.js";
import ScriptCodeBuilder from "../../modules/Builder/ScriptCodeBuilder.js";

/**
 * @param {CommandArgValues} $args
 * @constructor
 */
function Build($args) {
    const $projectConfig = new ProjectConfig();

    const HTML_FILENAME = 'index.html';

    let $buildConfig = null;
    let $isProdBuild = false;
    let $scriptBuilder = null;

    this.exec = async function() {
        $isProdBuild = $args.option('prod');
        Logger.note('Build your project '+ ($isProdBuild ? 'as prod' : 'as dev'));

        if(!$projectConfig.exists(PROJECT_CONFIG_FILE_NAME)) {
            Logger.info(PROJECT_CONFIG_FILE_NAME);
            Logger.error('project configuration not found');
            return;
        }
        await $projectConfig.setConfigFile(PROJECT_CONFIG_FILE_NAME, false);

        $buildConfig = $projectConfig.getBuildConfig();

        Logger.note('Create directory ' + $buildConfig.getDestinationPath());
        if(!Fs.existsSync($buildConfig.getDestinationPath())) {
            Fs.mkdirSync($buildConfig.getDestinationPath());
        }

        $scriptBuilder = new ScriptCodeBuilder($projectConfig);
        await $scriptBuilder.build(false);

        await this.buildCssCode();
        await this.buildJsCode();
        await this.buildIndexHtml();

        await this.copyAssets();
        Logger.success('Build completed');
    };

    this.buildCssCode = async function() {
        const cssFileName = $buildConfig.getCssFileName();
        const cssFilepath = FileSystem.resolve($buildConfig.getDestinationPath(), cssFileName);

        const styleCode = await $scriptBuilder.getStyle();
        const styleCodeMinified = await Minify.css(styleCode);

        FileSystem.putContent(cssFilepath, styleCodeMinified);
        Logger.note('Create ' + cssFileName);
    };

    this.buildJsCode = async function() {
        const jsFileName = $buildConfig.getJsFileName();
        const jsFilepath = FileSystem.resolve($buildConfig.getDestinationPath(), jsFileName);

        const jsCodeDependencies = await $scriptBuilder.getDependenciesScript({
            format: 'iife',
            name: '__IMO__', // Imported modules object
            terser: true
        });
        const jsAppCode = await $scriptBuilder.getScript(false);
        const jsCodeMinified = await minify(jsAppCode, { sourceMap: true });

        let output = jsCodeMinified.code;

        if(!$args.option('module')) {
            output = jsCodeDependencies + output;
        }

        FileSystem.putContent(jsFilepath, `!function(){${output}}();`);
        FileSystem.putContent(jsFilepath + '.map', jsCodeMinified.map);
        Logger.note('Create ' + jsFileName);

        if(!$args.option('module')) {
            return;
        }
        const importPath = ($buildConfig.getUnresolvedDestinationPath() +'/'+ $buildConfig.getJsFileName())
            .replace(/\/+/, '/');
        const mainFileName = 'index.js';
        FileSystem.putContent(
            FileSystem.pathFromCwd(mainFileName),
            `import "${importPath}"`);
        Logger.success(`${mainFileName} file created`);
    };

    this.buildIndexHtml = async function() {
        const htmlFilepath = FileSystem.resolve($buildConfig.getDestinationPath(), HTML_FILENAME);
        let htmlContent = FileSystem.getContent($projectConfig.getEntryHtml());
        const linkStyle =  `<link rel="stylesheet" href="${$buildConfig.getCssFileName()}"/>`;
        if(htmlContent.match(/<\/head>/)) {
            htmlContent  = htmlContent.replace('</head>', `${linkStyle}</head>`);
        } else {
            htmlContent  = htmlContent + linkStyle;
        }

        const srcScript =  `<script type="text/javascript" src="${$buildConfig.getJsFileName()}" ></script>`;
        if(htmlContent.match(/<\/body>/)) {
            htmlContent  = htmlContent.replace('</body>', '</body>'+srcScript);
        } else {
            htmlContent  = htmlContent + srcScript;
        }

        const htmlContentMinified  = await Minify.html(htmlContent);

        FileSystem.putContent(htmlFilepath, htmlContentMinified);
        Logger.note('Create ' + HTML_FILENAME);
    };

    this.copyAssets = async function() {
        const assetsPath = $projectConfig.getAssetsPath();
        return Fs.readdirSync(assetsPath).forEach(function(filename) {
            if(filename === 'index.html') {
                return;
            }
            const fullPath = FileSystem.resolve(assetsPath, filename)
            Fs.cpSync(fullPath, FileSystem.resolve($buildConfig.getDestinationPath(), filename), { recursive: true });
        });
    };

}

Build.signature = 'ng build {--module}';
Build.description = 'Compiles an Habame application or library into an output directory named dist/ at the given outputs dir.';
Build.help = '';

export default Build;