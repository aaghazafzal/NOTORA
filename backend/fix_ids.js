const mongoose = require('mongoose');
const { client, initClient, uploadToTelegram } = require('./telegramClient');
const fs = require('fs');

async function run() {
  try {
    await mongoose.connect('mongodb+srv://notora:aaghaz9431@notora.fvaoxen.mongodb.net/?appName=notora');
    console.log('Connected to DB');
    await initClient();
    console.log('Connected to Telegram');
    
    // Create a dummy pdf
    const dummyPath = './dummy.pdf';
    fs.writeFileSync(dummyPath, 'Dummy PDF content for testing');

    console.log('Uploading dummy pdf to telegram to get a real msg id...');
    // channelId is the 4th argument
    const msgId = await uploadToTelegram(dummyPath, 'Dummy.pdf', () => {}, -1004391184725);
    
    console.log('Uploaded! Msg ID:', msgId);
    
    await mongoose.connection.db.collection('books').updateMany({}, { $set: { telegramPrimaryMsgId: msgId, telegramBackupMsgId: msgId } });
    console.log('Updated all books to use real msg ID!');
    
    fs.unlinkSync(dummyPath);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
