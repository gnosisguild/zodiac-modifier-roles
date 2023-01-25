import "@nomiclabs/hardhat-ethers";
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

    const call1 = await testGas.insert();
    const receipts1 = await call1.wait();
    console.log("insert: ", receipts1.cumulativeGasUsed.toNumber());

    const call2 = await testGas.read1();
    const receipts2 = await call2.wait();
    console.log("read1:  ", receipts2.cumulativeGasUsed.toNumber());

    const call3 = await testGas.read2();
    const receipts3 = await call3.wait();
    console.log("read2:  ", receipts3.cumulativeGasUsed.toNumber());

    // const call4 = await testGas.read3();
    // const receipts4 = await call4.wait();
    // console.log("read3:  ", receipts4.cumulativeGasUsed.toNumber());

    // const call5 = await testGas.read4();
    // const receipts5 = await call5.wait();
    // console.log("read4:  ", receipts5.cumulativeGasUsed.toNumber());
  });
});
