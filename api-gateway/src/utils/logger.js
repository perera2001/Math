const logger = {
  info: (msg) => console.log(`[INFO]  ${new Date().toISOString()} | API-GW | ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} | API-GW | ${msg}`),
  warn: (msg) => console.warn(`[WARN]  ${new Date().toISOString()} | API-GW | ${msg}`),
};

module.exports = logger;
