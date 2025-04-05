import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { flattenCondition, Operator } from "../utils";
import { AbiType } from "./types";

describe("Topology library", async () => {
  async function setup() {
    const MockTopology = await hre.ethers.getContractFactory("MockTopology");
    const topology = await MockTopology.deploy();

    return {
      topology,
    };
  }

  it("a tuple type tree", async () => {
    const { topology } = await loadFixture(setup);

    const input = flattenCondition({
      paramType: AbiType.AbiEncodedWithSelector,
      operator: Operator.Matches,
      children: [
        {
          paramType: AbiType.Tuple,
          operator: Operator.Pass,
          children: [
            {
              paramType: AbiType.Dynamic,
              operator: Operator.Pass,
              children: [],
            },
            {
              paramType: AbiType.Static,
              operator: Operator.Pass,
              children: [],
            },
            {
              paramType: AbiType.Array,
              operator: Operator.Pass,
              children: [
                {
                  paramType: AbiType.Static,
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
        _type: BigInt(AbiType.AbiEncodedWithSelector),
        fields: [1n],
      },
      {
        _type: BigInt(AbiType.Tuple),
        fields: [2n, 3n, 4n],
      },
      {
        _type: BigInt(AbiType.Dynamic),
        fields: [],
      },
      {
        _type: BigInt(AbiType.Static),
        fields: [],
      },
      {
        _type: BigInt(AbiType.Array),
        fields: [5n],
      },
      {
        _type: BigInt(AbiType.Static),
        fields: [],
      },
    ];

    const output = (await topology.typeTree(input)).map(
      ({ _type, fields }) => ({ _type, fields })
    );

    expect(output).to.deep.equal(expected);
  });
  it("a logical type tree", async () => {
    const { topology } = await loadFixture(setup);

    const input = flattenCondition({
      paramType: AbiType.AbiEncodedWithSelector,
      operator: Operator.Matches,
      children: [
        {
          paramType: AbiType.None,
          operator: Operator.And,
          children: [
            {
              paramType: AbiType.Static,
              operator: Operator.EqualTo,
              children: [],
            },
            {
              paramType: AbiType.Static,
              operator: Operator.EqualTo,
              children: [],
            },
          ],
        },
      ],
    });

    const expected = [
      {
        _type: BigInt(AbiType.AbiEncodedWithSelector),
        fields: [1n],
      },
      {
        _type: BigInt(AbiType.Static),
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
      paramType: AbiType.None,
      operator: Operator.Or,
      children: [
        {
          paramType: AbiType.AbiEncodedWithSelector,
          operator: Operator.Matches,
          children: [
            {
              paramType: AbiType.Static,
              operator: Operator.Pass,
              children: [],
            },
            {
              paramType: AbiType.Dynamic,
              operator: Operator.EqualTo,
              children: [],
            },
          ],
        },
        {
          paramType: AbiType.AbiEncodedWithSelector,
          operator: Operator.Matches,
          children: [
            {
              paramType: AbiType.Static,
              operator: Operator.EqualTo,
              children: [],
            },
            {
              paramType: AbiType.Dynamic,
              operator: Operator.EqualTo,
              children: [],
            },
          ],
        },
        {
          paramType: AbiType.AbiEncodedWithSelector,
          operator: Operator.Matches,
          children: [
            {
              paramType: AbiType.Static,
              operator: Operator.EqualTo,
              children: [],
            },
            {
              paramType: AbiType.Dynamic,
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
        _type: BigInt(AbiType.AbiEncodedWithSelector),
        fields: [1n, 2n],
      },
      {
        _type: BigInt(AbiType.Static),
        fields: [],
      },
      {
        _type: BigInt(AbiType.Dynamic),
        fields: [],
      },
    ];

    expect(output).to.deep.equal(expected);
  });
  it("AND gets unfolded to Static", async () => {
    const { topology } = await loadFixture(setup);

    const input = flattenCondition({
      paramType: AbiType.AbiEncodedWithSelector,
      operator: Operator.Matches,
      children: [
        {
          paramType: AbiType.None,
          operator: Operator.And,
          children: [
            {
              paramType: AbiType.Static,
              operator: Operator.EqualTo,
              children: [],
            },
            {
              paramType: AbiType.Static,
              operator: Operator.EqualTo,
              children: [],
            },
          ],
        },
      ],
    });

    const expected = [
      {
        _type: BigInt(AbiType.AbiEncodedWithSelector),
        fields: [1n],
      },
      {
        _type: BigInt(AbiType.Static),
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
      paramType: AbiType.AbiEncodedWithSelector,
      operator: Operator.Matches,
      children: [
        {
          paramType: AbiType.Tuple,
          operator: Operator.Matches,
          children: [
            {
              paramType: AbiType.Dynamic,
              operator: Operator.Pass,
              children: [],
            },
            {
              paramType: AbiType.Static,
              operator: Operator.Pass,
              children: [],
            },
            {
              paramType: AbiType.None,
              operator: Operator.Or,
              children: [
                {
                  paramType: AbiType.Array,
                  operator: Operator.EqualTo,
                  children: [
                    {
                      paramType: AbiType.Static,
                      operator: Operator.EqualTo,
                      children: [],
                    },
                  ],
                },
                {
                  paramType: AbiType.Array,
                  operator: Operator.EqualTo,
                  children: [
                    {
                      paramType: AbiType.Static,
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
        _type: BigInt(AbiType.AbiEncodedWithSelector),
        fields: [1n],
      },
      {
        _type: BigInt(AbiType.Tuple),
        fields: [2, 3, 4],
      },
      {
        _type: BigInt(AbiType.Dynamic),
        fields: [],
      },
      {
        _type: BigInt(AbiType.Static),
        fields: [],
      },
      {
        _type: BigInt(AbiType.Array),
        fields: [5],
      },
      {
        _type: BigInt(AbiType.Static),
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
      paramType: AbiType.AbiEncodedWithSelector,
      operator: Operator.Matches,
      children: [
        {
          paramType: AbiType.Tuple,
          operator: Operator.Matches,
          children: [
            {
              paramType: AbiType.Dynamic,
              operator: Operator.Pass,
              children: [],
            },
            {
              paramType: AbiType.Static,
              operator: Operator.Pass,
              children: [],
            },
            {
              paramType: AbiType.Array,
              operator: Operator.EqualTo,
              children: [
                {
                  paramType: AbiType.None,
                  operator: Operator.Or,
                  children: [
                    {
                      paramType: AbiType.Static,
                      operator: Operator.EqualTo,
                      children: [],
                    },
                    {
                      paramType: AbiType.Static,
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
        _type: BigInt(AbiType.AbiEncodedWithSelector),
        fields: [1n],
      },
      {
        _type: BigInt(AbiType.Tuple),
        fields: [2, 3, 4],
      },
      {
        _type: BigInt(AbiType.Dynamic),
        fields: [],
      },
      {
        _type: BigInt(AbiType.Static),
        fields: [],
      },
      {
        _type: BigInt(AbiType.Array),
        fields: [5],
      },
      {
        _type: BigInt(AbiType.Static),
        fields: [],
      },
    ];

    const output = (await topology.typeTree(input)).map(
      ({ _type, fields }) => ({ _type, fields })
    );

    expect(output).to.deep.equal(expected);
  });
  it("EtherWithinAllowance in Calldata gets inspected as None", async () => {
    const { topology } = await loadFixture(setup);

    const input = flattenCondition({
      paramType: AbiType.AbiEncodedWithSelector,
      operator: Operator.Matches,
      children: [
        {
          paramType: AbiType.None,
          operator: Operator.EtherWithinAllowance,
          children: [],
        },
        {
          paramType: AbiType.Static,
          operator: Operator.EqualTo,
          children: [],
        },
      ],
    });

    const expected = [
      {
        _type: BigInt(AbiType.AbiEncodedWithSelector),
        fields: [1n, 2n],
      },
      {
        _type: BigInt(AbiType.None),
        fields: [],
      },
      {
        _type: BigInt(AbiType.Static),
        fields: [],
      },
    ];

    const output = (await topology.typeTree(input)).map(
      ({ _type, fields }) => ({ _type, fields })
    );

    expect(output).to.deep.equal(expected);
  });
  it("CallWithinAllowance Value trailing in Calldata gets inspected as None", async () => {
    const { topology } = await loadFixture(setup);

    const input = flattenCondition({
      paramType: AbiType.AbiEncodedWithSelector,
      operator: Operator.Matches,
      children: [
        {
          paramType: AbiType.Static,
          operator: Operator.EqualTo,
          children: [],
        },
        {
          paramType: AbiType.None,
          operator: Operator.CallWithinAllowance,
          children: [],
        },
      ],
    });

    const expected = [
      {
        _type: BigInt(AbiType.AbiEncodedWithSelector),
        fields: [1n, 2n],
      },
      {
        _type: BigInt(AbiType.Static),
        fields: [],
      },
      {
        _type: BigInt(AbiType.None),
        fields: [],
      },
    ];

    const output = (await topology.typeTree(input)).map(
      ({ _type, fields }) => ({ _type, fields })
    );

    expect(output).to.deep.equal(expected);
  });
});
