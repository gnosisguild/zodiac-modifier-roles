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

describe("Operator - EqualTo", () => {
  describe("word-like comparison (size <= 32)", () => {
    it("matches a full 32-byte word (e.g. uint256, bytes32)", async () => {
      const iface = new Interface(["function fn(uint256)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      // EqualTo: parameter must equal 12345
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
              operator: Operator.EqualTo,
              compValue: abiCoder.encode(["uint256"], [12345]),
            },
          ],
        }),
        ExecutionOptions.None,
      );

      // Exact match passes
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [12345]),
            0,
          ),
      ).to.not.be.reverted;
    });

    it("fails when values differ", async () => {
      const iface = new Interface(["function fn(uint256)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      // EqualTo: parameter must equal 100
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
              operator: Operator.EqualTo,
              compValue: abiCoder.encode(["uint256"], [100]),
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Different value fails
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [101]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);
    });

    it("integrates with Slice operator", async () => {
      const iface = new Interface(["function fn(bytes)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      // Slice 4 bytes at offset 4 (skip first 4 bytes), then EqualTo comparison
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
              compValue: solidityPacked(["uint16", "uint8"], [4, 4]), // shift=4, size=4
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
        ExecutionOptions.None,
      );

      // bytes[4:8] = 0xdeadbeef matches (first 4 bytes ignored)
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, ["0x00000000deadbeef"]),
            0,
          ),
      ).to.not.be.reverted;

      // bytes[4:8] = 0xcafebabe does not match
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, ["0x00000000cafebabe"]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);
    });

    it("compares ether value (msg.value)", async () => {
      const iface = new Interface(["function fn(uint256)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      // EqualTo on EtherValue: msg.value must equal 1000 wei
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
              operator: Operator.Pass,
            },
            {
              paramType: Encoding.EtherValue,
              operator: Operator.EqualTo,
              compValue: abiCoder.encode(["uint256"], [1000]),
            },
          ],
        }),
        ExecutionOptions.Send,
      );

      // Exact ether value passes
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            1000,
            iface.encodeFunctionData(fn, [42]),
            0,
          ),
      ).to.not.be.reverted;

      // Different ether value fails
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            1001,
            iface.encodeFunctionData(fn, [42]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);
    });
  });

  describe("hashed comparison (size > 32)", () => {
    it("matches large dynamic data (e.g. large string/bytes) by comparing hash", async () => {
      const iface = new Interface(["function fn(string)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      // Large string > 32 bytes
      const largeString =
        "This is a string that is definitely longer than 32 bytes and will be hashed for comparison";

      // EqualTo: parameter must equal the large string (compared by hash)
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
              operator: Operator.EqualTo,
              compValue: abiCoder.encode(["string"], [largeString]),
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Exact match passes (hash comparison)
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [largeString]),
            0,
          ),
      ).to.not.be.reverted;
    });

    it("matches complex types (e.g. Tuple, Array) by comparing hash", async () => {
      const iface = new Interface(["function fn(uint256[])"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      const targetArray = [1, 2, 3, 4, 5];

      // EqualTo on Array: entire array must match (compared by hash)
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.EqualTo,
              compValue: abiCoder.encode(["uint256[]"], [targetArray]),
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.Pass,
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Exact array match passes
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [targetArray]),
            0,
          ),
      ).to.not.be.reverted;
    });

    it("fails when large dynamic data differs", async () => {
      const iface = new Interface(["function fn(string)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      const largeString =
        "This is a string that is definitely longer than 32 bytes and will be hashed for comparison";

      // EqualTo: parameter must equal the large string
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
              operator: Operator.EqualTo,
              compValue: abiCoder.encode(["string"], [largeString]),
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Different large string fails
      const differentString =
        "This is a different string that is also longer than 32 bytes but has different content";
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [differentString]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);
    });
  });
});
