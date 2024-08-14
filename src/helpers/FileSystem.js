

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
    }
};

export default FileSystem;