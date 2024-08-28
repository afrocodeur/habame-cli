import Path from 'node:path';
import Fs from 'node:fs';
import Url from 'node:url';

const __dirname = Path.resolve(Path.dirname(Url.fileURLToPath(import.meta.url)), '../..');

const FileSystem = {
    ext: function (filename) {
        return filename
            .split('.')
            .filter(Boolean)
            .slice(1)
            .join('.');
    },
    isJsonFile: function(filename) {
        return this.ext(filename).toLowerCase() === 'json';
    },
    pathFromCwd: function(subPath) {
        return Path.resolve(subPath);
    },
    resolve: function(root, subPath) {
        return Path.resolve(root, subPath);
    },
    existInCwd: function(subPath) {
        return Fs.existsSync(this.pathFromCwd(subPath));
    },
    pathFromRoot: function(subPath) {
        return Path.resolve(__dirname, subPath);
    },
    getContent: function(path) {
        return Fs.readFileSync(path, 'utf-8');
    },
    putContent: function(path, content) {
        return Fs.writeFileSync(path, content, 'utf-8');
    },
    eachFileFrom: function(path, callback, options = {}) {
        return Fs.readdirSync(path).forEach(function(filename) {
            const filePath = Path.resolve(path, filename);
            if(Fs.lstatSync(filePath).isDirectory()) {
                FileSystem.eachFileFrom(filePath, callback);
                return;
            }
            callback({ path: filePath, name: filename });
        });
    },
    removeDir: function(path) {
        if(Fs.existsSync(path)) {
            Fs.rmdirSync(path, { recursive: true });
        }
    }
};

export default FileSystem;