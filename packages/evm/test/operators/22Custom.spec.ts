import { expect } from "chai";
import hre from "hardhat";
import { Interface, ZeroHash } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { setupFallbacker } from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
} from "../utils";

describe("Operator - Custom", () => {
  async function setupWithChecker() {
    const base = await setupFallbacker();
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
      const {
        roles,
        member,
        testContractAddress,
        roleKey,
        customCheckerAddress,
      } = await loadFixture(setupWithChecker);
      const iface = new Interface(["function fn(uint256)"]);
      const fn = iface.getFunction("fn")!;

      // Custom condition: param > 100
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
              operator: Operator.Custom,
              compValue: customCheckerAddress,
            },
          ],
        }),
        ExecutionOptions.Both,
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

    it("passes correct context (operation type) to adapter", async () => {
      const {
        roles,
        member,
        testContractAddress,
        roleKey,
        customCheckerAddress,
      } = await loadFixture(setupWithChecker);
      const iface = new Interface(["function fn(uint256)"]);
      const fn = iface.getFunction("fn")!;

      // Adapter fails if operation != Call (0)
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
        .withArgs(ConditionViolationStatus.CustomConditionViolation, ZeroHash);
    });

    it("extracts and passes extra data (from compValue) to adapter", async () => {
      const {
        roles,
        member,
        testContractAddress,
        roleKey,
        customCheckerAddress,
      } = await loadFixture(setupWithChecker);
      const iface = new Interface(["function fn(uint256)"]);
      const fn = iface.getFunction("fn")!;

      const extraData = "aabbccddeeff112233445566";
      const compValue = customCheckerAddress + extraData;

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
        .withArgs(
          ConditionViolationStatus.CustomConditionViolation,
          expectedInfo,
        );
    });
  });

  describe("result handling", () => {
    it("passes when adapter returns true", async () => {
      const {
        roles,
        member,
        testContractAddress,
        roleKey,
        customCheckerAddress,
      } = await loadFixture(setupWithChecker);
      const iface = new Interface(["function fn(uint256)"]);
      const fn = iface.getFunction("fn")!;

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
              operator: Operator.Custom,
              compValue: customCheckerAddress,
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Adapter returns true for > 100
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

    it("fails when adapter returns false (propagates error info)", async () => {
      const {
        roles,
        member,
        testContractAddress,
        roleKey,
        customCheckerAddress,
      } = await loadFixture(setupWithChecker);
      const iface = new Interface(["function fn(uint256)"]);
      const fn = iface.getFunction("fn")!;

      const extraData = "1234"; // "reason" code
      const compValue = customCheckerAddress + extraData;

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
              operator: Operator.Custom,
              compValue,
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Adapter returns false for <= 100, info = extraData
      const expectedInfo = "0x" + extraData.padEnd(64, "0");

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
        .withArgs(
          ConditionViolationStatus.CustomConditionViolation,
          expectedInfo,
        );
    });
  });

  describe("adapter call safety", () => {
    // Helper to set up a custom condition with a given adapter address
    async function allowWithCustomCondition(
      roles: Awaited<ReturnType<typeof setupWithChecker>>["roles"],
      roleKey: string,
      testContractAddress: string,
      selector: string,
      adapterAddress: string,
    ) {
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.Custom,
              compValue: adapterAddress,
            },
          ],
        }),
        ExecutionOptions.Both,
      );
    }

    it("no code at address: reverts", async () => {
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupWithChecker);
      const iface = new Interface(["function fn(uint256)"]);
      const fn = iface.getFunction("fn")!;

      const randomEOA = "0x1234567890123456789012345678901234567890";
      await allowWithCustomCondition(
        roles,
        roleKey,
        testContractAddress,
        fn.selector,
        randomEOA,
      );

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
        .withArgs(
          ConditionViolationStatus.CustomConditionNotAContract,
          ZeroHash,
        );
    });

    it("wrong interface: reverts", async () => {
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupWithChecker);
      const iface = new Interface(["function fn(uint256)"]);
      const fn = iface.getFunction("fn")!;

      // Deploy contract with code but no check() function and no fallback
      const NoInterfaceChecker = await hre.ethers.getContractFactory(
        "TestCustomCheckerNoInterface",
      );
      const noInterfaceChecker = await NoInterfaceChecker.deploy();
      const noInterfaceCheckerAddress = await noInterfaceChecker.getAddress();

      await allowWithCustomCondition(
        roles,
        roleKey,
        testContractAddress,
        fn.selector,
        noInterfaceCheckerAddress,
      );

      // Function selector not found, no fallback -> staticcall fails
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
        .withArgs(ConditionViolationStatus.CustomConditionReverted, ZeroHash);
    });

    it("function reverts: reverts", async () => {
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupWithChecker);
      const iface = new Interface(["function fn(uint256)"]);
      const fn = iface.getFunction("fn")!;

      const RevertingChecker = await hre.ethers.getContractFactory(
        "TestCustomCheckerReverting",
      );
      const revertingChecker = await RevertingChecker.deploy();
      const revertingCheckerAddress = await revertingChecker.getAddress();

      await allowWithCustomCondition(
        roles,
        roleKey,
        testContractAddress,
        fn.selector,
        revertingCheckerAddress,
      );

      // Adapter reverts -> staticcall fails
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
        .withArgs(ConditionViolationStatus.CustomConditionReverted, ZeroHash);
    });

    it("returns wrong type: reverts", async () => {
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupWithChecker);
      const iface = new Interface(["function fn(uint256)"]);
      const fn = iface.getFunction("fn")!;

      // Deploy contract that returns uint256 instead of (bool, bytes32)
      const WrongReturnChecker = await hre.ethers.getContractFactory(
        "TestCustomCheckerWrongReturn",
      );
      const wrongReturnChecker = await WrongReturnChecker.deploy();
      const wrongReturnCheckerAddress = await wrongReturnChecker.getAddress();

      await allowWithCustomCondition(
        roles,
        roleKey,
        testContractAddress,
        fn.selector,
        wrongReturnCheckerAddress,
      );

      // Return data length != 64 bytes
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
        .withArgs(
          ConditionViolationStatus.CustomConditionInvalidResult,
          ZeroHash,
        );
    });

    it("returns expected: succeeds", async () => {
      const {
        roles,
        member,
        testContractAddress,
        roleKey,
        customCheckerAddress,
      } = await loadFixture(setupWithChecker);
      const iface = new Interface(["function fn(uint256)"]);
      const fn = iface.getFunction("fn")!;

      await allowWithCustomCondition(
        roles,
        roleKey,
        testContractAddress,
        fn.selector,
        customCheckerAddress,
      );

      // Valid adapter returns (true, bytes32) -> passes
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
  });
});
