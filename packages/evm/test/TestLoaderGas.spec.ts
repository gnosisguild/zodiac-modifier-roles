import "@nomiclabs/hardhat-ethers";
import hre, { deployments, ethers } from "hardhat";
import { Operator, ExecutionOptions, ParameterType } from "./utils";

describe.skip("TestLoaderGas", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();

    const TestLoaderGas = await hre.ethers.getContractFactory("TestLoaderGas");
    const testLoaderGas1 = await TestLoaderGas.deploy();
    const testLoaderGas2 = await TestLoaderGas.deploy();

    return {
      testLoaderGas1,
      testLoaderGas2,
    };
  });

  it("1 item", async () => {
    const paramConfig = [
      {
        parent: 0,
        paramType: ParameterType.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.GreaterThan,
        compValue: ethers.utils.solidityPack(["uint256"], [1234]),
      },
    ];

    const { testLoaderGas1, testLoaderGas2 } = await setup();

    const storeCall = await testLoaderGas1.store(
      paramConfig,
      ExecutionOptions.Both
    );
    const storeReceipts = await storeCall.wait();
    console.log("store: ", storeReceipts.cumulativeGasUsed.toNumber());

    const storeNaiveCall = await testLoaderGas2.storeNaive(
      paramConfig,
      ExecutionOptions.Both
    );
    const storeNaiveReceipts = await storeNaiveCall.wait();
    console.log(
      "storeNaive: ",
      storeNaiveReceipts.cumulativeGasUsed.toNumber()
    );

    const loadCall = await testLoaderGas1.load();
    const loadReceipts = await loadCall.wait();
    console.log("load: ", loadReceipts.cumulativeGasUsed.toNumber());

    const loadNaiveCall = await testLoaderGas2.loadNaive();
    const loadNaiveReceipts = await loadNaiveCall.wait();
    console.log("loadNaive: ", loadNaiveReceipts.cumulativeGasUsed.toNumber());
  });

  it("7 items", async () => {
    const encodedParam_3 = ethers.utils.solidityPack(
      ["string"],
      ["This is a dynamic array"]
    );
    const encodedParam_4 = ethers.utils.defaultAbiCoder.encode(
      ["uint256"],
      [4]
    );
    const encodedParam_5 = ethers.utils.solidityPack(["string"], ["Test"]);
    const encodedParam_6 = ethers.utils.defaultAbiCoder.encode(
      ["bool"],
      [true]
    );
    const encodedParam_7 = ethers.utils.defaultAbiCoder.encode(["uint8"], [3]);
    const encodedParam_8 = ethers.utils.solidityPack(["string"], ["weeeeeeee"]);
    const encodedParam_9 = ethers.utils.solidityPack(
      ["string"],
      [
        "This is an input that is larger than 32 bytes and must be scanned for correctness",
      ]
    );

    const paramConfig = [
      {
        parent: 0,
        paramType: ParameterType.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Dynamic,
        operator: Operator.EqualTo,
        compValue: encodedParam_3,
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: encodedParam_4,
      },
      {
        parent: 0,
        paramType: ParameterType.Dynamic,
        operator: Operator.EqualTo,
        compValue: encodedParam_5,
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: encodedParam_6,
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: encodedParam_7,
      },
      {
        parent: 0,
        paramType: ParameterType.Dynamic,
        operator: Operator.EqualTo,
        compValue: encodedParam_8,
      },
      {
        parent: 0,
        paramType: ParameterType.Dynamic,
        operator: Operator.EqualTo,
        compValue: encodedParam_9,
      },
    ];

    const { testLoaderGas1, testLoaderGas2 } = await setup();

    const storeCall = await testLoaderGas1.store(
      paramConfig,
      ExecutionOptions.Both
    );
    const storeReceipts = await storeCall.wait();
    console.log("store: ", storeReceipts.cumulativeGasUsed.toNumber());

    const storeNaiveCall = await testLoaderGas2.storeNaive(
      paramConfig,
      ExecutionOptions.Both
    );
    const storeNaiveReceipts = await storeNaiveCall.wait();
    console.log(
      "storeNaive: ",
      storeNaiveReceipts.cumulativeGasUsed.toNumber()
    );

    const loadCall = await testLoaderGas1.load();
    const loadReceipts = await loadCall.wait();
    console.log("load: ", loadReceipts.cumulativeGasUsed.toNumber());

    const loadNaiveCall = await testLoaderGas2.loadNaive();
    const loadNaiveReceipts = await loadNaiveCall.wait();
    console.log("loadNaive: ", loadNaiveReceipts.cumulativeGasUsed.toNumber());
  });
});
