#!/usr/bin/env node

'use strict';

import CommandHandler from "../src/commands/CommandHandler.js";

const commandHandler = new CommandHandler();
commandHandler.exec();