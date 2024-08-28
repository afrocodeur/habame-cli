import Path from 'node:path';
import Fs from 'node:fs';
import ScriptCodeBuilder from "./ScriptCodeBuilder.js";

/**
 *
 * @param {ProjectConfig} $config
 * @constructor
 */
const HabameProjectLiveBuilder = function($config) {

    const $scriptBuilder = new ScriptCodeBuilder($config);
    let $wsClientCode = '';

    this.scriptBuilder = () => $scriptBuilder;

    this.watch = () => {
        return $scriptBuilder.watch();
    };

    /**
     * @param {ProjectConfig} $config
     * @returns {Promise<string>}
     */
    this.getHtmlCode = async ($config) => {
        const entryHtml = Path.resolve($config.getEntryHtml());
        let contentHtml = Fs.readFileSync(entryHtml, 'utf8');
        const dependencies = await $scriptBuilder.getDependenciesScript({ format: 'iife', name: 'dependenciesLiveImported' });
        const appScript = await $scriptBuilder.getScript(false);
        const appStyles = await $scriptBuilder.getStyles();

        const appStylesCode = appStyles
            .map(({ code, component }) => `<style data-component="${component}" >${code}</style>`)
            .join("\n");

        const sourceCode = `
            <script type="text/javascript" data-type="dependencies" >${dependencies}</script>\n
            <script type="text/javascript" >${appScript}</script>\n
            <script type="text/javascript" >${$wsClientCode}</script>\n
        `;

        if(contentHtml.match(/<\/head>/)) {
            contentHtml  = contentHtml.replace('</head>', `${appStylesCode}</head>`);
        } else {
            contentHtml  = contentHtml + appStylesCode;
        }

        if(contentHtml.match(/<\/body>/)) {
            contentHtml  = contentHtml.replace('</body>', '</body>'+sourceCode);
        } else {
            contentHtml  = contentHtml + sourceCode;
        }
        return contentHtml;
    };

    /**
     * @param {string} clientCode
     */
    this.setWsClientCode = function(clientCode) {
        $wsClientCode = clientCode;
    };
};

export default HabameProjectLiveBuilder;