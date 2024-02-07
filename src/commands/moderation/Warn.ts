import { ApplicationCommandOptionType, Colors, EmbedBuilder, GuildMember, User } from "discord.js";
import { KCommand } from "../../classes/objects/KCommand";
import { createPunishment } from "../../modules/Punishments";

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
        }, {
            type: ApplicationCommandOptionType.Integer,
            name: "expires",
            description: "The duration of the warning in minutes",
            required: false,
        }
    ],

    run: async (client, interaction, options) => {
        const guild = interaction.guild;

        if(!guild)
            return await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true })

        const target = options.getUser("user", true);
        const reason = options.getString("reason", true);

        // Maybe add a server configuration setting to default setting for silent punishments?
        const silent = options.getBoolean("silent", false) || false;
        const expires = options.getInteger("expires", false) || 0;

        const punishment = await createPunishment({
            punishType: "Warning",
            guildId: interaction.guild.id,
            userId: target.id,
            punishedBy: interaction.user.id,
            reason: reason,
            punishedAt: Date.now(),
            expiresAt: (expires > 0 ? Date.now() + (expires * 60000) : 0)
        });

        await interaction.reply({ ephemeral: silent, embeds: [new EmbedBuilder({
            color: Colors.Gold,
            title: "User Warned",
            description: `**<@${target.id}>** has been warned for **${reason}**.`,
            footer: { text: `Punishment ID: ${punishment.punishId}` },
            timestamp: new Date(),
        })]});

        target.createDM(true).then(async (dm) => {
            await dm.send({ embeds: [new EmbedBuilder({
                color: Colors.Gold,
                title: "Warning Received",
                description: `You have been warned in **${guild.name}** for **${reason}**.\n\nThis warning will expire in <t:${Math.floor(punishment.expiresAt / 1000)}:R>.`,
                footer: { text: `Punishment ID: ${punishment.punishId}` },
                timestamp: new Date(),
            })] });
        });
    }
});