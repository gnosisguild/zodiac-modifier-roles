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

describe("Operator - Nor", async () => {
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

  it("cannot set up an empty Nor", async () => {
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
          operator: Operator.Nor,
          compValue: "0x",
        },
      ])
    ).to.be.reverted;
  });

  it("evaluates a Nor with a single child", async () => {
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
        operator: Operator.Nor,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [100]),
      },
    ]);

    await expect(invoke(100)).to.be.revertedWithCustomError(
      roles,
      "NorViolation"
    );

    await expect(invoke(1000)).to.not.be.reverted;
  });

  it("evaluates a Nor with multiple children", async () => {
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
        operator: Operator.Nor,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [6]),
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [77]),
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [888]),
      },
    ]);

    await expect(invoke(6)).to.be.revertedWithCustomError(
      roles,
      "NorViolation"
    );

    await expect(invoke(77)).to.be.revertedWithCustomError(
      roles,
      "NorViolation"
    );

    await expect(invoke(888)).to.be.revertedWithCustomError(
      roles,
      "NorViolation"
    );

    await expect(invoke(1000)).to.not.be.reverted;
  });
});
