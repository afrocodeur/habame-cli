import { createRequire } from 'node:module';
import Os from 'node:os';


const require = createRequire(import.meta.url);

const CustomRequire = {
    get: async ($filename) => {
        const absoluteFileName = (Os.type() === 'Windows_NT') ? 'file://'+ $filename : $filename;
        return (await import(absoluteFileName +'?update='+ Date.now())).default;
    }
}

export default CustomRequire;