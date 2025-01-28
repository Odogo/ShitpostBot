import { ColorResolvable, GuildMember, HexColorString, Role, User } from "discord.js";
import { MUserRoles } from "../database/MUserRoles";
import { Client } from '../../index';

export class UserRoles {

    /**
     * Finds the entry for the user in the database
     * @param user the user (or guild member) to find the role for
     * @returns the user role entry, or null if not found
     */
    public static async getUserRole(user:  GuildMember) {
        return MUserRoles.findOne({ where: { userId: user.id, guildId: user.guild.id } });
    }

    /**
     * Checks whether or not this member has a user role in the guild
     * @param user the user to check
     * @returns true if the user has a user role, false otherwise
     */
    public static async hasUserRole(user: GuildMember): Promise<boolean> {
        return !!await this.getUserRole(user);
    }

    public static async importUserRole(user: GuildMember, role: Role): Promise<Role> {
        return new Promise(async (resolve, reject) => {
            let userRole = await this.getUserRole(user);
            if (!userRole) { userRole = await MUserRoles.create({ userId: user.id, guildId: user.guild.id }); }

            userRole.roleId = role.id;
            await userRole.save();

            if (!user.roles.cache.has(role.id)) { await user.roles.add(role); }
            return resolve(role);
        });
    }

    /**
     * Updates a user role for a user in a guild with the given name and color
     * @param user the user to update the role for
     * @param roleName  the name of the role
     * @param roleColor the color of the role
     * @returns the role that was created or updated
     */
    public static async updateUserRole(user: GuildMember, roleName: string, roleColor: HexColorString): Promise<Role> {
        return new Promise(async (resolve, reject) => {
            const guild = user.guild;

            let userRole = await this.getUserRole(user);
            if (!userRole) { userRole = await MUserRoles.create({ userId: user.id, guildId: user.guild.id }); }

            const role = await userRole.getRole(Client) || await guild.roles.create({ name: roleName, color: roleColor });
            if (!role) { return reject("Failed to create role."); }

            if (role.name !== roleName || role.hexColor !== roleColor) {
                await role.edit({ name: roleName, color: roleColor, reason: "User request (handled by Shitpost)" });
            }

            userRole.roleId = role.id;
            await userRole.save();

            if (!user.roles.cache.has(role.id)) { await user.roles.add(role); }
            return resolve(role);
        });
    }

    /**
     * Updates a user role for a user in a guild with the given name
     * @param user the user to update the role for
     * @param roleName  the name of the role
     * @returns the role that was created or updated
     */
    public static async updateUserRoleName(user: GuildMember, roleName: string): Promise<Role> {
        return new Promise(async (resolve, reject) => {
            const guild = user.guild;

            let userRole = await this.getUserRole(user);
            if (!userRole) { userRole = await MUserRoles.create({ userId: user.id, guildId: user.guild.id }); }

            const role = await userRole.getRole(Client) || await guild.roles.create({ name: roleName });
            if (!role) { return reject("Failed to create role."); }

            if (role.name !== roleName) {
                await role.edit({ name: roleName, reason: "User request (handled by Shitpost)" });
            }

            userRole.roleId = role.id;
            await userRole.save();

            if (!user.roles.cache.has(role.id)) { await user.roles.add(role); }
            return resolve(role);
        });
    }

    /**
     * Updates a user role for a user in a guild with the given color
     * @param user the user to update the role for
     * @param roleColor the color of the role
     * @returns the role that was created or updated
     */
    public static async updateUserRoleColor(user: GuildMember, roleColor: HexColorString): Promise<Role> {
        return new Promise(async (resolve, reject) => {
            const guild = user.guild;

            let userRole = await this.getUserRole(user);
            if (!userRole) { userRole = await MUserRoles.create({ userId: user.id, guildId: user.guild.id }); }

            const role = await userRole.getRole(Client) || await guild.roles.create({ color: roleColor });
            if (!role) { return reject("Failed to create role."); }

            if (role.hexColor !== roleColor) {
                await role.edit({ color: roleColor, reason: "User request (handled by Shitpost)" });
            }

            userRole.roleId = role.id;
            await userRole.save();

            if (!user.roles.cache.has(role.id)) { await user.roles.add(role); }
            return resolve(role);
        });
    }

    /**
     * Deletes the given user's user role in the guild and the database.
     * @param user the user to delete the role for
     * @returns a promise that resolves when the role is deleted
     */
    public static async deleteUserRole(user: GuildMember): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const userRole = await this.getUserRole(user);
            if (!userRole) { return reject("User does not have a user role."); }

            const role = await userRole.getRole(Client);
            if (!role) {
                await userRole.destroy();
                return reject("User role does not exist.");
            }

            await userRole.destroy();
            await role.delete("User request (handled by Shitpost)");

            return resolve();
        });
    }
}