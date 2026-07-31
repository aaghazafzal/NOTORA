const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');
const bigInt = require('big-integer');

const apiId = 21798363;
const apiHash = 'bd1b7774786435c5c0663704dc174fde';
const stringSession = new StringSession(fs.readFileSync('session.txt', 'utf8').trim());

(async () => {
    const client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 });
    await client.connect();

    const messages = await client.getMessages('me', { limit: 10 });
    const message = messages.find(m => m.media && m.media.document);
    
    if (!message) {
        console.log("No document found");
        process.exit(1);
    }

    const fileSize = message.media.document.size;
    console.log("File size:", fileSize.toString());

    const start = 0;
    const end = 100000;

    const requestSize = 1024 * 512;
    const offset = bigInt(start);
    const limit = Math.ceil((end - start + 1) / requestSize);
    console.log("Fetching offset", offset.toString(), "limit", limit);

    let chunks = [];
    for await (const chunk of client.iterDownload({ file: message.media, offset, limit, requestSize })) {
        chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    console.log("Downloaded bytes:", buffer.length);
    console.log("Buffer matched requested size?", buffer.length >= (end - start + 1));
    process.exit(0);
})();
