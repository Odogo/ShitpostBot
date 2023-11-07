import { ApplicationCommandDataResolvable, AuditLogEvent, Client, ClientEvents, ClientOptions, Collection, Events } from "discord.js";
import { PathLike } from "fs";
import { KCommand, TKCommandOptions } from "./KCommand";
import { lstat, readdir } from "fs/promises";
import { logDebug, logError, logInfo, logWarn } from '../system';
import { join } from "path";
import { KEvent } from "./KEvent";
import { KObject } from './KObject';
import { KLogging } from "./KLogging";

type KClientOptions = {
    token: string,
    clientId: string,
    paths: KClientPaths
} & ClientOptions;

type KClientPaths = {
    commands: PathLike,
    events: PathLike,
    logging: PathLike
}

export class KClient extends Client {

    protected clientId: string;

    public paths: KClientPaths

    public commands: Collection<string, TKCommandOptions>;
    public logging: Collection<AuditLogEvent, KLogging>;

    constructor(options: KClientOptions) {
        super(options);

        this.token = options.token;
        this.clientId = options.clientId;
        this.paths = options.paths;

        this.commands = new Collection();
        this.logging = new Collection();
    }

    public override async login(token = this.token): Promise<string> {
        return new Promise(async (resolve, reject) => {
            if(token == null || token == undefined) {
                reject(new Error("token cannot be null or undefined"));
                return;
            }

            logInfo("Initializing...");
            const start = Date.now();
    
            logInfo("Registering required modules");
            await this.gatherCommands();
            await this.gatherEvents();
            await this.gatherLogging();
    
            logInfo("Attemping login with token");
            const result = await super.login(token);
            logInfo("Successfully logged in! (Took " + (Date.now() - start) + " ms to initialize)");
            resolve(result);
        });
    }

    private async gatherCommands() {
        logDebug("[Commands] Gathering commands for registration...");
        if(!this.paths.commands) {
            logWarn("No command path given, assuming no commands are needed!");
            return;
        }

        const cmds = await fetchObjectFiles<KCommand>(this.paths.commands, KCommand);
        cmds.forEach((value, key) => {
            this.commands.set(key.split("_")[1], value.rawOptions);
        });
        logDebug("[Commands] Commands gathered, awaiting bot status of 'Ready'");
    }

    private async gatherEvents() {
        this.once(Events.ClientReady, async () => {
            logInfo("Bot is now active & ready!");
            await this.pushCommandsToDiscord(Array.from(this.commands.values()));
        });

        logDebug("[Events] Gathering events..");
        if(!this.paths.events) {
            logWarn("No event path given, assuming no events are needed!");
            return;
        }
    
        const events = await fetchObjectFiles<KEvent<keyof ClientEvents>>(this.paths.events, KEvent);
        events.forEach(async (event) => { 
            this.on(event.event, event.run);
        });
        logDebug("[Events] Events registered.");
    }

    private async gatherLogging() {
        logDebug("[Logging] Gathering logging objects");
        if(!this.paths.logging) {
            logWarn("No logging path given, assuming no logging objects are needed!");
            return;
        }

        const logging = await fetchObjectFiles<KLogging>(this.paths.logging, KLogging);
        logging.forEach((value) => this.logging.set(value.logEvent, value));
        logDebug("[Logging] All logging objects gathered");
    }

    private async pushCommandsToDiscord(commands: Array<ApplicationCommandDataResolvable>) {
        logDebug("[Commands] Bot ready, attempting to push to discord...");
        try {
            await this.application?.commands.set(commands);
            logDebug("[Commands] Successfully pushed to discord.");
        } catch(reason) {
            logError("[Commands] Failed to push commands to discord: " + reason);
            throw reason;
        }
    }
}

type Constructor<T> = new (...args: any[]) => T;

export async function fetchObjectFiles<Key extends KObject>(directory: PathLike, object: Constructor<Key>): Promise<Collection<string, Key>> {
    return new Promise(async (resolve, reject) => {
        const objects = new Collection<string, Key>();

        await readdir(directory).then(async (files) => {
            for(let i=0; i < files.length; i++) {
                let file = files[i];

                if(file.startsWith("ignore_")) {
                    logDebug("Found file/directory with ignore tag, ignoring!");
                    continue;
                }

                if(file === "0") continue;

                let filePath = join(directory.toString(), file);
                let fileStats = await lstat(filePath);

                if(fileStats.isFile()) {
                    if(file.endsWith(".ts")) {
                        const importObj = (await import(filePath))?.default;
                        if(!(importObj instanceof object)) {
                            continue;
                        }

                        objects.set(importObj.objectName, importObj);
                    } else {
                        logWarn("Found misc file " + filePath + " inside commands folder. Ignoring, but repair or remove it!");
                    }
                } else if(fileStats.isDirectory()) {
                    let subCommands = await fetchObjectFiles<Key>(filePath, object);
                    subCommands.forEach((value, key) => objects.set(key, value));
                } else {
                    logError("Path " + filePath + " is not a file or directory, delete this file!");
                    reject("Path " + filePath + " is neither file or directory");
                }
            }
        }).catch(reject);

        resolve(objects);
    });
}