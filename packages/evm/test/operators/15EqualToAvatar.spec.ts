import hre from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { setupOneParamAddress } from "../setup";
import { Encoding, Operator, PermissionCheckerStatus } from "../utils";
import { ZeroHash } from "ethers";

describe("Operator - EqualToAvatar", async () => {
  it("evaluates operator EqualToAvatar", async () => {
    const { roles, allowFunction, invoke } =
      await loadFixture(setupOneParamAddress);

    const [, , alice, bob, charlie] = await hre.ethers.getSigners();

    const avatar = await roles.avatar();

    await allowFunction([
      {
        parent: 0,
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.Static,
        operator: Operator.EqualToAvatar,
        compValue: `0x`,
      },
    ]);

    await expect(invoke(avatar)).to.not.be.reverted;

    await expect(invoke(alice.address))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, ZeroHash);
    await expect(invoke(bob.address))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, ZeroHash);

    await expect(invoke(charlie.address))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, ZeroHash);
  });
});
