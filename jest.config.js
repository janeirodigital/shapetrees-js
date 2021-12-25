/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    "**/tests/src/*.ts"
  ],
  // transformIgnorePatterns: ['.*node_modules/(?!@node-fetch)/'],
};
