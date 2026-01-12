import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, Interface, solidityPacked, ZeroHash } from "ethers";

import { setupTestContract, setupOneParam, setupDynamicParam } from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
} from "../utils";

const abiCoder = AbiCoder.defaultAbiCoder();

describe("Operator - LessThan", () => {
  it("passes when value < compValue", async () => {
    const { allowFunction, invoke } = await loadFixture(setupOneParam);

    await allowFunction(
      flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.LessThan,
            compValue: abiCoder.encode(["uint256"], [100]),
          },
        ],
      }),
      ExecutionOptions.None,
    );

    // 99 < 100 passes
    await expect(invoke(99)).to.not.be.reverted;
  });

  it("fails when value >= compValue", async () => {
    const { roles, allowFunction, invoke } = await loadFixture(setupOneParam);

    await allowFunction(
      flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.LessThan,
            compValue: abiCoder.encode(["uint256"], [100]),
          },
        ],
      }),
      ExecutionOptions.None,
    );

    // 100 == 100 fails
    await expect(invoke(100))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(ConditionViolationStatus.ParameterGreaterThanAllowed, ZeroHash);

    // 101 > 100 fails
    await expect(invoke(101))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(ConditionViolationStatus.ParameterGreaterThanAllowed, ZeroHash);
  });

  it("integrates with Slice operator", async () => {
    const { roles, allowFunction, invoke } =
      await loadFixture(setupDynamicParam);

    // Slice 4 bytes at offset 0, then LessThan comparison
    await allowFunction(
      flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Dynamic,
            operator: Operator.Slice,
            compValue: solidityPacked(["uint16", "uint8"], [0, 4]), // shift=0, size=4
            children: [
              {
                paramType: Encoding.Static,
                operator: Operator.LessThan,
                compValue: abiCoder.encode(["uint256"], [100]),
              },
            ],
          },
        ],
      }),
      ExecutionOptions.None,
    );

    // 0x00000063 = 99 < 100 passes
    await expect(invoke("0x00000063")).to.not.be.reverted;

    // 0x00000064 = 100 >= 100 fails
    await expect(invoke("0x00000064"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(ConditionViolationStatus.ParameterGreaterThanAllowed, ZeroHash);
  });

  it("compares ether value (msg.value)", async () => {
    const iface = new Interface(["function fn()"]);
    const fn = iface.getFunction("fn")!;
    const { roles, member, testContractAddress, roleKey } =
      await loadFixture(setupTestContract);

    // LessThan on EtherValue: msg.value must be < 1000 wei
    await roles.allowFunction(
      roleKey,
      testContractAddress,
      fn.selector,
      flattenCondition({
        paramType: Encoding.EtherValue,
        operator: Operator.LessThan,
        compValue: abiCoder.encode(["uint256"], [1000]),
      }),
      ExecutionOptions.Send,
    );

    // 999 < 1000 passes
    await expect(
      roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          999,
          iface.encodeFunctionData(fn),
          0,
        ),
    ).to.not.be.reverted;

    // 1000 >= 1000 fails
    await expect(
      roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          1000,
          iface.encodeFunctionData(fn),
          0,
        ),
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(ConditionViolationStatus.ParameterGreaterThanAllowed, ZeroHash);
  });
});
