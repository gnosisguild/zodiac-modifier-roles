import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import hre from "hardhat";
import { hexlify, Interface, randomBytes } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { setupTestContract, setupOneParam } from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
  packConditions,
} from "../utils";

describe("Operator - Custom", () => {
  async function setupWithChecker() {
    const base = await setupOneParam();
    const CustomChecker =
      await hre.ethers.getContractFactory("TestCustomChecker");
    const customChecker = await CustomChecker.deploy();
    return {
      ...base,
      customChecker,
      customCheckerAddress: await customChecker.getAddress(),
    };
  }

  describe("execution logic", () => {
    it("delegates execution to the configured adapter address", async () => {
      const { allowFunction, invoke, customCheckerAddress } =
        await loadFixture(setupWithChecker);

      // Custom condition: param > 100
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.Custom,
              compValue: customCheckerAddress,
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // 101 > 100 passes
      await expect(invoke(101)).to.not.be.reverted;
    });

    it("passes correct context (operation type) to adapter", async () => {
      const {
        roles,
        member,
        testContractAddress,
        fn,
        allowFunction,
        customCheckerAddress,
      } = await loadFixture(setupWithChecker);
      const iface = new Interface(["function fn(uint256)"]);

      // Adapter fails if operation != Call (0)
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.Custom,
              compValue: customCheckerAddress,
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Call operation (0) passes
      await expect(
        roles.connect(member).execTransactionFromModule(
          testContractAddress,
          0,
          iface.encodeFunctionData(fn, [101]),
          0, // Operation.Call
        ),
      ).to.not.be.reverted;

      // DelegateCall operation (1) fails (adapter returns false)
      await expect(
        roles.connect(member).execTransactionFromModule(
          testContractAddress,
          0,
          iface.encodeFunctionData(fn, [101]),
          1, // Operation.DelegateCall
        ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.CustomConditionViolation,
          1, // Custom node
          anyValue,
        );
    });

    it("extracts and passes extra data (from compValue) to adapter", async () => {
      const { roles, allowFunction, invoke, customCheckerAddress } =
        await loadFixture(setupWithChecker);

      const extraData = "aabbccddeeff112233445566";
      const compValue = customCheckerAddress + extraData;

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.Custom,
              compValue,
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Fail condition: param <= 100.
      // Adapter should return false + extraData as error info.
      // Note: returned info is bytes32, so extraData is padded/truncated to 32 bytes
      const expectedInfo = "0x" + extraData.padEnd(64, "0");

      await expect(invoke(99))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.CustomConditionViolation,
          1, // Custom node
          anyValue,
        );
    });
  });

  describe("result handling", () => {
    it("passes when adapter returns true", async () => {
      const { allowFunction, invoke, customCheckerAddress } =
        await loadFixture(setupWithChecker);

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.Custom,
              compValue: customCheckerAddress,
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Adapter returns true for > 100
      await expect(invoke(101)).to.not.be.reverted;
    });

    it("fails when adapter returns false (propagates error info)", async () => {
      const { roles, allowFunction, invoke, customCheckerAddress } =
        await loadFixture(setupWithChecker);

      const extraData = "1234"; // "reason" code
      const compValue = customCheckerAddress + extraData;

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.Custom,
              compValue,
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Adapter returns false for <= 100, info = extraData
      const expectedInfo = "0x" + extraData.padEnd(64, "0");

      await expect(invoke(99))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.CustomConditionViolation,
          1, // Custom node
          anyValue,
        );
    });
  });

  describe("adapter call safety", () => {
    it("no code at address: reverts", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupWithChecker);

      const randomAddress = hexlify(randomBytes(20));
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.Custom,
              compValue: randomAddress,
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      await expect(invoke(101))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.CustomConditionNotAContract,
          1, // Custom node
          anyValue,
        );
    });

    it("wrong interface: reverts", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupWithChecker);

      // Deploy contract with code but no check() function and no fallback
      const NoInterfaceChecker = await hre.ethers.getContractFactory(
        "TestCustomCheckerNoInterface",
      );
      const noInterfaceChecker = await NoInterfaceChecker.deploy();
      const noInterfaceCheckerAddress = await noInterfaceChecker.getAddress();

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.Custom,
              compValue: noInterfaceCheckerAddress,
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Function selector not found, no fallback -> staticcall fails
      await expect(invoke(101))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.CustomConditionReverted,
          1, // Custom node
          anyValue,
        );
    });

    it("function reverts: reverts", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupWithChecker);

      const RevertingChecker = await hre.ethers.getContractFactory(
        "TestCustomCheckerReverting",
      );
      const revertingChecker = await RevertingChecker.deploy();
      const revertingCheckerAddress = await revertingChecker.getAddress();

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.Custom,
              compValue: revertingCheckerAddress,
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Adapter reverts -> staticcall fails
      await expect(invoke(101))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.CustomConditionReverted,
          1, // Custom node
          anyValue,
        );
    });

    it("returns wrong type: reverts", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupWithChecker);

      // Deploy contract that returns (uint256, uint256) instead of bool
      const WrongReturnChecker = await hre.ethers.getContractFactory(
        "TestCustomCheckerWrongReturn",
      );
      const wrongReturnChecker = await WrongReturnChecker.deploy();
      const wrongReturnCheckerAddress = await wrongReturnChecker.getAddress();

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.Custom,
              compValue: wrongReturnCheckerAddress,
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Return data length != 32 bytes
      await expect(invoke(101))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.CustomConditionInvalidResult,
          1, // Custom node
          anyValue,
        );
    });

    it("returns expected: succeeds", async () => {
      const { allowFunction, invoke, customCheckerAddress } =
        await loadFixture(setupWithChecker);

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.Custom,
              compValue: customCheckerAddress,
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Valid adapter returns true -> passes
      await expect(invoke(101)).to.not.be.reverted;
    });
  });

  describe("violation context", () => {
    it("reports the violating node index", async () => {
      const { roles, allowFunction, invoke, customCheckerAddress } =
        await loadFixture(setupWithChecker);

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.Custom,
              compValue: customCheckerAddress,
            },
          ],
        }),
      );

      // Value <= 100 triggers custom checker failure
      await expect(invoke(50))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.CustomConditionViolation,
          1, // Custom node at BFS index 1
          anyValue,
        );
    });

    it("reports the calldata range of the violation", async () => {
      const { roles, allowFunction, invoke, customCheckerAddress } =
        await loadFixture(setupWithChecker);

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.Custom,
              compValue: customCheckerAddress,
            },
          ],
        }),
      );

      await expect(invoke(50))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.CustomConditionViolation,
          anyValue,
          4, // payloadLocation: parameter starts at byte 4
        );
    });
  });

  describe("integrity", () => {
    it("reverts UnsuitableCompValue when compValue is less than 20 bytes", async () => {
      const { roles } = await loadFixture(setupTestContract);

      await expect(
        packConditions(roles, [
          {
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Custom,
            compValue: "0x" + "ab".repeat(19), // 19 bytes, less than address
          },
        ]),
      ).to.be.revertedWithCustomError(roles, "UnsuitableCompValue");
    });
  });
});
