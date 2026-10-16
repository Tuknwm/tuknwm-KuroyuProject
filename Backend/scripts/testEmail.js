require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sendWelcome } = require('../utils/mailer');

sendWelcome({ name: 'Test User', email: 'joenks321@gmail.com' })
  .then(() => { console.log('Email sent to joenks321@gmail.com'); process.exit(0); })
  .catch(err => { console.error('Failed:', err.message); process.exit(1); });
