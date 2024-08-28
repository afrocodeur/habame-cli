import Start from "./start/Start.js";
import Generate from "./generate/Generate.js";
import CreateApp from "./create-app/CreateApp.js";
import Build from "./build/Build.js";

export const COMMANDS = {
    start: Start,
    s: Start,
    generate: Generate,
    create: CreateApp,
    build: Build
};