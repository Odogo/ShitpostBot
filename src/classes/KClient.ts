import { Client, ClientOptions } from "discord.js";

export class KClient extends Client {

    protected clientId: string;

    constructor(options: ClientOptions, token?: string, clientId?: string) {
        super(options);

        this.token = token;
        this.clientId = clientId;
    }
}