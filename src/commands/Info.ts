import { ApplicationCommandOptionType, Embed, EmbedBuilder, UserFlags, UserFlagsBitField } from "discord.js";
import { KCommand } from "../classes/objects/KCommand";

export default new KCommand({
    name: "info",
    description: "A command to gather information about a specific thing",

    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "server",
            description: "Gathers information about the current server",
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "member",
            description: "Gathers information about a member in the guild",

            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "user",
                    description: "The user to gather info about",
                    required: true
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "role",
            description:" Gathers information about a role in the guild",

            options: [
                {
                    type: ApplicationCommandOptionType.Role,
                    name: "role",
                    description: "The role to gather info about",
                    required: true
                }
            ]
        }
    ],

    run: async (client, interaction, options) => {
        if(client.user === null) return;

        const { guild } = interaction;
        if(guild === null)
            return await interaction.reply({ content: "This command was not executed inside of a guild. If you believe tis was a mistake, try again or report this issue!", ephemeral: true });

        const embed = new EmbedBuilder();
        embed.setTimestamp()
            .setColor(0x6f2dfc)
            .setFooter({ text: client.user.displayName, iconURL: client.user.avatarURL({ extension: "png", size: 1024 }) || undefined })

        let subCommand = options.getSubcommand();
        if(subCommand === "server") {
            embed.setTitle("Server Information")
                .setAuthor({ name: guild.name, iconURL: guild.iconURL({ extension: 'png', size: 1024 }) || undefined })
                .addFields([
                    { name: "Created", value: "<t:" + Math.floor(guild.createdTimestamp / 1000) + ":R>", inline: true },
                    { name: "Members", value: guild.memberCount + " members", inline: true },
                    { name: "Roles", value: guild.roles.cache.size + " roles", inline: true },
                    { name: "Channels", value: guild.channels.cache.size + " channels", inline: true }
                ]).setThumbnail(guild.iconURL({ extension: 'png', size: 1024 }));
        } else if(subCommand === "user") {
            const user = options.getUser("user", true);
            const member = await guild.members.fetch(user);

            embed.setTitle("User Information")
                .setAuthor({ name: user.displayName, iconURL: user.avatarURL({ extension: 'png', size: 1024 }) || undefined})
                .addFields([
                    { name: "Joined", value: "<t:" + Math.floor(user.createdTimestamp / 1000) + ":R>", inline: true }
                ]).setThumbnail(user.avatarURL({ extension: 'png', size: 1024}));

            const roles = Array.from(member.roles.cache.values());
            const roleIds = roles.map((role) => "<@&" + role.id + ">");
            embed.addFields({ name: "Roles", value: (roles.length <= 0 ? "No roles" : roleIds.join(", ")) });

            const userFlags = user.flags;
            if(userFlags !== null) {
                let flags = Object.entries(UserFlagsBitField.Flags).reduce((obj, [perm, value]) => ({ ...obj, [perm]: userFlags.has(value) }), {} as UserFlag);
            }
        } else if(subCommand === "role") {
            const role = options.getRole("role", true);

            embed.setTimestamp("Role Information")
        } else {
            return await interaction.reply({ content: "Invalid subcommand option, something wrong must've happened as you should not be seeing this! Try again or report this issue!", ephemeral: true });
        }

        await interaction.reply({ embeds: [embed] });
    }
})

type UserFlag = {
    [K in keyof typeof UserFlags]: boolean
}