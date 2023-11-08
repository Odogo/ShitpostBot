import { ChatInputApplicationCommandData, CommandInteractionOptionResolver, PermissionResolvable } from "discord.js";
import { KClient } from "../KClient";
import { KInteraction } from "../../interfaces/KInteraction";
import { KObject } from "./KObject";

export class KCommand extends KObject {

    private _rawOptions: TKCommandOptions;

    constructor(options: TKCommandOptions) {
        super("Cmd_" + options.name);

        this._rawOptions = options;

        Object.assign(this, options);
    }

    public get rawOptions() { return this._rawOptions; }
}

export type TKCommandOptions = {
    userPermissions?: PermissionResolvable[],
    run: (client: KClient, interaction: KInteraction, options: CommandInteractionOptionResolver) => Promise<any>
} & ChatInputApplicationCommandData;