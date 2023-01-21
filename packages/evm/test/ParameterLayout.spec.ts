import "@nomiclabs/hardhat-ethers";

import { expect } from "chai";
import hre, { deployments } from "hardhat";

import { ParameterConfigFlatStruct } from "../typechain-types/contracts/PermissionBuilder";

describe("ParameterLayout", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();

    const MockParameterLayout = await hre.ethers.getContractFactory(
      "MockParameterLayout"
    );
    const parameterLayout = await MockParameterLayout.deploy();

    return {
      parameterLayout,
    };
  });

  it("builds a one level tree", async () => {
    const { parameterLayout } = await setup();

    const config: ParameterConfigFlatStruct[] = [
      { parent: 0, isScoped: true, _type: 0, comp: 0, compValues: [] },
      { parent: 1, isScoped: true, _type: 1, comp: 0, compValues: [] },
      { parent: 2, isScoped: true, _type: 2, comp: 0, compValues: [] },
    ];

    const result = await parameterLayout.rootBounds(config);
    expect(result.left).to.equal(0);
    expect(result.right).to.equal(2);

    let resultChildren = await parameterLayout.childrenBounds(config, 0);
    expect(resultChildren.hasChildren).to.equal(false);
    resultChildren = await parameterLayout.childrenBounds(config, 1);
    expect(resultChildren.hasChildren).to.equal(false);
    resultChildren = await parameterLayout.childrenBounds(config, 2);
    expect(resultChildren.hasChildren).to.equal(false);
  });

  it("builds a two level tree", async () => {
    const { parameterLayout } = await setup();

    const config: ParameterConfigFlatStruct[] = [
      { parent: 0, isScoped: false, _type: 0, comp: 0, compValues: [] },
      { parent: 1, isScoped: true, _type: 3, comp: 0, compValues: [] },
      { parent: 1, isScoped: true, _type: 1, comp: 0, compValues: [] },
      { parent: 1, isScoped: true, _type: 0, comp: 0, compValues: [] },
    ];

    const result = await parameterLayout.rootBounds(config);
    expect(result.left).to.equal(0);
    expect(result.right).to.equal(1);

    let resultChildren = await parameterLayout.childrenBounds(config, 0);
    expect(resultChildren.hasChildren).to.equal(false);

    resultChildren = await parameterLayout.childrenBounds(config, 1);
    expect(resultChildren.hasChildren).to.equal(true);
    expect(resultChildren.bounds.left).to.equal(2);
    expect(resultChildren.bounds.right).to.equal(3);

    resultChildren = await parameterLayout.childrenBounds(config, 2);
    expect(resultChildren.hasChildren).to.equal(false);
    resultChildren = await parameterLayout.childrenBounds(config, 3);
    expect(resultChildren.hasChildren).to.equal(false);
  });

  it("builds a three level three", async () => {
    const { parameterLayout } = await setup();

    const config = [
      { isScoped: true, _type: 4, comp: 0, compValues: [], parent: 0 },
      { isScoped: true, _type: 3, comp: 0, compValues: [], parent: 0 },
      { isScoped: true, _type: 2, comp: 0, compValues: [], parent: 1 },
      { isScoped: true, _type: 0, comp: 0, compValues: [], parent: 1 },
    ];

    const result = await parameterLayout.rootBounds(config);
    expect(result.left).to.equal(0);
    expect(result.right).to.equal(0);

    let resultChildren = await parameterLayout.childrenBounds(config, 0);
    expect(resultChildren.hasChildren).to.equal(true);
    expect(resultChildren.bounds.left).to.equal(1);
    expect(resultChildren.bounds.right).to.equal(1);

    resultChildren = await parameterLayout.childrenBounds(config, 1);
    expect(resultChildren.hasChildren).to.equal(true);
    expect(resultChildren.bounds.left).to.equal(2);
    expect(resultChildren.bounds.right).to.equal(3);

    resultChildren = await parameterLayout.childrenBounds(config, 2);
    expect(resultChildren.hasChildren).to.equal(false);
    resultChildren = await parameterLayout.childrenBounds(config, 3);
    expect(resultChildren.hasChildren).to.equal(false);
  });

  it("from a bug in another part of the stack", async () => {
    const { parameterLayout } = await setup();

    const config = [
      { isScoped: true, _type: 4, comp: 0, compValues: [], parent: 0 },
      { isScoped: true, _type: 3, comp: 0, compValues: [], parent: 0 },
      { isScoped: true, _type: 3, comp: 0, compValues: [], parent: 0 },
      { isScoped: true, _type: 3, comp: 0, compValues: [], parent: 0 },
      { isScoped: false, _type: 0, comp: 0, compValues: [], parent: 1 },
      { isScoped: true, _type: 0, comp: 0, compValues: [], parent: 1 },
      { isScoped: false, _type: 0, comp: 0, compValues: [], parent: 2 },
      { isScoped: true, _type: 0, comp: 0, compValues: [], parent: 2 },
      { isScoped: false, _type: 0, comp: 0, compValues: [], parent: 3 },
      { isScoped: true, _type: 0, comp: 0, compValues: [], parent: 3 },
    ];

    const result = await parameterLayout.rootBounds(config);
    expect(result.left).to.equal(0);
    expect(result.right).to.equal(0);

    let resultChildren = await parameterLayout.childrenBounds(config, 0);
    expect(resultChildren.hasChildren).to.equal(true);
    expect(resultChildren.bounds.left).to.equal(1);
    expect(resultChildren.bounds.right).to.equal(3);

    resultChildren = await parameterLayout.childrenBounds(config, 1);
    expect(resultChildren.hasChildren).to.equal(true);
    expect(resultChildren.bounds.left).to.equal(4);
    expect(resultChildren.bounds.right).to.equal(5);

    resultChildren = await parameterLayout.childrenBounds(config, 2);
    expect(resultChildren.hasChildren).to.equal(true);
    expect(resultChildren.bounds.left).to.equal(6);
    expect(resultChildren.bounds.right).to.equal(7);

    resultChildren = await parameterLayout.childrenBounds(config, 3);
    expect(resultChildren.hasChildren).to.equal(true);
    expect(resultChildren.bounds.left).to.equal(8);
    expect(resultChildren.bounds.right).to.equal(9);

    resultChildren = await parameterLayout.childrenBounds(config, 7);
    expect(resultChildren.hasChildren).to.equal(false);
  });

  it.skip("should fail if an intermediate node does not have a parent");
  it.skip("should fail if nodes are out of order");
});
