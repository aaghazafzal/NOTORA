const mongoose = require('mongoose');
const dbManager = require('./db');

(async () => {
  await dbManager.connectAll();
  const User = dbManager.getUserModel();
  const Follow = dbManager.getFollowModel();
  
  const follows = await Follow.find();
  
  await User.updateMany({}, { followers: 0, following: 0 });
  
  for (const follow of follows) {
    await User.updateOne({ uid: follow.followingId }, { $inc: { followers: 1 } }, { upsert: true });
    await User.updateOne({ uid: follow.followerId }, { $inc: { following: 1 } }, { upsert: true });
  }
  console.log('Synced followers/following counts!');
  process.exit(0);
})().catch(console.error);
