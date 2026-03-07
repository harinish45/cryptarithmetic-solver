/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/__tests__'],
    moduleNameMapper: {
        '^@cryptarithmetic/shared$': '<rootDir>/../shared/src/index.ts',
        '^@cryptarithmetic/shared/(.*)$': '<rootDir>/../shared/src/$1'
    },
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: '<rootDir>/tsconfig.json',
            diagnostics: false
        }]
    }
};
