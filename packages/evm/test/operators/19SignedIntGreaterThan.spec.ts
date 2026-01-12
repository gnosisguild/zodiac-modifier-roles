import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, Interface, solidityPacked, ZeroHash } from "ethers";

import { setupFallbacker } from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
} from "../utils";

const abiCoder = AbiCoder.defaultAbiCoder();

describe("Operator - SignedIntGreaterThan", () => {
  it("passes when signed value > compValue", async () => {
    const iface = new Interface(["function fn(int256)"]);
    const fn = iface.getFunction("fn")!;
    const { roles, member, testContractAddress, roleKey } =
      await loadFixture(setupFallbacker);

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
            operator: Operator.SignedIntGreaterThan,
            compValue: abiCoder.encode(["int256"], [100]),
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

  it("fails when signed value <= compValue", async () => {
    const iface = new Interface(["function fn(int256)"]);
    const fn = iface.getFunction("fn")!;
    const { roles, member, testContractAddress, roleKey } =
      await loadFixture(setupFallbacker);

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
            operator: Operator.SignedIntGreaterThan,
            compValue: abiCoder.encode(["int256"], [100]),
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

  it("handles negative numbers correctly", async () => {
    const iface = new Interface(["function fn(int256)"]);
    const fn = iface.getFunction("fn")!;
    const { roles, member, testContractAddress, roleKey } =
      await loadFixture(setupFallbacker);

    // compValue = -50, so value must be > -50
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
            operator: Operator.SignedIntGreaterThan,
            compValue: abiCoder.encode(["int256"], [-50]),
          },
        ],
      }),
      ExecutionOptions.None,
    );

    // -49 > -50 passes
    await expect(
      roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          0,
          iface.encodeFunctionData(fn, [-49]),
          0,
        ),
    ).to.not.be.reverted;

    // 0 > -50 passes
    await expect(
      roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          0,
          iface.encodeFunctionData(fn, [0]),
          0,
        ),
    ).to.not.be.reverted;

    // -50 == -50 fails
    await expect(
      roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          0,
          iface.encodeFunctionData(fn, [-50]),
          0,
        ),
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(ConditionViolationStatus.ParameterLessThanAllowed, ZeroHash);

    // -51 < -50 fails
    await expect(
      roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          0,
          iface.encodeFunctionData(fn, [-51]),
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
      await loadFixture(setupFallbacker);

    // Slice 4 bytes at offset 0, then SignedIntGreaterThan comparison
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
                operator: Operator.SignedIntGreaterThan,
                compValue: abiCoder.encode(["int256"], [0]),
              },
            ],
          },
        ],
      }),
      ExecutionOptions.None,
    );

    // 0x00000001 = 1 > 0 passes
    await expect(
      roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          0,
          iface.encodeFunctionData(fn, ["0x00000001"]),
          0,
        ),
    ).to.not.be.reverted;

    // 0x00000000 = 0 <= 0 fails
    await expect(
      roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          0,
          iface.encodeFunctionData(fn, ["0x00000000"]),
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
      await loadFixture(setupFallbacker);

    // SignedIntGreaterThan on EtherValue: msg.value must be > 1000 wei
    await roles.allowFunction(
      roleKey,
      testContractAddress,
      fn.selector,
      flattenCondition({
        paramType: Encoding.EtherValue,
        operator: Operator.SignedIntGreaterThan,
        compValue: abiCoder.encode(["int256"], [1000]),
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
