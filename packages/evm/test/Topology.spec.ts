import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { AbiType, flattenCondition, Operator } from "./utils";

// todo: test that different variants in different array positions work

describe("Topology Library", () => {
  async function setup() {
    const MockTopology = await hre.ethers.getContractFactory("MockTopology");
    const topology = await MockTopology.deploy();
    return { topology };
  }

  describe("typeTree()", () => {
    describe("Basic Type Representation", () => {
      it("should correctly represent a Static type", async () => {
        const { topology } = await loadFixture(setup);

        const input = flattenCondition({
          paramType: AbiType.Calldata,
          operator: Operator.Matches,
          children: [
            {
              paramType: AbiType.Static,
              operator: Operator.Pass,
              children: [],
            },
          ],
        });

        const output = bfsToTree(await topology.typeTree(input));

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

      it("should correctly represent a Dynamic type", async () => {
        const { topology } = await loadFixture(setup);

        const input = flattenCondition({
          paramType: AbiType.Calldata,
          operator: Operator.Matches,
          children: [
            {
              paramType: AbiType.Dynamic,
              operator: Operator.Pass,
              children: [],
            },
          ],
        });

        const output = bfsToTree(await topology.typeTree(input));

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

      it("should correctly represent a simple Tuple of basic types", async () => {
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
              ],
            },
          ],
        });

        const output = bfsToTree(await topology.typeTree(input));

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
              ],
            },
          ],
        });
      });

      it("should correctly represent a simple Array of a basic type", async () => {
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
              ],
            },
          ],
        });

        const output = bfsToTree(await topology.typeTree(input));

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

      it("should process only first element of Array, ignoring subsequent siblings", async () => {
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

        const output = bfsToTree(await topology.typeTree(input));

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

    describe("Complex Nested Structures", () => {
      it("should handle deeply nested Tuples", async () => {
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
                  paramType: AbiType.Tuple,
                  operator: Operator.Pass,
                  children: [
                    {
                      paramType: AbiType.Dynamic,
                      operator: Operator.Pass,
                      children: [],
                    },
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
          ],
        });

        const output = bfsToTree(await topology.typeTree(input));

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
                  _type: AbiType.Tuple,
                  children: [
                    {
                      _type: AbiType.Dynamic,
                      children: [],
                    },
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
          ],
        });
      });

      it("should handle multi-dimensional Arrays", async () => {
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

        const output = bfsToTree(await topology.typeTree(input));

        expect(output).to.deep.equal({
          _type: AbiType.Calldata,
          children: [
            {
              _type: AbiType.Array,
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
        });
      });

      it("should handle Arrays of Tuples", async () => {
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
        });

        const output = bfsToTree(await topology.typeTree(input));

        expect(output).to.deep.equal({
          _type: AbiType.Calldata,
          children: [
            {
              _type: AbiType.Array,
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
        });
      });

      it("should handle Tuples containing Arrays", async () => {
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

        const output = bfsToTree(await topology.typeTree(input));

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
    });

    describe("Logical Operator Behavior (AND, OR, NOR)", () => {
      describe("Non-Variant Children", () => {
        it("should resolve AND with homogeneous children to a single representative type tree", async () => {
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

          const output = bfsToTree(await topology.typeTree(input));

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

        it("should resolve OR with homogeneous children to a single representative type tree", async () => {
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

          const output = bfsToTree(await topology.typeTree(input));

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

        it("should unfold OR within Tuple when children have same type tree", async () => {
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

          const output = bfsToTree(await topology.typeTree(input));

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

        it("should unfold OR within Array when children have same type tree", async () => {
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

          const output = bfsToTree(await topology.typeTree(input));

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
      });

      describe("Variant Children", () => {
        it("should resolve OR with heterogeneous children to a Dynamic variant type", async () => {
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

          const output = bfsToTree(await topology.typeTree(input));

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

        it("should correctly represent all variant children under the Dynamic type", async () => {
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

          const output = bfsToTree(await topology.typeTree(input));

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

        it("should handle variants within nested structures (e.g., inside a Tuple)", async () => {
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

          const output = bfsToTree(await topology.typeTree(input));

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

        it("should handle variants within Array structures", async () => {
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
                    paramType: AbiType.Dynamic,
                    operator: Operator.Pass,
                    children: [],
                  },
                ],
              },
            ],
          });

          const output = bfsToTree(await topology.typeTree(input));

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
                  {
                    _type: AbiType.Dynamic,
                    children: [],
                  },
                ],
              },
            ],
          });
        });

        it("should handle AND with heterogeneous children as variant", async () => {
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

          const output = bfsToTree(await topology.typeTree(input));

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
      });

      describe("Edge Cases for Logical Operators", () => {
        it("should handle a logical operator with only a single child", async () => {
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
                    paramType: AbiType.Static,
                    operator: Operator.Pass,
                    children: [],
                  },
                ],
              },
            ],
          });

          const output = bfsToTree(await topology.typeTree(input));

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

        it("should handle multiple nested logical operators", async () => {
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
                        paramType: AbiType.Static,
                        operator: Operator.EqualTo,
                        children: [],
                      },
                      {
                        paramType: AbiType.Static,
                        operator: Operator.GreaterThan,
                        children: [],
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

          const output = bfsToTree(await topology.typeTree(input));

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
                      { paramType: AbiType.Dynamic },
                      { paramType: AbiType.Dynamic },
                    ],
                  },
                  {
                    paramType: AbiType.None,
                    operator: Operator.And,
                    children: [
                      {
                        paramType: AbiType.Calldata,
                        operator: Operator.Matches,
                        children: [{ paramType: AbiType.Static }],
                      },
                      {
                        paramType: AbiType.AbiEncoded,
                        operator: Operator.Matches,
                        children: [{ paramType: AbiType.Static }],
                      },
                    ],
                  },
                ],
              },
            ],
          });

          const output = normalizeTree(
            bfsToTree(await topology.typeTree(input)),
          );

          // Mixed OR/AND structure where:
          // - First AND yields Dynamic (same type tree)
          // - Second AND yields different structures, creating a variant
          expect(output).to.deep.equal(
            normalizeTree({
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
            }),
          );
        });

        it("should handle nested variants", async () => {
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

          const output = bfsToTree(await topology.typeTree(input));

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

      describe("Top-level Variant Unfolding", () => {
        it("should unfold top-level OR variants to their entrypoint form", async () => {
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

          const output = bfsToTree(await topology.typeTree(input));

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
      });
    });

    describe("Specialized Operator and Type Handling", () => {
      it("should treat EtherWithinAllowance as a None type in the tree", async () => {
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
              operator: Operator.EtherWithinAllowance,
              children: [],
            },
          ],
        });

        const output = bfsToTree(await topology.typeTree(input));

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

      it("should treat CallWithinAllowance as a None type in the tree", async () => {
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

        const output = bfsToTree(await topology.typeTree(input));

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

      it("should handle EtherWithinAllowance as lone node", async () => {
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
          ],
        });

        const output = bfsToTree(await topology.typeTree(input));

        expect(output).to.deep.equal({
          _type: AbiType.Calldata,
          children: [],
        });
      });

      it("should handle CallWithinAllowance as lone node", async () => {
        const { topology } = await loadFixture(setup);

        const input = flattenCondition({
          paramType: AbiType.Calldata,
          operator: Operator.Matches,
          children: [
            {
              paramType: AbiType.None,
              operator: Operator.CallWithinAllowance,
            },
          ],
        });

        const output = bfsToTree(await topology.typeTree(input));

        expect(output).to.deep.equal({
          _type: AbiType.Calldata,
          children: [],
        });
      });

      it("should filter out complete subtrees that are non-structural", async () => {
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
                  paramType: AbiType.None,
                  operator: Operator.EtherWithinAllowance,
                },
                {
                  paramType: AbiType.None,
                  operator: Operator.CallWithinAllowance,
                },
              ],
            },
          ],
        });

        const output = bfsToTree(await topology.typeTree(input));

        expect(output).to.deep.equal({
          _type: AbiType.Calldata,
          children: [],
        });
      });

      it("should handle EtherWithinAllowance as first node", async () => {
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
              paramType: AbiType.Dynamic,
              operator: Operator.Pass,
              children: [],
            },
            {
              paramType: AbiType.None,
              operator: Operator.EtherWithinAllowance,
              children: [],
            },
          ],
        });

        const output = bfsToTree(await topology.typeTree(input));

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

      it("should handle CallWithinAllowance as last node", async () => {
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
              paramType: AbiType.Dynamic,
              operator: Operator.Pass,
              children: [],
            },
            {
              paramType: AbiType.None,
              operator: Operator.CallWithinAllowance,
              children: [],
            },
          ],
        });

        const output = bfsToTree(await topology.typeTree(input));

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

      it("should handle EtherWithinAllowance as child of OR variant", async () => {
        const { topology } = await loadFixture(setup);

        const condition = {
          paramType: AbiType.None,
          operator: Operator.Or,
          children: [
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
                  paramType: AbiType.None,
                  operator: Operator.EtherWithinAllowance,
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
                  paramType: AbiType.None,
                  operator: Operator.EtherWithinAllowance,
                  children: [],
                },
              ],
            },
          ],
        };

        const input = flattenCondition(condition);

        const output = bfsToTree(await topology.typeTree(input));

        // NonStructural nodes filtered out; both OR branches identical -> collapses to single branch
        expect(output).to.deep.equal({
          _type: AbiType.Calldata,
          children: [{ _type: AbiType.Static, children: [] }],
        });
      });

      it("should represent non-top-level Calldata types directly within the tree", async () => {
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

        const output = bfsToTree(await topology.typeTree(input));

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

      it("should represent non-top-level AbiEncoded types directly within the tree", async () => {
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
                      children: [
                        { paramType: AbiType.Static },
                        { paramType: AbiType.Dynamic },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });

        const output = bfsToTree(await topology.typeTree(input));

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

      it("should correctly handle an AbiEncoded type within a variant structure", async () => {
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

        const output = bfsToTree(await topology.typeTree(input));

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

      it("should handle nested non-top-level Calldata in complex structures", async () => {
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

        const output = bfsToTree(await topology.typeTree(input));

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
    });

    describe("Array Variant Handling", () => {
      it("should include only first Array element when children have same type tree", async () => {
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
              ],
            },
          ],
        });

        const output = bfsToTree(await topology.typeTree(input));

        // OR with homogeneous children (all Dynamic) is not a variant
        // Array should only have first child
        expect(output).to.deep.equal({
          _type: AbiType.Calldata,
          children: [
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
        });
      });

      it("should include only first Array element for simple non-variant types", async () => {
        const { topology } = await loadFixture(setup);

        const input = flattenCondition({
          paramType: AbiType.Calldata,
          operator: Operator.Matches,
          children: [
            {
              paramType: AbiType.Array,
              operator: Operator.Pass,
              children: [
                { paramType: AbiType.Static },
                { paramType: AbiType.Static },
                { paramType: AbiType.Static },
              ],
            },
          ],
        });

        const output = bfsToTree(await topology.typeTree(input));

        // Multiple Static children - all same type, not a variant
        // Array should only have first child
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

      it("should include all Array elements when children form a variant", async () => {
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
                    { paramType: AbiType.Dynamic },
                    {
                      paramType: AbiType.Calldata,
                      operator: Operator.Matches,
                      children: [{ paramType: AbiType.Static }],
                    },
                    {
                      paramType: AbiType.AbiEncoded,
                      operator: Operator.Matches,
                      children: [{ paramType: AbiType.Dynamic }],
                    },
                  ],
                },
              ],
            },
          ],
        });

        const output = bfsToTree(await topology.typeTree(input));

        // OR with heterogeneous children (Dynamic, Calldata, AbiEncoded) creates a variant
        // Array should contain all variant children
        expect(output).to.deep.equal({
          _type: AbiType.Calldata,
          children: [
            {
              _type: AbiType.Array,
              children: [
                {
                  _type: AbiType.Dynamic,
                  children: [
                    { _type: AbiType.Dynamic, children: [] },
                    {
                      _type: AbiType.Calldata,
                      children: [{ _type: AbiType.Static, children: [] }],
                    },
                    {
                      _type: AbiType.AbiEncoded,
                      children: [{ _type: AbiType.Dynamic, children: [] }],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
    });
  });

  describe("toTypeTree - OLD TESTS", () => {
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

        const output = bfsToTree(await topology.typeTree(input));

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

        const output = bfsToTree(await topology.typeTree(input));

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

        const output = bfsToTree(await topology.typeTree(input));

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

        const output = bfsToTree(await topology.typeTree(input));

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

        const output = bfsToTree(await topology.typeTree(input));

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

        const output = bfsToTree(await topology.typeTree(input));

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
              paramType: AbiType.Static,
              operator: Operator.EqualTo,
              children: [],
            },
            {
              paramType: AbiType.None,
              operator: Operator.EtherWithinAllowance,
              children: [],
            },
          ],
        });

        const output = bfsToTree(await topology.typeTree(input));

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

        const output = bfsToTree(await topology.typeTree(input));

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

        const output = bfsToTree(await topology.typeTree(input));

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

    describe("Ether/CallWithinAllowance", () => {
      it("EtherWithinAllowance as lone node", async () => {
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
          ],
        });

        const output = bfsToTree(await topology.typeTree(input));

        expect(output).to.deep.equal({
          _type: AbiType.Calldata,
          children: [],
        });
      });

      it("CallWithinAllowance as lone node", async () => {
        const { topology } = await loadFixture(setup);

        const input = flattenCondition({
          paramType: AbiType.Calldata,
          operator: Operator.Matches,
          children: [
            {
              paramType: AbiType.None,
              operator: Operator.CallWithinAllowance,
              children: [],
            },
          ],
        });

        const output = bfsToTree(await topology.typeTree(input));

        expect(output).to.deep.equal({
          _type: AbiType.Calldata,
          children: [],
        });
      });

      it("CallWithinAllowance as last node", async () => {
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
              paramType: AbiType.Dynamic,
              operator: Operator.Pass,
              children: [],
            },
            {
              paramType: AbiType.None,
              operator: Operator.CallWithinAllowance,
              children: [],
            },
          ],
        });

        const output = bfsToTree(await topology.typeTree(input));

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

      it("EtherWithinAllowance as child of OR variant", async () => {
        const { topology } = await loadFixture(setup);

        const condition = {
          paramType: AbiType.None,
          operator: Operator.Or,
          children: [
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
                  paramType: AbiType.None,
                  operator: Operator.EtherWithinAllowance,
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
                  paramType: AbiType.None,
                  operator: Operator.EtherWithinAllowance,
                  children: [],
                },
              ],
            },
          ],
        };

        const input = flattenCondition(condition);

        const output = bfsToTree(await topology.typeTree(input));

        // NonStructural nodes filtered out; both OR branches identical -> collapses to single branch
        expect(output).to.deep.equal({
          _type: AbiType.Calldata,
          children: [{ _type: AbiType.Static, children: [] }],
        });
      });
    });

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

        const output = bfsToTree(await topology.typeTree(input));

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

        const output = bfsToTree(await topology.typeTree(input));

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

        const output = bfsToTree(await topology.typeTree(input));

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

        const output = bfsToTree(await topology.typeTree(input));

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

        const output = bfsToTree(await topology.typeTree(input));

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

        const output = bfsToTree(await topology.typeTree(input));

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

        const output = bfsToTree(await topology.typeTree(input));

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

        const output = bfsToTree(await topology.typeTree(input));

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

        const output = normalizeTree(bfsToTree(await topology.typeTree(input)));

        // Mixed OR/AND structure where:
        // - First AND yields Dynamic (same type tree)
        // - Second AND yields different structures, creating a variant
        expect(output).to.deep.equal(
          normalizeTree({
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
          }),
        );
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

        const output = normalizeTree(bfsToTree(await topology.typeTree(input)));

        // Deeply nested structure:
        // - Inner OR yields Dynamic (same type tree)
        // - AND combines to Dynamic
        // - Outer OR creates variant between Dynamic and Calldata
        expect(output).to.deep.equal(
          normalizeTree({
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
          }),
        );
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

        const output = bfsToTree(await topology.typeTree(input));

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

        const output = bfsToTree(await topology.typeTree(input));

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

        const output = bfsToTree(await topology.typeTree(input));

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
                {
                  paramType: AbiType.Dynamic,
                  operator: Operator.Pass,
                  children: [],
                },
              ],
            },
          ],
        });

        const output = bfsToTree(await topology.typeTree(input));

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
                {
                  _type: AbiType.Dynamic,
                  children: [],
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

        const output = bfsToTree(await topology.typeTree(input));

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
});

// Helper function
type TreeNode = {
  _type: AbiType;
  children: TreeNode[];
};
function bfsToTree(
  bfsArray: { _type: bigint; parent: number | bigint }[],
): TreeNode {
  const nodes = bfsArray.map((item) => ({
    _type: Number(item._type),
    children: [] as TreeNode[],
  }));

  for (let i = 1; i < bfsArray.length; i++) {
    nodes[Number(bfsArray[i].parent)].children.push(nodes[i]);
  }

  return nodes[0];
}

function normalizeTree(node: TreeNode): TreeNode {
  // Recursively normalize all children first
  const normalizedChildren = node.children.map(normalizeTree);

  // Sort children by _type first, then by JSON representation for deterministic ordering
  normalizedChildren.sort((a, b) => {
    if (a._type !== b._type) {
      return a._type - b._type;
    }
    // If types are equal, sort by stringified representation
    return JSON.stringify(a).localeCompare(JSON.stringify(b));
  });

  return {
    _type: node._type,
    children: normalizedChildren,
  };
}
