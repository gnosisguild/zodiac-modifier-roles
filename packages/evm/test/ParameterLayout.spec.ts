import "@nomiclabs/hardhat-ethers";

import { expect } from "chai";
import hre, { deployments } from "hardhat";

import { flattenParameterConfig, ParameterType } from "./utils";

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

    const config = flattenParameterConfig([
      {
        isScoped: true,
        _type: ParameterType.Static,
        comp: 0,
        compValues: [],
        children: [],
      },
      {
        isScoped: true,
        _type: ParameterType.Dynamic,
        comp: 0,
        compValues: [],
        children: [],
      },
      {
        isScoped: true,
        _type: ParameterType.Dynamic32,
        comp: 0,
        compValues: [],
        children: [],
      },
    ]);
    const result = await parameterLayout.flatToTree(config);

    const layout = [
      {
        isScoped: true,
        _type: ParameterType.Static,
        comp: 0,
        compValues: [],
        children: [],
      },
      {
        isScoped: true,
        _type: ParameterType.Dynamic,
        comp: 0,
        compValues: [],
        children: [],
      },
      {
        isScoped: true,
        _type: ParameterType.Dynamic32,
        comp: 0,
        compValues: [],
        children: [],
      },
    ];

    expect(cleanUp(result)).to.deep.equal(layout);
  });

  it("builds a two level tree", async () => {
    const { parameterLayout } = await setup();

    const tree = [
      {
        isScoped: false,
        _type: ParameterType.Static,
        comp: 0,
        compValues: [],
        children: [],
      },
      {
        isScoped: true,
        _type: ParameterType.Tuple,
        comp: 0,
        compValues: [],
        children: [
          {
            isScoped: true,
            _type: ParameterType.Dynamic,
            comp: 0,
            compValues: [],
            children: [],
          },
          {
            isScoped: true,
            _type: ParameterType.Static,
            comp: 0,
            compValues: [],
            children: [],
          },
        ],
      },
    ];

    const flat = flattenParameterConfig(tree);

    const result = await parameterLayout.flatToTree(flat);

    expect(cleanUp(result)).to.deep.equal(tree);
  });

  it("builds a three level three", async () => {
    const { parameterLayout } = await setup();

    const tree = [
      {
        isScoped: true,
        _type: ParameterType.Array,
        comp: 0,
        compValues: [],
        children: [
          {
            isScoped: true,
            _type: ParameterType.Tuple,
            comp: 0,
            compValues: [],
            children: [
              {
                isScoped: true,
                _type: ParameterType.Dynamic32,
                comp: 0,
                compValues: [],
                children: [],
              },
              {
                isScoped: true,
                _type: ParameterType.Static,
                comp: 0,
                compValues: [],
                children: [],
              },
            ],
          },
        ],
      },
    ];

    const flat = flattenParameterConfig(tree);

    const result = await parameterLayout.flatToTree(flat);

    expect(cleanUp(result)).to.deep.equal(tree);
  });

  it("from a bug in another part of the stack", async () => {
    const { parameterLayout } = await setup();

    const tree = [
      {
        isScoped: true,
        _type: ParameterType.Array,
        comp: 0,
        compValues: [],
        children: [
          {
            isScoped: true,
            _type: ParameterType.Tuple,
            comp: 0,
            compValues: [],
            children: [
              {
                isScoped: false,
                _type: ParameterType.Static,
                comp: 0,
                compValues: [],
                children: [],
              },
              {
                isScoped: true,
                _type: ParameterType.Static,
                comp: 0,
                compValues: [],
                children: [],
              },
            ],
          },
          {
            isScoped: true,
            _type: ParameterType.Tuple,
            comp: 0,
            compValues: [],
            children: [
              {
                isScoped: false,
                _type: ParameterType.Static,
                comp: 0,
                compValues: [],
                children: [],
              },
              {
                isScoped: true,
                _type: ParameterType.Static,
                comp: 0,
                compValues: [],
                children: [],
              },
            ],
          },
          {
            isScoped: true,
            _type: ParameterType.Tuple,
            comp: 0,
            compValues: [],
            children: [
              {
                isScoped: false,
                _type: ParameterType.Static,
                comp: 0,
                compValues: [],
                children: [],
              },
              {
                isScoped: true,
                _type: ParameterType.Static,
                comp: 0,
                compValues: [],
                children: [],
              },
            ],
          },
        ],
      },
    ];

    const flat = flattenParameterConfig(tree);

    const result = await parameterLayout.flatToTree(flat);

    expect(cleanUp(result)).to.deep.equal(tree);
  });

  it.skip("should fail if an intermediate node does not have a parent");
  it.skip("should fail if nodes are out of order");
});

function cleanUp(result: any): any[] {
  return result.map(({ isScoped, _type, comp, compValues, children }) => {
    return {
      isScoped,
      _type,
      comp,
      compValues,
      children: cleanUp(children),
    };
  });
}
