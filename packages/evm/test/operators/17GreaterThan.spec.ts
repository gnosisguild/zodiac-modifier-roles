import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { AbiCoder, ZeroHash } from "ethers";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

import { Encoding, Operator, PermissionCheckerStatus } from "../utils";
import {
  setupOneParamAddress,
  setupOneParamUintSmall,
  setupOneParamUintWord,
} from "../setup";

describe("Operator - GreaterThan", async () => {
  it("evaluates operator GreaterThan - uint full word", async () => {
    const { roles, allowFunction, invoke } = await loadFixture(
      setupOneParamUintWord,
    );

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
        operator: Operator.GreaterThan,
        compValue: defaultAbiCoder.encode(["uint256"], [1000]),
      },
    ]);

    await expect(invoke(1000))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);
    await expect(invoke(999))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);
    await expect(invoke(1001)).to.not.be.reverted;
  });
  it("evaluates operator GreaterThan - uint smaller than word", async () => {
    const { roles, allowFunction, invoke } = await loadFixture(
      setupOneParamUintSmall,
    );

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
        operator: Operator.GreaterThan,
        compValue: defaultAbiCoder.encode(["uint8"], [50]),
      },
    ]);

    await expect(invoke(50))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);
    await expect(invoke(49))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);
    await expect(invoke(51)).to.not.be.reverted;
  });
  it("evaluates operator GreaterThan - address", async () => {
    const { roles, allowFunction, invoke } =
      await loadFixture(setupOneParamAddress);

    const address = "0x000000000000000000000000000000000000000f";

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
        operator: Operator.GreaterThan,
        compValue: defaultAbiCoder.encode(["address"], [address]),
      },
    ]);

    await expect(invoke(address))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);
    await expect(invoke("0x000000000000000000000000000000000000000e"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);
    await expect(invoke("0x000000000000000000000000000000000000001f")).to.not.be
      .reverted;
  });
});
