import { expect } from "chai";
import hre from "hardhat";
import { AbiCoder, ZeroHash } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { AbiType, flattenCondition, Operator } from "./utils";
import { ConditionFlatStruct } from "../typechain-types/contracts/Integrity";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

async function setup() {
  const Integrity = await hre.ethers.getContractFactory("Integrity");
  const integrity = await Integrity.deploy();
  const integrityAddress = await integrity.getAddress();
  const Mock = await hre.ethers.getContractFactory("MockIntegrity", {
    libraries: {
      Integrity: integrityAddress,
    },
  });
  const mock = await Mock.deploy();

  async function enforce(conditionsFlat: ConditionFlatStruct[]) {
    await mock.enforce(conditionsFlat);
  }

  return {
    enforce,
    integrity,
  };
}

describe("Integrity", async () => {
  it("enforces only one root node", async () => {
    const { integrity, enforce } = await loadFixture(setup);

    await expect(
      enforce([
        {
          parent: 1,
          paramType: AbiType.Calldata,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: AbiType.Tuple,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ]),
    ).to.be.revertedWithCustomError(integrity, "UnsuitableRootNode");

    await expect(
      enforce([
        {
          parent: 1,
          paramType: AbiType.Calldata,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: AbiType.Tuple,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ]),
    ).to.be.revertedWithCustomError(integrity, "UnsuitableRootNode");

    await expect(
      enforce([
        {
          parent: 0,
          paramType: AbiType.Calldata,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: AbiType.Tuple,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ]),
    ).to.be.revertedWithCustomError(integrity, "UnsuitableRootNode");
  });

  describe("node", async () => {
    it("Node Pass well formed", async () => {
      const { integrity, enforce } = await loadFixture(setup);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Pass,
            compValue: "0x00",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableCompValue")
        .withArgs(0);
    });
    it("Node And/Or/Nor well formed", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.And,
            compValue: "0x",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableParameterType")
        .withArgs(0);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.None,
            operator: Operator.And,
            compValue: "0x00",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableCompValue")
        .withArgs(0);
    });
    it("Node Matches well formed", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Dynamic,
            operator: Operator.Matches,
            compValue: "0x",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableParameterType")
        .withArgs(0);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x00",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableCompValue")
        .withArgs(0);
    });
    it("Node ArraySome/Every/Subset well formed", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Dynamic,
            operator: Operator.ArraySome,
            compValue: "0x",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableParameterType")
        .withArgs(0);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Dynamic,
            operator: Operator.ArrayEvery,
            compValue: "0x",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableParameterType")
        .withArgs(0);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Dynamic,
            operator: Operator.ArraySubset,
            compValue: "0x",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableParameterType")
        .withArgs(0);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Array,
            operator: Operator.ArraySubset,
            compValue: "0x00",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableCompValue")
        .withArgs(0);
    });
    it("Node EqualToAvatar well formed", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Dynamic,
            operator: Operator.EqualToAvatar,
            compValue: "0x",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableParameterType")
        .withArgs(1);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Static,
            operator: Operator.EqualToAvatar,
            compValue: "0x00",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableCompValue")
        .withArgs(1);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Static,
            operator: Operator.EqualToAvatar,
            compValue: "0x",
          },
        ]),
      ).to.not.be.reverted;
    });
    it("Node EqualTo well formed", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.EqualTo,
            compValue: "0x",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableParameterType")
        .withArgs(1);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Static,
            operator: Operator.EqualTo,
            compValue: "0x",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableCompValue")
        .withArgs(1);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Static,
            operator: Operator.EqualTo,
            compValue: "0x00",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableCompValue")
        .withArgs(1);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["uint256"], [100]),
          },
        ]),
      ).to.not.be.reverted;
    });
    it("Node GT/LT well formed", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Dynamic,
            operator: Operator.GreaterThan,
            compValue: "0x",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableParameterType")
        .withArgs(1);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Dynamic,
            operator: Operator.LessThan,
            compValue: "0x",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableParameterType")
        .withArgs(1);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Dynamic,
            operator: Operator.SignedIntGreaterThan,
            compValue: "0x",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableParameterType")
        .withArgs(1);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Dynamic,
            operator: Operator.SignedIntLessThan,
            compValue: "0x",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableParameterType")
        .withArgs(1);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Static,
            operator: Operator.SignedIntLessThan,
            compValue: "0x00",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableCompValue")
        .withArgs(1);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Static,
            operator: Operator.SignedIntLessThan,
            compValue: defaultAbiCoder.encode(["int32"], [-100]),
          },
        ]),
      ).to.not.be.reverted;
    });
    it("Node Bitmask well formed", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Tuple,
            operator: Operator.Bitmask,
            compValue: "0x",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableParameterType")
        .withArgs(1);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Static,
            operator: Operator.Bitmask,
            compValue: "0x00",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableCompValue")
        .withArgs(1);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Static,
            operator: Operator.Bitmask,
            compValue:
              "0x0000000000000000000000000000000000000000000000000000000000000000",
          },
        ]),
      ).to.not.be.reverted;
    });
    it("Node Custom well formed", async () => {
      const { integrity, enforce } = await loadFixture(setup);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Static,
            operator: Operator.Custom,
            compValue: "0x00",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableCompValue")
        .withArgs(1);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Static,
            operator: Operator.Custom,
            compValue:
              "0x0000000000000000000000000000000000000000000000000000000000000000",
          },
        ]),
      ).to.not.be.reverted;
    });
    it("Node WithinAllowance formed", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Tuple,
            operator: Operator.WithinAllowance,
            compValue: "0x",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableParameterType")
        .withArgs(1);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Static,
            operator: Operator.WithinAllowance,
            compValue: "0x00",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableCompValue")
        .withArgs(1);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Static,
            operator: Operator.WithinAllowance,
            compValue:
              "0x0000000000000000000000000000000000000000000000000000000000000000",
          },
        ]),
      ).to.not.be.reverted;
    });
    it("Node (Ether|Call)WithinAllowance formed", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Static,
            operator: Operator.EtherWithinAllowance,
            compValue: "0x",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableParameterType")
        .withArgs(1);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Dynamic,
            operator: Operator.CallWithinAllowance,
            compValue: "0x",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableParameterType")
        .withArgs(1);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.None,
            operator: Operator.EtherWithinAllowance,
            compValue: "0x00",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableCompValue")
        .withArgs(1);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.None,
            operator: Operator.CallWithinAllowance,
            compValue:
              "0x0000000000000000000000000000000000000000000000000000000000000000",
          },
        ]),
      ).to.not.be.reverted;
    });
    it("Node *Placeholder* triggers error", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Static,
            operator: Operator._Placeholder09,
            compValue: "0x",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsupportedOperator")
        .withArgs(1);
    });
  });

  describe("tree", async () => {
    it("enforces param config in BFS order", async () => {
      const { integrity, enforce } = await loadFixture(setup);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ]),
      ).to.be.revertedWithCustomError(integrity, "NotBFS");
    });
    it("enforces (Ether/Call)WithinAllowance to be child of root Calldata - ok", async () => {
      const { enforce } = await loadFixture(setup);

      // EtherWithinAllowance
      const conditions = flattenCondition({
        paramType: AbiType.Calldata,
        children: [
          {
            paramType: AbiType.None,
            operator: Operator.EtherWithinAllowance,
            compValue: ZeroHash,
          },
        ],
      });
      await expect(enforce(conditions)).to.not.be.reverted;
    });
    it("enforces (Ether/Call)WithinAllowance to be child of root Calldata - ok when root under LOGICAL", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      {
        // EtherWithinAllowance
        await expect(
          enforce(
            flattenCondition({
              paramType: AbiType.None,
              operator: Operator.Or,
              children: [
                {
                  paramType: AbiType.Calldata,
                  children: [
                    {
                      paramType: AbiType.None,
                      operator: Operator.EtherWithinAllowance,
                      compValue: ZeroHash,
                    },
                  ],
                },
                {
                  paramType: AbiType.Calldata,
                  children: [
                    {
                      paramType: AbiType.None,
                      operator: Operator.EtherWithinAllowance,
                      compValue: ZeroHash,
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.not.be.reverted;
      }
      {
        // EtherWithinAllowance
        await expect(
          enforce(
            flattenCondition({
              paramType: AbiType.None,
              operator: Operator.Or,
              children: [
                {
                  paramType: AbiType.Calldata,
                  children: [
                    {
                      paramType: AbiType.None,
                      operator: Operator.EtherWithinAllowance,
                      compValue: ZeroHash,
                    },
                  ],
                },
                {
                  paramType: AbiType.Calldata,
                  children: [
                    {
                      paramType: AbiType.None,
                      operator: Operator.EtherWithinAllowance,
                      compValue: ZeroHash,
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.not.be.reverted;
      }
    });
    it("enforces (Ether/Call)WithinAllowance to be child of root Calldata - throws on Calldata that's non root", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      {
        // EtherWithinAllowance
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.Calldata,
              children: [
                {
                  paramType: AbiType.None,
                  operator: Operator.EtherWithinAllowance,
                  compValue: ZeroHash,
                },
              ],
            },
          ],
        });

        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableParent")
          .withArgs(2);
      }
      {
        // CallWithinAllowance
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              operator: Operator.Or,
              paramType: AbiType.None,
              children: [
                {
                  paramType: AbiType.Calldata,
                  children: [
                    {
                      operator: Operator.Or,
                      paramType: AbiType.None,
                      children: [
                        {
                          paramType: AbiType.None,
                          operator: Operator.CallWithinAllowance,
                          compValue: ZeroHash,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableParent")
          .withArgs(4);
      }
    });
    it("enforces (Ether/Call)WithinAllowance to be child of root Calldata - throws on nodes other than Calldata", async () => {
      const { integrity, enforce } = await loadFixture(setup);
      {
        // EtherWithinAllowance
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.Tuple,
              children: [
                {
                  paramType: AbiType.None,
                  operator: Operator.EtherWithinAllowance,
                  compValue: ZeroHash,
                },
              ],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableParent")
          .withArgs(2);
      }

      {
        // EtherWithinAllowance
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.AbiEncoded,
              children: [
                {
                  paramType: AbiType.None,
                  operator: Operator.EtherWithinAllowance,
                  compValue: ZeroHash,
                },
              ],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableParent")
          .withArgs(2);
      }
      {
        // CallWithinAllowance
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.Tuple,
              children: [
                {
                  paramType: AbiType.None,
                  operator: Operator.CallWithinAllowance,
                  compValue: ZeroHash,
                },
              ],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableParent")
          .withArgs(2);
      }

      {
        // CallWithinAllowance
        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          children: [
            {
              paramType: AbiType.AbiEncoded,
              children: [
                {
                  paramType: AbiType.None,
                  operator: Operator.CallWithinAllowance,
                  compValue: ZeroHash,
                },
              ],
            },
          ],
        });
        await expect(enforce(conditions))
          .to.be.revertedWithCustomError(integrity, "UnsuitableParent")
          .withArgs(2);
      }
    });
    it("enforces and/or/nor to have at least 1 child", async () => {
      const { integrity, enforce } = await loadFixture(setup);

      let conditions = [
        {
          parent: 0,
          paramType: AbiType.Calldata,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: AbiType.None,
          operator: Operator.And,
          compValue: "0x",
        },
      ];
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(integrity, "UnsuitableChildCount")
        .withArgs(1);

      conditions = [
        ...conditions,
        {
          parent: 1,
          paramType: AbiType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];

      await expect(enforce(conditions)).to.not.be.reverted;
    });
    it("enforces static to have no children", async () => {
      const { integrity, enforce } = await loadFixture(setup);

      const conditions = [
        {
          parent: 0,
          paramType: AbiType.Calldata,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: AbiType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: AbiType.Dynamic,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(integrity, "UnsuitableChildCount")
        .withArgs(1);
    });
    it("enforces dynamic to have no children", async () => {
      const { integrity, enforce } = await loadFixture(setup);

      const conditions = [
        {
          parent: 0,
          paramType: AbiType.Calldata,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: AbiType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: AbiType.Dynamic,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: AbiType.Dynamic,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(integrity, "UnsuitableChildCount")
        .withArgs(2);
    });
    it("enforces tuple to have at least one child", async () => {
      const { integrity, enforce } = await loadFixture(setup);

      const conditions = [
        {
          parent: 0,
          paramType: AbiType.Calldata,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: AbiType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: AbiType.Tuple,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(integrity, "UnsuitableChildCount")
        .withArgs(2);
    });
    it("enforces Calldata to have at least one child", async () => {
      const { integrity, enforce } = await loadFixture(setup);

      const conditions = [
        {
          parent: 0,
          paramType: AbiType.Calldata,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(integrity, "UnsuitableChildCount")
        .withArgs(0);
    });
    it("enforces array to have at least 1 child", async () => {
      const { integrity, enforce } = await loadFixture(setup);

      let conditions = [
        {
          parent: 0,
          paramType: AbiType.Calldata,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: AbiType.Array,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(integrity, "UnsuitableChildCount")
        .withArgs(1);

      conditions = [
        ...conditions,
        {
          parent: 1,
          paramType: AbiType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];

      await expect(enforce(conditions)).to.not.be.reverted;
    });
    it("enforces arraySome/arrayEvery to have at exactly 1 child", async () => {
      const { integrity, enforce } = await loadFixture(setup);

      const conditions = [
        {
          parent: 0,
          paramType: AbiType.Calldata,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: AbiType.Array,
          operator: Operator.ArraySome,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: AbiType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: AbiType.Dynamic,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ];
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(integrity, "UnsuitableChildCount")
        .withArgs(1);

      conditions[1].operator = Operator.ArrayEvery;
      await expect(enforce(conditions))
        .to.be.revertedWithCustomError(integrity, "UnsuitableChildCount")
        .withArgs(1);

      await expect(enforce(conditions.slice(0, -1))).to.not.be.reverted;
    });
    it("allows arraySome/arrayEvery to have logical operators as children", async () => {
      const { enforce } = await loadFixture(setup);

      // Test ArraySome with OR logical operator
      await expect(
        enforce(
          flattenCondition({
            paramType: AbiType.Calldata,
            children: [
              {
                paramType: AbiType.Array,
                operator: Operator.ArraySome,
                children: [
                  {
                    paramType: AbiType.None,
                    operator: Operator.Or,
                    children: [
                      {
                        paramType: AbiType.Static,
                        operator: Operator.EqualTo,
                        compValue: defaultAbiCoder.encode(["uint256"], [100]),
                      },
                      {
                        paramType: AbiType.Static,
                        operator: Operator.EqualTo,
                        compValue: defaultAbiCoder.encode(["uint256"], [200]),
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        ),
      ).to.not.be.reverted;

      // Test ArrayEvery with AND logical operator
      await expect(
        enforce(
          flattenCondition({
            paramType: AbiType.Calldata,
            children: [
              {
                paramType: AbiType.Array,
                operator: Operator.ArrayEvery,
                children: [
                  {
                    paramType: AbiType.None,
                    operator: Operator.And,
                    children: [
                      {
                        paramType: AbiType.Static,
                        operator: Operator.GreaterThan,
                        compValue: defaultAbiCoder.encode(["uint256"], [50]),
                      },
                      {
                        paramType: AbiType.Static,
                        operator: Operator.LessThan,
                        compValue: defaultAbiCoder.encode(["uint256"], [150]),
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        ),
      ).to.not.be.reverted;

      // Test ArraySome with NOR logical operator
      await expect(
        enforce(
          flattenCondition({
            paramType: AbiType.Calldata,
            children: [
              {
                paramType: AbiType.Array,
                operator: Operator.ArraySome,
                children: [
                  {
                    paramType: AbiType.None,
                    operator: Operator.Nor,
                    children: [
                      {
                        paramType: AbiType.Static,
                        operator: Operator.EqualTo,
                        compValue: defaultAbiCoder.encode(["uint256"], [0]),
                      },
                      {
                        paramType: AbiType.Static,
                        operator: Operator.EqualTo,
                        compValue: defaultAbiCoder.encode(["uint256"], [1]),
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        ),
      ).to.not.be.reverted;
    });
    it("enforces arraySubset to have at most 256 children", async () => {
      const { integrity, enforce } = await loadFixture(setup);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Array,
            operator: Operator.ArraySubset,
            compValue: "0x",
          },
          ...new Array(257).fill(null).map(() => ({
            parent: 1,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          })),
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableChildCount")
        .withArgs(1);
    });
    it("enforces (Ether|Call)WithinAllowance to have no children", async () => {
      const { integrity, enforce } = await loadFixture(setup);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.None,
            operator: Operator.CallWithinAllowance,
            compValue: ZeroHash,
          },
          {
            parent: 1,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableChildCount")
        .withArgs(1);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.None,
            operator: Operator.EtherWithinAllowance,
            compValue: ZeroHash,
          },
          {
            parent: 1,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ]),
      )
        .to.be.revertedWithCustomError(integrity, "UnsuitableChildCount")
        .withArgs(1);
    });
    it("enforces resolved root type to be Calldata", async () => {
      const { integrity, enforce } = await loadFixture(setup);

      await expect(
        enforce([
          {
            parent: 0,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ]),
      ).to.be.revertedWithCustomError(integrity, "UnsuitableRootNode");
    });

    describe("compatible childTypeTree ", () => {
      it("and/or/nor mismatch", async () => {
        const { integrity, enforce } = await loadFixture(setup);

        const conditions = [
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.None,
            operator: Operator.And,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 3,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ];
        await expect(enforce(conditions)).to.be.revertedWithCustomError(
          integrity,
          "UnsuitableChildTypeTree",
        );

        await expect(
          enforce([
            {
              parent: 0,
              paramType: AbiType.Calldata,
              operator: Operator.Pass,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: AbiType.None,
              operator: Operator.And,
              compValue: "0x",
            },
            {
              parent: 1,
              paramType: AbiType.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
            {
              parent: 1,
              paramType: AbiType.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
            {
              parent: 1,
              paramType: AbiType.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ]),
        ).to.not.be.reverted;
      });
      it("and/or/nor mismatch - order counts", async () => {
        const { integrity, enforce } = await loadFixture(setup);

        const conditions = [
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.None,
            operator: Operator.Or,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 2,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 2,
            paramType: AbiType.Dynamic,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 3,
            paramType: AbiType.Dynamic,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 3,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ];
        await expect(enforce(conditions)).to.be.revertedWithCustomError(
          integrity,
          "UnsuitableChildTypeTree",
        );

        await expect(
          enforce([
            {
              parent: 0,
              paramType: AbiType.Calldata,
              operator: Operator.Pass,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: AbiType.None,
              operator: Operator.Or,
              compValue: "0x",
            },
            {
              parent: 1,
              paramType: AbiType.Tuple,
              operator: Operator.Pass,
              compValue: "0x",
            },
            {
              parent: 1,
              paramType: AbiType.Tuple,
              operator: Operator.Pass,
              compValue: "0x",
            },
            {
              parent: 2,
              paramType: AbiType.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
            {
              parent: 2,
              paramType: AbiType.Dynamic,
              operator: Operator.Pass,
              compValue: "0x",
            },
            {
              parent: 3,
              paramType: AbiType.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
            {
              parent: 3,
              paramType: AbiType.Dynamic,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ]),
        ).to.not.be.reverted;
      });
      it("and/or/nor mismatch - recursive", async () => {
        const { integrity, enforce } = await loadFixture(setup);

        const conditions = [
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.None,
            operator: Operator.Nor,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: AbiType.None,
            operator: Operator.And,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 3,
            paramType: AbiType.Dynamic,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ];

        await expect(enforce(conditions)).to.be.revertedWithCustomError(
          integrity,
          "UnsuitableChildTypeTree",
        );

        conditions[conditions.length - 1].paramType = AbiType.Static;

        await expect(enforce(conditions)).to.not.be.reverted;
      });
      it("array mismatch", async () => {
        const { integrity, enforce } = await loadFixture(setup);

        const conditions = flattenCondition({
          paramType: AbiType.Calldata,
          operator: Operator.Pass,
          compValue: "0x",
          children: [
            {
              paramType: AbiType.Array,
              operator: Operator.Pass,
              compValue: "0x",
              children: [
                {
                  paramType: AbiType.Tuple,
                  operator: Operator.Pass,
                  compValue: "0x",
                  children: [
                    {
                      paramType: AbiType.Dynamic,
                      operator: Operator.Pass,
                      compValue: "0x",
                    },
                    {
                      paramType: AbiType.Static,
                      operator: Operator.Pass,
                      compValue: "0x",
                    },
                  ],
                },
                {
                  paramType: AbiType.Tuple,
                  operator: Operator.Pass,
                  compValue: "0x",
                  children: [
                    {
                      paramType: AbiType.Static,
                      operator: Operator.Pass,
                      compValue: "0x",
                    },
                    {
                      paramType: AbiType.Static,
                      operator: Operator.Pass,
                      compValue: "0x",
                    },
                  ],
                },
              ],
            },
          ],
        });

        await expect(enforce(conditions)).to.be.revertedWithCustomError(
          integrity,
          "UnsuitableChildTypeTree",
        );

        conditions[4].paramType = AbiType.Static;

        await expect(enforce(conditions)).to.not.be.reverted;
      });
      it("array mismatch - order counts", async () => {
        const { integrity, enforce } = await loadFixture(setup);

        const conditions = [
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Array,
            operator: Operator.Pass,
            compValue: "0x",
          },
          // first element 2
          {
            parent: 1,
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            compValue: "0x",
          },
          // second element 3
          {
            parent: 1,
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 2,
            paramType: AbiType.Dynamic,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 2,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 3,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 3,
            paramType: AbiType.Dynamic,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ];

        await expect(enforce(conditions)).to.be.revertedWithCustomError(
          integrity,
          "UnsuitableChildTypeTree",
        );

        // swap
        conditions[6].paramType = AbiType.Dynamic;
        conditions[7].paramType = AbiType.Static;

        await expect(enforce(conditions)).to.not.be.reverted;
      });
      it("array mismatch - different length", async () => {
        const { integrity, enforce } = await loadFixture(setup);

        const conditions = [
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Array,
            operator: Operator.Pass,
            compValue: "0x",
          },
          // first element 2
          {
            parent: 1,
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            compValue: "0x",
          },
          // second element 3
          {
            parent: 1,
            paramType: AbiType.Tuple,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 2,
            paramType: AbiType.Dynamic,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 2,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 3,
            paramType: AbiType.Dynamic,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 3,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ];

        await expect(enforce(conditions)).to.be.not.reverted;

        await expect(
          enforce(conditions.slice(0, -1)),
        ).to.be.revertedWithCustomError(integrity, "UnsuitableChildTypeTree");
      });
      it("array mismatch - recursive", async () => {
        const { integrity, enforce } = await loadFixture(setup);

        const conditions = [
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Array,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: AbiType.None,
            operator: Operator.Or,
            compValue: "0x",
          },
          {
            parent: 3,
            paramType: AbiType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 3,
            paramType: AbiType.Dynamic,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ];

        await expect(enforce(conditions)).to.be.revertedWithCustomError(
          integrity,
          "UnsuitableChildTypeTree",
        );

        conditions[conditions.length - 1].paramType = AbiType.Static;
        await expect(enforce(conditions)).to.not.be.reverted;
      });

      it("type variants:", async () => {
        it("allows Dynamic and Calldata siblings", async () => {
          const { enforce } = await loadFixture(setup);

          await expect(
            enforce(
              flattenCondition({
                paramType: AbiType.Calldata,
                children: [
                  {
                    paramType: AbiType.None,
                    operator: Operator.And,
                    children: [
                      {
                        paramType: AbiType.Dynamic,
                        operator: Operator.Pass,
                      },
                      {
                        paramType: AbiType.Calldata,
                        children: [
                          {
                            paramType: AbiType.Static,
                            operator: Operator.Pass,
                          },
                        ],
                      },
                    ],
                  },
                ],
              }),
            ),
          ).to.not.be.reverted;
        });

        // Test 2: Dynamic + AbiEncoded are equivalent
        it("allows Dynamic and AbiEncoded siblings", async () => {
          const { enforce } = await loadFixture(setup);
          await expect(
            enforce(
              flattenCondition({
                paramType: AbiType.Calldata,
                children: [
                  {
                    paramType: AbiType.None,
                    operator: Operator.Or,
                    children: [
                      {
                        paramType: AbiType.Dynamic,
                        operator: Operator.Pass,
                      },
                      {
                        paramType: AbiType.AbiEncoded,
                        children: [
                          {
                            paramType: AbiType.Static,
                            operator: Operator.Pass,
                          },
                        ],
                      },
                    ],
                  },
                ],
              }),
            ),
          ).to.not.be.reverted;
        });

        // Test 3: Calldata + AbiEncoded are equivalent
        it("allows Calldata and AbiEncoded siblings", async () => {
          const { enforce } = await loadFixture(setup);
          await expect(
            enforce(
              flattenCondition({
                paramType: AbiType.Calldata,
                children: [
                  {
                    paramType: AbiType.None,
                    operator: Operator.Nor,
                    children: [
                      {
                        paramType: AbiType.Calldata,
                        children: [
                          {
                            paramType: AbiType.Static,
                            operator: Operator.Pass,
                          },
                        ],
                      },
                      {
                        paramType: AbiType.AbiEncoded,
                        children: [
                          {
                            paramType: AbiType.Dynamic,
                            operator: Operator.Pass,
                          },
                        ],
                      },
                    ],
                  },
                ],
              }),
            ),
          ).to.not.be.reverted;
        });

        // Test 4: All three types together (Dynamic + Calldata + AbiEncoded)
        it("allows all three equivalent types as siblings", async () => {
          const { enforce } = await loadFixture(setup);
          await expect(
            enforce(
              flattenCondition({
                paramType: AbiType.Calldata,
                children: [
                  {
                    paramType: AbiType.None,
                    operator: Operator.And,
                    children: [
                      {
                        paramType: AbiType.Dynamic,
                        operator: Operator.Pass,
                      },
                      {
                        paramType: AbiType.Calldata,
                        children: [
                          {
                            paramType: AbiType.Static,
                            operator: Operator.Pass,
                          },
                        ],
                      },
                      {
                        paramType: AbiType.AbiEncoded,
                        children: [
                          {
                            paramType: AbiType.Tuple,
                            children: [
                              {
                                paramType: AbiType.Static,
                                operator: Operator.Pass,
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              }),
            ),
          ).to.not.be.reverted;
        });

        // Test 5: Type equivalence in nested arrays
        it("allows type equivalence within array contexts", async () => {
          const { enforce } = await loadFixture(setup);
          await expect(
            enforce(
              flattenCondition({
                paramType: AbiType.Calldata,
                children: [
                  {
                    paramType: AbiType.Array,
                    operator: Operator.ArraySome,
                    children: [
                      {
                        paramType: AbiType.None,
                        operator: Operator.Or,
                        children: [
                          {
                            paramType: AbiType.Dynamic,
                            operator: Operator.Pass,
                          },
                          {
                            paramType: AbiType.Calldata,
                            children: [
                              {
                                paramType: AbiType.Static,
                                operator: Operator.EqualTo,
                                compValue: defaultAbiCoder.encode(
                                  ["uint256"],
                                  [42],
                                ),
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              }),
            ),
          ).to.not.be.reverted;
        });

        it("rejects Static as sibling in type variant point", async () => {
          const { integrity, enforce } = await loadFixture(setup);
          await expect(
            enforce(
              flattenCondition({
                paramType: AbiType.Calldata,
                children: [
                  {
                    paramType: AbiType.None,
                    operator: Operator.And,
                    children: [
                      {
                        paramType: AbiType.Dynamic,
                        operator: Operator.Pass,
                      },
                      {
                        paramType: AbiType.Calldata,
                        children: [
                          {
                            paramType: AbiType.Static,
                            operator: Operator.Pass,
                          },
                        ],
                      },
                      {
                        paramType: AbiType.Static,
                        operator: Operator.Pass,
                      },
                    ],
                  },
                ],
              }),
            ),
          )
            .to.be.revertedWithCustomError(integrity, "UnsuitableChildTypeTree")
            .withArgs(1);
        });

        it("rejects Tuple as sibling in type variant point", async () => {
          const { integrity, enforce } = await loadFixture(setup);
          await expect(
            enforce(
              flattenCondition({
                paramType: AbiType.Calldata,
                children: [
                  {
                    paramType: AbiType.None,
                    operator: Operator.And,
                    children: [
                      {
                        paramType: AbiType.Dynamic,
                        operator: Operator.Pass,
                      },
                      {
                        paramType: AbiType.Tuple,
                        children: [
                          {
                            paramType: AbiType.Static,
                            operator: Operator.Pass,
                          },
                        ],
                      },
                    ],
                  },
                ],
              }),
            ),
          )
            .to.be.revertedWithCustomError(integrity, "UnsuitableChildTypeTree")
            .withArgs(1);
        });
      });
    });
  });
});
