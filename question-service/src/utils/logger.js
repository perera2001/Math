const logger = {
  info: (msg) => console.log(`[INFO]  ${new Date().toISOString()} | QUESTION-SVC | ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} | QUESTION-SVC | ${msg}`),
  warn: (msg) => console.warn(`[WARN]  ${new Date().toISOString()} | QUESTION-SVC | ${msg}`),
};

module.exports = logger;
