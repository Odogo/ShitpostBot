import { ChatInputApplicationCommandData, CommandInteraction, CommandInteractionOptionResolver, PermissionResolvable } from "discord.js"
import { ShitClient } from "./ShitClient";

export class ShitCommand {

    private _rawOptions: ShitCommandOptions;

    constructor(options: ShitCommandOptions) {
        this._rawOptions = options;
        Object.assign(this, options);
    }

    public get rawOptions() { return this._rawOptions; }
}

export type ShitCommandRun = (
    client: ShitClient,
    interaction: CommandInteraction,
    options: CommandInteractionOptionResolver
) => Promise<any>;

export type ShitCommandOptions = {
    userPermissions?: Array<PermissionResolvable>,
    run: ShitCommandRun
} & ChatInputApplicationCommandData;