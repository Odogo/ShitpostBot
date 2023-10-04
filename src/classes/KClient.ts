import { ApplicationCommandData, ApplicationCommandDataResolvable, Client, ClientEvents, ClientOptions, Collection, Events } from "discord.js";
import { PathLike } from "fs";
import { TKCommandOptions } from "./KCommand";
import { lstat, readdir } from "fs/promises";
import { logDebug, logError, logWarn } from '../system';
import { join } from "path";
import { KEvent } from "./KEvent";

export class KClient extends Client {

    protected clientId: string;

    public cmdPath: PathLike;
    public eventPath: PathLike;

    private commands: Collection<string, TKCommandOptions>

    constructor(options: ClientOptions, token?: string, clientId?: string, cmdPath?: PathLike, eventPath?: PathLike) {
        super(options);

        this.token = token;
        this.clientId = clientId;

        this.cmdPath = cmdPath;
        this.eventPath = eventPath;

        this.commands = new Collection();
    }

    public override async login(token = this.token): Promise<string> {
        await this.registerCommands();
        await this.registerEvents();

        return super.login(token);
    }

    private async registerCommands() {
        logDebug("[Commands] Gathering commands for registration...");
        if(!this.cmdPath) {
            logWarn("No command path given, assuming no commands are needed to be registered!");
            return;
        }

        let cmds = await fetchCommandFiles(this.cmdPath);
        cmds.forEach((value, key) => this.commands.set(key, value));
        logDebug("[Commands] Commands gathered, awaiting bot status of 'Ready'");
    }

    private async registerEvents() {
        this.once(Events.ClientReady, async () => {
            await this.pushCommandsToDiscord(Array.from(this.commands.values()));
        });

        logDebug("[Events] Gathering events..");
        if(!this.eventPath) {
            logWarn("No event path given, assuming no events are needed to be registered!");
            return;
        }
    
        let events = await fetchEventFiles(this.eventPath);
        events.forEach(async (event) => this.on(event.event, event.run));
        logDebug("[Events] Events registered.");
    }

    private async pushCommandsToDiscord(commands: Array<ApplicationCommandDataResolvable>) {
        logDebug("[Commands] Bot ready, attempting to push to discord...");
        try {
            await this.application.commands.set(commands);
            logDebug("[Commands] Successfully pushed to discord.");
        } catch(reason) {
            logError("[Commands] Failed to push commands to discord: " + reason);
            throw reason;
        }
    }
}

export async function fetchCommandFiles(directory: PathLike): Promise<Collection<string, TKCommandOptions>> {
    return new Promise(async (resolve, reject) => {
        const commands = new Collection<string, TKCommandOptions>();

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
                        const cmd: TKCommandOptions = (await import(filePath))?.default;
                        if(!cmd.name || !cmd.description) { 
                            logWarn("Found command file with no name or description, ignoring! [" + filePath + "]");
                            continue;
                        }

                        commands.set(cmd.name, cmd);
                    } else {
                        logWarn("Found misc file " + filePath + " inside commands folder. Ignoring, but repair or remove it!");
                    }
                } else if(fileStats.isDirectory()) {
                    let subCommands = await fetchCommandFiles(filePath);
                    subCommands.forEach((value, key) => commands.set(key, value));
                } else {
                    logError("Path " + filePath + " is not a file or directory, delete this file!");
                    reject("Path " + filePath + " is neither file or directory");
                }
            }
        }).catch(reject);

        resolve(commands);
    });
}

export async function fetchEventFiles(directory: PathLike): Promise<Array<KEvent<keyof ClientEvents>>> {
    return new Promise(async (resolve, reject) => {
        const events = new Array<KEvent<keyof ClientEvents>>();

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
                        const event: KEvent<keyof ClientEvents> = (await import(filePath))?.default;
                        events.push(event);
                    }
                } else if(fileStats.isDirectory()) {
                    let subEvents = await fetchEventFiles(filePath);
                    subEvents.forEach((event) => events.push(event));
                } else {
                    logError("Path " + filePath + " is not a file or directory, delete this file!");
                    reject("Path " + filePath + " is neither file or directory");
                }
            }
        }).catch(reject);

        resolve(events);
    });
}