import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  AbiCoder,
  hexlify,
  randomBytes,
  solidityPacked,
  ZeroHash,
} from "ethers";

import { setupDynamicParam } from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
} from "../utils";

const abiCoder = AbiCoder.defaultAbiCoder();

// compValue layout: 2 bytes shift + 1 byte size
const encodeCompValue = (shift: number, size: number) =>
  solidityPacked(["uint16", "uint8"], [shift, size]);

describe("Operator - Slice", () => {
  describe("extraction", () => {
    it("extracts 2-byte shift from compValue", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupDynamicParam);

      // Slice 4 bytes at shift 4 (skip first 4 bytes)
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.Slice,
              compValue: encodeCompValue(4, 4), // shift=4, size=4
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [0xdeadbeef]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // bytes: [4 bytes prefix][0xdeadbeef][suffix]
      // Slice extracts bytes 4-7 which should equal 0xdeadbeef
      await expect(invoke("0x00000000deadbeef00000000")).to.not.be.reverted;

      // Wrong value at the slice position
      await expect(invoke("0x00000000cafebabe00000000"))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);

      // Value at wrong position (shift 0 instead of 4) - fails
      await expect(invoke("0xdeadbeef0000000000000000"))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);
    });

    it("extracts 1-byte size from compValue (size 1)", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupDynamicParam);

      // Slice 1 byte at shift 0
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.Slice,
              compValue: encodeCompValue(0, 1), // shift=0, size=1
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  // Single byte 0xab right-aligned to 32 bytes
                  compValue: abiCoder.encode(["uint256"], [0xab]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // bytes starting with 0xab - passes
      await expect(invoke("0xab00000000000000")).to.not.be.reverted;

      // bytes starting with 0xcd - fails
      await expect(invoke("0xcd00000000000000"))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);
    });

    it("extracts 1-byte size from compValue (size 32)", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupDynamicParam);

      // Slice 32 bytes at shift 0 (full word)
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.Slice,
              compValue: encodeCompValue(0, 32), // shift=0, size=32
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [12345]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // 32 bytes encoding 12345 - passes
      await expect(invoke(abiCoder.encode(["uint256"], [12345]))).to.not.be
        .reverted;

      // 32 bytes encoding different value - fails
      await expect(invoke(abiCoder.encode(["uint256"], [12346])))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);
    });
  });

  describe("propagation", () => {
    it("propagates result from child", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupDynamicParam);

      // Slice 4 bytes, child checks GreaterThan 100
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.Slice,
              compValue: encodeCompValue(0, 4), // shift=0, size=4
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
        ExecutionOptions.Both,
      );

      // Value 101 > 100 - child passes, Slice propagates success
      await expect(invoke("0x00000065")).to.not.be.reverted; // 101 in 4 bytes

      // Value 100 not > 100 - child fails with ParameterLessThanAllowed, Slice propagates
      await expect(invoke("0x00000064")) // 100 in 4 bytes
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterLessThanAllowed, ZeroHash);
    });

    it("propagates consumption from child", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupDynamicParam);

      const allowanceKey = hexlify(randomBytes(32));

      // Set up allowance of 100
      await roles.setAllowance(allowanceKey, 100, 0, 0, 0, 0);

      // Slice 32 bytes, child consumes via WithinAllowance
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.Slice,
              compValue: encodeCompValue(0, 32), // shift=0, size=32
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.WithinAllowance,
                  compValue: allowanceKey,
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Consume 30 from sliced value
      await expect(invoke(abiCoder.encode(["uint256"], [30]))).to.not.be
        .reverted;

      // Consumption propagated through Slice - remaining is 70
      const { balance } = await roles.accruedAllowance(allowanceKey);
      expect(balance).to.equal(70);
    });
  });
});
