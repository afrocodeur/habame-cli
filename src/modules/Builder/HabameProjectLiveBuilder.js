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
        const dependencies = await $scriptBuilder.getDependenciesScript();
        const appScript = await $scriptBuilder.getScript(false);
        const appStyles = await $scriptBuilder.getStyles();

        const appStylesCode = appStyles
            .map(({ code, component }) => `<style data-component="${component}" >${code}</style>`)
            .join("\n");

        contentHtml  = contentHtml.replace(
            '</html>',
            `
            ${appStylesCode}
            <script type="text/javascript" data-type="dependencies" >${dependencies}</script>\n
            <script type="text/javascript" >${appScript}</script>\n
            <script type="text/javascript">${$wsClientCode}</script>\n
            </html>`
        );
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