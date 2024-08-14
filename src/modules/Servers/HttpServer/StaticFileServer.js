import Fs from 'node:fs';
import Path from 'node:path';

import ContentType from "../../../constants/ContentType.js";


/**
 *
 * @param {ProjectConfig} $config
 * @constructor
 */
const StaticFileServer = function($config) {

    let $sourceDir = '';

    this.loadSourceDir =  () => {
        $sourceDir = Path.dirname($config.getEntryHtml());
    };

    this.fullPath = (path) => {
        return Path.resolve($sourceDir, path);
    };

    this.getContentType = (filename) => {
        const extname = Path.extname(filename).replace(/^([.]+)/, '');
        return ContentType[extname];
    };

    this.couldServe = (path) => {
        return Fs.existsSync(this.fullPath(path));
    };

    this.serve =  async (path, res) => {
        const filename = this.fullPath(path);
        res.writeHead(200, { 'Content-Type': this.getContentType(path) });
        res.end(Fs.readFileSync(filename), 'utf-8');
    };

};

export default StaticFileServer;