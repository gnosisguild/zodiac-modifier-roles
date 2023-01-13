module.exports = {
  skipFiles: [
    "test/Mock.sol",
    "test/MockConfigTree.sol",
    "test/MockPluckCalldata.sol",
    "test/MultiSend.sol",
    "test/TestAvatar.sol",
    "test/TestContract.sol",
    "test/TestEncoder.sol",
    "test/TestFactory.sol",
    "test/TestGas.sol",
  ],
  mocha: {
    grep: "@skip-on-coverage", // Find everything with this tag
    invert: true, // Run the grep's inverse set.
  },
};
