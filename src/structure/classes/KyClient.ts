import { ApplicationCommandDataResolvable, Client, ClientEvents, Collection, Events, GatewayIntentBits } from "discord.js";

import { lstat, readdir } from "fs/promises";
import { join } from "path";
import { PathLike } from "fs";

import { debug, error, info, warn } from "../../utilities/System";

import { KyEvent } from "./KyEvent";
import { KyCommandOptions } from "./KyCommand";

type KyClientOptions = {
    discord: {
        token: string;
        clientId: string;
    }

    commandPath: PathLike,
    eventsPath: PathLike,
}

export class KyClient extends Client {

    public clientOptions: KyClientOptions;

    public commands: Collection<string, KyCommandOptions>;

    constructor(options: KyClientOptions) {
        super({ intents: [GatewayIntentBits.MessageContent] });

        this.clientOptions = options;
        this.commands = new Collection();
    }

    public async initialize() {
		info("Initalizing...");
        await this.registerModules();

		info("Logging in...");
        await this.login(this.clientOptions.discord.token);
    }

    public async shutdown() {
        this.destroy();
    }

    public async registerModules() {
		debug("[Modules] Registering modules...");
        await this.registerCommands();
        await this.registerEvents();
		debug("[Modules] Modules registered.");
    }

    private async registerCommands() {
		debug("[Commands] Gathering commands for registration...");
        let cmds = await fetchCommandFiles(this.clientOptions.commandPath);
		cmds.forEach((value, key) => this.commands.set(key, value));
		debug("[Commands] Commands gathered, awaiting bot status of 'Ready'...");
    }

	private async pushCommandsToDiscord(commands: Array<ApplicationCommandDataResolvable>) {
		debug("[Commands] Bot ready, attempting push to discord...");
		try {
			await this.application.commands.set(commands);
			debug("[Commands] Successfully pushed commands to discord.");
		} catch(reason) {
			error("[Commands] Failed to push commands to discord: " + reason);
			throw reason;
		}
	}

    private async registerEvents() {
		this.once(Events.ClientReady, async () => { 
			await this.pushCommandsToDiscord(Array.from(this.commands.values()));
		});

		debug("[Events] Gathering events...");
		let events = await fetchEventFiles(this.clientOptions.eventsPath);
		events.forEach(async (event) => this.on(event.event, event.run));
		debug("[Events] Events registered.");
    }
}

export async function fetchCommandFiles(directory: PathLike): Promise<Collection<string, KyCommandOptions>> {
	return new Promise(async (resolve, reject) => {
		const commands = new Collection<string, KyCommandOptions>();

		await readdir(directory).then(async (files) => {
			for (let i = 0; i < files.length; i++) {
				let file = files[i];

				if (file.startsWith("ignore_")) {
					debug("Found file/directory with ignore tag, ignoring! [" + file + "]");
					continue;
				}

				if (file === "0") { continue; }

				let filePath = join(directory.toString(), file);
				let fileStats = await lstat(filePath);

				if (fileStats.isFile()) {
					if(file.endsWith(".ts")) {
						const cmd: KyCommandOptions = (await import(filePath))?.default;
						if(!cmd.name || !cmd.description) { warn("Found command file with no name or description, ignoring! [" + filePath + "]"); continue; }

						commands.set(cmd.name, cmd);
					} else {
						warn("Found misc file " + filePath + " inside commands folder. Ignoring, but repair or remove it!");
					}
				} else if (fileStats.isDirectory()) {
					let subCommands = await fetchCommandFiles(filePath);
					subCommands.forEach((value, key) => commands.set(key, value));
				} else {
					error("Path " + filePath + " is not a file or directory, delete this file!");
					reject("Path " + filePath + " is neither file or directory");
				}
			}
		}).catch(error);

		resolve(commands);
	});
}

export async function fetchEventFiles(directory: PathLike): Promise<Array<KyEvent<keyof ClientEvents>>> {
	return new Promise(async (resolve, reject) => {
		const events = new Array<KyEvent<keyof ClientEvents>>();

		await readdir(directory).then(async (files) => {
			for (let i = 0; i < files.length; i++) {
				let file = files[i];

				if (file.startsWith("ignore_")) {
					debug("Found file/directory with ignore tag, ignoring! [" + file + "]");
					continue;
				}

				if (file === "0") { continue; }

				let filePath = join(directory.toString(), file);
				let fileStats = await lstat(filePath);

				if (fileStats.isFile()) {
					if(file.endsWith(".ts")) {
						const cmd: KyEvent<keyof ClientEvents> = (await import(filePath))?.default;
						events.push(cmd);
					} else {
						warn("Found misc file " + filePath + " inside commands folder. Ignoring, but repair or remove it!");
					}
				} else if (fileStats.isDirectory()) {
					let subEvents = await fetchEventFiles(filePath);
					subEvents.forEach((event) => events.push(event));
				} else {
					error("Path " + filePath + " is not a file or directory, delete this file!");
					reject("Path " + filePath + " is neither file or directory");
				}
			}
		}).catch(error);

		resolve(events);
	});
}