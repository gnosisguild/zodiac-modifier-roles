import hre from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { setupOneParamAddress } from "./setup";
import {
  BYTES32_ZERO,
  Operator,
  ParameterType,
  PermissionCheckerStatus,
} from "../utils";

describe("Operator - EqualToAvatar", async () => {
  it("evaluates operator EqualToAvatar", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamAddress
    );

    const [, , alice, bob, charlie] = await hre.ethers.getSigners();

    const avatar = await roles.avatar();

    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.EqualToAvatar,
        compValue: `0x`,
      },
    ]);

    await expect(invoke(avatar)).to.not.be.reverted;

    await expect(invoke(alice.address))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    await expect(invoke(bob.address))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);

    await expect(invoke(charlie.address))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
  });
});
