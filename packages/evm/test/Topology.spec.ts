import { expect } from "chai";
import hre, { deployments } from "hardhat";

import "@nomiclabs/hardhat-ethers";

import { Comparison, ParameterType } from "./utils";

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
      _type: ParameterType.None,
      comp: Comparison.Or,
      children: [
        {
          _type: ParameterType.AbiEncoded,
          comp: Comparison.Matches,
          children: [
            {
              _type: ParameterType.Static,
              comp: 0,
              children: [],
            },
            {
              _type: ParameterType.Dynamic,
              comp: Comparison.EqualTo,
              children: [],
            },
          ],
        },
        {
          _type: ParameterType.AbiEncoded,
          comp: Comparison.Matches,
          children: [
            {
              _type: ParameterType.Static,
              comp: Comparison.EqualTo,
              children: [],
            },
            {
              _type: ParameterType.Dynamic,
              comp: Comparison.EqualTo,
              children: [],
            },
          ],
        },
        {
          _type: ParameterType.AbiEncoded,
          comp: Comparison.Matches,
          children: [
            {
              _type: ParameterType.Static,
              comp: Comparison.EqualTo,
              children: [],
            },
            {
              _type: ParameterType.Dynamic,
              comp: Comparison.EqualTo,
              children: [],
            },
          ],
        },
      ],
    };
    // [
    //   {
    //     _type: ParameterType.Static,
    //     children: [],
    //   },
    //   {
    //     _type: ParameterType.Dynamic,
    //     children: [],
    //   },
    // ]
    const result = await topology.typeTree(layout);
    expect(result._type).to.equal(ParameterType.AbiEncoded);
    expect(result.children.length).to.equal(2);
    expect(result.children[0]._type).to.equal(ParameterType.Static);
    expect(result.children[0].children.length).to.equal(0);
    expect(result.children[1]._type).to.equal(ParameterType.Dynamic);
    expect(result.children[1].children.length).to.equal(0);
  });

  it("top level Or gets unfolded to its children types", async () => {
    const { topology } = await setup();
    const layout = {
      _type: ParameterType.None,
      comp: Comparison.Or,
      children: [
        {
          _type: ParameterType.Tuple,
          comp: Comparison.Matches,
          children: [
            {
              _type: ParameterType.Static,
              comp: Comparison.EqualTo,
              children: [],
            },
            {
              _type: ParameterType.Static,
              comp: Comparison.EqualTo,
              children: [],
            },
          ],
        },
        {
          _type: ParameterType.Tuple,
          comp: Comparison.Matches,
          children: [
            {
              _type: ParameterType.Static,
              comp: Comparison.EqualTo,
              children: [],
            },
            {
              _type: ParameterType.Static,
              comp: Comparison.EqualTo,
              children: [],
            },
          ],
        },
      ],
    };
    const result = await topology.typeTree(layout);

    // [
    //   {
    //     _type: ParameterType.Tuple,
    //     children: [
    //       {
    //         _type: ParameterType.Static,
    //         children: [],
    //       },
    //       {
    //         _type: ParameterType.Static,
    //         children: [],
    //       },
    //     ],
    //   },
    // ]

    expect(result._type).to.equal(ParameterType.Tuple);
    expect(result.children.length).to.equal(2);
    expect(result.children[0]._type).to.equal(ParameterType.Static);
    expect(result.children[0].children.length).to.equal(0);
    expect(result.children[1]._type).to.equal(ParameterType.Static);
    expect(result.children[1].children.length).to.equal(0);
  });

  it("nested Or gets unfolded to its children types", async () => {
    const { topology } = await setup();
    const layout = {
      _type: ParameterType.Tuple,
      comp: 0,
      children: [
        {
          _type: ParameterType.Static,
          comp: Comparison.EqualTo,
          children: [],
        },
        {
          _type: ParameterType.None,
          comp: Comparison.Or,
          children: [
            {
              _type: ParameterType.Array,
              comp: Comparison.EqualTo,
              children: [
                {
                  _type: ParameterType.Static,
                  comp: Comparison.EqualTo,
                  children: [],
                },
              ],
            },
            {
              _type: ParameterType.Array,
              comp: Comparison.EqualTo,
              children: [
                {
                  _type: ParameterType.Static,
                  comp: Comparison.EqualTo,
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
    //     _type: ParameterType.Tuple,
    //     children: [
    //       {
    //         _type: ParameterType.Static,
    //         children: [],
    //       },
    //       {
    //         _type: ParameterType.Array,
    //         children: [ Static],
    //       },
    //     ],
    //   },
    // ];

    const result = await topology.typeTree(layout);
    expect(result._type).to.equal(ParameterType.Tuple);
    expect(result.children.length).to.equal(2);

    expect(result.children[0]._type).to.equal(ParameterType.Static);
    expect(result.children[0].children.length).to.equal(0);

    expect(result.children[1]._type).to.equal(ParameterType.Array);
    expect(result.children[1].children.length).to.equal(1);
    expect(result.children[1].children[0]._type).to.equal(ParameterType.Static);
    expect(result.children[1].children[0].children.length).to.equal(0);
  });

  it("extraneous Value operation gets included as None", async () => {
    const { topology } = await setup();
    const layout = {
      _type: ParameterType.AbiEncoded,
      comp: 0,
      children: [
        {
          _type: ParameterType.None,
          comp: Comparison.ETHWithinAllowance,
          children: [],
        },
        {
          _type: ParameterType.Tuple,
          comp: 0,
          children: [
            {
              _type: ParameterType.Static,
              comp: Comparison.EqualTo,
              children: [],
            },
            {
              _type: ParameterType.None,
              comp: Comparison.Or,
              children: [
                {
                  _type: ParameterType.Array,
                  comp: Comparison.EqualTo,
                  children: [
                    {
                      _type: ParameterType.Static,
                      comp: Comparison.EqualTo,
                      children: [],
                    },
                  ],
                },
                {
                  _type: ParameterType.Array,
                  comp: Comparison.EqualTo,
                  children: [
                    {
                      _type: ParameterType.Static,
                      comp: Comparison.EqualTo,
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
    //     _type: ParameterType.Tuple,
    //     children: [
    //       {
    //         _type: ParameterType.None,
    //         children: [],
    //       },
    //       {
    //         _type: ParameterType.Static,
    //         children: [],
    //       },
    //       {
    //         _type: ParameterType.Array,
    //         children: [ Static],
    //       },
    //     ],
    //   },
    // ];

    const root = await topology.typeTree(layout);
    expect(root._type).to.equal(ParameterType.AbiEncoded);
    expect(root.children.length).to.equal(2);

    const extraneous = root.children[0];
    expect(extraneous._type).to.equal(ParameterType.None);
    expect(extraneous.children.length).to.equal(0);

    const tuple = root.children[1];
    expect(tuple._type).to.equal(ParameterType.Tuple);
    expect(tuple.children.length).to.equal(2);

    expect(tuple.children[0]._type).to.equal(ParameterType.Static);
    expect(tuple.children[0].children.length).to.equal(0);

    expect(tuple.children[1]._type).to.equal(ParameterType.Array);
    expect(tuple.children[1].children.length).to.equal(1);
    expect(tuple.children[1].children[0]._type).to.equal(ParameterType.Static);
    expect(tuple.children[1].children[0].children.length).to.equal(0);
  });
});
