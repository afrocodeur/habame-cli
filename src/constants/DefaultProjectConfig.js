import xmlEngine from "../modules/HbFileBuilder/xmlEngine.js";

export default {
    name: 'Habame project',
    entry: {
        html: 'public/index.html',
        assets: 'public',
        script: 'src/main.js',
        modules: 'src/app.module.js'
    },
    server: {
        port: 8000,
        wsPort: 8001,
        experimentalHotReload: false
    },
    plugins: {
        'view': [{callback: xmlEngine}],
    },
    build: {
        outputs: {
            dir: 'dist/',
            files: {
                css: '',
                js: ''
            }
        },
        includeHabame: true,
        type: '',
        rollup: {

        }
    }
};