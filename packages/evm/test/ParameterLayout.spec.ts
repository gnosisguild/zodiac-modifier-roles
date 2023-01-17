import "@nomiclabs/hardhat-ethers";

import { expect } from "chai";
import hre, { deployments } from "hardhat";

enum ParameterType {
  Static,
  Dynamic,
  Dynamic32,
  Tuple,
  Array,
}

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

    const config = [
      {
        isScoped: true,
        path: [0],
        _type: ParameterType.Static,
        comp: 0,
        compValues: [],
      },
      {
        isScoped: true,
        path: [1],
        _type: ParameterType.Dynamic,
        comp: 0,
        compValues: [],
      },
      {
        isScoped: true,
        path: [2],
        _type: ParameterType.Dynamic32,
        comp: 0,
        compValues: [],
      },
    ];
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

    // const g1 = await parameterLayout.estimateGas.create(config);
    // const g2 = await parameterLayout.estimateGas.createNoCopy(config);

    // console.log("GAS " + g1.toNumber());
    // console.log("GAS " + g2.toNumber());

    expect(cleanUp(result)).to.deep.equal(layout);
  });

  it("builds a two level tree", async () => {
    const { parameterLayout } = await setup();

    const config = [
      {
        isScoped: true,
        path: [1],
        _type: ParameterType.Tuple,
        comp: 0,
        compValues: [],
      },
      {
        isScoped: true,
        path: [1, 0],
        _type: ParameterType.Dynamic,
        comp: 0,
        compValues: [],
      },
      {
        isScoped: true,
        path: [1, 1],
        _type: ParameterType.Static,
        comp: 0,
        compValues: [],
      },
    ];

    const result = await parameterLayout.flatToTree(config);
    const layout = [
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
    // const g1 = await parameterLayout.estimateGas.create(config);
    // const g2 = await parameterLayout.estimateGas.createNoCopy(config);

    // console.log("GAS " + g1.toNumber());
    // console.log("GAS " + g2.toNumber());
    expect(cleanUp(result)).to.deep.equal(layout);
  });

  it("builds a three level three", async () => {
    const { parameterLayout } = await setup();

    const config = [
      {
        isScoped: true,
        path: [0],
        _type: ParameterType.Array,
        comp: 0,
        compValues: [],
      },
      {
        isScoped: true,
        path: [0, 0],
        _type: ParameterType.Tuple,
        comp: 0,
        compValues: [],
      },
      {
        isScoped: true,
        path: [0, 0, 0],
        _type: ParameterType.Dynamic32,
        comp: 0,
        compValues: [],
      },
      {
        isScoped: true,
        path: [0, 0, 1],
        _type: ParameterType.Static,
        comp: 0,
        compValues: [],
      },
    ];

    const result = await parameterLayout.flatToTree(config);
    const layout = [
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

    // const g1 = await parameterLayout.estimateGas.create(config);
    // const g2 = await parameterLayout.estimateGas.createNoCopy(config);

    // console.log("GAS " + g1.toNumber());
    // console.log("GAS " + g2.toNumber());

    expect(cleanUp(result)).to.deep.equal(layout);
  });

  it("from a bug in another part of the stack", async () => {
    const { parameterLayout } = await setup();

    const config = [
      {
        isScoped: true,
        path: [0],
        _type: ParameterType.Array,
        comp: 0,
        compValues: [],
      },
      {
        isScoped: true,
        path: [0, 0],
        _type: ParameterType.Tuple,
        comp: 0,
        compValues: [],
      },
      {
        isScoped: true,
        path: [0, 0, 1],
        _type: ParameterType.Static,
        comp: 0,
        compValues: [],
      },
      {
        isScoped: true,
        path: [0, 1],
        _type: ParameterType.Tuple,
        comp: 0,
        compValues: [],
      },
      {
        isScoped: true,
        path: [0, 1, 1],
        _type: ParameterType.Static,
        comp: 0,
        compValues: [],
      },
      {
        isScoped: true,
        path: [0, 2],
        _type: ParameterType.Tuple,
        comp: 0,
        compValues: [],
      },
      {
        isScoped: true,
        path: [0, 2, 1],
        _type: ParameterType.Static,
        comp: 0,
        compValues: [],
      },
    ];

    const result = await parameterLayout.flatToTree(config);
    const layout = [
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

    // const g1 = await parameterLayout.estimateGas.create(config);
    // const g2 = await parameterLayout.estimateGas.createNoCopy(config);

    // console.log("GAS " + g1.toNumber());
    // console.log("GAS " + g2.toNumber());

    expect(cleanUp(result)).to.deep.equal(layout);
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
