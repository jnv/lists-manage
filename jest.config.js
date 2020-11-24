module.exports = {
  preset: 'ts-jest',
  collectCoverageFrom: ['src/**/*.{js,ts}'],
  roots: ['<rootDir>/src/'],
  reporters: ['default', 'jest-teamcity'],
}
