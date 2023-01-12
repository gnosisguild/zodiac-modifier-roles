import "@nomiclabs/hardhat-ethers";
import { hexlify, keccak256, toUtf8Bytes } from "ethers/lib/utils";
import hre, { deployments } from "hardhat";

describe.skip("Gas", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();

    const TestGas = await hre.ethers.getContractFactory("TestGas");
    const testGas = await TestGas.deploy();

    return {
      testGas,
    };
  });

  it("map insertion", async () => {
    const { testGas } = await setup();

    const call1 = await testGas.insertBytes("0xabf019234aa333", 123456789);
    const receipts1 = await call1.wait();
    console.log("insertBytes: ", receipts1.cumulativeGasUsed.toNumber());

    const now = Date.now();
    const key = keccak256(hexlify(toUtf8Bytes(String(now))));

    const call2 = await testGas.insertBytes32(key, 123456789);
    const receipts2 = await call2.wait();
    console.log("insertBytes32: ", receipts2.cumulativeGasUsed.toNumber());

    const call3 = await testGas.insertHashAndBytes32(
      "0xabf019234aa444",
      123456789
    );
    const receipts3 = await call3.wait();
    console.log(
      "insertHashAndBytes32: ",
      receipts3.cumulativeGasUsed.toNumber()
    );
  });
});
