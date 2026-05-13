const logger = {
  info: (msg) => console.log(`[INFO]  ${new Date().toISOString()} | QUIZ-SVC | ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} | QUIZ-SVC | ${msg}`),
  warn: (msg) => console.warn(`[WARN]  ${new Date().toISOString()} | QUIZ-SVC | ${msg}`),
};

module.exports = logger;
