import { rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import Logger from "../Logger/Logger.js";

const devOutputConfigs = [
    {
        format: 'es',
    },
];

const inputOptions = {
    plugins: [
        babel({
            babelHelpers: 'bundled',
            exclude: ['node_modules/**']
        }),
        // commonjs(),
        resolve(),
    ],
    onwarn: function(message) {
        if(message.code === 'UNKNOWN_OPTION') {
            return false;
        }
        // Logger.warning(message);
    }
};

const RollupBuilder = function() {

    this.build = async function(entryFile, outputConfigs) {
        let bundle;
        let buildFailed = false;
        let outputResponse = [];
        inputOptions.input = entryFile;
        console.log('use rollup on '+ entryFile);
        try {
            // create a bundle
            bundle = await rollup(inputOptions);

            const response = await bundle.generate(outputConfigs || devOutputConfigs);
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