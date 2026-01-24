import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, Interface, hexlify, randomBytes, concat } from "ethers";

import {
  setupTestContract,
  setupOneParam,
  setupTwoParams,
  setupDynamicParam,
} from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
  packConditions,
} from "../utils";

const abiCoder = AbiCoder.defaultAbiCoder();

describe("Operator - Matches", () => {
  describe("prefix skipping", () => {
    it("skips 10 bytes offset before decoding child", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupDynamicParam);

      // Matches with AbiEncoded that skips 10 bytes (0x000a) but does NOT match them
      // compValue length is 2 => only configuration, no match bytes
      await allowFunction(
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

      await expect(invoke(correctPayload)).to.not.be.reverted;

      // Ensure that actual logic checks the param (42)
      const wrongParamPayload =
        junkHeader + abiCoder.encode(["uint256"], [99]).slice(2);
      await expect(invoke(wrongParamPayload))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.ParameterNotAllowed,
          2, // EqualTo node
          anyValue,
          anyValue,
        );
    });
  });
  describe("prefix validation", () => {
    it("validates 4-byte prefix (shift 4)", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupDynamicParam);

      // Matches with 4-byte prefix (common selector size)
      await allowFunction(
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
      await expect(invoke(correctPayload)).to.not.be.reverted;

      // Wrong 4-byte prefix fails
      const wrongPayload =
        "0xcafebabe" + abiCoder.encode(["uint256"], [42]).slice(2);
      await expect(invoke(wrongPayload))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.LeadingBytesNotAMatch,
          1, // Matches node with prefix
          anyValue,
          anyValue,
        );
    });

    it("skips prefix check when compValue is empty (shift 0)", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupDynamicParam);

      // Matches with empty compValue - no prefix check
      await allowFunction(
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
      await expect(invoke(payload))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.ParameterNotAllowed,
          2, // EqualTo node
          anyValue,
          anyValue,
        );
    });

    it("validates 10-byte prefix (shift 10)", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupDynamicParam);

      const prefix10 = hexlify(randomBytes(10));

      // Matches with 10-byte prefix
      await allowFunction(
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
      await expect(invoke(correctPayload)).to.not.be.reverted;

      // Wrong 10-byte prefix fails with LeadingBytesNotAMatch
      const wrongPrefix10 = hexlify(randomBytes(10));
      const wrongPrefixPayload =
        wrongPrefix10 + abiCoder.encode(["uint256"], [123]).slice(2);
      await expect(invoke(wrongPrefixPayload))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.LeadingBytesNotAMatch,
          1, // Matches node with prefix
          anyValue,
          anyValue,
        );

      // Correct prefix + wrong param fails with ParameterNotAllowed
      const wrongParamPayload =
        prefix10 + abiCoder.encode(["uint256"], [999]).slice(2);
      await expect(invoke(wrongParamPayload))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.ParameterNotAllowed,
          2, // EqualTo node
          anyValue,
          anyValue,
        );
    });

    it("validates 31-byte prefix (shift 31)", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupDynamicParam);

      const prefix31 = hexlify(randomBytes(31));

      // Matches with 31-byte prefix
      await allowFunction(
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
      await expect(invoke(correctPayload)).to.not.be.reverted;

      // Wrong 31-byte prefix fails
      const wrongPrefix31 = hexlify(randomBytes(31));
      const wrongPayload =
        wrongPrefix31 + abiCoder.encode(["uint256"], [456]).slice(2);
      await expect(invoke(wrongPayload))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.LeadingBytesNotAMatch,
          1, // Matches node with prefix
          anyValue,
          anyValue,
        );
    });
  });

  describe("parameter routing", () => {
    it("routes decoded parameters to corresponding children", async () => {
      const iface = new Interface(["function fn(uint256,uint256,uint256)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      // Matches routes each param to its corresponding child
      const packed = await packConditions(
        roles,
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
      );
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        packed,
        ExecutionOptions.Both,
      );

      // All params match - passes
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
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
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [999, 200, 300]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.ParameterNotAllowed,
          1, // First EqualTo node
          anyValue,
          anyValue,
        );

      // Second param wrong - fails
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [100, 999, 300]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.ParameterNotAllowed,
          2, // Second EqualTo node
          anyValue,
          anyValue,
        );

      // Third param wrong - fails
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [100, 200, 999]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.ParameterNotAllowed,
          3, // Third EqualTo node
          anyValue,
          anyValue,
        );
    });

    it("passes empty payload to non-structural children", async () => {
      const { roles, allowFunction, invoke } = await loadFixture(setupOneParam);

      await allowFunction(
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.And,
          children: [
            // Structural: Matches checks param
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [42]),
                },
              ],
            },
            // Non-structural: checks ether value (sibling of Matches)
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
      await expect(invoke(42, { value: 100 })).to.not.be.reverted;

      // Correct param + wrong ether
      await expect(invoke(42, { value: 999 }))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.ParameterNotAllowed,
          2, // EtherValue EqualTo node (BFS: And=0, Matches=1, EtherValue=2, Static=3)
          anyValue,
          anyValue,
        );
    });

    it("accumulates consumptions across children", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupTwoParams);

      const allowanceKey =
        "0x000000000000000000000000000000000000000000000000000000000000abcd";

      // Set up allowance of 100
      await roles.setAllowance(allowanceKey, 100, 0, 0, 0, 0);

      // Matches with two children consuming from same allowance
      await allowFunction(
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
      await expect(invoke(30, 20)).to.not.be.reverted;

      // Verify consumption was accumulated
      const { balance } = await roles.accruedAllowance(allowanceKey);
      expect(balance).to.equal(50);

      // Second call: 30 + 30 = 60, but only 50 remaining
      await expect(invoke(30, 30))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.AllowanceExceeded,
          2, // Second WithinAllowance node
          anyValue,
          anyValue,
        );
    });
  });

  describe("violation context", () => {
    it("reports the violating node index", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupTwoParams);

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.Pass,
            },
            {
              paramType: Encoding.Static,
              operator: Operator.EqualTo,
              compValue: abiCoder.encode(["uint256"], [42]),
            },
          ],
        }),
      );

      await expect(invoke(100, 99))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.ParameterNotAllowed,
          2, // EqualTo child node at BFS index 2
          anyValue,
          anyValue,
        );
    });

    it("reports the calldata range of the violation", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupTwoParams);

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.Pass,
            },
            {
              paramType: Encoding.Static,
              operator: Operator.EqualTo,
              compValue: abiCoder.encode(["uint256"], [42]),
            },
          ],
        }),
      );

      await expect(invoke(100, 99))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.ParameterNotAllowed,
          anyValue,
          36, // payloadLocation: second param starts at byte 36 (4 + 32)
          32, // payloadSize: uint256 is 32 bytes
        );
    });
  });

  describe("integrity", () => {
    it("reverts UnsuitableParameterType for invalid encodings", async () => {
      const { roles } = await loadFixture(setupTestContract);

      for (const encoding of [
        Encoding.None,
        Encoding.Static,
        Encoding.Dynamic,
        Encoding.EtherValue,
      ]) {
        await expect(
          packConditions(roles, [
            {
              parent: 0,
              paramType: encoding,
              operator: Operator.Matches,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableParameterType");
      }
    });

    describe("compValue", () => {
      it("only AbiEncoded accepts non-empty compValue", async () => {
        const { roles } = await loadFixture(setupTestContract);

        // All valid Matches encodings except AbiEncoded
        for (const encoding of [Encoding.Tuple, Encoding.Array]) {
          await expect(
            packConditions(roles, [
              {
                parent: 0,
                paramType: encoding,
                operator: Operator.Matches,
                compValue: "0x".padEnd(66, "0"),
              },
              {
                parent: 0,
                paramType: Encoding.Static,
                operator: Operator.Pass,
                compValue: "0x",
              },
            ]),
          ).to.be.revertedWithCustomError(roles, "UnsuitableCompValue");
        }
      });

      it("reverts UnsuitableCompValue when AbiEncoded Matches has 1 byte compValue", async () => {
        const { roles } = await loadFixture(setupTestContract);

        await expect(
          packConditions(roles, [
            {
              parent: 0,
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x04", // 1 byte - invalid (must be 0, 2, or 2+N)
            },
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableCompValue");
      });

      it("reverts UnsuitableCompValue when AbiEncoded Matches compValue exceeds 34 bytes", async () => {
        const { roles } = await loadFixture(setupTestContract);

        // 35 bytes = 2 + 33, but N must be <= 32
        const compValue = "0x" + "00".repeat(35);

        await expect(
          packConditions(roles, [
            {
              parent: 0,
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue,
            },
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableCompValue");
      });
    });

    it("requires at least one structural child", async () => {
      const { roles } = await loadFixture(setupTestContract);

      const allowanceKey = hexlify(randomBytes(32));

      // Tuple and Array require structural children (AbiEncoded does not)
      for (const encoding of [Encoding.Tuple, Encoding.Array]) {
        await expect(
          packConditions(roles, [
            {
              parent: 0,
              paramType: encoding,
              operator: Operator.Matches,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableChildCount");

        await expect(
          packConditions(roles, [
            {
              parent: 0,
              paramType: encoding,
              operator: Operator.Matches,
              compValue: "0x",
            },
            {
              // Non-structural child - should not count as structural
              parent: 0,
              paramType: Encoding.None,
              operator: Operator.CallWithinAllowance,
              compValue: allowanceKey,
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableChildCount");
      }
    });
  });
});
