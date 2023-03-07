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

    const layout = [
      {
        _type: ParameterType.AbiEncoded,
        comp: Comparison.OneOf,
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
      },
    ];

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
    expect(result.length).to.equal(2);
    expect(result[0]._type).to.equal(ParameterType.Static);
    expect(result[0].children.length).to.equal(0);
    expect(result[1]._type).to.equal(ParameterType.Dynamic);
    expect(result[1].children.length).to.equal(0);
  });

  it("top level oneOf gets unfolded to its children types", async () => {
    const { topology } = await setup();
    const layout = [
      {
        _type: ParameterType.Tuple,
        comp: Comparison.OneOf,
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
      },
    ];
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
    expect(result.length).to.equal(1);
    expect(result[0]._type).to.equal(ParameterType.Tuple);
    expect(result[0].children.length).to.equal(2);
    expect(result[0].children[0]._type).to.equal(ParameterType.Static);
    expect(result[0].children[0].children.length).to.equal(0);
    expect(result[0].children[1]._type).to.equal(ParameterType.Static);
    expect(result[0].children[1].children.length).to.equal(0);
  });

  it("nested level oneOf gets unfolded to its children types", async () => {
    const { topology } = await setup();
    const layout = [
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
            _type: ParameterType.Array,
            comp: Comparison.OneOf,
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
    ];

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
    expect(result.length).to.equal(1);
    expect(result[0]._type).to.equal(ParameterType.Tuple);
    expect(result[0].children.length).to.equal(2);

    expect(result[0].children[0]._type).to.equal(ParameterType.Static);
    expect(result[0].children[0].children.length).to.equal(0);

    expect(result[0].children[1]._type).to.equal(ParameterType.Array);
    expect(result[0].children[1].children.length).to.equal(1);
    expect(result[0].children[1].children[0]._type).to.equal(
      ParameterType.Static
    );
    expect(result[0].children[1].children[0].children.length).to.equal(0);
  });
});
