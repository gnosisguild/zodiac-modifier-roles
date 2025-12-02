import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, concat, hexlify, randomBytes } from "ethers";

import {
  Encoding,
  ExecutionOptions,
  Operator,
  flattenCondition,
} from "./utils";
import { deployRolesMod } from "./setup";

const ROLE_KEY =
  "0x000000000000000000000000000000000000000000000000000000000000abcd";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

describe("AbiEncoded LeadingBytes", async () => {
  async function setup() {
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();
    const avatarAddress = await avatar.getAddress();
    const [owner, invoker] = await hre.ethers.getSigners();
    const roles = await deployRolesMod(
      hre,
      owner.address,
      avatarAddress,
      avatarAddress,
    );
    await roles.enableModule(invoker.address);
    await roles.connect(owner).assignRoles(invoker.address, [ROLE_KEY], [true]);
    await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

    return {
      avatar,
      owner,
      invoker,
      roles,
      testContract,
    };
  }

  describe("Root AbiEncoded with custom leadingBytes", () => {
    it("AbiEncoded with 20 bytes offset, decodes Tuple, passes condition", async () => {
      const { roles, testContract, owner, invoker } = await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();

      await roles.connect(owner).scopeTarget(ROLE_KEY, testContractAddress);

      // Use oneParamStaticTuple(StaticTuple) - tuple with (uint256, bool)
      const selector = testContract.interface.getFunction(
        "oneParamStaticTuple",
      ).selector;

      // Condition: AbiEncoded with 20 bytes offset from start of block
      // (4-byte selector + 16 extra bytes)
      await roles.connect(owner).scopeFunction(
        ROLE_KEY,
        testContractAddress,
        selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0014", // 20 in hex (4 selector + 16 extra)
          children: [
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["uint256"], [42]),
                },
                {
                  paramType: Encoding.Static,
                  operator: Operator.Pass,
                },
              ],
            },
          ],
        }),
        ExecutionOptions.None,
      );

      const invoke = (a: number, b: boolean) => {
        const extraHeader = hexlify(randomBytes(16));
        const tupleData = defaultAbiCoder.encode(
          ["tuple(uint256,bool)"],
          [[a, b]],
        );
        const customCalldata = concat([selector, extraHeader, tupleData]);

        return roles
          .connect(invoker)
          .execTransactionFromModule(testContractAddress, 0, customCalldata, 0);
      };

      await expect(invoke(42, true)).to.not.be.reverted;
      await expect(invoke(43, true)).to.be.reverted;
    });

    it("AbiEncoded with 300 bytes offset, decodes DynamicTuple, passes condition", async () => {
      const { roles, testContract, owner, invoker } = await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();

      await roles.connect(owner).scopeTarget(ROLE_KEY, testContractAddress);

      // Use oneParamDynamicTuple(DynamicTuple) - tuple with (uint256, bytes)
      const selector = testContract.interface.getFunction(
        "oneParamDynamicTuple",
      ).selector;

      await roles.connect(owner).scopeFunction(
        ROLE_KEY,
        testContractAddress,
        selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x012c", // 300 in hex
          children: [
            {
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.Pass,
                },
                {
                  paramType: Encoding.Dynamic,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["bytes"], ["0xdeadbeef"]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.None,
      );

      const invoke = (a: number, b: string) => {
        const extraHeader = hexlify(randomBytes(296));
        const tupleData = defaultAbiCoder.encode(
          ["tuple(uint256,bytes)"],
          [[a, b]],
        );
        const customCalldata = concat([selector, extraHeader, tupleData]);

        return roles
          .connect(invoker)
          .execTransactionFromModule(testContractAddress, 0, customCalldata, 0);
      };

      await expect(invoke(999, "0xdeadbeef")).to.not.be.reverted;
      await expect(invoke(999, "0xcafebabe")).to.be.reverted;
    });
  });

  describe("Nested AbiEncoded with custom leadingBytes", () => {
    it("Nested AbiEncoded with 10 bytes offset, decodes Array, passes condition", async () => {
      const { roles, testContract, owner, invoker } = await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();

      await roles.connect(owner).scopeTarget(ROLE_KEY, testContractAddress);

      const selector = testContract.interface.getFunction("dynamic").selector;

      // Condition: Calldata -> AbiEncoded (bytes param with custom leadingBytes)
      // AbiEncoded handles the dynamic length prefix internally, then skips 10 bytes
      await roles.connect(owner).scopeFunction(
        ROLE_KEY,
        testContractAddress,
        selector,
        flattenCondition({
          paramType: Encoding.Calldata,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x000a", // 10 in hex
              children: [
                {
                  paramType: Encoding.Array,
                  operator: Operator.Matches,
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.EqualTo,
                      compValue: defaultAbiCoder.encode(["uint256"], [123]),
                    },
                    {
                      paramType: Encoding.Static,
                      operator: Operator.EqualTo,
                      compValue: defaultAbiCoder.encode(["uint256"], [456]),
                    },
                    {
                      paramType: Encoding.Static,
                      operator: Operator.EqualTo,
                      compValue: defaultAbiCoder.encode(["uint256"], [789]),
                    },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.None,
      );

      const invoke = (values: number[]) => {
        const customHeader = hexlify(randomBytes(10));
        const arrayAbiEncoded = defaultAbiCoder.encode(["uint256[]"], [values]);
        const bytesPayload = concat([customHeader, arrayAbiEncoded]);

        const calldata = testContract.interface.encodeFunctionData("dynamic", [
          bytesPayload,
        ]);

        return roles
          .connect(invoker)
          .execTransactionFromModule(testContractAddress, 0, calldata, 0);
      };

      await expect(invoke([123, 456, 789])).to.not.be.reverted;
      await expect(invoke([123, 456, 790])).to.be.reverted;
    });

    it("Nested AbiEncoded with 500 bytes offset, decodes Array, passes condition", async () => {
      const { roles, testContract, owner, invoker } = await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();

      await roles.connect(owner).scopeTarget(ROLE_KEY, testContractAddress);

      const selector = testContract.interface.getFunction("dynamic").selector;

      await roles.connect(owner).scopeFunction(
        ROLE_KEY,
        testContractAddress,
        selector,
        flattenCondition({
          paramType: Encoding.Calldata,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x01f4", // 500 in hex
              children: [
                {
                  paramType: Encoding.Array,
                  operator: Operator.Matches,
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.EqualTo,
                      compValue: defaultAbiCoder.encode(["uint256"], [111]),
                    },
                    {
                      paramType: Encoding.Static,
                      operator: Operator.EqualTo,
                      compValue: defaultAbiCoder.encode(["uint256"], [222]),
                    },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.None,
      );

      const invoke = (values: number[]) => {
        const customHeader = hexlify(randomBytes(500));
        const arrayAbiEncoded = defaultAbiCoder.encode(["uint256[]"], [values]);
        const bytesPayload = concat([customHeader, arrayAbiEncoded]);

        const calldata = testContract.interface.encodeFunctionData("dynamic", [
          bytesPayload,
        ]);

        return roles
          .connect(invoker)
          .execTransactionFromModule(testContractAddress, 0, calldata, 0);
      };

      await expect(invoke([111, 222])).to.not.be.reverted;
      await expect(invoke([111, 223])).to.be.reverted;
    });
  });

  describe("LeadingBytes edge cases", () => {
    it("fails when data doesn't match condition due to wrong offset", async () => {
      const { roles, testContract, owner, invoker } = await loadFixture(setup);

      const testContractAddress = await testContract.getAddress();

      await roles.connect(owner).scopeTarget(ROLE_KEY, testContractAddress);

      const selector = testContract.interface.getFunction("dynamic").selector;

      // Condition expects 10 bytes offset
      await roles.connect(owner).scopeFunction(
        ROLE_KEY,
        testContractAddress,
        selector,
        flattenCondition({
          paramType: Encoding.Calldata,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x000a", // 10 bytes
              children: [
                {
                  paramType: Encoding.Array,
                  operator: Operator.ArrayEvery, // Use ArrayEvery for variable-length arrays
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.EqualTo,
                      compValue: defaultAbiCoder.encode(["uint256"], [123]),
                    },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.None,
      );

      // Send data with 5 bytes header instead of 10 - decoder will read wrong data
      const wrongHeader = hexlify(randomBytes(5));
      const arrayAbiEncoded = defaultAbiCoder.encode(["uint256[]"], [[123]]);
      const bytesPayload = concat([wrongHeader, arrayAbiEncoded]);

      const calldata = testContract.interface.encodeFunctionData("dynamic", [
        bytesPayload,
      ]);

      await expect(
        roles
          .connect(invoker)
          .execTransactionFromModule(testContractAddress, 0, calldata, 0),
      ).to.be.revertedWithCustomError(roles, "ConditionViolation");
    });
  });
});
