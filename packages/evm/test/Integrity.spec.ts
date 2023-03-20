import { expect } from "chai";
import hre, { deployments, waffle, ethers } from "hardhat";

import "@nomiclabs/hardhat-ethers";
import { Operator, ExecutionOptions, ParameterType } from "./utils";
import { defaultAbiCoder } from "ethers/lib/utils";

const AddressOne = "0x0000000000000000000000000000000000000000";

describe("Integrity", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    const [owner] = waffle.provider.getWallets();

    const Modifier = await hre.ethers.getContractFactory("Roles");
    const modifier = await Modifier.deploy(
      owner.address,
      avatar.address,
      avatar.address
    );

    return {
      modifier,
      owner,
    };
  });

  it("enforces only one root node", async () => {
    const { modifier, owner } = await setup();

    const ROLE_ID = 0;

    await expect(
      modifier.connect(owner).scopeFunction(
        ROLE_ID,
        AddressOne,
        "0x00000000",
        [
          {
            parent: 1,
            paramType: ParameterType.AbiEncoded,
            operator: Operator.Whatever,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.Tuple,
            operator: Operator.Whatever,
            compValue: "0x",
          },
        ],
        ExecutionOptions.None
      )
    ).to.be.revertedWith("NoRootNode()");

    await expect(
      modifier.connect(owner).scopeFunction(
        ROLE_ID,
        AddressOne,
        "0x00000000",
        [
          {
            parent: 0,
            paramType: ParameterType.AbiEncoded,
            operator: Operator.Whatever,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: ParameterType.Tuple,
            operator: Operator.Whatever,
            compValue: "0x",
          },
        ],
        ExecutionOptions.None
      )
    ).to.be.revertedWith("TooManyRootNodes()");
  });

  it("enforces param config in BFS order", async () => {
    const { modifier, owner } = await setup();

    const ROLE_ID = 0;
    await expect(
      modifier.connect(owner).scopeFunction(
        ROLE_ID,
        AddressOne,
        "0x00000000",
        [
          {
            parent: 0,
            paramType: ParameterType.AbiEncoded,
            operator: Operator.Whatever,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.Tuple,
            operator: Operator.Whatever,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: ParameterType.Static,
            operator: Operator.Whatever,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.Whatever,
            compValue: "0x",
          },
        ],
        ExecutionOptions.None
      )
    ).to.be.revertedWith("NotBFS()");
  });

  describe("Enforces Parameter Size constraints", () => {
    const MORE_THAN_32_BYTES_TEXT =
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.";

    it("static node has correct compValue size", async () => {
      const { modifier, owner } = await setup();

      await expect(
        modifier.connect(owner).scopeFunction(
          0,
          AddressOne,
          "0x00000000",
          [
            {
              parent: 0,
              paramType: ParameterType.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              compValue: ethers.utils.solidityPack(
                ["string"],
                [MORE_THAN_32_BYTES_TEXT]
              ),
            },
          ],
          ExecutionOptions.None
        )
      ).to.be.revertedWith("UnsuitableCompValue(1)");

      await expect(
        modifier.connect(owner).scopeFunction(
          0,
          AddressOne,
          "0x00000000",
          [
            {
              parent: 0,
              paramType: ParameterType.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              compValue: defaultAbiCoder.encode(["uint256"], [123]),
            },
          ],
          ExecutionOptions.None
        )
      ).to.not.be.reverted;
    });

    it("dynamic node has correct compValue size");
  });

  describe("Enforces compatible childTypeTree for And/Or operators", () => {
    it.skip("detects array type mismatch", async () => {
      const { modifier, owner } = await setup();

      await modifier.connect(owner).scopeFunction(
        0,
        AddressOne,
        "0x00000000",
        [
          {
            parent: 0,
            paramType: ParameterType.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.None,
            operator: Operator.Or,
            compValue: "0x",
          },
          // first Array 1
          {
            parent: 1,
            paramType: ParameterType.Array,
            operator: Operator.Matches,
            compValue: "0x",
          },
          // second Array 2
          {
            parent: 1,
            paramType: ParameterType.Array,
            operator: Operator.Matches,
            compValue: "0x",
          },
          // first array first element 3
          {
            parent: 2,
            paramType: ParameterType.Tuple,
            operator: Operator.Matches,
            compValue: "0x",
          },
          // first array second element 4
          {
            parent: 2,
            paramType: ParameterType.Tuple,
            operator: Operator.Matches,
            compValue: "0x",
          },
          // second array first element 5
          {
            parent: 3,
            paramType: ParameterType.Tuple,
            operator: Operator.Matches,
            compValue: "0x",
          },
          // tuple first
          {
            parent: 4,
            paramType: ParameterType.Static,
            operator: 0,
            compValue: "0x",
          },
          {
            parent: 4,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["address"], [address1]),
          },
          // tuple second 8
          {
            parent: 5,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["uint256"], [334455]),
          },
          {
            parent: 5,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["address"], [address2]),
          },
          // tuple third 9
          {
            parent: 6,
            paramType: ParameterType.Static,
            operator: 0,
            compValue: "0x",
          },
          {
            parent: 6,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["address"], [address3]),
          },
        ],
        ExecutionOptions.None
      );
    });
  });

  describe("Enforces compatible childTypeTree for Array nodes", () => {
    it("detects array type mismatch", async () => {
      const { modifier, owner } = await setup();

      await expect(
        modifier.connect(owner).scopeFunction(
          0,
          AddressOne,
          "0x00000000",
          [
            {
              parent: 0,
              paramType: ParameterType.AbiEncoded,
              operator: Operator.Whatever,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: ParameterType.Array,
              operator: Operator.Whatever,
              compValue: "0x",
            },
            // first element 2
            {
              parent: 1,
              paramType: ParameterType.Tuple,
              operator: Operator.Whatever,
              compValue: "0x",
            },
            // second element 3
            {
              parent: 1,
              paramType: ParameterType.Tuple,
              operator: Operator.Whatever,
              compValue: "0x",
            },
            // tuple first
            {
              parent: 2,
              paramType: ParameterType.Dynamic,
              operator: Operator.Whatever,
              compValue: "0x",
            },
            {
              parent: 2,
              paramType: ParameterType.Static,
              operator: Operator.Whatever,
              compValue: "0x",
            },
            // tuple second 8
            {
              parent: 3,
              paramType: ParameterType.Static,
              operator: Operator.Whatever,
              compValue: "0x",
            },
            {
              parent: 3,
              paramType: ParameterType.Static,
              operator: Operator.Whatever,
              compValue: "0x",
            },
          ],
          ExecutionOptions.None
        )
      ).to.be.revertedWith("UnsuitableSubTypeTree(1)");

      await expect(
        modifier.connect(owner).scopeFunction(
          0,
          AddressOne,
          "0x00000000",
          [
            {
              parent: 0,
              paramType: ParameterType.AbiEncoded,
              operator: Operator.Whatever,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: ParameterType.Array,
              operator: Operator.Whatever,
              compValue: "0x",
            },
            // first element 2
            {
              parent: 1,
              paramType: ParameterType.Tuple,
              operator: Operator.Whatever,
              compValue: "0x",
            },
            // second element 3
            {
              parent: 1,
              paramType: ParameterType.Tuple,
              operator: Operator.Whatever,
              compValue: "0x",
            },
            // tuple first
            {
              parent: 2,
              paramType: ParameterType.Static,
              operator: Operator.Whatever,
              compValue: "0x",
            },
            {
              parent: 2,
              paramType: ParameterType.Static,
              operator: Operator.Whatever,
              compValue: "0x",
            },
            // tuple second 8
            {
              parent: 3,
              paramType: ParameterType.Static,
              operator: Operator.Whatever,
              compValue: "0x",
            },
            {
              parent: 3,
              paramType: ParameterType.Static,
              operator: Operator.Whatever,
              compValue: "0x",
            },
          ],
          ExecutionOptions.None
        )
      ).to.not.be.reverted;
    });
    it("detects array type mismatch - order counts", async () => {
      const { modifier, owner } = await setup();

      const conditions = [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Whatever,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Array,
          operator: Operator.Whatever,
          compValue: "0x",
        },
        // first element 2
        {
          parent: 1,
          paramType: ParameterType.Tuple,
          operator: Operator.Whatever,
          compValue: "0x",
        },
        // second element 3
        {
          parent: 1,
          paramType: ParameterType.Tuple,
          operator: Operator.Whatever,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: ParameterType.Dynamic,
          operator: Operator.Whatever,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: Operator.Whatever,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: ParameterType.Static,
          operator: Operator.Whatever,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: ParameterType.Dynamic,
          operator: Operator.Whatever,
          compValue: "0x",
        },
      ];

      await expect(
        modifier
          .connect(owner)
          .scopeFunction(
            0,
            AddressOne,
            "0x00000000",
            conditions,
            ExecutionOptions.None
          )
      ).to.be.revertedWith("UnsuitableSubTypeTree(1)");

      // swap
      conditions[6].paramType = ParameterType.Dynamic;
      conditions[7].paramType = ParameterType.Static;

      await expect(
        modifier
          .connect(owner)
          .scopeFunction(
            0,
            AddressOne,
            "0x00000000",
            conditions,
            ExecutionOptions.None
          )
      ).to.not.be.reverted;
    });
    it("detects array type mismatch - length mismatch", async () => {
      const { modifier, owner } = await setup();

      const conditions = [
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Whatever,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Array,
          operator: Operator.Whatever,
          compValue: "0x",
        },
        // first element 2
        {
          parent: 1,
          paramType: ParameterType.Tuple,
          operator: Operator.Whatever,
          compValue: "0x",
        },
        // second element 3
        {
          parent: 1,
          paramType: ParameterType.Tuple,
          operator: Operator.Whatever,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: ParameterType.Dynamic,
          operator: Operator.Whatever,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: Operator.Whatever,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: ParameterType.Dynamic,
          operator: Operator.Whatever,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: ParameterType.Static,
          operator: Operator.Whatever,
          compValue: "0x",
        },
      ];

      await expect(
        modifier
          .connect(owner)
          .scopeFunction(
            0,
            AddressOne,
            "0x00000000",
            conditions,
            ExecutionOptions.None
          )
      ).to.be.not.reverted;

      await expect(
        modifier
          .connect(owner)
          .scopeFunction(
            0,
            AddressOne,
            "0x00000000",
            conditions.slice(0, -1),
            ExecutionOptions.None
          )
      ).to.be.revertedWith("UnsuitableSubTypeTree(1)");
    });
  });
});
