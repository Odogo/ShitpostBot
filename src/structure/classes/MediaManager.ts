import provider, { SoundCloudPlaylist, SoundCloudTrack, SpotifyAlbum, SpotifyPlaylist, SpotifyTrack } from 'play-dl';
import { warn } from '../../utilities/System';
import { SongDetails } from './SongDetails';
import { ServerQueueModel } from '../../utilities/database/ServerQueueModel';
import { Guild } from 'discord.js';

export class MediaManager {
    
    /**
     * Finds a valid song regarding the URL given. The URLs accepted are:
     * >- YouTube
     * >- Spotify
     * >- Soundcloud
     * 
     * Any other URL will be rejected. 
     *
     * @param url a https valid url, with the guidelines above
     * @returns the final resulting URL(s)
     * 
     * Update: added .then() and .catch() to promises for proper error handling.
     */
    public static async finalizeURL(url: string): Promise<string[]> {
        return new Promise(async (resolve, reject) => {
            if(!url.startsWith("https")) { reject(new Error("Invalid URL")); }

            let urls = new Array<string>();
            let spValidate = provider.sp_validate(url), soValidate = await provider.so_validate(url), ytValidate = provider.yt_validate(url);

            // Spotify Validation
            if(spValidate && spValidate !== 'search') {
                if(provider.is_expired()) { await provider.refreshToken().catch(reject); }

                await provider.spotify(url).then(async (spot) => {
                    if(spot.type === 'track') {
                        spot = spot as SpotifyTrack
                        await provider.search(spot.name)
                            .then((fsong) => urls.push(fsong[0].url))
                            .catch(warn);
                    } else {
                        spot = spot as SpotifyPlaylist | SpotifyAlbum;
                        await spot.all_tracks().then(async (tracks) => {
                            for(let i=0; i<tracks.length; i++) {
                                await provider.search(tracks[i].name).then((fsong) => urls.push(fsong[0].url));
                            }
                        }).catch(reject);
                    }
                });
            }

            // Soundcloud Validation
            else if(soValidate && soValidate !== 'search') {
                await provider.soundcloud(url).then(async (cloud) => {
                    if(cloud.type === 'track') {
                        cloud = cloud as SoundCloudTrack;
                        await provider.search(cloud.name)
                            .then((fsong) => urls.push(fsong[0].url))
                            .catch(warn)
                    } else {
                        cloud = cloud as SoundCloudPlaylist;
                        await cloud.all_tracks().then(async tracks => {
                            for(let i=0; i<tracks.length; i++) {
                                await provider.search(tracks[i].url)
                                    .then((fsong) => urls.push(fsong[0].url))
                                    .catch(warn);
                            }
                        }).catch(reject);
                    }
                }).catch(reject);
            }

            // YouTube Validation
            else if(ytValidate === 'video') { urls.push(url); }
            else if(ytValidate === 'playlist') {
                await provider.playlist_info(url).then(async (playlist) => {
                    await playlist.all_videos().then(tracks => {
                        for(let i=0; i<tracks.length; i++) { urls.push(tracks[i].url); }
                    }).catch(warn);
                }).catch(reject);
            } else {
                reject(new Error("Invalid URL"));
            }

            resolve(urls);
        });
    }

    /**
     * Using the keywords, searches for a video and returns a single url.
     * 
     * @param keywords the keywords to search for
     * @returns the resulting URL
     */
    public static async searchForURL(keywords: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            await provider.search(keywords, { limit: 1 })
                .then(result => resolve(result[0].url))
                .catch(reject);
        });
    }

    /**
     * Using the provided guild, pulls from the database to find the specific queue for the guild.
     * The method will return the entire list of URLs since the bot joined the voice channel, if it exists.
     * 
     * @param guild the guild to pull from
     * @returns an array of urls, otherwise undefined.
     */
    public static async fetchSongQueue(guild: Guild): Promise<Array<SongDetails> | undefined> {
        return new Promise(async (resolve, reject) => {
            await ServerQueueModel.findOne({ where: { guildId: guild.id } }).then(async data => {
                if(!data) resolve(undefined);

                let songs = new Array<SongDetails>();

                let parsed = JSON.parse(data.queueList);
                for(let i=0; i<parsed.length; i++) {
                    let result = SongDetails.fromJsonString(JSON.stringify(parsed[i]));
                    if(result != null) songs.push(result);
                }

                resolve(songs);
            }).catch(reject);
        });
    }

    /**
     * @deprecated Internal use only.
     * 
     * Sets the entire list of songs into the database.
     * 
     * @param guild the guild to set the list of songs to
     * @param songs the aforementioned list of songs
     */
    public static async setSongQueue(guild: Guild, songs: Array<SongDetails>): Promise<void> {
        return new Promise(async (resolve, reject) => {
            await ServerQueueModel.findOne({ where: { guildId: guild.id }}).then(async (data) => {
                if(!data) {
                    await ServerQueueModel.create({ guildId: guild.id, queueList: JSON.stringify(songs) })
                        .then(() => resolve())
                        .catch(reject);
                } else {
                    await ServerQueueModel.update({ queueList: JSON.stringify(songs)}, { where: { guildId: guild.id }})
                        .then(() => resolve())
                        .catch(reject);
                }
            }).catch(reject);
        });
    }

    /**
     * Fetches the current list of songs in the queue, and adds the array of songs provided into the queue
     * and sets the new array back into the database while also returning it.
     * 
     * @param guild the guild to add a song to
     * @param songs the aforementioned song
     * @returns the new complete list of songs for the guild
     */
    public static async addSongsToQueue(guild: Guild, songs: Array<SongDetails>): Promise<Array<SongDetails>> {
        return new Promise(async (resolve, reject) => {
            await this.fetchSongQueue(guild).then(async (details) => {
                if(details == undefined)
                    details = new Array<SongDetails>();

                for(let i=0; i<songs.length; i++)
                    details.push(songs[i]);

                await this.setSongQueue(guild, details)
                    .then(() => resolve(details))
                    .catch(reject);
            }).catch(reject);
        });
    }

    /**
     * Goes through the entire queue and finds all index points of where a match of the song exists.
     * 
     * @param guild the guild to grab from
     * @param song the song to look for [realistically only needs a url]
     * @returns all instance indexes of where the given song is
     */
    public static async hasSong(guild: Guild, song: SongDetails): Promise<Array<number>> {
        return new Promise(async (resolve, reject) => {
            await this.fetchSongQueue(guild).then(async (details) => {
                let indexs = new Array<number>();

                for(let i=0; i<details.length; i++) {
                    if(details[i].songUrl === song.songUrl)
                        indexs.push(i);
                }

                resolve(indexs);
            }).catch(reject);
        });
    }
}