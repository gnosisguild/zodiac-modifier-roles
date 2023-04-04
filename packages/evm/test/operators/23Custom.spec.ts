import hre from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { setupOneParamStatic } from "./setup";
import {
  BYTES32_ZERO,
  Operator,
  ParameterType,
  PermissionCheckerStatus,
} from "../utils";
import { AddressOne } from "@gnosis.pm/safe-contracts";

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
  it("passes a custom check", async () => {
    const { customChecker, scopeFunction, invoke } = await loadFixture(setup);

    const extra = "aabbccddeeff112233445566";
    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.Custom,
        compValue: `${customChecker.address}${extra}`,
      },
    ]);

    // above 101 is accepted
    await expect(invoke(101)).to.not.be.reverted;
  });
  it("fails a custom check and reports error info", async () => {
    const { roles, customChecker, scopeFunction, invoke } = await loadFixture(
      setup
    );

    const extra = "aabbccddeeff112233445566";
    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.Custom,
        compValue: `${customChecker.address}${extra}`,
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
  it.skip("fails by calling an adapter that doesn't implement ICustomChecker", async () => {
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
        paramType: ParameterType.Static,
        operator: Operator.Custom,
        compValue: AddressOne.padEnd(66, "0"),
      },
    ]);

    // above 101 is accepted
    await expect(invoke(99))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.CustomConditionMalformed, BYTES32_ZERO);
  });
});
