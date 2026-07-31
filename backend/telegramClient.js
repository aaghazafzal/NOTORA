const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');

const apiId = 33070446;
const apiHash = "43308cf4172c1319cdfce50beb5ecac6";
const botToken = "8956605278:AAG9Ddro_8BqOFpVwwAtZLV_ZXtKxHoZ52E";

const stringSession = new StringSession("");

const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

async function initClient() {
    await client.start({
        botAuthToken: botToken,
    });
    console.log("GramJS Client connected via Bot Token!");
}

async function uploadToTelegram(filePath, caption, progressCallback, channelId) {
    const message = await client.sendFile(channelId, {
        file: filePath,
        caption: caption,
        workers: 1,
        progressCallback: progressCallback
    });
    return message.id;
}

async function forwardMessage(fromChannelId, msgId, toChannelId) {
    const result = await client.invoke(new Api.messages.ForwardMessages({
        fromPeer: fromChannelId,
        id: [msgId],
        randomId: [BigInt(Math.floor(Math.random() * 1e15))],
        toPeer: toChannelId
    }));
    
    let newMsgId = null;
    for (const update of result.updates) {
        if (update.className === 'UpdateNewChannelMessage') {
            newMsgId = update.message.id;
            break;
        }
    }
    return newMsgId;
}

module.exports = { client, initClient, uploadToTelegram, forwardMessage };
