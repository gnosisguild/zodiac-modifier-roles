import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { hexlify, Interface, randomBytes, ZeroHash } from "ethers";

import { setupTestContract } from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
  packConditions,
} from "../utils";

describe("Operator - EqualToAvatar", () => {
  describe("comparison logic", () => {
    it("matches when parameter equals the avatar address", async () => {
      const iface = new Interface(["function fn(address)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      const avatar = await roles.avatar();

      // EqualToAvatar: parameter must equal the avatar address
      const packed = await packConditions(
        roles,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.EqualToAvatar,
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

      // Avatar address passes
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [avatar]),
            0,
          ),
      ).to.not.be.reverted;
    });

    it("fails when parameter does not equal the avatar address", async () => {
      const iface = new Interface(["function fn(address)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      // EqualToAvatar: parameter must equal the avatar address
      const packed = await packConditions(
        roles,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.EqualToAvatar,
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

      // Random address fails
      const randomAddress = hexlify(randomBytes(20));
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [randomAddress]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, 1n, anyValue);

      // Zero address fails
      const zeroAddress = "0x0000000000000000000000000000000000000000";
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [zeroAddress]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, 1n, anyValue);
    });
  });

  describe("context dynamicism", () => {
    it("matches new avatar address after avatar changes", async () => {
      const iface = new Interface(["function fn(address)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      const originalAvatar = await roles.avatar();

      // Set up EqualToAvatar condition
      const packed = await packConditions(
        roles,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.EqualToAvatar,
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

      // Original avatar passes
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [originalAvatar]),
            0,
          ),
      ).to.not.be.reverted;

      // Change the avatar (roles is already connected to owner)
      const newAvatar = "0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF";
      await roles.setAvatar(newAvatar);

      // Original avatar now fails
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [originalAvatar]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, 1n, anyValue);

      // New avatar now passes
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [newAvatar]),
            0,
          ),
      ).to.not.be.reverted;
    });
  });

  describe("violation context", () => {
    it("reports the violating node index", async () => {
      const iface = new Interface(["function fn(address)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      const packed = await packConditions(
        roles,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.EqualToAvatar,
            },
          ],
        }),
      );
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        packed,
        ExecutionOptions.None,
      );

      const wrongAddress = hexlify(randomBytes(20));
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [wrongAddress]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.ParameterNotAllowed,
          1, // EqualToAvatar node at BFS index 1
          anyValue,
        );
    });

    it("reports the calldata range of the violation", async () => {
      const iface = new Interface(["function fn(address)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      const packed = await packConditions(
        roles,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.EqualToAvatar,
            },
          ],
        }),
      );
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        packed,
        ExecutionOptions.None,
      );

      const wrongAddress = hexlify(randomBytes(20));
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [wrongAddress]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.ParameterNotAllowed,
          anyValue,
          4, // payloadLocation: parameter starts at byte 4
        );
    });
  });

  describe("integrity", () => {
    it("reverts UnsuitableParameterType for invalid encodings", async () => {
      const { roles } = await loadFixture(setupTestContract);

      for (const encoding of [
        Encoding.None,
        Encoding.Dynamic,
        Encoding.Tuple,
        Encoding.Array,
        Encoding.AbiEncoded,
        Encoding.EtherValue,
      ]) {
        await expect(
          packConditions(roles, [
            {
              parent: 0,
              paramType: encoding,
              operator: Operator.EqualToAvatar,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableParameterType");
      }
    });

    it("reverts UnsuitableCompValue when compValue is not empty", async () => {
      const { roles } = await loadFixture(setupTestContract);

      await expect(
        packConditions(roles, [
          {
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.EqualToAvatar,
            compValue: "0x".padEnd(66, "0"),
          },
        ]),
      ).to.be.revertedWithCustomError(roles, "UnsuitableCompValue");
    });

    it("reverts LeafNodeCannotHaveChildren when EqualToAvatar has children", async () => {
      const { roles } = await loadFixture(setupTestContract);

      await expect(
        packConditions(roles, [
          {
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.EqualToAvatar,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ]),
      ).to.be.revertedWithCustomError(roles, "LeafNodeCannotHaveChildren");
    });
  });
});
