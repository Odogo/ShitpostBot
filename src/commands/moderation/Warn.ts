import { ApplicationCommandOptionType, GuildMember, User } from "discord.js";
import { KCommand } from "../../classes/objects/KCommand";
import { Punishment } from "../../modules/Punishments";

export default new KCommand({
    name: "warn",
    description: "Warn a user with a reason",

    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: "user",
            description: "The target user to warn",
            required: true
        }, {
            type: ApplicationCommandOptionType.String,
            name: "reason",
            description: "The reason for the warning",
            required: true
        }, {
            type: ApplicationCommandOptionType.Boolean,
            name: "silent",
            description: "Execute the command silently.",
            required: false,
        }
    ],

    run: async (client, interaction, options) => {
        const target = options.getUser("user", true);
        const reason = options.getString("reason", true);

        // Maybe add a server configuration setting to default setting for silent punishments?
        const silent = options.getBoolean("silent", false) || false;

        
    }
});