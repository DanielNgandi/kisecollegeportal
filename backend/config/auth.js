module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'your_fallback_secret_key',
  JWT_EXPIRES_IN: '24h'
};