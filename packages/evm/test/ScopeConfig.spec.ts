import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import hre, { deployments } from "hardhat";
import { ExecutionOptions } from "./utils";

describe("ScopeConfig library", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();

    const MockScopeConfig = await hre.ethers.getContractFactory(
      "MockScopeConfig"
    );
    const ScopeConfig = await MockScopeConfig.deploy();

    return {
      ScopeConfig,
    };
  });

  it("packs/unpack Header", async () => {
    const { ScopeConfig } = await setup();

    const pointer = "0xffffff00000aaa11232839283000000000000000";
    const header = await ScopeConfig.packHeader(
      15,
      false,
      ExecutionOptions.DelegateCall,
      pointer
    );
    const result = await ScopeConfig.unpackHeader(header);
    expect(result._length).to.equal(15);
    expect(result.isWildcarded).to.equal(false);
    expect(result.options).to.equal(ExecutionOptions.DelegateCall);
    expect(result.pointer.toLowerCase()).to.equal(pointer);
  });

  it("packs/unpack Parameter", async () => {
    const { ScopeConfig } = await setup();

    let buffer = await ScopeConfig.packCondition(0, [0], {
      parent: 3,
      paramType: 2,
      operator: 3,
      compValue: "0xaabb",
    });

    let result = await ScopeConfig.unpackCondition(buffer, 0, [0]);

    expect(result.paramType).to.equal(2);
    expect(result.operator).to.equal(3);

    buffer = await ScopeConfig.packCondition(0, [0], {
      parent: 255,
      paramType: 4,
      operator: 10,
      compValue: "0xaabb",
    });

    result = await ScopeConfig.unpackCondition(buffer, 0, [0]);

    expect(result.paramType).to.equal(4);
    expect(result.operator).to.equal(10);
  });
});
