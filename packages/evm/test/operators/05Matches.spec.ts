import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  AbiCoder,
  Interface,
  ZeroHash,
  hexlify,
  randomBytes,
  concat,
} from "ethers";

import { setupFallbacker } from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
} from "../utils";

const abiCoder = AbiCoder.defaultAbiCoder();

describe("Operator - Matches", () => {
  describe("prefix skipping", () => {
    it("skips 10 bytes offset before decoding child", async () => {
      const iface = new Interface(["function fn(bytes)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, fallbackerAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // Matches with AbiEncoded that skips 10 bytes (0x000a) but does NOT match them
      // compValue length is 2 => only configuration, no match bytes
      await roles.allowFunction(
        roleKey,
        fallbackerAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x000a", // 10 bytes offset
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [42]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Send payload with 10 bytes of random junk + encoded param
      // The junk should be skipped, not matched.
      const junkHeader = hexlify(randomBytes(10));
      const paramData = abiCoder.encode(["uint256"], [42]).slice(2); // remove 0x
      const correctPayload = junkHeader + paramData;

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            0,
            iface.encodeFunctionData(fn, [correctPayload]),
            0,
          ),
      ).to.not.be.reverted;

      // Ensure that actual logic checks the param (42)
      const wrongParamPayload =
        junkHeader + abiCoder.encode(["uint256"], [99]).slice(2);
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            0,
            iface.encodeFunctionData(fn, [wrongParamPayload]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);
    });
  });
  describe("prefix validation", () => {
    it("validates 4-byte prefix (shift 4)", async () => {
      const iface = new Interface(["function fn(bytes)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, fallbackerAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // Matches with 4-byte prefix (common selector size)
      await roles.allowFunction(
        roleKey,
        fallbackerAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x0004deadbeef", // 2 bytes length + 4 bytes prefix
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [42]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Correct 4-byte prefix + valid param passes
      const correctPayload =
        "0xdeadbeef" + abiCoder.encode(["uint256"], [42]).slice(2);
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            0,
            iface.encodeFunctionData(fn, [correctPayload]),
            0,
          ),
      ).to.not.be.reverted;

      // Wrong 4-byte prefix fails
      const wrongPayload =
        "0xcafebabe" + abiCoder.encode(["uint256"], [42]).slice(2);
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            0,
            iface.encodeFunctionData(fn, [wrongPayload]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.LeadingBytesNotAMatch, ZeroHash);
    });

    it("skips prefix check when compValue is empty (shift 0)", async () => {
      const iface = new Interface(["function fn(bytes)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, fallbackerAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // Matches with empty compValue - no prefix check
      await roles.allowFunction(
        roleKey,
        fallbackerAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x0000", // 2 bytes length (0) = no prefix to check
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [42]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.None,
      );

      // Wrong param value fails with ParameterNotAllowed, not LeadingBytesNotAMatch
      const payload = abiCoder.encode(["uint256"], [999]);
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            0,
            iface.encodeFunctionData(fn, [payload]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);
    });

    it("validates 10-byte prefix (shift 10)", async () => {
      const iface = new Interface(["function fn(bytes)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, fallbackerAddress, roleKey } =
        await loadFixture(setupFallbacker);

      const prefix10 = hexlify(randomBytes(10));

      // Matches with 10-byte prefix
      await roles.allowFunction(
        roleKey,
        fallbackerAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: concat(["0x000a", prefix10]), // 2 bytes length + 10 bytes prefix
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [123]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Correct 10-byte prefix + valid param passes
      const correctPayload =
        prefix10 + abiCoder.encode(["uint256"], [123]).slice(2);
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            0,
            iface.encodeFunctionData(fn, [correctPayload]),
            0,
          ),
      ).to.not.be.reverted;

      // Wrong 10-byte prefix fails with LeadingBytesNotAMatch
      const wrongPrefix10 = hexlify(randomBytes(10));
      const wrongPrefixPayload =
        wrongPrefix10 + abiCoder.encode(["uint256"], [123]).slice(2);
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            0,
            iface.encodeFunctionData(fn, [wrongPrefixPayload]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.LeadingBytesNotAMatch, ZeroHash);

      // Correct prefix + wrong param fails with ParameterNotAllowed
      const wrongParamPayload =
        prefix10 + abiCoder.encode(["uint256"], [999]).slice(2);
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            0,
            iface.encodeFunctionData(fn, [wrongParamPayload]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);
    });

    it("validates 31-byte prefix (shift 31)", async () => {
      const iface = new Interface(["function fn(bytes)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, fallbackerAddress, roleKey } =
        await loadFixture(setupFallbacker);

      const prefix31 = hexlify(randomBytes(31));

      // Matches with 31-byte prefix
      await roles.allowFunction(
        roleKey,
        fallbackerAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: concat(["0x001f", prefix31]), // 2 bytes length + 31 bytes prefix
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [456]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.None,
      );

      // Correct 31-byte prefix + valid param passes
      const correctPayload =
        prefix31 + abiCoder.encode(["uint256"], [456]).slice(2);
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            0,
            iface.encodeFunctionData(fn, [correctPayload]),
            0,
          ),
      ).to.not.be.reverted;

      // Wrong 31-byte prefix fails
      const wrongPrefix31 = hexlify(randomBytes(31));
      const wrongPayload =
        wrongPrefix31 + abiCoder.encode(["uint256"], [456]).slice(2);
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            0,
            iface.encodeFunctionData(fn, [wrongPayload]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.LeadingBytesNotAMatch, ZeroHash);
    });
  });

  describe("parameter routing", () => {
    it("routes decoded parameters to corresponding children", async () => {
      const iface = new Interface(["function fn(uint256,uint256,uint256)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, fallbackerAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // Matches routes each param to its corresponding child
      await roles.allowFunction(
        roleKey,
        fallbackerAddress,
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
            {
              paramType: Encoding.Static,
              operator: Operator.EqualTo,
              compValue: abiCoder.encode(["uint256"], [200]),
            },
            {
              paramType: Encoding.Static,
              operator: Operator.EqualTo,
              compValue: abiCoder.encode(["uint256"], [300]),
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // All params match - passes
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            0,
            iface.encodeFunctionData(fn, [100, 200, 300]),
            0,
          ),
      ).to.not.be.reverted;

      // First param wrong - fails
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            0,
            iface.encodeFunctionData(fn, [999, 200, 300]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);

      // Second param wrong - fails
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            0,
            iface.encodeFunctionData(fn, [100, 999, 300]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);

      // Third param wrong - fails
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            0,
            iface.encodeFunctionData(fn, [100, 200, 999]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);
    });

    it("passes empty payload to non-structural children", async () => {
      const iface = new Interface(["function fn(uint256)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, fallbackerAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // Matches with structural child (param) + non-structural child (ether value)
      await roles.allowFunction(
        roleKey,
        fallbackerAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            // Structural: checks param
            {
              paramType: Encoding.Static,
              operator: Operator.EqualTo,
              compValue: abiCoder.encode(["uint256"], [42]),
            },
            // Non-structural: checks ether value (gets empty payload)
            {
              paramType: Encoding.EtherValue,
              operator: Operator.EqualTo,
              compValue: abiCoder.encode(["uint256"], [100]),
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Correct param + correct ether
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            100,
            iface.encodeFunctionData(fn, [42]),
            0,
          ),
      ).to.not.be.reverted;

      // Correct param + wrong ether
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            999,
            iface.encodeFunctionData(fn, [42]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);
    });

    it("accumulates consumptions across children", async () => {
      const iface = new Interface(["function fn(uint256,uint256)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, fallbackerAddress, roleKey } =
        await loadFixture(setupFallbacker);

      const allowanceKey =
        "0x000000000000000000000000000000000000000000000000000000000000abcd";

      // Set up allowance of 100
      await roles.setAllowance(allowanceKey, 100, 0, 0, 0, 0);

      // Matches with two children consuming from same allowance
      await roles.allowFunction(
        roleKey,
        fallbackerAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.WithinAllowance,
              compValue: allowanceKey,
            },
            {
              paramType: Encoding.Static,
              operator: Operator.WithinAllowance,
              compValue: allowanceKey,
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // First call: 30 + 20 = 50 consumed
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            0,
            iface.encodeFunctionData(fn, [30, 20]),
            0,
          ),
      ).to.not.be.reverted;

      // Verify consumption was accumulated
      const { balance } = await roles.accruedAllowance(allowanceKey);
      expect(balance).to.equal(50);

      // Second call: 30 + 30 = 60, but only 50 remaining
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            0,
            iface.encodeFunctionData(fn, [30, 30]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.AllowanceExceeded, allowanceKey);
    });
  });
});
