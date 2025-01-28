import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, HexColorString, PermissionFlagsBits, Role } from "discord.js";
import { ShitCommand } from "../structure/ShitCommand";
import { UserRoles } from "../structure/modules/UserRoles";
import { MUserRoles } from "../structure/database/MUserRoles";

const regex = /^#[0-9A-F]{6}$/i;

export default new ShitCommand({
    name: "userrole",
    description: "Manages your own personal colourful role in the server!",

    options: [
        {
            name: "set",
            description: "Sets your user role",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "name",
                    description: "The name of the role",
                    type: ApplicationCommandOptionType.String,
                },
                {
                    name: "color",
                    description: "A HEX color code for the role",
                    type: ApplicationCommandOptionType.String,
                }
            ]
        }, {
            name: "delete",
            description: "Deletes your user role",
            type: ApplicationCommandOptionType.Subcommand
        }, {
            name: "info",
            description: "Gets information about your user role",
            type: ApplicationCommandOptionType.Subcommand
        }, {
            name: "import",
            description: "Imports a user role from another system",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "role",
                    description: "The role to import",
                    type: ApplicationCommandOptionType.Role,
                    required: true
                }
            ]
        }
    ],

    run: async (client, interaction, options) => {
        if (!interaction.inGuild()) return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });

        const guild = await client.guilds.fetch(interaction.guildId);
        const member = await guild.members.fetch(interaction.user.id);

        const subcommand = options.getSubcommand(true);

        switch (subcommand) {
            case "set": {
                const name = options.getString("name", false);
                const color = options.getString("color", false);

                if (color && !regex.test(color)) {
                    return interaction.reply({ content: "The color must be a valid HEX color code. [Search 'hex color picker' in google or alternative methods to acquire one!](https://www.google.com/search?q=hex+color+picker)", ephemeral: true });
                }

                let role: Role;
                if (name && color) {
                    role = await UserRoles.updateUserRole(member, name, color as HexColorString);
                } else if (name) {
                    role = await UserRoles.updateUserRoleName(member, name);
                } else if (color) {
                    role = await UserRoles.updateUserRoleColor(member, color as HexColorString);
                } else {
                    return interaction.reply({ content: "You must provide a name and/or a color when updating your role.", ephemeral: true });
                }

                return interaction.reply({
                    content: "Successfully updated user role!",
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Role Updated")
                            .setDescription("<@&" + role.id + ">")
                            .setColor(color as HexColorString)
                    ]
                });
            }
            case "delete": {
                const actionRow = new ActionRowBuilder<ButtonBuilder>({
                    components: [
                        new ButtonBuilder({
                            customId: "confirm_userrole_delete",
                            label: "Confirm",
                            style: ButtonStyle.Success,
                            emoji: "✅"
                        }),
                        new ButtonBuilder({
                            customId: "cancel_userrole_delete",
                            label: "Cancel",
                            style: ButtonStyle.Danger,
                            emoji: "❌"
                        })
                    ]
                });

                const response = await interaction.reply({ content: "## :warning: Hold Up!\n Are you sure you want to delete your user role? **This action cannot be undone!**", components: [actionRow] });
                const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60_000, filter: (interaction) => interaction.user.id === member.id });

                collector.on("collect", async (bInteraction) => {
                    if (bInteraction.customId === "confirm_userrole_delete") {
                        await UserRoles.deleteUserRole(member);

                        await bInteraction.update({ content: "Successfully deleted <@" + member.id + ">'s user role.", components: [] });
                    } else if (bInteraction.customId === "cancel_userrole_delete") {
                        await bInteraction.update({ content: "Cancelled, no action was performed on your user role!", components: [] });
                    }

                    collector.stop();
                });
                break;
            }
            case "info": {
                const userRole = await UserRoles.getUserRole(member);
                if (userRole == null) return interaction.reply({ content: "You do not have a user role set.", ephemeral: true });

                const role = await userRole.getRole(client);
                if (role == null) return interaction.reply({ content: "Your user role was not found in the server.", ephemeral: true });

                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle((member.nickname || member.displayName) + "'s User Role")
                            .setDescription("<@&" + role.id + ">\n\n**Name:** " + role.name + "\n**Color:** " + role.hexColor)
                            .setColor(role.hexColor)
                    ]
                });
                break;
            }
            case "import": {
                const role = await guild.roles.fetch(options.getRole("role", true).id);
                if (role == null) return interaction.reply({ content: "The role could not be found.", ephemeral: true });

                if (role.managed) {
                    return interaction.reply({ content: "You cannot import a role that is managed by an integration.", ephemeral: true });
                }

                if (await MUserRoles.findOne({ where: { roleId: role.id } })) {
                    return interaction.reply({ content: "This role is already being used as a user role.", ephemeral: true });
                }

                let members = (await guild.members.fetch()).filter(member => member.roles.cache.has(role.id));
                if (members.size > 1) {
                    if (members.size == 2) {
                        const otherMember = members.filter(member => member.id !== interaction.user.id).first();
                        if (otherMember == null) return interaction.reply({ content: "You cannot import a role that is not unique to you.", ephemeral: true });

                        const actionRow = new ActionRowBuilder<ButtonBuilder>({
                            components: [
                                new ButtonBuilder({
                                    customId: "confirm_userrole_alternative_account",
                                    label: "Confirm",
                                    style: ButtonStyle.Success,
                                    emoji: "✅"
                                }),
                                new ButtonBuilder({
                                    customId: "cancel_userrole_alternative_account",
                                    label: "Cancel",
                                    style: ButtonStyle.Danger,
                                    emoji: "❌"
                                })
                            ]
                        });

                        const response = await interaction.reply({
                            content: "## :warning: Hold Up!\n" +
                                "There is another user with this role <@" + otherMember.id + "> who is potentially an alternative account to yours.\n" +
                                "If this is correct, please hit the ** Confirm ** button, otherwise cancel this action!"
                            , components: [actionRow]
                        });
                        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60_000, filter: (interaction) => interaction.user.id === member.id });

                        collector.on("collect", async (bInteraction) => {
                            if (bInteraction.customId === "confirm_userrole_alternative_account") {
                                await UserRoles.importUserRole(member, role);
                                await bInteraction.reply({
                                    content: "Successfully imported user role!",
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle((member.nickname || member.displayName) + "'s User Role")
                                            .setDescription("<@&" + role.id + ">\n\n**Name:** " + role.name + "\n**Color:** " + role.hexColor)
                                            .setColor(role.hexColor)
                                    ]
                                });
                                return;
                            } else if (bInteraction.customId === "cancel_userrole_alternative_account") {
                                await bInteraction.update({ content: "Cancelled, no action was performed on your user role!", components: [] });
                            }

                            collector.stop();
                            return;
                        });
                        return;
                    }
                    return interaction.reply({ content: "You cannot import a role that is not unique to you.", ephemeral: true });
                }

                await UserRoles.importUserRole(member, role);
                await interaction.reply({
                    content: "Successfully imported user role!",
                    embeds: [
                        new EmbedBuilder()
                            .setTitle((member.nickname || member.displayName) + "'s User Role")
                            .setDescription("<@&" + role.id + ">\n\n**Name:** " + role.name + "\n**Color:** " + role.hexColor)
                            .setColor(role.hexColor)
                    ]
                });
                break;
            }
        }
    }
});