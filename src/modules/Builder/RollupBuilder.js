import { rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import Logger from "../Logger/Logger.js";

const devOutputConfigs = {
    format: 'es',
};

const inputOptions = {
    plugins: [
        babel({
            babelHelpers: 'bundled',
            exclude: []
        }),
        resolve(),
    ],
    onwarn: function(message) {
        if(message.code === 'UNKNOWN_OPTION') {
            return false;
        }
    }
};

const RollupBuilder = function() {

    this.build = async function(entryFile, outputConfigs) {
        let bundle;
        let buildFailed = false;
        let outputResponse = [];
        inputOptions.input = entryFile;
        try {
            // create a bundle
            Logger.note('Build '+ entryFile);
            bundle = await rollup(inputOptions);

            const outputOption = outputConfigs ? { ...devOutputConfigs, ...outputConfigs } : { ...devOutputConfigs };

            const response = await bundle.generate(outputOption);
            outputResponse = response.output;
        } catch (error) {
            buildFailed = true;
            // do some error reporting
            Logger.error(error);
        }
        if (bundle) {
            // closes the bundle
            await bundle.close();
        }
        return (outputResponse.length === 1) ? outputResponse[0] : outputResponse;
    };


};

export default RollupBuilder;