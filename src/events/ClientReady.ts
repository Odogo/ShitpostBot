import provider from 'play-dl';
import { ActivityType, Events } from 'discord.js';

import { KyEvent } from "../structure/classes/discord/KyEvent";
import { error } from '../utilities/System';

import { version } from '../../package.json';

export default new KyEvent(Events.ClientReady, async (client) => {
    await provider.getFreeClientID().then(async (clientId) => {
        await provider.setToken({ soundcloud: { client_id: clientId } }).catch(reason => {
            error("Could not validate token for Soundcloud: " + reason);
            error(reason);
        });
    }).catch(reason => {
        error("Could not fetch token for Soundcloud: " + reason);
        error(reason);
    });

    client.user.setActivity({
        type: ActivityType.Competing,
        name: "Shitposting (" + version + ")",
    });
});