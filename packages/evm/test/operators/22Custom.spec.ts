import hre from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import {
  Encoding,
  BYTES32_ZERO,
  ExecutionOptions,
  Operator,
  PermissionCheckerStatus,
} from "../utils";
import { setupOneParamStatic } from "../setup";

const AddressOne = "0x0000000000000000000000000000000000000001";

describe("Operator - Custom", async () => {
  async function setup() {
    const { roles, allowFunction, invoke } =
      await loadFixture(setupOneParamStatic);

    const CustomChecker =
      await hre.ethers.getContractFactory("TestCustomChecker");
    const customChecker = await CustomChecker.deploy();

    return { roles, customChecker, allowFunction, invoke };
  }
  it("evaluates operator Custom - result is check pass", async () => {
    const { customChecker, allowFunction, invoke } = await loadFixture(setup);
    const customerCheckerAddress = await customChecker.getAddress();
    const extra = "aabbccddeeff112233445566";
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
        operator: Operator.Custom,
        compValue: `${customerCheckerAddress}${extra}`,
      },
    ]);

    // above 101 is accepted
    await expect(invoke(101)).to.not.be.reverted;
  });
  it("evaluates operator Custom - result is check fail", async () => {
    const { roles, customChecker, allowFunction, invoke } =
      await loadFixture(setup);
    const customerCheckerAddress = await customChecker.getAddress();
    const extra = "aabbccddeeff112233445566";
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
        operator: Operator.Custom,
        compValue: `${customerCheckerAddress}${extra}`,
      },
    ]);

    // above 101 is accepted
    await expect(invoke(99))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.CustomConditionViolation,
        `0xaabbccddeeff1122334455660000000000000000000000000000000000000000`,
      );
  });
  it("evaluates operator Custom - result is check fail due to operation", async () => {
    const { roles, customChecker, allowFunction, invoke } =
      await loadFixture(setup);
    const customerCheckerAddress = await customChecker.getAddress();
    const extra = "aabbccddeeff112233445566";
    await allowFunction(
      [
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Static,
          operator: Operator.Custom,
          compValue: `${customerCheckerAddress}${extra}`,
        },
      ],
      ExecutionOptions.Both,
    );

    await expect(invoke(101, 1))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.CustomConditionViolation,
        `0x0000000000000000000000000000000000000000000000000000000000000000`,
      );
  });

  it("supports unlimited extra bytes (more than 12 bytes)", async () => {
    const { roles, customChecker, allowFunction, invoke } =
      await loadFixture(setup);
    const customerCheckerAddress = await customChecker.getAddress();
    // 64 bytes of extra data (well beyond the old 12-byte limit)
    const extra =
      "0102030405060708091011121314151617181920212223242526272829303132" +
      "3334353637383940414243444546474849505152535455565758596061626364";
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
        operator: Operator.Custom,
        compValue: `${customerCheckerAddress}${extra}`,
      },
    ]);

    // above 100 is accepted
    await expect(invoke(101)).to.not.be.reverted;

    // below 100 fails, and the first 32 bytes of extra are returned as reason
    await expect(invoke(99))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.CustomConditionViolation,
        `0x0102030405060708091011121314151617181920212223242526272829303132`,
      );
  });

  it("supports empty extra bytes", async () => {
    const { customChecker, allowFunction, invoke } = await loadFixture(setup);
    const customerCheckerAddress = await customChecker.getAddress();
    // No extra bytes - just the address
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
        operator: Operator.Custom,
        compValue: customerCheckerAddress,
      },
    ]);

    // above 100 is accepted
    await expect(invoke(101)).to.not.be.reverted;
  });

  it.skip("adapter does not implement ICustomChecker", async () => {
    const { roles, allowFunction, invoke } = await loadFixture(setup);

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
