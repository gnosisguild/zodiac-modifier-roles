module.exports = {
  skipFiles: [
    "test/*",
    "test/MockDecoder.sol",
    "test/MockTopology.sol",
    "test/MultiSend.sol",
    "test/TestAvatar.sol",
    "test/TestCustomChecker.sol",
    "test/TestFactory.sol",
  ],
  mocha: {
    grep: "@skip-on-coverage", // Find everything with this tag
    invert: true, // Run the grep's inverse set.
  },
};
