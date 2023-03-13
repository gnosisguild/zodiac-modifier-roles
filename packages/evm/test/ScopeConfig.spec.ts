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

    let buffer = await ScopeConfig.packParameter(0, {
      parent: 3,
      _type: 2,
      comp: 3,
      compValue: "0xaabb",
    });

    let result = await ScopeConfig.unpackParameter(buffer, 0);

    expect(result._type).to.equal(2);
    expect(result.comp).to.equal(3);

    buffer = await ScopeConfig.packParameter(0, {
      parent: 255,
      _type: 4,
      comp: 10,
      compValue: "0xaabb",
    });

    result = await ScopeConfig.unpackParameter(buffer, 0);

    expect(result._type).to.equal(4);
    expect(result.comp).to.equal(10);
  });
});
