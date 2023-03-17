import { expect } from "chai";
import hre, { deployments } from "hardhat";

import "@nomiclabs/hardhat-ethers";

import { Operator, ParameterType } from "./utils";

describe("Topology", async () => {
  const setup = deployments.createFixture(async () => {
    const Topology = await hre.ethers.getContractFactory("MockTopology");
    const topology = await Topology.deploy();

    return {
      topology,
    };
  });

  it("top level variants get unfolded to its entrypoint form", async () => {
    const { topology } = await setup();

    const layout = {
      paramType: ParameterType.None,
      operator: Operator.Or,
      children: [
        {
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: ParameterType.Static,
              operator: 0,
              children: [],
            },
            {
              paramType: ParameterType.Dynamic,
              operator: Operator.EqualTo,
              children: [],
            },
          ],
        },
        {
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              children: [],
            },
            {
              paramType: ParameterType.Dynamic,
              operator: Operator.EqualTo,
              children: [],
            },
          ],
        },
        {
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              children: [],
            },
            {
              paramType: ParameterType.Dynamic,
              operator: Operator.EqualTo,
              children: [],
            },
          ],
        },
      ],
    };
    // [
    //   {
    //     paramType: ParameterType.Static,
    //     children: [],
    //   },
    //   {
    //     paramType: ParameterType.Dynamic,
    //     children: [],
    //   },
    // ]
    const result = await topology.typeTree(layout);
    expect(result.paramType).to.equal(ParameterType.AbiEncoded);
    expect(result.children.length).to.equal(2);
    expect(result.children[0].paramType).to.equal(ParameterType.Static);
    expect(result.children[0].children.length).to.equal(0);
    expect(result.children[1].paramType).to.equal(ParameterType.Dynamic);
    expect(result.children[1].children.length).to.equal(0);
  });

  it("top level Or gets unfolded to its children types", async () => {
    const { topology } = await setup();
    const layout = {
      paramType: ParameterType.None,
      operator: Operator.Or,
      children: [
        {
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          children: [
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              children: [],
            },
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              children: [],
            },
          ],
        },
        {
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          children: [
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              children: [],
            },
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              children: [],
            },
          ],
        },
      ],
    };
    const result = await topology.typeTree(layout);

    // [
    //   {
    //     paramType: ParameterType.Tuple,
    //     children: [
    //       {
    //         paramType: ParameterType.Static,
    //         children: [],
    //       },
    //       {
    //         paramType: ParameterType.Static,
    //         children: [],
    //       },
    //     ],
    //   },
    // ]

    expect(result.paramType).to.equal(ParameterType.Tuple);
    expect(result.children.length).to.equal(2);
    expect(result.children[0].paramType).to.equal(ParameterType.Static);
    expect(result.children[0].children.length).to.equal(0);
    expect(result.children[1].paramType).to.equal(ParameterType.Static);
    expect(result.children[1].children.length).to.equal(0);
  });

  it("nested Or gets unfolded to its children types", async () => {
    const { topology } = await setup();
    const layout = {
      paramType: ParameterType.Tuple,
      operator: 0,
      children: [
        {
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          children: [],
        },
        {
          paramType: ParameterType.None,
          operator: Operator.Or,
          children: [
            {
              paramType: ParameterType.Array,
              operator: Operator.EqualTo,
              children: [
                {
                  paramType: ParameterType.Static,
                  operator: Operator.EqualTo,
                  children: [],
                },
              ],
            },
            {
              paramType: ParameterType.Array,
              operator: Operator.EqualTo,
              children: [
                {
                  paramType: ParameterType.Static,
                  operator: Operator.EqualTo,
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    };

    // [
    //   {
    //     paramType: ParameterType.Tuple,
    //     children: [
    //       {
    //         paramType: ParameterType.Static,
    //         children: [],
    //       },
    //       {
    //         paramType: ParameterType.Array,
    //         children: [ Static],
    //       },
    //     ],
    //   },
    // ];

    const result = await topology.typeTree(layout);
    expect(result.paramType).to.equal(ParameterType.Tuple);
    expect(result.children.length).to.equal(2);

    expect(result.children[0].paramType).to.equal(ParameterType.Static);
    expect(result.children[0].children.length).to.equal(0);

    expect(result.children[1].paramType).to.equal(ParameterType.Array);
    expect(result.children[1].children.length).to.equal(1);
    expect(result.children[1].children[0].paramType).to.equal(
      ParameterType.Static
    );
    expect(result.children[1].children[0].children.length).to.equal(0);
  });

  it("extraneous Value operation gets included as None", async () => {
    const { topology } = await setup();
    const layout = {
      paramType: ParameterType.AbiEncoded,
      operator: 0,
      children: [
        {
          paramType: ParameterType.None,
          operator: Operator.ETHWithinAllowance,
          children: [],
        },
        {
          paramType: ParameterType.Tuple,
          operator: 0,
          children: [
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              children: [],
            },
            {
              paramType: ParameterType.None,
              operator: Operator.Or,
              children: [
                {
                  paramType: ParameterType.Array,
                  operator: Operator.EqualTo,
                  children: [
                    {
                      paramType: ParameterType.Static,
                      operator: Operator.EqualTo,
                      children: [],
                    },
                  ],
                },
                {
                  paramType: ParameterType.Array,
                  operator: Operator.EqualTo,
                  children: [
                    {
                      paramType: ParameterType.Static,
                      operator: Operator.EqualTo,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    // [
    //   {
    //     paramType: ParameterType.Tuple,
    //     children: [
    //       {
    //         paramType: ParameterType.None,
    //         children: [],
    //       },
    //       {
    //         paramType: ParameterType.Static,
    //         children: [],
    //       },
    //       {
    //         paramType: ParameterType.Array,
    //         children: [ Static],
    //       },
    //     ],
    //   },
    // ];

    const root = await topology.typeTree(layout);
    expect(root.paramType).to.equal(ParameterType.AbiEncoded);
    expect(root.children.length).to.equal(2);

    const extraneous = root.children[0];
    expect(extraneous.paramType).to.equal(ParameterType.None);
    expect(extraneous.children.length).to.equal(0);

    const tuple = root.children[1];
    expect(tuple.paramType).to.equal(ParameterType.Tuple);
    expect(tuple.children.length).to.equal(2);

    expect(tuple.children[0].paramType).to.equal(ParameterType.Static);
    expect(tuple.children[0].children.length).to.equal(0);

    expect(tuple.children[1].paramType).to.equal(ParameterType.Array);
    expect(tuple.children[1].children.length).to.equal(1);
    expect(tuple.children[1].children[0].paramType).to.equal(
      ParameterType.Static
    );
    expect(tuple.children[1].children[0].children.length).to.equal(0);
  });
});
