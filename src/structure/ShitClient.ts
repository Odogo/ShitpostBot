import { ActivityType, ApplicationCommandDataResolvable, AuditLogEvent, Client, ClientEvents, ClientOptions, Collection, Events, Presence } from "discord.js"
import { logDebug, logInfo, logWarn } from '../system';
import { ShitCommandOptions } from "./ShitCommand";
import { ShitLogging } from "./ShitLogging";
import { ShitEvent } from "./ShitEvent";
import { PathLike } from "fs";
import { readdir } from "fs/promises";

export class ShitClient extends Client {

    private _paths: ShitClientPaths;

    public commands: Collection<string, ShitCommandOptions>;
    public events: Collection<keyof ClientEvents, ShitEvent<keyof ClientEvents>>;
    public logging: Collection<AuditLogEvent, ShitLogging>;

    constructor(options: ClientOptions, paths: ShitClientPaths) {
        super(options);

        this._paths = paths;

        this.commands = new Collection();
        this.events = new Collection();
        this.logging = new Collection();
    }

    public override async login(token = this.token): Promise<string> {
        return new Promise(async (resolve, reject) => {
            if(!token) return reject(new Error("token invalid, required for login"));

            logInfo("Initializing...");
            const start = Date.now();

            logInfo("Registering required modules...");
            if (this.commands.size === 0) await this.gatherCommands();
            if (this.events.size === 0) await this.gatherEvents();
            if (this.logging.size === 0) await this.gatherLogging();
            logInfo("Modules registered! (took " + (Date.now() - start) + "ms)");

            logInfo("Registering event listeners...");
            this.events?.forEach((v, k) => this.on(k, v.listener));

            this.once(Events.ClientReady, async () => { 
                logInfo("Bot is now active & ready!");
                await this.pushCommands(Array.from(this.commands.values()));
            });
            logInfo("Event listeners registered! (took " + (Date.now() - start) + "ms) [total events: " + this.events.size + "]");

            logInfo("Attempting login with token...");
            const loginResult = await super.login(token);
            logInfo("Successfully logged in! (took " + (Date.now() - start) + "ms)");
            resolve(loginResult);
        });
    }

    public async gatherCommands(filePath?: PathLike): Promise<void> {
        if(filePath === undefined) filePath = this._paths.commands;

        await fetchFiles(filePath).then(async (files) => {
            for(const file of files) {
                const command = (await import(file))?.default as ShitCommandOptions;
                this.commands?.set(command.name, command);
            }
        });
    }

    public async gatherEvents(filePath?: PathLike): Promise<void> {
        if(filePath === undefined) filePath = this._paths.events;

        await fetchFiles(filePath).then(async (files) => {
            for(const file of files) {
                const event = (await import(file))?.default as ShitEvent<keyof ClientEvents>;
                this.events?.set(event.event, event);
            }
        });
    }

    public async gatherLogging(filePath?: PathLike): Promise<void> {
        if(filePath === undefined) filePath = this._paths.logging;

        await fetchFiles(filePath).then(async (files) => {
            for(const file of files) {
                const log = (await import(file))?.default as ShitLogging;
                this.logging?.set(log.logEvent, log);
            }
        });
    }

    private async pushCommands(commands: Array<ApplicationCommandDataResolvable>) {
        if(!this.commands) throw new Error("commands not initialized");

        logDebug("Pushing commands to Discord...");
        try {
            await this.application?.commands.set(commands);
            logDebug("[Commands] Successfully pushed commands to Discord");
        } catch(reason) {
            logWarn("[Commands] Failed to push commands to Discord: " + reason);
            throw reason;
        }
    }
}

type ShitClientPaths = {
    commands: PathLike,
    events: PathLike,
    logging: PathLike
}

export async function fetchFiles(filePath: PathLike): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
        const files: Array<string> = [];

        await readdir(filePath, { withFileTypes: true }).then(async (dirents) => {
            for(const dirent of dirents) {
                if(dirent.isDirectory()) {
                    await fetchFiles(`${filePath}/${dirent.name}`).then((fetchedFiles) => {
                        files.push(...fetchedFiles);
                    });
                } else if(dirent.isFile()) {
                    files.push(`${filePath}/${dirent.name}`);
                } else {
                    logWarn(`[fetchFiles] dirent is not a file or directory: ${dirent.name}`);
                }
            }
        }).catch(reject);

        resolve(files);
    });
}