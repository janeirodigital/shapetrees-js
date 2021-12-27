/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    "**/test/*.ts"
  ],
  // transformIgnorePatterns: ['.*node_modules/(?!@node-fetch)/'],
};
