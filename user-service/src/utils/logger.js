const logger = {
  info: (msg) => console.log(`[INFO]  ${new Date().toISOString()} | USER-SVC | ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} | USER-SVC | ${msg}`),
  warn: (msg) => console.warn(`[WARN]  ${new Date().toISOString()} | USER-SVC | ${msg}`),
};

module.exports = logger;
