import { ApplicationCommandOptionType, GuildMember } from 'discord.js';
import { KCommand } from "../classes/KCommand";
import { LoggingConfigCategory } from "../modules/Logging";

export default new KCommand({
    name: "logging",
    description: "The main command for logging",

    options: [
        {
            name: "category",
            description: "Which logging category would you like to modify?",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Messages", value: LoggingConfigCategory.MessageEvents },
                { name: "Guild Members (all)", value: LoggingConfigCategory.GuildMembersEvents },
                { name: "Guild", value: LoggingConfigCategory.GuildEvents },
                { name: "Guild Member (single)", value: LoggingConfigCategory.GuildMemberEvents },
                { name: "Voice", value: LoggingConfigCategory.VoiceEvents },
                { name: "Application", value: LoggingConfigCategory.ApplicationEvents },
            ]
        }
    ],

    run: async (client, interaction, options) => {

    }
});