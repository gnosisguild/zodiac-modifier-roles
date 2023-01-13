import "@nomiclabs/hardhat-ethers";

import { expect } from "chai";
import hre, { deployments } from "hardhat";

enum ParameterType {
  None = 0,
  Static,
  Dynamic,
  Dynamic32,
  Tuple,
  Array,
}

describe("ConfigTree", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();

    const MockConfigTree = await hre.ethers.getContractFactory(
      "MockConfigTree"
    );
    const configTree = await MockConfigTree.deploy();

    return {
      configTree,
    };
  });

  it("builds a one level tree", async () => {
    const { configTree } = await setup();

    const config = [
      {
        path: [0],
        _type: ParameterType.Static,
        comp: 0,
        compValues: [],
      },
      {
        path: [1],
        _type: ParameterType.Dynamic,
        comp: 0,
        compValues: [],
      },
      {
        path: [2],
        _type: ParameterType.Dynamic32,
        comp: 0,
        compValues: [],
      },
    ];
    const result = await configTree.create(config);

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

    const g1 = await configTree.estimateGas.create(config);
    const g2 = await configTree.estimateGas.createNoCopy(config);

    console.log("GAS " + g1.toNumber());
    console.log("GAS " + g2.toNumber());

    expect(cleanUp(result)).to.deep.equal(layout);
  });

  it("builds a two level tree", async () => {
    const { configTree } = await setup();

    const config = [
      {
        path: [1],
        _type: ParameterType.Tuple,
        comp: 0,
        compValues: [],
      },
      {
        path: [1, 0],
        _type: ParameterType.Dynamic,
        comp: 0,
        compValues: [],
      },
      {
        path: [1, 1],
        _type: ParameterType.Static,
        comp: 0,
        compValues: [],
      },
    ];

    const result = await configTree.create(config);
    const layout = [
      {
        isScoped: false,
        _type: ParameterType.None,
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
    const g1 = await configTree.estimateGas.create(config);
    const g2 = await configTree.estimateGas.createNoCopy(config);

    console.log("GAS " + g1.toNumber());
    console.log("GAS " + g2.toNumber());
    expect(cleanUp(result)).to.deep.equal(layout);
  });

  it("builds a three level three", async () => {
    const { configTree } = await setup();

    const config = [
      {
        path: [0],
        _type: ParameterType.Array,
        comp: 0,
        compValues: [],
      },
      {
        path: [0, 0],
        _type: ParameterType.Tuple,
        comp: 0,
        compValues: [],
      },
      {
        path: [0, 0, 0],
        _type: ParameterType.Dynamic32,
        comp: 0,
        compValues: [],
      },
      {
        path: [0, 0, 1],
        _type: ParameterType.Static,
        comp: 0,
        compValues: [],
      },
    ];

    const result = await configTree.create(config);
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

    const g1 = await configTree.estimateGas.create(config);
    const g2 = await configTree.estimateGas.createNoCopy(config);

    console.log("GAS " + g1.toNumber());
    console.log("GAS " + g2.toNumber());

    expect(cleanUp(result)).to.deep.equal(layout);
  });
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
