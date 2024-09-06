import { WebSocketServer } from 'ws';

import Logger from "../../Logger/Logger.js";
import ScriptCodeBuilder from "../../Builder/ScriptCodeBuilder.js";
import FileSystem from "../../../helpers/FileSystem.js";


/**
 *
 * @param {ProjectConfig} $config
 * @param {HabameProjectLiveBuilder} $builder
 * @constructor
 */
const WsServer =  function($config, $builder) {

    let $wsServer = null;
    const $sessionId = (new Date()).getTime();
    const $scriptBuilder = $builder.scriptBuilder();

    this.serve = () => {
        if(!$wsServer) {
            $wsServer = new WebSocketServer({ port: $config.getWsServerPort() }, () => {
                Logger.success('Websocket server run on '+ $config.getWsServerPort());
            });
        }
        $builder.setWsClientCode(this.getClientCode());
        $wsServer.on('connection', function connection(ws) {
            Logger.info('Connection established');

            ws.on('message', function message(message) {
                try {
                    const data = JSON.parse(message);

                }catch (e) {}
            });
            $scriptBuilder.on(ScriptCodeBuilder.UPDATED, (data) => {
                try {
                    data.experimentalHotReload = $config.getExperimentalHotReload();
                    data.sessionId = $sessionId;
                    ws.send(JSON.stringify( data ));
                } catch (e) {}
            });
            ws.send(JSON.stringify({ message: 'welcome!', sessionId: $sessionId }));
            ws.on('close', () => {
                Logger.warning('Connection closed');
            })
        });

        $wsServer.once('error', function(err) {
            if (err.code === 'EADDRINUSE') {
                Logger.error(`Port ${$config.getWsServerPort()} is currently in use`);
                process.exit()
            }
        });

        process.on('exit', function (){
            $wsServer.close();
        });
    };

    this.getClientCode = () => {
        let clientCodePath = FileSystem.pathFromRoot('templates/server/ws-code-client.js.template', 'utf8');
        let clientCode = FileSystem.getContent(clientCodePath);

        const vars = {
            host: $config.getHost(),
            port: $config.getWsServerPort()
        };

        for(const key in vars) {
            clientCode = clientCode.replace('%'+ key +'%', vars[key]);
        }

        return clientCode;
    };

};

export default WsServer;