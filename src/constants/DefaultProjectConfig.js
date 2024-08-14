import xmlEngine from "../modules/HbFileBuilder/xmlEngine.js";

export default {
    name: 'Habame project',
    entry: {
        html: 'public/index.html',
        script: 'src/main.js',
        modules: 'src/app.module.js'
    },
    server: {
        port: 8000,
        wsPort: 8001
    },
    plugins: {
        view: [xmlEngine],
        script: [],
        style: []
    },
    build: {
        default: {
            output: 'dist/',
            type: '',
            plugins: []
        }
    }
};