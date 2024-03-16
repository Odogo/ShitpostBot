import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { ShitCommand } from "../structure/ShitCommand";
import { Punishments } from "../structure/modules/Punishments";

export default new ShitCommand({
    name: "staffhistory",
    description: "View punishments executed by a particular staff member.",

    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: "user",
            description: "The staff member to view the history of.",
            required: true
        }, {
            type: ApplicationCommandOptionType.Integer,
            name: "page",
            description: "The page of the history to view.",
            required: false,
        }, {
            type: ApplicationCommandOptionType.Integer,
            name: "limit",
            description: "The amount to display per page. (5-15)",
            required: false,
            minValue: 5,
            maxValue: 15,
        }
    ],

    run: async (client, interaction, options) => {
        if (!interaction.guild) return;

        const member = await interaction.guild.members.fetch(interaction.user.id);

        if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({ content: "You do not have permission `Manage Messages` to use this command.", ephemeral: true });
        }

        const target = await interaction.guild.members.fetch(options.getUser("user", true).id);
        const punishments = await Punishments.fetchPunishments({
            guild: interaction.guild,
            executer: target.user
        });

        if (punishments.length === 0) {
            return await interaction.reply({ content: "<@" + target.id + "> has no executed punishments with this guild." });
        }

        const page = options.getInteger("page", false) || 1;
        const limit = options.getInteger("limit", false) || 10;

        const maxPages = Math.ceil(punishments.length / limit), start = (page - 1) * limit, end = start + limit;
        if (page > maxPages) {
            return await interaction.reply({ content: "Page " + page + " does not exist.", ephemeral: true });
        }

        const embed = new EmbedBuilder({
            author: {
                name: (target.nickname ? target.nickname : target.user.username) + "'s Staff History",
                iconURL: target.user.displayAvatarURL()
            },
            color: 0xAB62F0,
            footer: {
                text: "Page " + page + " of " + maxPages + " | " + punishments.length + " total executed punishments."
            }
        });

        const slice = punishments.slice(start, end);
        for(const punishment of slice) {
            const pTarget = await punishment.fetchTarget(client);

            embed.addFields({
                name: "#" + punishment.id + " - " + punishment.getType(),
                value: "Issued to <@" + pTarget.id + "> for `" + punishment.reason + "` on " + punishment.formattedCreatedAt() + ".\nExpires " + punishment.timeLeftFormatted(false),
            });
        }

        return await interaction.reply({ embeds: [embed] });
    }
})