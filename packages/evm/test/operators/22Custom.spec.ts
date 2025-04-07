import hre from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import {
  AbiType,
  BYTES32_ZERO,
  ExecutionOptions,
  Operator,
  PermissionCheckerStatus,
} from "../utils";
import { AddressOne } from "@gnosis.pm/safe-contracts";
import { setupOneParamStatic } from "../setup";

describe("Operator - Custom", async () => {
  async function setup() {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamStatic
    );

    const CustomChecker = await hre.ethers.getContractFactory(
      "TestCustomChecker"
    );
    const customChecker = await CustomChecker.deploy();

    return { roles, customChecker, scopeFunction, invoke };
  }
  it("evaluates operator Custom - result is check pass", async () => {
    const { customChecker, scopeFunction, invoke } = await loadFixture(setup);
    const customerCheckerAddress = await customChecker.getAddress();
    const extra = "aabbccddeeff112233445566";
    await scopeFunction([
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
        compValue: `${customerCheckerAddress}${extra}`,
      },
    ]);

    // above 101 is accepted
    await expect(invoke(101)).to.not.be.reverted;
  });
  it("evaluates operator Custom - result is check fail", async () => {
    const { roles, customChecker, scopeFunction, invoke } = await loadFixture(
      setup
    );
    const customerCheckerAddress = await customChecker.getAddress();
    const extra = "aabbccddeeff112233445566";
    await scopeFunction([
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
        compValue: `${customerCheckerAddress}${extra}`,
      },
    ]);

    // above 101 is accepted
    await expect(invoke(99))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.CustomConditionViolation,
        `0xaabbccddeeff1122334455660000000000000000000000000000000000000000`
      );
  });
  it("evaluates operator Custom - result is check fail due to operation", async () => {
    const { roles, customChecker, scopeFunction, invoke } = await loadFixture(
      setup
    );
    const customerCheckerAddress = await customChecker.getAddress();
    const extra = "aabbccddeeff112233445566";
    await scopeFunction(
      [
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
          compValue: `${customerCheckerAddress}${extra}`,
        },
      ],
      ExecutionOptions.Both
    );

    await expect(invoke(101, 1))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.CustomConditionViolation,
        `0x0000000000000000000000000000000000000000000000000000000000000000`
      );
  });

  it.skip("adapter does not implement ICustomChecker", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(setup);

    await scopeFunction([
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
        compValue: AddressOne.padEnd(66, "0"),
      },
    ]);

    // above 101 is accepted
    await expect(invoke(99))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.CustomConditionViolation, BYTES32_ZERO);
  });
});
