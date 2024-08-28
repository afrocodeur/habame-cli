import Util from 'node:util';
import ChildProcess from 'node:child_process';

const CommandExecutor = {
    exec: Util.promisify(ChildProcess.exec),
    spawn: ChildProcess.spawn
};

export default CommandExecutor;