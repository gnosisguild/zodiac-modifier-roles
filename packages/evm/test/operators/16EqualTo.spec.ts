import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { defaultAbiCoder } from "ethers/lib/utils";

import {
  BYTES32_ZERO,
  Operator,
  ParameterType,
  PermissionCheckerStatus,
} from "../utils";
import {
  setupOneParamArrayOfStatic,
  setupOneParamBytes,
  setupOneParamBytesSmall,
  setupOneParamBytesWord,
  setupOneParamDynamicNestedTuple,
  setupOneParamDynamicTuple,
  setupOneParamIntSmall,
  setupOneParamIntWord,
  setupOneParamStaticNestedTuple,
  setupOneParamString,
  setupOneParamUintSmall,
  setupOneParamUintWord,
  setupTwoParamsStaticTupleStatic,
} from "./setup";

describe("Operator - EqualTo", async () => {
  it("evaluates operator EqualTo for Static - uint full word", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamUintWord
    );

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
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [123]),
      },
    ]);

    await expect(invoke(321))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    await expect(invoke(123)).to.not.be.reverted;
  });
  it("evaluates operator EqualTo for Static - uint smaller than word", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamUintSmall
    );

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
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint8"], [50]),
      },
    ]);

    await expect(invoke(128))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    await expect(invoke(50)).to.not.be.reverted;
  });
  it("evaluates operator EqualTo for Static - signed integer full word", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamIntWord
    );

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
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["int256"], [-5555]),
      },
    ]);

    await expect(invoke(5555))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    await expect(invoke(-5555)).to.not.be.reverted;
  });
  it("evaluates operator EqualTo for Static - integer smaller than word", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamIntSmall
    );

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
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["int8"], [-55]),
      },
    ]);

    await expect(invoke(55))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    await expect(invoke(-55)).to.not.be.reverted;
  });
  it("evaluates operator EqualTo for Static - bytes full word", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamBytesWord
    );

    const value =
      "0x1234567890123456789012345678901234567890123456789012345678901234";
    const otherValue =
      "0x0000000000000000000000000000000000000000000000000000000000000011";
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
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["bytes32"], [value]),
      },
    ]);

    await expect(invoke(otherValue))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    await expect(invoke(value)).to.not.be.reverted;
  });
  it("evaluates operator EqualTo for Static - smaller than full word", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamBytesSmall
    );

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
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["bytes1"], ["0xa1"]),
      },
    ]);

    await expect(invoke("0xa2"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    await expect(invoke("0xa1")).to.not.be.reverted;
  });
  it("evaluates operator EqualTo for String", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamString
    );

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
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["string"], ["Hello World!"]),
      },
    ]);

    await expect(invoke("Good morning!"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    await expect(invoke("Hello World!")).to.not.be.reverted;
  });
  it("evaluates operator EqualTo for String - empty", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamString
    );

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
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["string"], [""]),
      },
    ]);

    await expect(invoke("Good morning!"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    await expect(invoke("")).to.not.be.reverted;
  });
  it("evaluates operator EqualTo for String - large", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamString
    );

    const value =
      "úúúúúA string which is longer than 32 bytes, and it has also some special characters ééééééé";
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
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["string"], [value]),
      },
    ]);

    await expect(invoke(""))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);

    await expect(invoke("Good morning!"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    await expect(invoke(value)).to.not.be.reverted;
  });
  it("evaluates operator EqualTo for Bytes", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamBytes
    );

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
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["bytes"], ["0xbadfed"]),
      },
    ]);

    await expect(invoke("0x"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    await expect(invoke("0xdeadbeef"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    await expect(invoke("0xbadfed")).to.not.be.reverted;
  });
  it("evaluates operator EqualTo for Bytes - large", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamBytes
    );

    const largeValue =
      "0xdeadbeef000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff";

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
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["bytes"], [largeValue]),
      },
    ]);

    await expect(invoke("0x"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    await expect(invoke("0xdeadbeef"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    await expect(invoke(largeValue)).to.not.be.reverted;
  });
  it("evaluates operator EqualTo for Bytes - empty", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamBytes
    );

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
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["bytes"], ["0x"]),
      },
    ]);

    await expect(invoke("0x00"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    await expect(invoke("0xdeadbeef"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    await expect(invoke("0x")).to.not.be.reverted;
  });
  it("evaluates operator EqualTo for Array", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamArrayOfStatic
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Array,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256[]"], [[4, 5, 6]]),
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
    ]);

    await expect(invoke([]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    await expect(invoke([4, 5, 6, 7]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    await expect(invoke([4, 5, 6])).to.not.be.reverted;
  });
  it("evaluates operator EqualTo for Array - empty", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamArrayOfStatic
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Array,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256[]"], [[]]),
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
    ]);

    await expect(invoke([])).to.not.be.reverted;

    await expect(invoke([1]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    await expect(invoke([2, 3]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
  });
  it("evaluates operator EqualTo for Tuple - static", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupTwoParamsStaticTupleStatic
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Tuple,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(
          ["tuple(uint256,bool)"],
          [[123, false]]
        ),
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
    ]);

    await expect(invoke({ a: 100, b: false }, 1))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);

    await expect(invoke({ a: 123, b: true }, 1))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);

    await expect(invoke({ a: 123, b: false }, 1)).to.not.be.reverted;
  });
  it("evaluates operator EqualTo for Tuple - static nested", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamStaticNestedTuple
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Tuple,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(
          ["tuple(uint256,tuple(uint256, bool))"],
          [[9, [8, false]]]
        ),
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Tuple,
        operator: Operator.Pass,
        compValue: "0x",
      },
      {
        parent: 3,
        paramType: ParameterType.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
      {
        parent: 3,
        paramType: ParameterType.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
    ]);

    await expect(invoke({ a: 10, b: { a: 9, b: true } }))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);

    await expect(invoke({ a: 9, b: { a: 8, b: false } })).to.not.be.reverted;
  });
  it("evaluates operator EqualTo for Tuple - dynamic", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamDynamicTuple
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Tuple,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(
          ["tuple(uint256,bytes)"],
          [[100, "0xbadfed"]]
        ),
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Dynamic,
        operator: Operator.Pass,
        compValue: "0x",
      },
    ]);

    await expect(invoke({ a: 100, b: "0xff" }))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    await expect(invoke({ a: 10, b: "0xbadfed" }))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);

    await expect(invoke({ a: 100, b: "0xbadfed" })).to.not.be.reverted;
  });
  it("evaluates operator EqualTo for Tuple - dynamic nested", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamDynamicNestedTuple
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Tuple,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(
          ["tuple(uint256,tuple(uint256,bytes))"],
          [[222, [333, "0xbadfed"]]]
        ),
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Tuple,
        operator: Operator.Pass,
        compValue: "0x",
      },
      {
        parent: 3,
        paramType: ParameterType.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
      {
        parent: 3,
        paramType: ParameterType.Dynamic,
        operator: Operator.Pass,
        compValue: "0x",
      },
    ]);

    await expect(invoke({ a: 222, b: { a: 333, b: "0xdeadbeef" } }))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);

    // await expect(invoke({ a: 222, b: { a: 333, b: "0xbadfed" } })).to.not.be
    //   .reverted;
  });
});
