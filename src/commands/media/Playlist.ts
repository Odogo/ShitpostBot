import { ShitCommand } from "../../structure/ShitCommand";
import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import { Client, rootPath } from "../..";
import { FileEncryption } from "../../structure/util/FileEncryption";
import { Media } from '../../structure/modules/Media';
import { MediaQueueItem } from "../../structure/database/media/MediaQueueItem";

const cryptoAlgorithm = process.env.crypto_algorithm || "aes-256-cbc";
const cryptoPass = process.env.crypto_password || crypto.randomInt(1000000000).toString();

export default new ShitCommand({
    name: "playlist",
    description: "Create and restore playlists for your server or locally",

    options: [
        {
            name: "create",
            description: "Create a playlist",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "name",
                    description: "The name of the playlist",
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: "local",
                    description: "Whether to create the playlist locally or for the server [default: true]",
                    type: ApplicationCommandOptionType.Boolean
                }
            ]
        },
        {
            name: "restore",
            description: "Restore a playlist",
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: "local",
                    description: "Restore a local playlist",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "file",
                            description: "The playlist file, should end in a .sppl extension",
                            type: ApplicationCommandOptionType.Attachment,
                            required: true
                        }
                    ]
                },
                {
                    name: "server",
                    description: "Restore a server playlist",
                    type: ApplicationCommandOptionType.Subcommand,
                }
            ]
        }
    ],

    run: async (client, interaction, options) => {
        if (Media.isDisabled())
            return interaction.reply({ content: "The media module is disabled. Please visit https://github.com/Odogo/ShitpostBot/issues/55 for more information." });
        
        if (!interaction.inGuild()) return interaction.reply({ content: "This command can only be used in a server!", ephemeral: true });
        const guild = await client.guilds.fetch(interaction.guildId);
        const member = await guild.members.fetch(interaction.user.id);

        const subcommand = options.getSubcommand(true);

        if (subcommand === "create") {
            await interaction.deferReply();

            const rawName = options.getString("name", true);
            const local = options.getBoolean("local", false) ?? true;
            const name = rawName.toLowerCase().replaceAll(" ", "_");

            // const fileName = member.id + "_" + name.toLowerCase().replaceAll(" ", "_").slice(0, 16) + ".sppl";
            // const data = await FileEncryption.encrypt(name);

            // await fs.mkdir(rootPath + "/playlists", { recursive: true }); 
            // await fs.writeFile(rootPath + "/playlists/" + fileName + ".sppl", data, 'utf8');
            // await interaction.editReply({ content: "Playlist created successfully!", files: [{ attachment: rootPath + "/playlists/" + fileName + ".sppl", name: "test.sppl" }] });

            // if (local) {
            //     await fs.rm(rootPath + "/playlists/test.sppl");
            // }
            
            const fileName = member.id + "_" + name.slice(0, Math.min(name.length, 32)) + ".sppl";

            const songs = await Media.fetchGuildQueueItems(guild);
            if (songs.length === 0) {
                return interaction.reply({ content: "There are no songs in the queue to create a playlist with.", ephemeral: true });
            }

            const data = await FileEncryption.encrypt(JSON.stringify(songs, null, 4));

            const storagePath = local ? `${rootPath}/playlists/local_storage` : `${rootPath}/playlists/${guild.id}`;
            const filePath = `${storagePath}/${fileName}`;
            
            await fs.mkdir(storagePath, { recursive: true });
            await fs.writeFile(filePath, data, 'utf8');

            if (local) {
                await interaction.editReply({
                    content: "Playlist created successfully!",
                    files: [{ attachment: filePath, name: fileName }]
                });
                await fs.rm(filePath);
            } else {
                await interaction.editReply({ content: "Playlist created under server storage successfully!" });
            }
            // } else if (subcommand === "local") {
            //     const file = options.getAttachment("file", true);
            //     if (!file.name.endsWith(".sppl")) {
            //         return interaction.reply({ content: "Invalid file type! Please provide a .sppl file.", ephemeral: true });
            //     }

            //     const response = await fetch(file.url);
            //     if (!response.ok) {
            //         return interaction.reply({ content: "An error occurred while fetching the file! Error: " + response.statusText, ephemeral: true });
            //     }

            //     const data = await response.text();
            //     const decryptData = await FileEncryption.decrypt(data);

            //     return interaction.reply({ content: "Decrypted data: " + decryptData, ephemeral: true });
        } else if (options.getSubcommandGroup() != null && options.getSubcommandGroup() === "restore") {
            await interaction.reply("Fetching file from provider...")
            
            // Data should be the (still encrypted) playlist data
            let data: string | null = null;
            
            if (subcommand === "local") {
                const attachment = options.getAttachment("file", true);
                if (!attachment.name.endsWith(".sppl")) {
                    return interaction.editReply({ content: "Invalid file type! Please provide a .sppl file." });
                }

                const response = await fetch(attachment.url);
                if (!response.ok) {
                    return interaction.editReply({ content: "An error occurred while fetching the file! Error: " + response.statusText });
                }

                data = await response.text();
            } else if (subcommand === "server") {
                data = await new Promise(async (resolve, reject) => {
                    const files = await fs.readdir(`${rootPath}/playlists/${guild.id}`);
                    const playlistFiles = files.filter(file => file.endsWith(".sppl"));

                    const perPage = 10;
                    let page = 0;
                    const maxPages = Math.ceil(playlistFiles.length / perPage) - 1;

                    const dropdown = await generateSelectMenu(playlistFiles, page, perPage);

                    const reply = await interaction.followUp({
                        content: "Select a playlist to restore",
                        components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(dropdown), generateButtons(page, maxPages)],
                        embeds: [],
                        files: []
                    });

                    const collector = reply.createMessageComponentCollector({
                        filter: i => i.user.id === interaction.user.id,
                        time: 60000
                    });

                    collector.on("collect", async i => {
                        if (i.isButton()) {
                            if (i.customId === "playlist_restore_server_cancel") {
                                collector.stop();
                                return interaction.editReply({ content: "Cancelled playlist restore.", components: [] });
                            }

                            if (i.customId === "playlist_restore_server_prev") {
                                page = Math.max(0, page - 1);
                            } else if (i.customId === "playlist_restore_server_next") {
                                page = Math.min(maxPages, page + 1);
                            }

                            const newSelectMenu = await generateSelectMenu(playlistFiles, page, perPage);

                            await i.update({
                                content: "Select a playlist to restore",
                                components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(newSelectMenu), generateButtons(page, maxPages)],
                                embeds: [],
                                files: [],
                            });
                        } else if (i.isStringSelectMenu()) {
                            collector.stop();
                            await reply.delete();

                            resolve(await fs.readFile(`${rootPath}/playlists/${guild.id}/${i.values[0]}`, 'utf8'));
                            return;
                        }
                    });
                });
            }

            if (data === null) {
                return interaction.editReply({ content: "An error occurred while fetching the playlist data." });
            }

            const decryptData = await FileEncryption.decrypt(data);
            const songs: MediaQueueItem[] = JSON.parse(decryptData);

            // Update `songs` to be ordered, starting with the first song (being `queuePosition` 0, etc.)
            const orderedSongs = songs.sort((a, b) => a.queuePosition - b.queuePosition);

            if(await Media.isPlaying(guild)) {
                const reply = await interaction.followUp({
                    content: "There are songs currently playing! This will clear the queue and play the playlist.\nAre you sure you want to continue?",
                    components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId("playlist_restore_confirm")
                            .setLabel("Yes")
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId("playlist_restore_cancel")
                            .setLabel("No")
                            .setStyle(ButtonStyle.Danger)
                    )]
                });

                await reply.awaitMessageComponent({
                    componentType: ComponentType.Button,
                    filter: i => i.user.id === interaction.user.id,
                    time: 20000
                }).then(async i => {
                    if (i.isButton()) {
                        if (i.customId === "playlist_restore_confirm") {
                            await Media.removeAllQueueItems(guild);
                            await Media.updateGPlayingIndex(guild, -1);

                            await reply.delete();
                        } else {
                            return await reply.edit({ content: "Playlist restore cancelled.", components: [] });
                        }
                    }
                }).catch(async () => {
                    return reply.edit({ content: "Playlist restore timed out.", components: [] });
                });
            }

            try {
                for (let i = 0; i < orderedSongs.length; i++) {
                    const song = orderedSongs[i];
                    await Media.createQueueItem(guild, await client.users.fetch(song.requestorId), song.songUrl);
                }
            } catch (error) {
                return await interaction.editReply({ content: "An error occurred while restoring the playlist. If you've uploaded the file using the local command, verify the file is not corrupted. Otherwise, try remaking it again." });
            }

            await interaction.editReply({ content: "Playlist restored successfully!" });
            await Media.skipMediaPlayer(guild);
        }
    }
});

