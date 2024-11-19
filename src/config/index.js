const path = require('path');

module.exports = {
  PORT: 3000,
  DB_FILE: path.join(__dirname, '..', 'db', 'pm2-status.json')
};