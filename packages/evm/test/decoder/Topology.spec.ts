import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Operator, ParameterType } from "../utils";
import { flattenCondition } from "./flattenConditions";

describe("Topology library", async () => {
  async function setup() {
    const MockTopology = await hre.ethers.getContractFactory("MockTopology");
    const topology = await MockTopology.deploy();

    return {
      topology,
    };
  }

  it("misc", async () => {
    const { topology } = await loadFixture(setup);

    const input = flattenCondition({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.Tuple,
          operator: Operator.Pass,
          children: [
            {
              paramType: ParameterType.Dynamic,
              operator: Operator.Pass,
              children: [],
            },
            {
              paramType: ParameterType.Static,
              operator: Operator.Pass,
              children: [],
            },
            {
              paramType: ParameterType.Array,
              operator: Operator.Pass,
              children: [
                {
                  paramType: ParameterType.Static,
                  operator: Operator.Pass,
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    });

    const expected = [
      {
        _type: BigInt(ParameterType.Calldata),
        fields: [1n],
      },
      {
        _type: BigInt(ParameterType.Tuple),
        fields: [2n, 3n, 4n],
      },
      {
        _type: BigInt(ParameterType.Dynamic),
        fields: [],
      },
      {
        _type: BigInt(ParameterType.Static),
        fields: [],
      },
      {
        _type: BigInt(ParameterType.Array),
        fields: [5n],
      },
      {
        _type: BigInt(ParameterType.Static),
        fields: [],
      },
    ];

    const output = (await topology.typeTree(input)).map(
      ({ _type, fields }) => ({ _type, fields })
    );

    expect(output).to.deep.equal(expected);
  });
  it("misc 2", async () => {
    const { topology } = await loadFixture(setup);

    const input = flattenCondition({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.None,
          operator: Operator.And,
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
    });

    const expected = [
      {
        _type: BigInt(ParameterType.Calldata),
        fields: [1n],
      },
      {
        _type: BigInt(ParameterType.Static),
        fields: [],
      },
    ];

    const output = (await topology.typeTree(input)).map(
      ({ _type, fields }) => ({ _type, fields })
    );

    expect(output).to.deep.equal(expected);
  });
  it("top level variants get unfolded to its entrypoint form", async () => {
    const { topology } = await loadFixture(setup);

    const input = flattenCondition({
      paramType: ParameterType.None,
      operator: Operator.Or,
      children: [
        {
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          children: [
            {
              paramType: ParameterType.Static,
              operator: Operator.Pass,
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
          paramType: ParameterType.Calldata,
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
          paramType: ParameterType.Calldata,
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
    });

    const output = (await topology.typeTree(input)).map(
      ({ _type, fields }) => ({ _type, fields })
    );

    const expected = [
      {
        _type: BigInt(ParameterType.Calldata),
        fields: [1n, 2n],
      },
      {
        _type: BigInt(ParameterType.Static),
        fields: [],
      },
      {
        _type: BigInt(ParameterType.Dynamic),
        fields: [],
      },
    ];

    expect(output).to.deep.equal(expected);
  });
  it("AND gets unfolded to Static", async () => {
    const { topology } = await loadFixture(setup);

    const input = flattenCondition({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.None,
          operator: Operator.And,
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
    });

    const expected = [
      {
        _type: BigInt(ParameterType.Calldata),
        fields: [1n],
      },
      {
        _type: BigInt(ParameterType.Static),
        fields: [],
      },
    ];

    const output = (await topology.typeTree(input)).map(
      ({ _type, fields }) => ({ _type, fields })
    );

    expect(output).to.deep.equal(expected);
  });
  it("OR gets unfolded to Array - From Tuple", async () => {
    const { topology } = await loadFixture(setup);

    const input = flattenCondition({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          children: [
            {
              paramType: ParameterType.Dynamic,
              operator: Operator.Pass,
              children: [],
            },
            {
              paramType: ParameterType.Static,
              operator: Operator.Pass,
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
    });

    const expected = [
      {
        _type: BigInt(ParameterType.Calldata),
        fields: [1n],
      },
      {
        _type: BigInt(ParameterType.Tuple),
        fields: [2, 3, 4],
      },
      {
        _type: BigInt(ParameterType.Dynamic),
        fields: [],
      },
      {
        _type: BigInt(ParameterType.Static),
        fields: [],
      },
      {
        _type: BigInt(ParameterType.Array),
        fields: [5],
      },
      {
        _type: BigInt(ParameterType.Static),
        fields: [],
      },
    ];

    const output = (await topology.typeTree(input)).map(
      ({ _type, fields }) => ({
        _type,
        fields,
      })
    );

    expect(output).to.deep.equal(expected);
  });
  it("OR gets unfolded to Static - From Array", async () => {
    const { topology } = await loadFixture(setup);

    const input = flattenCondition({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          children: [
            {
              paramType: ParameterType.Dynamic,
              operator: Operator.Pass,
              children: [],
            },
            {
              paramType: ParameterType.Static,
              operator: Operator.Pass,
              children: [],
            },
            {
              paramType: ParameterType.Array,
              operator: Operator.EqualTo,
              children: [
                {
                  paramType: ParameterType.None,
                  operator: Operator.Or,
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
            },
          ],
        },
      ],
    });

    const expected = [
      {
        _type: BigInt(ParameterType.Calldata),
        fields: [1n],
      },
      {
        _type: BigInt(ParameterType.Tuple),
        fields: [2, 3, 4],
      },
      {
        _type: BigInt(ParameterType.Dynamic),
        fields: [],
      },
      {
        _type: BigInt(ParameterType.Static),
        fields: [],
      },
      {
        _type: BigInt(ParameterType.Array),
        fields: [5],
      },
      {
        _type: BigInt(ParameterType.Static),
        fields: [],
      },
    ];

    const output = (await topology.typeTree(input)).map(
      ({ _type, fields }) => ({ _type, fields })
    );

    expect(output).to.deep.equal(expected);
  });
  it("Extraneous Value in Calldata gets inspected as None", async () => {
    const { topology } = await loadFixture(setup);

    const input = flattenCondition({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.None,
          operator: Operator.EtherWithinAllowance,
          children: [],
        },
        {
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          children: [],
        },
      ],
    });

    const expected = [
      {
        _type: BigInt(ParameterType.Calldata),
        fields: [1n, 2n],
      },
      {
        _type: BigInt(ParameterType.None),
        fields: [],
      },
      {
        _type: BigInt(ParameterType.Static),
        fields: [],
      },
    ];

    const output = (await topology.typeTree(input)).map(
      ({ _type, fields }) => ({ _type, fields })
    );

    expect(output).to.deep.equal(expected);
  });
  it("Extraneous Value trailing in Calldata gets inspected as None", async () => {
    const { topology } = await loadFixture(setup);

    const input = flattenCondition({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          children: [],
        },
        {
          paramType: ParameterType.None,
          operator: Operator.CallWithinAllowance,
          children: [],
        },
      ],
    });

    const expected = [
      {
        _type: BigInt(ParameterType.Calldata),
        fields: [1n, 2n],
      },
      {
        _type: BigInt(ParameterType.Static),
        fields: [],
      },
      {
        _type: BigInt(ParameterType.None),
        fields: [],
      },
    ];

    const output = (await topology.typeTree(input)).map(
      ({ _type, fields }) => ({ _type, fields })
    );

    expect(output).to.deep.equal(expected);
  });
});
