import { CommandInteraction, GuildMember } from "discord.js";

export interface KyInteraction extends CommandInteraction {
    member: GuildMember;
}