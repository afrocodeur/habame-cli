import http from 'node:http';
import Fs from 'node:fs';

import Logger from "../../Logger/Logger.js";
import StaticFileServer from "./StaticFileServer.js";

const DEFAULT_PORT = 8000;

/**
 *
 * @param {ProjectConfig} $config
 * @param {HabameProjectLiveBuilder} $builder
 * @constructor
 */
const HttpServer = function($config, $builder) {

    const $staticFileServer = new StaticFileServer($config);

    const $entryPoint = async (req, res) => {
        if(req.url === '/' || req.url === '/index.html') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            const code = await $builder.getHtmlCode($config);
            res.end(code);
            return;
        }
        const path = req.url.replace(/^(\/+)/, '');
        if($staticFileServer.couldServe(path)) {
            $staticFileServer.serve(path, res);
            return;
        }
        res.writeHead(404);
        res.end('File not found');
    };

    const $server = http.createServer($entryPoint);

    this.serve = async () => {
        Logger.info('start the http web server');
        await $builder.watch();
        $staticFileServer.loadSourceDir();
        $server.listen($config.getServerPort() || DEFAULT_PORT, '127.0.0.1', () => {
            Logger.success('Server start on : ' + $config.getServerPort());
            Logger.info('http://localhost:' + $config.getServerPort());
        });
    };
};

export default HttpServer;