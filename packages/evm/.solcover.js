module.exports = {
  skipFiles: [
    "test/*",
    "test/MockConsumptions.sol",
    "test/MockDecoder.sol",
    "test/MockIntegrity.sol",
    "test/MockTopology.sol",
    "test/MultiSend.sol",
    "test/TestAvatar.sol",
    "test/TestContract.sol",
    "test/TestCustomChecker.sol",
    "test/TestEncoder.sol",
    "test/TestFactory.sol",
  ],
  mocha: {
    grep: "@skip-on-coverage", // Find everything with this tag
    invert: true, // Run the grep's inverse set.
  },
};
