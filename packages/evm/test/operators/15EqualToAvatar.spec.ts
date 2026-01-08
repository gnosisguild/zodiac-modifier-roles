import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Interface, ZeroHash } from "ethers";

import { setupFallbacker } from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
} from "../utils";

describe("Operator - EqualToAvatar", () => {
  describe("comparison logic", () => {
    it("matches when parameter equals the avatar address", async () => {
      const iface = new Interface(["function fn(address)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, fallbackerAddress, roleKey } =
        await loadFixture(setupFallbacker);

      const avatar = await roles.avatar();

      // EqualToAvatar: parameter must equal the avatar address
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
              operator: Operator.EqualToAvatar,
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Avatar address passes
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            0,
            iface.encodeFunctionData(fn, [avatar]),
            0,
          ),
      ).to.not.be.reverted;
    });

    it("fails when parameter does not equal the avatar address", async () => {
      const iface = new Interface(["function fn(address)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, fallbackerAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // EqualToAvatar: parameter must equal the avatar address
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
              operator: Operator.EqualToAvatar,
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Random address fails
      const randomAddress = "0x1234567890123456789012345678901234567890";
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            0,
            iface.encodeFunctionData(fn, [randomAddress]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);

      // Zero address fails
      const zeroAddress = "0x0000000000000000000000000000000000000000";
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            0,
            iface.encodeFunctionData(fn, [zeroAddress]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);
    });
  });

  describe("context dynamicism", () => {
    it("matches new avatar address after avatar changes", async () => {
      const iface = new Interface(["function fn(address)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, fallbackerAddress, roleKey } =
        await loadFixture(setupFallbacker);

      const originalAvatar = await roles.avatar();

      // Set up EqualToAvatar condition
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
              operator: Operator.EqualToAvatar,
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Original avatar passes
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
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
            fallbackerAddress,
            0,
            iface.encodeFunctionData(fn, [originalAvatar]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);

      // New avatar now passes
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            fallbackerAddress,
            0,
            iface.encodeFunctionData(fn, [newAvatar]),
            0,
          ),
      ).to.not.be.reverted;
    });
  });
});
