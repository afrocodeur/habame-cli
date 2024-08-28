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
    const $scriptBuilder = $builder.scriptBuilder();

    this.serve = () => {
        if(!$wsServer) {
            $wsServer = new WebSocketServer({ port: $config.getWsServerPort() }, () => {
                Logger.info('Websocket server run on '+ $config.getWsServerPort());
            });
        }
        $builder.setWsClientCode(this.getClientCode());
        $wsServer.on('connection', function connection(ws) {
            ws.on('message', function message(data) {
                Logger.log('received: %s', data);
            });
            $scriptBuilder.on(ScriptCodeBuilder.UPDATED, (data) => {
                try {
                    ws.send(JSON.stringify( data ));
                } catch (e) {}
            });
            ws.send(JSON.stringify({ message: 'welcome!' }));
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