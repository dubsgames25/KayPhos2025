module.exports = {
    rootDir: ".", // You’re now running from kay-phos root
    testEnvironment: "jsdom",
    collectCoverage: true,
    collectCoverageFrom: [
        "server/gin/public/js/**/*.js",
        "!**/node_modules/**"
    ],
    coverageDirectory: "coverage", // Keep this clean at root
    testMatch: ["<rootDir>/server/gin/test/frontend/tests/**/*.test.js"]
};
