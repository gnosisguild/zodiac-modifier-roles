import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, Interface, solidityPacked, ZeroHash } from "ethers";

import { setupTestContract } from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
} from "../utils";

const abiCoder = AbiCoder.defaultAbiCoder();

describe("Operator - GreaterThan", () => {
  it("passes when value > compValue", async () => {
    const iface = new Interface(["function fn(uint256)"]);
    const fn = iface.getFunction("fn")!;
    const { roles, member, testContractAddress, roleKey } =
      await loadFixture(setupTestContract);

    await roles.allowFunction(
      roleKey,
      testContractAddress,
      fn.selector,
      flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.GreaterThan,
            compValue: abiCoder.encode(["uint256"], [100]),
          },
        ],
      }),
      ExecutionOptions.None,
    );

    // 101 > 100 passes
    await expect(
      roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          0,
          iface.encodeFunctionData(fn, [101]),
          0,
        ),
    ).to.not.be.reverted;
  });

  it("fails when value <= compValue", async () => {
    const iface = new Interface(["function fn(uint256)"]);
    const fn = iface.getFunction("fn")!;
    const { roles, member, testContractAddress, roleKey } =
      await loadFixture(setupTestContract);

    await roles.allowFunction(
      roleKey,
      testContractAddress,
      fn.selector,
      flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.GreaterThan,
            compValue: abiCoder.encode(["uint256"], [100]),
          },
        ],
      }),
      ExecutionOptions.None,
    );

    // 100 == 100 fails
    await expect(
      roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          0,
          iface.encodeFunctionData(fn, [100]),
          0,
        ),
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(ConditionViolationStatus.ParameterLessThanAllowed, ZeroHash);

    // 99 < 100 fails
    await expect(
      roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          0,
          iface.encodeFunctionData(fn, [99]),
          0,
        ),
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(ConditionViolationStatus.ParameterLessThanAllowed, ZeroHash);
  });

  it("integrates with Slice operator", async () => {
    const iface = new Interface(["function fn(bytes)"]);
    const fn = iface.getFunction("fn")!;
    const { roles, member, testContractAddress, roleKey } =
      await loadFixture(setupTestContract);

    // Slice 4 bytes at offset 0, then GreaterThan comparison
    await roles.allowFunction(
      roleKey,
      testContractAddress,
      fn.selector,
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
                operator: Operator.GreaterThan,
                compValue: abiCoder.encode(["uint256"], [100]),
              },
            ],
          },
        ],
      }),
      ExecutionOptions.None,
    );

    // 0x00000065 = 101 > 100 passes
    await expect(
      roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          0,
          iface.encodeFunctionData(fn, ["0x00000065"]),
          0,
        ),
    ).to.not.be.reverted;

    // 0x00000064 = 100 <= 100 fails
    await expect(
      roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          0,
          iface.encodeFunctionData(fn, ["0x00000064"]),
          0,
        ),
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(ConditionViolationStatus.ParameterLessThanAllowed, ZeroHash);
  });

  it("compares ether value (msg.value)", async () => {
    const iface = new Interface(["function fn()"]);
    const fn = iface.getFunction("fn")!;
    const { roles, member, testContractAddress, roleKey } =
      await loadFixture(setupTestContract);

    // GreaterThan on EtherValue: msg.value must be > 1000 wei
    await roles.allowFunction(
      roleKey,
      testContractAddress,
      fn.selector,
      flattenCondition({
        paramType: Encoding.EtherValue,
        operator: Operator.GreaterThan,
        compValue: abiCoder.encode(["uint256"], [1000]),
      }),
      ExecutionOptions.Send,
    );

    // 1001 > 1000 passes
    await expect(
      roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          1001,
          iface.encodeFunctionData(fn),
          0,
        ),
    ).to.not.be.reverted;

    // 1000 <= 1000 fails
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
      .withArgs(ConditionViolationStatus.ParameterLessThanAllowed, ZeroHash);
  });
});
