import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, Interface, solidityPacked, ZeroHash } from "ethers";

import { setupTestContract, setupOneParam, setupDynamicParam } from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
} from "../utils";

const abiCoder = AbiCoder.defaultAbiCoder();

describe("Operator - GreaterThan", () => {
  it("passes when value > compValue", async () => {
    const { allowFunction, invoke } = await loadFixture(setupOneParam);

    await allowFunction(
      flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.GreaterThan,
            compValue: abiCoder.encode(["uint256"], [100]),
          },
        ],
      }),
      ExecutionOptions.None,
    );

    // 101 > 100 passes
    await expect(invoke(101)).to.not.be.reverted;
  });

  it("fails when value <= compValue", async () => {
    const { roles, allowFunction, invoke } = await loadFixture(setupOneParam);

    await allowFunction(
      flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.GreaterThan,
            compValue: abiCoder.encode(["uint256"], [100]),
          },
        ],
      }),
      ExecutionOptions.None,
    );

    // 100 == 100 fails
    await expect(invoke(100))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        ConditionViolationStatus.ParameterLessThanAllowed,
        1,
        anyValue,
        anyValue,
      );

    // 99 < 100 fails
    await expect(invoke(99))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        ConditionViolationStatus.ParameterLessThanAllowed,
        1,
        anyValue,
        anyValue,
      );
  });

  it("integrates with Slice operator", async () => {
    const { roles, allowFunction, invoke } =
      await loadFixture(setupDynamicParam);

    // Slice 4 bytes at offset 0, then GreaterThan comparison
    await allowFunction(
      flattenCondition({
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        children: [
          {
            paramType: Encoding.Dynamic,
            operator: Operator.Slice,
            compValue: solidityPacked(["uint16", "uint8"], [0, 4]), // shift=0, size=4
            children: [
              {
                paramType: Encoding.Static,
                operator: Operator.GreaterThan,
                compValue: abiCoder.encode(["uint256"], [100]),
              },
            ],
          },
        ],
      }),
      ExecutionOptions.None,
    );

    // 0x00000065 = 101 > 100 passes
    await expect(invoke("0x00000065")).to.not.be.reverted;

    // 0x00000064 = 100 <= 100 fails
    await expect(invoke("0x00000064"))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        ConditionViolationStatus.ParameterLessThanAllowed,
        2,
        anyValue,
        anyValue,
      );
  });

  it("compares ether value (msg.value)", async () => {
    const iface = new Interface(["function fn()"]);
    const fn = iface.getFunction("fn")!;
    const { roles, member, testContractAddress, roleKey } =
      await loadFixture(setupTestContract);

    // GreaterThan on EtherValue: msg.value must be > 1000 wei
    await roles.allowFunction(
      roleKey,
      testContractAddress,
      fn.selector,
      flattenCondition({
        paramType: Encoding.EtherValue,
        operator: Operator.GreaterThan,
        compValue: abiCoder.encode(["uint256"], [1000]),
      }),
      ExecutionOptions.Send,
    );

    // 1001 > 1000 passes
    await expect(
      roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          1001,
          iface.encodeFunctionData(fn),
          0,
        ),
    ).to.not.be.reverted;

    // 1000 <= 1000 fails
    await expect(
      roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          1000,
          iface.encodeFunctionData(fn),
          0,
        ),
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        ConditionViolationStatus.ParameterLessThanAllowed,
        0,
        anyValue,
        anyValue,
      );
  });

  describe("violation context", () => {
    it("reports the violating node index", async () => {
      const { roles, allowFunction, invoke } = await loadFixture(setupOneParam);

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.GreaterThan,
              compValue: abiCoder.encode(["uint256"], [100]),
            },
          ],
        }),
        ExecutionOptions.None,
      );

      await expect(invoke(50))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.ParameterLessThanAllowed,
          1, // GreaterThan node at BFS index 1
          anyValue,
          anyValue,
        );
    });

    it("reports the calldata range of the violation", async () => {
      const { roles, allowFunction, invoke } = await loadFixture(setupOneParam);

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.GreaterThan,
              compValue: abiCoder.encode(["uint256"], [100]),
            },
          ],
        }),
        ExecutionOptions.None,
      );

      await expect(invoke(50))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.ParameterLessThanAllowed,
          anyValue,
          4, // payloadLocation: parameter starts at byte 4
          32, // payloadSize: uint256 is 32 bytes
        );
    });
  });

  describe("integrity", () => {
    it("reverts UnsuitableParameterType for invalid encodings", async () => {
      const { roles, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      for (const encoding of [
        Encoding.None,
        Encoding.Dynamic,
        Encoding.Tuple,
        Encoding.Array,
        Encoding.AbiEncoded,
      ]) {
        await expect(
          roles.allowTarget(
            roleKey,
            testContractAddress,
            [
              {
                parent: 0,
                paramType: encoding,
                operator: Operator.GreaterThan,
                compValue: abiCoder.encode(["uint256"], [100]),
              },
            ],
            0,
          ),
        ).to.be.revertedWithCustomError(roles, "UnsuitableParameterType");
      }
    });

    it("reverts UnsuitableCompValue when compValue is not 32 bytes", async () => {
      const { roles, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      await expect(
        roles.allowTarget(
          roleKey,
          testContractAddress,
          [
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.GreaterThan,
              compValue: "0x0000", // Not 32 bytes
            },
          ],
          0,
        ),
      ).to.be.revertedWithCustomError(roles, "UnsuitableCompValue");
    });

    it("reverts LeafNodeCannotHaveChildren when GreaterThan has children", async () => {
      const { roles, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      await expect(
        roles.allowTarget(
          roleKey,
          testContractAddress,
          [
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.GreaterThan,
              compValue: abiCoder.encode(["uint256"], [100]),
            },
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ],
          0,
        ),
      ).to.be.revertedWithCustomError(roles, "LeafNodeCannotHaveChildren");
    });
  });
});
