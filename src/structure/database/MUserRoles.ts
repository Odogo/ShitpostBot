import { Client, Guild, Role, User } from "discord.js";
import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelInstance } from "../..";

export class MUserRoles
    extends Model<InferAttributes<MUserRoles>, InferCreationAttributes<MUserRoles>> {

    declare id: CreationOptional<number>
    declare guildId: string;
    declare userId: string;

    declare roleId: CreationOptional<string | null>;

    public async getGuild(client: Client): Promise<Guild> {
        return client.guilds.fetch(this.guildId);
    }

    public async getUser(client: Client): Promise<User> {
        return client.users.fetch(this.userId);
    }

    public async getRole(client: Client): Promise<Role | null> {
        const rId = this.roleId;
        if (!rId) return null;
        
        return this.getGuild(client).then((guild) => {
            return guild.roles.fetch(rId);
        });
    }

    public static async initialize() {
        return MUserRoles.init({
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            guildId: {
                type: DataTypes.STRING,
                allowNull: false
            },
            userId: {
                type: DataTypes.STRING,
                allowNull: false
            },
            roleId: {
                type: DataTypes.STRING,
                allowNull: true
            }
        }, {
            sequelize: sequelInstance,
            tableName: "userRoles",
            timestamps: false
        });
    }

}