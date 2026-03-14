const path = require('path');
const dotenv = require('dotenv');

const rootDir = path.resolve(__dirname, '..', '..');
dotenv.config({ path: path.join(rootDir, '.env') });

const env = {
  PORT: process.env.PORT || 4000,
};

module.exports = { env };

