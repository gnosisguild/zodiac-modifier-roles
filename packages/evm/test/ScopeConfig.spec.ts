import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import hre, { deployments } from "hardhat";

enum ParameterType {
  Unspecified = 0,
  Static,
  Dynamic,
  Dynamic32,
  Tuple,
  Array,
}

enum Comparison {
  EqualTo = 0,
  GreaterThan,
  LessThan,
  OneOf,
  SubsetOf,
  Matches,
  Some,
  Every,
}

enum ExecutionOptions {
  None = 0,
  Send,
  DelegateCall,
  Both,
}

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

  it("packs/unpacks ExecutionOptions", async () => {
    const { ScopeConfig } = await setup();
    let scopeConfig = await ScopeConfig.pack(
      0,
      ExecutionOptions.None,
      false,
      0
    );
    let result = await ScopeConfig.unpack(scopeConfig);
    expect(result.options).to.equal(ExecutionOptions.None);

    scopeConfig = await ScopeConfig.pack(
      scopeConfig,
      ExecutionOptions.Both,
      true,
      10
    );
    result = await ScopeConfig.unpack(scopeConfig);
    expect(result.options).to.equal(ExecutionOptions.Both);
  });

  it("packs/unpacks isWildcaded", async () => {
    const { ScopeConfig } = await setup();
    let scopeConfig = await ScopeConfig.pack(
      0,
      ExecutionOptions.None,
      false,
      0
    );
    let result = await ScopeConfig.unpack(scopeConfig);
    expect(result.isWildcarded).to.equal(false);

    scopeConfig = await ScopeConfig.pack(
      scopeConfig,
      ExecutionOptions.Both,
      true,
      32
    );
    result = await ScopeConfig.unpack(scopeConfig);
    expect(result.isWildcarded).to.equal(true);
  });

  it("packs/unpacks length", async () => {
    const { ScopeConfig } = await setup();

    let scopeConfig = await ScopeConfig.pack(
      0,
      ExecutionOptions.None,
      false,
      32
    );

    let [, , length] = await ScopeConfig.unpack(scopeConfig);

    expect(length).to.equal(32);

    scopeConfig = await ScopeConfig.pack(
      scopeConfig,
      ExecutionOptions.Both,
      true,
      2
    );
    [, , length] = await ScopeConfig.unpack(scopeConfig);
    expect(length).to.equal(2);

    scopeConfig = await ScopeConfig.pack(
      scopeConfig,
      ExecutionOptions.Both,
      true,
      0
    );
    [, , length] = await ScopeConfig.unpack(scopeConfig);
    expect(length).to.equal(0);
  });

  it("packs/unpacks a ParameterType", async () => {
    const { ScopeConfig } = await setup();

    const atIndex = async (index: number) => {
      // try first with the min type of ParameterType enum
      let scopeConfig = await ScopeConfig.packParameter(
        0,
        index,
        true,
        ParameterType.Unspecified,
        Comparison.Matches
      );
      let result = await ScopeConfig.unpackParameter(scopeConfig, index);
      expect(result.paramType).to.equal(ParameterType.Unspecified);

      // try first with the max type of ParameterType enum
      scopeConfig = await ScopeConfig.packParameter(
        scopeConfig,
        index,
        true,
        ParameterType.Array,
        Comparison.Matches
      );
      result = await ScopeConfig.unpackParameter(scopeConfig, index);
      expect(result.paramType).to.equal(ParameterType.Array);
    };

    // try at min index
    await atIndex(0);

    // try at middle
    await atIndex(16);

    // try at max index
    await atIndex(31);
  });

  it("packs/unpacks a Comparison", async () => {
    const { ScopeConfig } = await setup();

    const atIndex = async (index: number) => {
      // try first with the min type of Comparison enum
      let scopeConfig = await ScopeConfig.packParameter(
        0,
        index,
        true,
        ParameterType.Unspecified,
        Comparison.EqualTo
      );
      let result = await ScopeConfig.unpackParameter(scopeConfig, index);
      expect(result.paramComp).to.equal(Comparison.EqualTo);

      // try first with the max type of Comparison enum
      scopeConfig = await ScopeConfig.packParameter(
        scopeConfig,
        index,
        true,
        ParameterType.Array,
        Comparison.Every
      );
      result = await ScopeConfig.unpackParameter(scopeConfig, index);
      expect(result.paramComp).to.equal(Comparison.Every);
    };

    // try at min index
    await atIndex(0);

    // try at middle
    await atIndex(16);

    // try at max index
    await atIndex(31);
  });
});
