import Mongoose from "mongoose";
import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from "discord.js";

import important from "../configs/constants.js";
import userSchema from "../schemas/UserSchema.js";

const strikeIds = [
    "1367413785026887752", // Guild Strike 1
    "1367413788034334794", // Guild Strike 2
    "1385611642187939902" // Guild Strike 3 (Removal)
]

async function strike(members: GuildMember | GuildMember[], amount: number) {
    const memberList = Array.isArray(members) ? members : [members];
    const AllTimeDB = Mongoose.connection.useDb("AllTimeDB");
    const AllTimeUser = AllTimeDB.model("User", userSchema);

    const pendingRemoval: GuildMember[] = [];

    await Promise.all(
        memberList.map(async (member) => {
            try {
                // Get current strikes
                const userData = await AllTimeUser.findById(member.user.id);
                const currentStrikes = userData?.strikes ?? 0;

                // Clamp strike between 0-3
                const newStrikes = Math.max(0, Math.min(currentStrikes + amount, 3));

                // Update DB
                await AllTimeUser.updateOne(
                    { _id: member.user.id },
                    { $set: { strikes: newStrikes } },
                    { upsert: true }
                );

                // Update member roles
                let fullMember = member;
                if (!member.roles?.cache || member.partial) {
                    fullMember = await member.fetch();
                }

                if (newStrikes > 0 && newStrikes <= 3) {
                    const roleId = strikeIds[newStrikes - 1]!

                    if (!fullMember.roles.cache.has(roleId)) {
                        await fullMember.roles.remove(strikeIds).catch(() => {});
                        await fullMember.roles.add(roleId).catch(() => {});
                    }
                }
                
                if (newStrikes < 3) return;
                pendingRemoval.push(fullMember);
            } catch(err) {
                console.error(`Error while striking ${member.user.username} (${member.user.id}):`, err);
            }
        })
    );
    
    return pendingRemoval;
}

export = {
    cooldown: 5,
    allowedRoles: ["1425112155291648010", "1364898392689606667", "1319685026446704732", "1319685397697007677"],
    data: new SlashCommandBuilder()
        .setName("strike")
        .setDescription("Increment a specified member's strike count")
        .addUserOption((option) =>
            option
                .setName("member")
                .setDescription("The member to strike")
                .setRequired(true)
        )
        .addIntegerOption((option) => 
            option
                .setName("amount")
                .setDescription("The amount of strikes")
                .setMaxValue(3)
                .setMinValue(-3)
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const amount = interaction.options.getInteger("amount");
        await interaction.deferReply();

        if (!amount) {
            await interaction.editReply("Please specify strike amount");
            return;
        }

        if (!interaction.guild) {
            await interaction.editReply("This command can only be used inside a server");
            return;
        }

        const user = interaction.options.getUser("member");
        if (!user) return;

        const member = await interaction.guild.members.fetch(user.id);
        const isMember = member.roles.cache.has(important.memberId!);
        if (!isMember) {
            interaction.editReply("You can only configure strikes for Heartkeeper members");
            return;
        }

        try {
            await strike(member, amount);
            interaction.editReply(`Successfully incremented ${member.user.username}'s strike count by ${amount}`);
            console.log(`STRIKE COMMAND: ${interaction.member?.user.username} (${interaction.member?.user.id}) incremented ${member.user.username}'s (${member.user.id}) strike count by ${amount}`);
        } catch(err) {
            throw err;
        }
    },

    async runStrike(members: GuildMember | GuildMember[], amount: number) {
        let strikeMembers = await strike(members, amount);
        return strikeMembers;
    }
}