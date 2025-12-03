import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Encoding, Operator, PermissionCheckerStatus } from "../utils";
import {
  setupOneParamBytes,
  setupOneParamStatic,
  setupTwoParamsStatic,
} from "../setup";
import { ZeroHash } from "ethers";

// Helper: compValue = [shift (2 bytes)][mask (N bytes)][expected (N bytes)]
function bitmaskCompValue(
  shift: number,
  mask: string,
  expected: string,
): string {
  if (mask.length !== expected.length) {
    throw new Error("mask and expected must have same length");
  }
  const shiftHex = shift.toString(16).padStart(4, "0");
  return `0x${shiftHex}${mask}${expected}`;
}

describe("Operator - Bitmask", () => {
  it("overflows on static param by going over calldata limit", async () => {
    const { roles, scopeFunction, invoke } =
      await loadFixture(setupOneParamStatic);

    // shift 30 + 4 byte mask = 34 bytes needed, but only 32 bytes in calldata
    const compValue = bitmaskCompValue(30, "ffffffff", "00000000");

    await scopeFunction([
      {
        parent: 0,
        paramType: Encoding.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.Static,
        operator: Operator.Bitmask,
        compValue,
      },
    ]);

    await expect(invoke(BigInt(0)))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.BitmaskOverflow, ZeroHash);
  });

  it("overflows on dynamic param by going over param size", async () => {
    const { roles, scopeFunction, invoke } =
      await loadFixture(setupOneParamBytes);

    // 64-byte mask but value is only 5 bytes (padded to 32)
    const compValue = bitmaskCompValue(0, "ff".repeat(64), "00".repeat(64));

    await scopeFunction([
      {
        parent: 0,
        paramType: Encoding.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.Dynamic,
        operator: Operator.Bitmask,
        compValue,
      },
    ]);

    await expect(invoke("0x" + "aa".repeat(5)))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.BitmaskOverflow, ZeroHash);
  });

  it("works on dynamic", async () => {
    const { roles, scopeFunction, invoke } =
      await loadFixture(setupOneParamBytes);

    const compValue = bitmaskCompValue(0, "ffff", "aabb");

    await scopeFunction([
      {
        parent: 0,
        paramType: Encoding.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.Dynamic,
        operator: Operator.Bitmask,
        compValue,
      },
    ]);

    await expect(invoke("0xaabb")).to.not.be.reverted;

    await expect(invoke("0xaacc"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.BitmaskNotAllowed, ZeroHash);
  });

  it("works on static", async () => {
    const { roles, scopeFunction, invoke } =
      await loadFixture(setupOneParamStatic);

    const compValue = bitmaskCompValue(0, "ffff", "aabb");

    await scopeFunction([
      {
        parent: 0,
        paramType: Encoding.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.Static,
        operator: Operator.Bitmask,
        compValue,
      },
    ]);

    await expect(
      invoke(
        BigInt(
          "0xaabb000000000000000000000000000000000000000000000000000000000000",
        ),
      ),
    ).to.not.be.reverted;

    await expect(
      invoke(
        BigInt(
          "0xaacc000000000000000000000000000000000000000000000000000000000000",
        ),
      ),
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.BitmaskNotAllowed, ZeroHash);
  });

  it("shift works on dynamic", async () => {
    const { roles, scopeFunction, invoke } =
      await loadFixture(setupOneParamBytes);

    // shift 5, check 1 byte
    const compValue = bitmaskCompValue(5, "ff", "cd");

    await scopeFunction([
      {
        parent: 0,
        paramType: Encoding.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.Dynamic,
        operator: Operator.Bitmask,
        compValue,
      },
    ]);

    await expect(invoke("0x0000000000cd")).to.not.be.reverted;

    await expect(invoke("0x0000000000ab"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.BitmaskNotAllowed, ZeroHash);
  });

  it("shift works on static", async () => {
    const { roles, scopeFunction, invoke } =
      await loadFixture(setupOneParamStatic);

    // shift 15, check 1 byte
    const compValue = bitmaskCompValue(15, "ff", "ab");

    await scopeFunction([
      {
        parent: 0,
        paramType: Encoding.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.Static,
        operator: Operator.Bitmask,
        compValue,
      },
    ]);

    // byte at position 15 is 0xab
    await expect(
      invoke(
        BigInt(
          "0x000000000000000000000000000000ab00000000000000000000000000000000",
        ),
      ),
    ).to.not.be.reverted;

    await expect(
      invoke(
        BigInt(
          "0x000000000000000000000000000000cd00000000000000000000000000000000",
        ),
      ),
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.BitmaskNotAllowed, ZeroHash);
  });

  it("multiword works on dynamic", async () => {
    const { roles, scopeFunction, invoke } =
      await loadFixture(setupOneParamBytes);

    // 64-byte mask spanning 2 words
    const compValue = bitmaskCompValue(0, "ff".repeat(64), "ab".repeat(64));

    await scopeFunction([
      {
        parent: 0,
        paramType: Encoding.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.Dynamic,
        operator: Operator.Bitmask,
        compValue,
      },
    ]);

    await expect(invoke("0x" + "ab".repeat(64))).to.not.be.reverted;

    // last byte differs
    await expect(invoke("0x" + "ab".repeat(63) + "cd"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.BitmaskNotAllowed, ZeroHash);
  });

  it("multiword works on static (crosses into next param)", async () => {
    const { roles, scopeFunction, invoke } =
      await loadFixture(setupTwoParamsStatic);

    // 64-byte mask reads both params entirely
    const compValue = bitmaskCompValue(0, "ff".repeat(64), "00".repeat(64));

    await scopeFunction([
      {
        parent: 0,
        paramType: Encoding.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.Static,
        operator: Operator.Bitmask,
        compValue,
      },
    ]);

    // both params zero - passes
    await expect(invoke(BigInt(0), BigInt(0))).to.not.be.reverted;

    // second param non-zero - fails
    await expect(invoke(BigInt(0), BigInt(1)))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.BitmaskNotAllowed, ZeroHash);
  });

  it("elaborate mask patterns work - only activated bits are considered", async () => {
    const { roles, scopeFunction, invoke } =
      await loadFixture(setupOneParamStatic);

    // mask 0xf0 checks only high nibble, expected 0xa0
    const compValue = bitmaskCompValue(0, "f0", "a0");

    await scopeFunction([
      {
        parent: 0,
        paramType: Encoding.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.Static,
        operator: Operator.Bitmask,
        compValue,
      },
    ]);

    // 0xab & 0xf0 = 0xa0 - passes (low nibble 0xb ignored)
    await expect(
      invoke(
        BigInt(
          "0xab00000000000000000000000000000000000000000000000000000000000000",
        ),
      ),
    ).to.not.be.reverted;

    // 0xaf & 0xf0 = 0xa0 - passes (low nibble 0xf ignored)
    await expect(
      invoke(
        BigInt(
          "0xaf00000000000000000000000000000000000000000000000000000000000000",
        ),
      ),
    ).to.not.be.reverted;

    // 0xbb & 0xf0 = 0xb0 != 0xa0 - fails
    await expect(
      invoke(
        BigInt(
          "0xbb00000000000000000000000000000000000000000000000000000000000000",
        ),
      ),
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.BitmaskNotAllowed, ZeroHash);
  });

  it("works on static crossing parameter boundary", async () => {
    const { roles, scopeFunction, invoke } =
      await loadFixture(setupTwoParamsStatic);

    // shift 26, mask 10 bytes = reads 6 bytes from param1, 4 bytes from param2
    const compValue = bitmaskCompValue(26, "ff".repeat(10), "aa".repeat(10));

    await scopeFunction([
      {
        parent: 0,
        paramType: Encoding.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.Static,
        operator: Operator.Bitmask,
        compValue,
      },
    ]);

    // param1 ends with 6 bytes of 0xaa, param2 starts with 4 bytes of 0xaa
    const param1 = BigInt(
      "0x000000000000000000000000000000000000000000000000000000aaaaaaaaaaaaa",
    );
    const param2 = BigInt(
      "0xaaaaaaaa00000000000000000000000000000000000000000000000000000000",
    );

    await expect(invoke(param1, param2)).to.not.be.reverted;

    // param2 first byte wrong
    const param2Wrong = BigInt(
      "0xbbaaaaaaaa000000000000000000000000000000000000000000000000000000",
    );
    await expect(invoke(param1, param2Wrong))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.BitmaskNotAllowed, ZeroHash);
  });
});
