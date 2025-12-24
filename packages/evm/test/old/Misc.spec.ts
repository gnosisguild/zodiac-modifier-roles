import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import hre from "hardhat";

import {
  Encoding,
  BYTES32_ZERO,
  ExecutionOptions,
  flattenCondition,
  Operator,
  PermissionCheckerStatus,
} from "../utils";
import {
  deployRolesMod,
  setupOneParamArrayOfBytes,
  setupOneParamBytes,
} from "../setup";
import {
  Interface,
  AbiCoder,
  ZeroHash,
  parseEther,
  randomBytes,
  hexlify,
} from "ethers";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

describe("Misc", async () => {
  it("evaluates operator Bitmask and EqualsTo with type equivalent tree", async () => {
    const { roles, allowFunction, invoke } =
      await loadFixture(setupOneParamBytes);

    const maskCompValue = (selector: string) => {
      const shift = "0000";
      const mask = "ffffffff".padEnd(30, "0");
      const expected = selector.slice(2).padEnd(30, "0");
      return `0x${shift}${mask}${expected}`;
    };

    const iface = new Interface([
      "function fnOut(bytes a)",
      "function fnAllowed1(uint256 a)",
      "function fnAllowed2(uint256 a)",
      "function fnOther(uint256 a)",
    ]);
    const fnAllowed1 = iface.getFunction("fnAllowed1");
    const fnAllowed2 = iface.getFunction("fnAllowed2");
    if (!fnAllowed1 || !fnAllowed2) return;

    await allowFunction([
      {
        parent: 0,
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.None,
        operator: Operator.And,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: Encoding.None,
        operator: Operator.Or,
        compValue: "0x",
      },
      {
        parent: 2,
        paramType: Encoding.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [123456]),
      },

      {
        parent: 3,
        paramType: Encoding.Dynamic,
        operator: Operator.Bitmask,
        compValue: maskCompValue(fnAllowed1.selector),
      },
      {
        parent: 3,
        paramType: Encoding.Dynamic,
        operator: Operator.Bitmask,
        compValue: maskCompValue(fnAllowed2.selector),
      },
    ]);

    await expect(invoke(iface.encodeFunctionData("fnAllowed1", [123456]))).to
      .not.be.reverted;

    await expect(invoke(iface.encodeFunctionData("fnAllowed2", [123456]))).to
      .not.be.reverted;

    await expect(invoke(iface.encodeFunctionData("fnOther", [123456])))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.OrViolation, BYTES32_ZERO);

    await expect(invoke(iface.encodeFunctionData("fnAllowed1", [1])))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
  });

  it("It is possible to setup sibling TypeEquivalence when the first element is Dynamic, and others are Dynamic or AbiEncoded", async () => {
    const { allowFunction } = await loadFixture(setupOneParamBytes);

    const maskCompValue = (selector: string) => {
      const shift = "0000";
      const mask = "ffffffff".padEnd(30, "0");
      const expected = selector.slice(2).padEnd(30, "0");
      return `0x${shift}${mask}${expected}`;
    };

    const iface = new Interface([
      "function fnOut(bytes a)",
      "function fnAllowed1(uint256 a)",
      "function fnAllowed2(uint256 a)",
      "function fnOther(uint256 a)",
    ]);
    const fnAllowed1 = iface.getFunction("fnAllowed1");
    const fnAllowed2 = iface.getFunction("fnAllowed2");
    if (!fnAllowed1 || !fnAllowed2) return;
    await expect(
      allowFunction([
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.None,
          operator: Operator.And,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: Encoding.None,
          operator: Operator.Or,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: Encoding.Dynamic,
          operator: Operator.Bitmask,
          compValue: maskCompValue(fnAllowed1.selector),
        },
        {
          parent: 2,
          paramType: Encoding.Dynamic,
          operator: Operator.Bitmask,
          compValue: maskCompValue(fnAllowed2.selector),
        },
        {
          parent: 3,
          paramType: Encoding.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [123456]),
        },
      ]),
    ).to.not.be.reverted;
  });

  it("evalutes array.every(OR())", async () => {
    const { roles, allowFunction, invoke } = await loadFixture(
      setupOneParamArrayOfBytes,
    );

    const conditions = flattenCondition({
      paramType: Encoding.AbiEncoded,
      operator: Operator.Matches,
      children: [
        {
          paramType: Encoding.Array,
          operator: Operator.ArrayEvery,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Or,
              children: [
                // Variant 1: AbiEncoded with single uint256
                {
                  paramType: Encoding.AbiEncoded,
                  operator: Operator.Matches,
                  compValue: "0x0000", // leadingBytes = 0 (no selector)
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.GreaterThan,
                      compValue: defaultAbiCoder.encode(["uint256"], [100]),
                    },
                  ],
                },
                // Variant 2: AbiEncoded with tuple(uint256, bytes)
                {
                  paramType: Encoding.AbiEncoded,
                  operator: Operator.Matches,
                  compValue: "0x0000", // leadingBytes = 0 (no selector)
                  children: [
                    {
                      paramType: Encoding.Tuple,
                      operator: Operator.Matches,
                      children: [
                        {
                          paramType: Encoding.Static,
                          operator: Operator.EqualTo,
                          compValue: defaultAbiCoder.encode(["uint256"], [25]),
                        },
                        {
                          paramType: Encoding.Dynamic,
                          operator: Operator.EqualTo,
                          compValue: encode(["bytes"], ["0xaabbcc"]),
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    await allowFunction(conditions);

    // Test data - each entry must match one of the variants
    const validArray = [
      encode(["uint256"], [150]), // Variant 1: 150 > 100 ✓
      encode(["tuple(uint256,bytes)"], [[25, "0xaabbcc"]]), // Variant 2: 25 < 50 ✓
      encode(["uint256"], [200]), // Variant 1: 200 > 100 ✓
    ];

    const invalidArray = [
      encode(["uint256"], [150]), // Variant 1: 150 > 100 ✓
      encode(["uint256"], [50]), // Variant 1: 50 < 100 ✗, would need to be Variant 2 but overflow
      encode(["uint256"], [200]), // Variant 1: 200 > 100 ✓
    ];

    await expect(invoke(validArray)).to.not.be.reverted;
    await expect(invoke(invalidArray))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.NotEveryArrayElementPasses, ZeroHash);
  });

  describe("EtherValue encoding", () => {
    async function setup() {
      const [owner, member] = await hre.ethers.getSigners();

      const Avatar = await hre.ethers.getContractFactory("TestAvatar");
      const avatar = await Avatar.deploy();

      const TestContract = await hre.ethers.getContractFactory("TestContract");
      const testContract = await TestContract.deploy();

      const avatarAddress = await avatar.getAddress();
      const roles = await deployRolesMod(
        hre,
        owner.address,
        avatarAddress,
        avatarAddress,
      );

      const roleKey = randomBytes32();

      await roles.connect(owner).enableModule(member.address);
      await roles.connect(owner).grantRole(member.address, roleKey, 0, 0, 0);
      await roles.connect(owner).setDefaultRole(member.address, roleKey);

      // Fund the avatar for value transfer tests
      await owner.sendTransaction({
        to: avatarAddress,
        value: parseEther("100"),
      });

      return { owner, member, roles, testContract, roleKey };
    }

    it("EqualTo with EtherValue - requires exact ether amount", async () => {
      const { owner, member, roles, testContract, roleKey } =
        await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();
      const SELECTOR =
        testContract.interface.getFunction("oneParamBytes").selector;

      await roles.connect(owner).scopeTarget(roleKey, testContractAddress);

      // Scope to require exactly 1 ether
      await roles.connect(owner).allowFunction(
        roleKey,
        testContractAddress,
        SELECTOR,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.Pass,
            },
            {
              paramType: Encoding.EtherValue,
              operator: Operator.EqualTo,
              compValue: defaultAbiCoder.encode(["uint256"], [parseEther("1")]),
            },
          ],
        }),
        ExecutionOptions.Send,
      );

      const calldata = testContract.interface.encodeFunctionData(
        "oneParamBytes",
        ["0xdeadbeef"],
      );

      // Exactly 1 ether - passes
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            parseEther("1"),
            calldata,
            0,
          ),
      ).to.not.be.reverted;

      // 0 ether - fails
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, calldata, 0),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);

      // 2 ether - fails
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            parseEther("2"),
            calldata,
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);

      // 0.999 ether - fails
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            parseEther("0.999"),
            calldata,
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    });

    it("EqualTo with EtherValue - zero ether requirement", async () => {
      const { owner, member, roles, testContract, roleKey } =
        await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();
      const SELECTOR =
        testContract.interface.getFunction("oneParamBytes").selector;

      await roles.connect(owner).scopeTarget(roleKey, testContractAddress);

      // Scope to require exactly 0 ether (no value transfer)
      await roles.connect(owner).allowFunction(
        roleKey,
        testContractAddress,
        SELECTOR,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.Pass,
            },
            {
              paramType: Encoding.EtherValue,
              operator: Operator.EqualTo,
              compValue: defaultAbiCoder.encode(["uint256"], [0]),
            },
          ],
        }),
        ExecutionOptions.Send,
      );

      const calldata = testContract.interface.encodeFunctionData(
        "oneParamBytes",
        ["0xdeadbeef"],
      );

      // 0 ether - passes
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, calldata, 0),
      ).to.not.be.reverted;

      // Any non-zero ether - fails
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 1, calldata, 0),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    });

    it("Or over embedded AbiEncoded with different ether value restrictions per branch", async () => {
      const { owner, member, roles, testContract, roleKey } =
        await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();

      // Use oneParamBytes(bytes) - the bytes param will contain embedded calldata
      const SELECTOR =
        testContract.interface.getFunction("oneParamBytes").selector;

      // Embedded function interfaces
      const iface = new Interface([
        "function fnZeroEther(uint256 a)",
        "function fnLimitedEther(uint256 a, bool b)",
      ]);

      await roles.connect(owner).scopeTarget(roleKey, testContractAddress);

      // Scope oneParamBytes with an OR over embedded functions:
      // - fnZeroEther: ether value must be 0
      // - fnLimitedEther: ether value must be < 10 ether
      await roles.connect(owner).allowFunction(
        roleKey,
        testContractAddress,
        SELECTOR,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Or,
              children: [
                {
                  paramType: Encoding.AbiEncoded,
                  operator: Operator.Matches,
                  compValue:
                    "0x0004" +
                    iface.getFunction("fnZeroEther")!.selector.slice(2),
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.Pass,
                    },
                    {
                      paramType: Encoding.EtherValue,
                      operator: Operator.LessThan,
                      compValue: defaultAbiCoder.encode(["uint256"], [1]), // must be < 1 (i.e., 0)
                    },
                  ],
                },
                {
                  paramType: Encoding.AbiEncoded,
                  operator: Operator.Matches,
                  compValue:
                    "0x0004" +
                    iface.getFunction("fnLimitedEther")!.selector.slice(2),
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.Pass,
                    },
                    {
                      paramType: Encoding.Static,
                      operator: Operator.Pass,
                    },
                    {
                      paramType: Encoding.EtherValue,
                      operator: Operator.LessThan,
                      compValue: defaultAbiCoder.encode(
                        ["uint256"],
                        [parseEther("10")],
                      ),
                    },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Send,
      );

      // fnZeroEther with 0 ether - passes
      const calldataZeroEther = testContract.interface.encodeFunctionData(
        "oneParamBytes",
        [iface.encodeFunctionData("fnZeroEther", [123])],
      );

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            calldataZeroEther,
            0,
          ),
      ).to.not.be.reverted;

      // fnZeroEther with 1 ether - fails (must be < 1)
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            parseEther("1"),
            calldataZeroEther,
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "ConditionViolation");

      // fnLimitedEther with 5 ether - passes (< 10)
      const calldataLimitedEther = testContract.interface.encodeFunctionData(
        "oneParamBytes",
        [iface.encodeFunctionData("fnLimitedEther", [456, true])],
      );
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            parseEther("5"),
            calldataLimitedEther,
            0,
          ),
      ).to.not.be.reverted;

      // fnLimitedEther with 15 ether - fails (>= 10)
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            parseEther("15"),
            calldataLimitedEther,
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "ConditionViolation");
    });
  });
});

function encode(types: any, values: any, removeOffset = false) {
  const result = defaultAbiCoder.encode(types, values);
  return removeOffset ? `0x${result.slice(66)}` : result;
}

function randomBytes32(): string {
  return hexlify(randomBytes(32));
}
