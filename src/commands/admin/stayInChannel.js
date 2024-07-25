const { Command } = require('@structures/Command');
const { joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const { GatewayIntentBits } = require('discord.js');
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');

// Google Cloud Text-to-Speech client setup
const client = new TextToSpeechClient();
const writeFile = util.promisify(fs.writeFile);

module.exports = new Command({
    name: 'stay',
    description: 'Makes the bot stay in a voice channel 24/7, greet users, unmute if muted, and rejoin if disconnected',
    botPermissions: ['CONNECT', 'SPEAK'],
    userPermissions: ['ADMINISTRATOR'],
    command: {
        enabled: true,
        usage: '<channel-id>',
        minArgsCount: 1,
    },
    async messageRun(message, args) {
        const channelId = args[0];
        const channel = message.guild.channels.cache.get(channelId);

        if (!channel || channel.type !== 'GUILD_VOICE') {
            return message.reply('Please provide a valid voice channel ID.');
        }

        await stayInChannel(channel);
        return message.reply(`Bot will now stay in ${channel.name} 24/7.`);
    }
});

async function stayInChannel(channel) {
    try {
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();

        connection.subscribe(player);

        // Bot greets users who join the channel
        channel.guild.client.on('voiceStateUpdate', async (oldState, newState) => {
            if (oldState.channelId !== channel.id && newState.channelId === channel.id) {
                const user = newState.member.user;
                const username = user.username;

                const request = {
                    input: { text: `Welcome, ${username}!` },
                    voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
                    audioConfig: { audioEncoding: 'MP3' },
                };

                const [response] = await client.synthesizeSpeech(request);
                const audioPath = `./welcome_${username}.mp3`;
                await writeFile(audioPath, response.audioContent, 'binary');

                const resource = createAudioResource(audioPath);
                player.play(resource);
            }

            // Unmute the bot if muted
            if (newState.member.id === channel.guild.client.user.id && newState.mute) {
                newState.setMute(false);
            }
        });

        // Reconnect the bot if disconnected
        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
            } catch (error) {
                connection.destroy();
                stayInChannel(channel);
            }
        });

    } catch (error) {
        console.error(`Failed to join the channel: ${error}`);
    }
}
