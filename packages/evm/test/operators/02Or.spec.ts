import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, Interface, ZeroHash } from "ethers";

import {
  AbiType,
  flattenCondition,
  Operator,
  PermissionCheckerStatus,
} from "../utils";
import {
  setupOneParamStatic,
  setupOneParamStaticTuple,
  setupTwoParamsStaticDynamic,
} from "../setup";
import { ConditionFlatStruct } from "../../typechain-types/contracts/Integrity";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

describe("Operator - Or", async () => {
  it("evaluates operator Or with a single child", async () => {
    const { roles, scopeFunction, invoke } =
      await loadFixture(setupOneParamStatic);

    await scopeFunction([
      {
        parent: 0,
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: AbiType.None,
        operator: Operator.Or,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: AbiType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [1]),
      },
    ]);

    await expect(invoke(1)).to.not.be.reverted;

    await expect(invoke(2))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.OrViolation, ZeroHash);
  });

  it("evaluates operator Or with multiple children", async () => {
    const { roles, scopeFunction, invoke } =
      await loadFixture(setupOneParamStatic);

    await scopeFunction([
      {
        parent: 0,
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: AbiType.None,
        operator: Operator.Or,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: AbiType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [15]),
      },
      {
        parent: 1,
        paramType: AbiType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [30]),
      },
    ]);

    await expect(invoke(1))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.OrViolation, ZeroHash);

    await expect(invoke(15)).to.not.be.reverted;

    await expect(invoke(20))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.OrViolation, ZeroHash);

    await expect(invoke(30)).to.not.be.reverted;

    await expect(invoke(100))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.OrViolation, ZeroHash);
  });

  it("evaluates operator OR, with type equivalent sibling children", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamStaticTuple,
    );

    const conditions = flattenCondition({
      paramType: AbiType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: AbiType.None,
          operator: Operator.Or,
          children: [
            {
              paramType: AbiType.Tuple,
              operator: Operator.Matches,
              children: [
                {
                  paramType: AbiType.Static,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["uint256"], [123]),
                },
                {
                  paramType: AbiType.Static,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["bool"], [true]),
                },
              ],
            },
            {
              paramType: AbiType.Tuple,
              operator: Operator.Matches,
              children: [
                {
                  paramType: AbiType.Static,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["uint256"], [345]),
                },
                {
                  paramType: AbiType.Static,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["bool"], [false]),
                },
              ],
            },
          ],
        },
      ],
    }) as ConditionFlatStruct[];

    await scopeFunction(conditions);

    // A
    await expect(invoke({ a: 123, b: true })).to.not.be.reverted;
    await expect(invoke({ a: 345, b: false })).to.not.be.reverted;

    await expect(invoke({ a: 123, b: false }))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.OrViolation, ZeroHash);

    await expect(invoke({ a: 345, b: true }))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.OrViolation, ZeroHash);
  });
  it("evaluates operator OR, with variant children", async () => {
    const {
      roles,
      scopeFunction,
      invoke: _invoke,
    } = await loadFixture(setupTwoParamsStaticDynamic);

    const conditions = flattenCondition({
      paramType: AbiType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: AbiType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [987]),
        },
        {
          paramType: AbiType.None,
          operator: Operator.Or,
          children: [
            {
              paramType: AbiType.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: AbiType.Dynamic,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(
                    ["bytes"],
                    ["0xaabbccddee"],
                  ),
                },
              ],
            },
            {
              paramType: AbiType.Calldata,
              operator: Operator.Matches,
              children: [
                {
                  paramType: AbiType.Static,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["uint256"], [12345]),
                },
              ],
            },
          ],
        },
      ],
    }) as ConditionFlatStruct[];

    await scopeFunction(conditions);

    const invokeA = (a: number, b: string) => {
      const embedded = defaultAbiCoder.encode(["bytes"], [b]);
      return _invoke(a, embedded);
    };

    const invokeB = (a: number, b: number) => {
      const embedded = Interface.from([
        "function f(uint256)",
      ]).encodeFunctionData("f", [b]);

      return _invoke(a, embedded);
    };

    // A
    await expect(invokeA(987, "0xaabbccddee")).to.not.be.reverted;
    await expect(invokeA(999, "0xaabbccddee"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, ZeroHash);
    await expect(invokeA(987, "0xaabbccdd"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.OrViolation, ZeroHash);

    // B
    await expect(invokeB(987, 12345)).to.not.be.reverted;
    await expect(invokeB(999, 12345))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, ZeroHash);
    await expect(invokeB(987, 1234))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.OrViolation, ZeroHash);
  });

  it.skip("Tracks the resulting consumption");
});
