require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const email = process.argv[2];
if (!email) { console.error('Usage: node scripts/makeAdmin.js <email>'); process.exit(1); }

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const user = await User.findOneAndUpdate({ email: email.toLowerCase() }, { role: 'admin' }, { new: true });
  if (!user) { console.error('User not found:', email); process.exit(1); }
  console.log(`✓ ${user.name} (${user.email}) is now admin`);
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
