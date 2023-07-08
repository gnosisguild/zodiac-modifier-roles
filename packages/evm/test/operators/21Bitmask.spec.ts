import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { BigNumber } from "ethers";

import {
  BYTES32_ZERO,
  Operator,
  ParameterType,
  PermissionCheckerStatus,
} from "../utils";
import { setupOneParamBytes, setupOneParamStatic } from "./setup";

describe("Operator - Bitmask", async () => {
  it("evaluates operator Bitmask - Static, left aligned", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamStatic
    );

    const shift = "0000";
    const mask = "ff".padEnd(30, "0");
    const expected = "46".padEnd(30, "0");
    const compValue = `0x${shift}${mask}${expected}`;

    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.Bitmask,
        compValue,
      },
    ]);

    await expect(
      invoke(
        BigNumber.from(
          "0x4600000000000000000000000000000000000000000000000000000000000000"
        )
      )
    ).to.not.be.reverted;

    await expect(
      invoke(
        BigNumber.from(
          "0x4600ff0000000000000000000000000000000110000000000000000334400000"
        )
      )
    ).to.not.be.reverted;

    await expect(
      invoke(
        BigNumber.from(
          "0x4500000000000000000000000000000000000000000000000000000000000000"
        )
      )
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.BitmaskNotAllowed, BYTES32_ZERO);
  });
  it("evaluates operator Bitmask - Static, middle aligned", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamStatic
    );

    const shift = "000a";
    const mask = "f0f0f0".padEnd(30, "0");
    const expected = "103020".padEnd(30, "0");
    const compValue = `0x${shift}${mask}${expected}`;

    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.Bitmask,
        compValue,
      },
    ]);

    await expect(
      invoke(
        BigNumber.from(
          "0x0000000000000000000010302000000000000000000000000000000000000000"
        )
      )
    ).to.not.be.reverted;
    await expect(
      invoke(
        BigNumber.from(
          "0x000000000000000000001030200000000000000000000000000000ffffffffff"
        )
      )
    ).to.not.be.reverted;

    await expect(
      invoke(
        BigNumber.from(
          "0x000000000000000000001030400000000000000000000000000000ffffffffff"
        )
      )
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.BitmaskNotAllowed, BYTES32_ZERO);
  });
  it("evaluates operator Bitmask - Static, right aligned", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamStatic
    );

    const shift = "001e";
    const mask = "ffff".padEnd(30, "0");
    const expected = "abcd".padEnd(30, "0");
    const compValue = `0x${shift}${mask}${expected}`;
    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.Bitmask,
        compValue,
      },
    ]);

    await expect(
      invoke(
        BigNumber.from(
          "0x00000000000000000000000000000000000000000000000000000000000abcd"
        )
      )
    ).to.not.be.reverted;
    await expect(
      invoke(
        BigNumber.from(
          "0x00000000ffffffff000000000000000000000000000000000000000000fabcd"
        )
      )
    ).to.not.be.reverted;

    await expect(
      invoke(
        BigNumber.from(
          "0x00000000ffffffff0000000000000000000000000000000000000000000bbcd"
        )
      )
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.BitmaskNotAllowed, BYTES32_ZERO);
  });
  it("evaluates operator Bitmask - Static, overflow", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamStatic
    );

    // 30
    const shift = "0020";
    const mask = "ffffff".padEnd(30, "0");
    const expected = "abcd11".padEnd(30, "0");
    const compValue = `0x${shift}${mask}${expected}`;
    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.Bitmask,
        compValue,
      },
    ]);

    await expect(
      invoke(
        BigNumber.from(
          "0x000000000000000000000000000000000000000000000000000000000000000"
        )
      )
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.BitmaskOverflow, BYTES32_ZERO);
  });
  it("evaluates operator Bitmask - Dynamic, left aligned", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamBytes
    );

    const shift = "0000";
    const mask = "ff".padEnd(30, "0");
    const expected = "46".padEnd(30, "0");
    const compValue = `0x${shift}${mask}${expected}`;
    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Dynamic,
        operator: Operator.Bitmask,
        compValue,
      },
    ]);

    await expect(invoke("0x46")).to.not.be.reverted;
    await expect(invoke("0x4600ff000000000000000000000000")).to.not.be.reverted;

    await expect(invoke("0x45"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.BitmaskNotAllowed, BYTES32_ZERO);
    await expect(invoke("0x45ff0077"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.BitmaskNotAllowed, BYTES32_ZERO);
  });
  it("evaluates operator Bitmask - Dynamic, right aligned", async () => {
    const { scopeFunction, invoke } = await loadFixture(setupOneParamBytes);

    const shift = "000a";
    const mask = "0000000f".padEnd(30, "0");
    const expected = "00000003".padEnd(30, "0");
    const compValue = `0x${shift}${mask}${expected}`;
    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Dynamic,
        operator: Operator.Bitmask,
        compValue,
      },
    ]);

    await expect(invoke("0x0000000000000000000000000003")).to.not.be.reverted;

    await expect(invoke("0x000f200000120000aa00000000f3")).to.not.be.reverted;

    await expect(invoke("0x0000000000000000000000000003ffff")).to.not.be
      .reverted;
  });
  it("evaluates operator Bitmask - Dynamic, overflow", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamBytes
    );

    // 30
    const shift = "0050";
    const mask = "ffffff".padEnd(30, "0");
    const expected = "aaaaaa".padEnd(30, "0");
    const compValue = `0x${shift}${mask}${expected}`;
    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Dynamic,
        operator: Operator.Bitmask,
        compValue,
      },
    ]);

    await expect(invoke("0x0000000000"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.BitmaskOverflow, BYTES32_ZERO);
  });

  it("cannot set up a Bitmap operator for other than Static/Dynamic", async () => {
    const { scopeFunction } = await loadFixture(setupOneParamBytes);

    const shift = "0050";
    const mask = "ffffff".padEnd(30, "0");
    const expected = "aaaaaa".padEnd(30, "0");
    const compValue = `0x${shift}${mask}${expected}`;

    await expect(
      scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Tuple,
          operator: Operator.Bitmask,
          compValue,
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ])
    ).to.be.reverted;

    await expect(
      scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Array,
          operator: Operator.Bitmask,
          compValue,
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ])
    ).to.be.reverted;
  });
});
