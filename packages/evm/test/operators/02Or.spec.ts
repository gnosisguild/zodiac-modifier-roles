import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { defaultAbiCoder } from "ethers/lib/utils";

import {
  Operator,
  ExecutionOptions,
  ParameterType,
  deployRolesMod,
} from "../utils";
import { ConditionFlatStruct } from "../../typechain-types/contracts/Integrity";

describe("Operator - Or", async () => {
  const ROLE_KEY =
    "0x0000000000000000000000000000000000000000000000000000000000000001";

  async function setup() {
    const [owner, invoker] = await hre.ethers.getSigners();

    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

    const roles = await deployRolesMod(
      hre,
      owner.address,
      avatar.address,
      avatar.address
    );
    await roles.enableModule(invoker.address);

    await roles.connect(owner).assignRoles(invoker.address, [ROLE_KEY], [true]);
    await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithSingleParam")
    );

    async function invoke(a: number) {
      return roles
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.fnWithSingleParam(a))
            .data as string,
          0
        );
    }

    await roles.connect(owner).scopeTarget(ROLE_KEY, testContract.address);

    async function scopeFunction(conditions: ConditionFlatStruct[]) {
      await roles
        .connect(owner)
        .scopeFunction(
          ROLE_KEY,
          testContract.address,
          SELECTOR,
          conditions,
          ExecutionOptions.None
        );
    }

    return {
      roles,
      scopeFunction,
      invoke,
    };
  }

  it("cannot set up an empty Or", async () => {
    const { scopeFunction } = await loadFixture(setup);

    await expect(
      scopeFunction([
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
      ])
    ).to.be.reverted;
  });

  it("evaluates an Or with a single child", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(setup);

    await scopeFunction([
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
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [1]),
      },
    ]);

    await expect(invoke(1)).to.not.be.reverted;

    await expect(invoke(2)).to.be.revertedWithCustomError(roles, "OrViolation");
  });

  it("evaluates an Or with multiple children", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(setup);

    await scopeFunction([
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
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [15]),
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [30]),
      },
    ]);

    await expect(invoke(1)).to.be.revertedWithCustomError(roles, "OrViolation");

    await expect(invoke(15)).to.not.be.reverted;

    await expect(invoke(20)).to.be.revertedWithCustomError(
      roles,
      "OrViolation"
    );

    await expect(invoke(30)).to.not.be.reverted;

    await expect(invoke(100)).to.be.revertedWithCustomError(
      roles,
      "OrViolation"
    );
  });

  it.skip("Tracks the resulting trace");
});
