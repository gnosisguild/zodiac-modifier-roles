import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { AbiType, flattenCondition, Operator } from "./utils";

describe("Topology library", async () => {
  async function setup() {
    const MockTopology = await hre.ethers.getContractFactory("MockTopology");
    const topology = await MockTopology.deploy();

    return {
      topology,
    };
  }

  describe("basic cases", () => {
    it("a tuple type tree", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
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

      const output = bfsToTree(await topology.typeTree2(input));

      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Tuple,
            children: [
              {
                _type: AbiType.Dynamic,
                children: [],
              },
              {
                _type: AbiType.Static,
                children: [],
              },
              {
                _type: AbiType.Array,
                children: [
                  {
                    _type: AbiType.Static,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      });
    });
    it("a logical type tree", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
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

      const output = bfsToTree(await topology.typeTree2(input));

      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Static,
            children: [],
          },
        ],
      });
    });
    it("top level variants get unfolded to its entrypoint form", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.None,
        operator: Operator.Or,
        children: [
          {
            paramType: AbiType.Calldata,
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
            paramType: AbiType.Calldata,
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
            paramType: AbiType.Calldata,
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

      const output = bfsToTree(await topology.typeTree2(input));

      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Static,
            children: [],
          },
          {
            _type: AbiType.Dynamic,
            children: [],
          },
        ],
      });
    });
    it("AND gets unfolded to Static", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
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

      const output = bfsToTree(await topology.typeTree2(input));

      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Static,
            children: [],
          },
        ],
      });
    });
    it("OR gets unfolded to Array - From Tuple", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
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

      const output = bfsToTree(await topology.typeTree2(input));

      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Tuple,
            children: [
              {
                _type: AbiType.Dynamic,
                children: [],
              },
              {
                _type: AbiType.Static,
                children: [],
              },
              {
                _type: AbiType.Array,
                children: [
                  {
                    _type: AbiType.Static,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      });
    });
    it("OR gets unfolded to Static - From Array", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
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

      const output = bfsToTree(await topology.typeTree2(input));

      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Tuple,
            children: [
              {
                _type: AbiType.Dynamic,
                children: [],
              },
              {
                _type: AbiType.Static,
                children: [],
              },
              {
                _type: AbiType.Array,
                children: [
                  {
                    _type: AbiType.Static,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      });
    });
    it("EtherWithinAllowance in Calldata gets inspected as None", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
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

      const output = bfsToTree(await topology.typeTree2(input));

      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.None,
            children: [],
          },
          {
            _type: AbiType.Static,
            children: [],
          },
        ],
      });
    });
    it("CallWithinAllowance Value trailing in Calldata gets inspected as None", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
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

      const output = bfsToTree(await topology.typeTree2(input));

      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Static,
            children: [],
          },
          {
            _type: AbiType.None,
            children: [],
          },
        ],
      });
    });
    it("Array resolves to first element only in type tree", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Array,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
        ],
      });

      const output = bfsToTree(await topology.typeTree2(input));

      // Array should only process its first child, ignoring the rest
      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Array,
            children: [
              {
                _type: AbiType.Static,
                children: [],
              },
            ],
          },
        ],
      });
    });
  });

  // Non-top level Calldata/AbiEncoded implicit Dynamic handling
  describe("Non-top level Calldata/AbiEncoded handling", () => {
    it("should represent non-top level Calldata directly", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Calldata,
                operator: Operator.Matches,
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

      const output = bfsToTree(await topology.typeTree2(input));

      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Tuple,
            children: [
              {
                _type: AbiType.Static,
                children: [],
              },
              {
                _type: AbiType.Calldata,
                children: [
                  {
                    _type: AbiType.Static,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it("should represent non-top level AbiEncoded directly", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Array,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.AbiEncoded,
                operator: Operator.Matches,
                children: [
                  {
                    paramType: AbiType.Tuple,
                    operator: Operator.Pass,
                    children: [
                      {
                        paramType: AbiType.Static,
                        operator: Operator.Pass,
                        children: [],
                      },
                      {
                        paramType: AbiType.Dynamic,
                        operator: Operator.Pass,
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

      const output = bfsToTree(await topology.typeTree2(input));

      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Array,
            children: [
              {
                _type: AbiType.AbiEncoded,
                children: [
                  {
                    _type: AbiType.Tuple,
                    children: [
                      {
                        _type: AbiType.Static,
                        children: [],
                      },
                      {
                        _type: AbiType.Dynamic,
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
    });

    it("should handle nested non-top level Calldata directly in complex structures", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Array,
                operator: Operator.Pass,
                children: [
                  {
                    paramType: AbiType.Calldata,
                    operator: Operator.Matches,
                    children: [
                      {
                        paramType: AbiType.Tuple,
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
              },
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
        ],
      });

      const output = bfsToTree(await topology.typeTree2(input));

      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Tuple,
            children: [
              {
                _type: AbiType.Array,
                children: [
                  {
                    _type: AbiType.Calldata,
                    children: [
                      {
                        _type: AbiType.Tuple,
                        children: [
                          {
                            _type: AbiType.Static,
                            children: [],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                _type: AbiType.Static,
                children: [],
              },
            ],
          },
        ],
      });
    });

    it("should represent AbiEncoded within OR structure as variant with Dynamic wrapper", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.Or,
            children: [
              {
                paramType: AbiType.AbiEncoded,
                operator: Operator.Matches,
                children: [
                  {
                    paramType: AbiType.Static,
                    operator: Operator.Pass,
                    children: [],
                  },
                ],
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

      const output = bfsToTree(await topology.typeTree2(input));

      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Dynamic,
            children: [
              {
                _type: AbiType.AbiEncoded,
                children: [
                  {
                    _type: AbiType.Static,
                    children: [],
                  },
                ],
              },
              {
                _type: AbiType.Dynamic,
                children: [],
              },
            ],
          },
        ],
      });
    });
  });

  // OR/AND children with relaxed type tree equivalence
  describe("OR/AND children with type tree equivalence rules", () => {
    it("should handle OR with children translating to same type tree - non-variant payload", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.Or,
            children: [
              {
                paramType: AbiType.Dynamic,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Dynamic,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Dynamic,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
        ],
      });

      const output = bfsToTree(await topology.typeTree2(input));

      // All OR children produce same type tree (Dynamic with no children)
      // This should NOT create a variant, just return the first child's tree
      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Dynamic,
            children: [],
          },
        ],
      });
    });

    it("should handle AND with children translating to same type tree - non-variant payload", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.And,
            children: [
              {
                paramType: AbiType.Dynamic,
                operator: Operator.EqualTo,
                children: [],
              },
              {
                paramType: AbiType.Dynamic,
                operator: Operator.GreaterThan,
                children: [],
              },
            ],
          },
        ],
      });

      const output = bfsToTree(await topology.typeTree2(input));

      // All AND children produce same type tree (Dynamic with no children)
      // So this should NOT create a variant, just return the first child's tree
      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Dynamic,
            children: [],
          },
        ],
      });
    });

    it("should handle OR with children translating to different type trees - variant payload", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.Or,
            children: [
              {
                paramType: AbiType.Dynamic,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Calldata,
                operator: Operator.Matches,
                children: [
                  {
                    paramType: AbiType.Static,
                    operator: Operator.Pass,
                    children: [],
                  },
                ],
              },
              {
                paramType: AbiType.AbiEncoded,
                operator: Operator.Matches,
                children: [
                  {
                    paramType: AbiType.Dynamic,
                    operator: Operator.Pass,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      });

      const output = bfsToTree(await topology.typeTree2(input));

      // OR children have different type trees, so this creates a variant
      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Dynamic,
            children: [
              {
                _type: AbiType.Dynamic,
                children: [],
              },
              {
                _type: AbiType.Calldata,
                children: [
                  {
                    _type: AbiType.Static,
                    children: [],
                  },
                ],
              },
              {
                _type: AbiType.AbiEncoded,
                children: [
                  {
                    _type: AbiType.Dynamic,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it("should handle AND with children translating to different type trees - variant payload", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.And,
            children: [
              {
                paramType: AbiType.Dynamic,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Calldata,
                operator: Operator.Matches,
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

      const output = bfsToTree(await topology.typeTree2(input));

      // AND children have different type trees, so this creates a variant
      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Dynamic,
            children: [
              {
                _type: AbiType.Dynamic,
                children: [],
              },
              {
                _type: AbiType.Calldata,
                children: [
                  {
                    _type: AbiType.Static,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it("should handle mixed OR/AND structures with relaxed equivalence", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.Or,
            children: [
              {
                paramType: AbiType.None,
                operator: Operator.And,
                children: [
                  {
                    paramType: AbiType.Dynamic,
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
                paramType: AbiType.None,
                operator: Operator.And,
                children: [
                  {
                    paramType: AbiType.Calldata,
                    operator: Operator.Matches,
                    children: [
                      {
                        paramType: AbiType.Static,
                        operator: Operator.Pass,
                        children: [],
                      },
                    ],
                  },
                  {
                    paramType: AbiType.AbiEncoded,
                    operator: Operator.Matches,
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
          },
        ],
      });

      const output = bfsToTree(await topology.typeTree2(input));

      // Mixed OR/AND structure where:
      // - First AND yields Dynamic (same type tree)
      // - Second AND yields different structures, creating a variant
      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Dynamic,
            children: [
              {
                _type: AbiType.Dynamic,
                children: [],
              },
              {
                _type: AbiType.Dynamic,
                children: [
                  {
                    _type: AbiType.Calldata,
                    children: [
                      {
                        _type: AbiType.Static,
                        children: [],
                      },
                    ],
                  },
                  {
                    _type: AbiType.AbiEncoded,
                    children: [
                      {
                        _type: AbiType.Static,
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
    });

    it("should handle deeply nested OR/AND with relaxed type tree matching", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.None,
                operator: Operator.Or,
                children: [
                  {
                    paramType: AbiType.None,
                    operator: Operator.And,
                    children: [
                      {
                        paramType: AbiType.None,
                        operator: Operator.Or,
                        children: [
                          {
                            paramType: AbiType.Dynamic,
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
                        paramType: AbiType.Dynamic,
                        operator: Operator.Pass,
                        children: [],
                      },
                    ],
                  },
                  {
                    paramType: AbiType.Calldata,
                    operator: Operator.Matches,
                    children: [
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
              },
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
        ],
      });

      const output = bfsToTree(await topology.typeTree2(input));

      // Deeply nested structure:
      // - Inner OR yields Dynamic (same type tree)
      // - AND combines to Dynamic
      // - Outer OR creates variant between Dynamic and Calldata
      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Tuple,
            children: [
              {
                _type: AbiType.Dynamic,
                children: [
                  {
                    _type: AbiType.Dynamic,
                    children: [],
                  },
                  {
                    _type: AbiType.Calldata,
                    children: [
                      {
                        _type: AbiType.Array,
                        children: [
                          {
                            _type: AbiType.Static,
                            children: [],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                _type: AbiType.Static,
                children: [],
              },
            ],
          },
        ],
      });
    });
  });

  // Variant payload nodes with multiple children
  describe("Variant payload nodes with multiple children", () => {
    it("should create variant payload node with multiple Static children", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.Or,
            children: [
              {
                paramType: AbiType.Dynamic,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Dynamic,
                operator: Operator.EqualTo,
                children: [],
              },
              {
                paramType: AbiType.Dynamic,
                operator: Operator.GreaterThan,
                children: [],
              },
            ],
          },
        ],
      });

      const output = bfsToTree(await topology.typeTree2(input));

      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Dynamic,
            children: [],
          },
        ],
      });
    });

    it("should create variant payload node with mixed child types", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.Or,
            children: [
              {
                paramType: AbiType.Dynamic,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: AbiType.Calldata,
                operator: Operator.Matches,
                children: [
                  {
                    paramType: AbiType.Static,
                    operator: Operator.Pass,
                    children: [],
                  },
                ],
              },
              {
                paramType: AbiType.AbiEncoded,
                operator: Operator.Matches,
                children: [
                  {
                    paramType: AbiType.Tuple,
                    operator: Operator.Pass,
                    children: [
                      {
                        paramType: AbiType.Static,
                        operator: Operator.Pass,
                        children: [],
                      },
                      {
                        paramType: AbiType.Dynamic,
                        operator: Operator.Pass,
                        children: [],
                      },
                    ],
                  },
                ],
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

      const output = bfsToTree(await topology.typeTree2(input));

      // OR with mixed child types creates a variant payload node
      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Dynamic,
            children: [
              {
                _type: AbiType.Dynamic,
                children: [],
              },
              {
                _type: AbiType.Calldata,
                children: [
                  {
                    _type: AbiType.Static,
                    children: [],
                  },
                ],
              },
              {
                _type: AbiType.AbiEncoded,
                children: [
                  {
                    _type: AbiType.Tuple,
                    children: [
                      {
                        _type: AbiType.Static,
                        children: [],
                      },
                      {
                        _type: AbiType.Dynamic,
                        children: [],
                      },
                    ],
                  },
                ],
              },
              {
                _type: AbiType.Dynamic,
                children: [],
              },
            ],
          },
        ],
      });
    });

    it("should handle variant payload nodes within Tuple structures", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            children: [
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
                    paramType: AbiType.Dynamic,
                    operator: Operator.Pass,
                    children: [],
                  },
                  {
                    paramType: AbiType.Calldata,
                    operator: Operator.Matches,
                    children: [
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
                  {
                    paramType: AbiType.AbiEncoded,
                    operator: Operator.Matches,
                    children: [
                      {
                        paramType: AbiType.Dynamic,
                        operator: Operator.Pass,
                        children: [],
                      },
                    ],
                  },
                ],
              },
              {
                paramType: AbiType.Array,
                operator: Operator.Pass,
                children: [
                  {
                    paramType: AbiType.Dynamic,
                    operator: Operator.Pass,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      });

      const output = bfsToTree(await topology.typeTree2(input));

      // Variant within Tuple: second element is OR with different structures
      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Tuple,
            children: [
              {
                _type: AbiType.Static,
                children: [],
              },
              {
                _type: AbiType.Dynamic,
                children: [
                  {
                    _type: AbiType.Dynamic,
                    children: [],
                  },
                  {
                    _type: AbiType.Calldata,
                    children: [
                      {
                        _type: AbiType.Array,
                        children: [
                          {
                            _type: AbiType.Static,
                            children: [],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    _type: AbiType.AbiEncoded,
                    children: [
                      {
                        _type: AbiType.Dynamic,
                        children: [],
                      },
                    ],
                  },
                ],
              },
              {
                _type: AbiType.Array,
                children: [
                  {
                    _type: AbiType.Dynamic,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it("should handle variant payload nodes within Array structures", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.Array,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.None,
                operator: Operator.Or,
                children: [
                  {
                    paramType: AbiType.Calldata,
                    operator: Operator.Matches,
                    children: [
                      {
                        paramType: AbiType.Tuple,
                        operator: Operator.Pass,
                        children: [
                          {
                            paramType: AbiType.Static,
                            operator: Operator.Pass,
                            children: [],
                          },
                          {
                            paramType: AbiType.Dynamic,
                            operator: Operator.Pass,
                            children: [],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    paramType: AbiType.AbiEncoded,
                    operator: Operator.Matches,
                    children: [
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
                  {
                    paramType: AbiType.Dynamic,
                    operator: Operator.Pass,
                    children: [],
                  },
                ],
              },
              // These will be ignored - Array only processes first child
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
        ],
      });

      const output = bfsToTree(await topology.typeTree2(input));

      // Array contains OR variant as first child (others ignored)
      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Array,
            children: [
              {
                _type: AbiType.Dynamic,
                children: [
                  {
                    _type: AbiType.Calldata,
                    children: [
                      {
                        _type: AbiType.Tuple,
                        children: [
                          {
                            _type: AbiType.Static,
                            children: [],
                          },
                          {
                            _type: AbiType.Dynamic,
                            children: [],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    _type: AbiType.AbiEncoded,
                    children: [
                      {
                        _type: AbiType.Array,
                        children: [
                          {
                            _type: AbiType.Static,
                            children: [],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    _type: AbiType.Dynamic,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it("should handle nested variant payload nodes", async () => {
      const { topology } = await loadFixture(setup);

      const input = flattenCondition({
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.Or,
            children: [
              {
                paramType: AbiType.Calldata,
                operator: Operator.Matches,
                children: [
                  {
                    paramType: AbiType.None,
                    operator: Operator.Or,
                    children: [
                      {
                        paramType: AbiType.Dynamic,
                        operator: Operator.Pass,
                        children: [],
                      },
                      {
                        paramType: AbiType.AbiEncoded,
                        operator: Operator.Matches,
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
              },
              {
                paramType: AbiType.Dynamic,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
        ],
      });

      const output = bfsToTree(await topology.typeTree2(input));

      // Nested variants: outer OR contains inner OR with different structures
      expect(output).to.deep.equal({
        _type: AbiType.Calldata,
        children: [
          {
            _type: AbiType.Dynamic,
            children: [
              {
                _type: AbiType.Calldata,
                children: [
                  {
                    _type: AbiType.Dynamic,
                    children: [
                      {
                        _type: AbiType.Dynamic,
                        children: [],
                      },
                      {
                        _type: AbiType.AbiEncoded,
                        children: [
                          {
                            _type: AbiType.Static,
                            children: [],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                _type: AbiType.Dynamic,
                children: [],
              },
            ],
          },
        ],
      });
    });
  });
});

type TreeNode = {
  _type: AbiType;
  children: TreeNode[];
};
function bfsToTree(
  bfsArray: { _type: bigint; parent: number | bigint }[],
): TreeNode {
  // Create a copy of objects and add children array to each
  const nodes = bfsArray.map((item) => ({
    _type: Number(item._type),
    children: [] as TreeNode[],
  }));

  for (let i = 1; i < bfsArray.length; i++) {
    nodes[Number(bfsArray[i].parent)].children.push(nodes[i]);
  }

  return nodes[0];
}
