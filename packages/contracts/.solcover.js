module.exports = {
  skipFiles: [
    "test/Mock.sol",
    "test/TestAvatar.sol",
    "test/TestContract.sol",
    "test/TestPluckParam.sol",
    "test/TestFactory.sol",
    "test/MultiSend.sol"
  ],
  mocha: {
    grep: "@skip-on-coverage", // Find everything with this tag
    invert: true, // Run the grep's inverse set.
  },
};
