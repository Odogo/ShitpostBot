import { CommandInteraction, GuildMember } from "discord.js";

export interface KInteraction extends CommandInteraction {
    member: GuildMember
}