async function generateSelectMenu(playlist: string[], page: number, perPage: number): Promise<StringSelectMenuBuilder> {
    return new Promise(async (resolve, reject) => {
        const options = await Promise.all(playlist.slice(page * perPage, (page + 1) * perPage).map(async (file, index) => {
            const split = file.split("_");
            const memberId = split[0];
            const name = split.slice(1).join("_").slice(0, -5);

            const user = await Client.users.fetch(memberId);

            return new StringSelectMenuOptionBuilder()
                .setLabel(name)
                .setDescription(`Created by ${user.displayName}`)
                .setValue(file);
        })).then(options =>
            resolve(new StringSelectMenuBuilder()
                .setCustomId("playlist_restore_server")
                .setPlaceholder("Select a playlist to restore")
                .addOptions(options))
        ).catch(reject);
    });
}

function generateButtons(page: number, maxPages: number) {
    const prevPage = new ButtonBuilder()
        .setCustomId("playlist_restore_server_prev")
        .setLabel("Previous Page")
        .setStyle(ButtonStyle.Secondary)
    
    const currentPage = new ButtonBuilder()
        .setCustomId("playlist_restore_server_current")
        .setLabel(`Page ${page + 1}/${maxPages + 1}`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true);
    
    const nextPage = new ButtonBuilder()
        .setCustomId("playlist_restore_server_next")
        .setLabel("Next Page")
        .setStyle(ButtonStyle.Secondary);
    
    const cancel = new ButtonBuilder()
        .setCustomId("playlist_restore_server_cancel")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Danger);
    
    return new ActionRowBuilder<ButtonBuilder>().addComponents(prevPage, currentPage, nextPage, cancel);
}