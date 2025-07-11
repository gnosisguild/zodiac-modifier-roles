import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, BytesLike } from "ethers";

import {
  AbiType,
  BYTES32_ZERO,
  ExecutionOptions,
  Operator,
  PermissionCheckerStatus,
  flattenCondition,
} from "./utils";
import { deployRolesMod } from "./setup";

const AddressOne = "0x0000000000000000000000000000000000000001";
const ROLE_KEY =
  "0x000000000000000000000000000000000000000000000000000000000000000f";
const ROLE_KEY1 =
  "0x0000000000000000000000000000000000000000000000000000000000000001";
const ROLE_KEY2 =
  "0x0000000000000000000000000000000000000000000000000000000000000002";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

describe("Roles", async () => {
  async function setup() {
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();
    const avatarAddress = await avatar.getAddress();
    const [owner, invoker, alice, bob] = await hre.ethers.getSigners();
    const roles = await deployRolesMod(
      hre,
      owner.address,
      avatarAddress,
      avatarAddress,
    );
    await roles.enableModule(invoker.address);

    return {
      avatar,
      owner,
      invoker,
      alice,
      bob,
      roles,
      testContract,
    };
  }

  async function setupWitSpendAndRevert() {
    const { roles, testContract, owner, invoker } = await setup();

    await roles.connect(owner).assignRoles(invoker.address, [ROLE_KEY], [true]);
    await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

    const allowanceKey =
      "0x1230000000000000000000000000000000000000000000000000000000000123";

    await roles.setAllowance(allowanceKey, 1000, 0, 0, 0, 0);

    await roles
      .connect(owner)
      .scopeTarget(ROLE_KEY, await testContract.getAddress());
    await roles.connect(owner).scopeFunction(
      ROLE_KEY,
      await testContract.getAddress(),
      testContract.interface.getFunction("spendAndMaybeRevert").selector,
      [
        {
          parent: 0,
          paramType: AbiType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: AbiType.Static,
          operator: Operator.WithinAllowance,
          compValue: allowanceKey,
        },
        {
          parent: 0,
          paramType: AbiType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ],
      ExecutionOptions.None,
    );

    return {
      roles,
      testContract,
      owner,
      invoker,
      roleKey: ROLE_KEY,
      allowanceKey,
    };
  }

  describe("setUp()", async () => {
    it("should emit event because of successful set up", async () => {
      const [user1] = await hre.ethers.getSigners();
      if (!hre.ethers.isAddress(user1.address)) {
        throw new Error("Invalid address detected: " + user1.address);
      }
      const roles = await deployRolesMod(
        hre,
        user1.address,
        user1.address,
        user1.address,
      );
      await roles.waitForDeployment();
      await expect(roles.deploymentTransaction())
        .to.emit(roles, "RolesModSetup")
        .withArgs(user1.address, user1.address, user1.address, user1.address);
    });
  });

  describe("assignRoles()", async () => {
    it("should throw on length mismatch", async () => {
      const { roles, owner, alice } = await loadFixture(setup);
      await expect(
        roles
          .connect(owner)
          .assignRoles(alice.address, [ROLE_KEY1, ROLE_KEY2], [true]),
      ).to.be.revertedWithCustomError(roles, "ArraysDifferentLength");
    });
    it("reverts if not authorized", async () => {
      const { roles, alice, bob } = await loadFixture(setup);
      await expect(
        roles.connect(alice).assignRoles(bob.address, [ROLE_KEY1], [true]),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("assigns roles to a module", async () => {
      const { roles, testContract, owner, invoker } = await loadFixture(setup);

      await roles
        .connect(owner)
        .allowTarget(
          ROLE_KEY,
          await testContract.getAddress(),
          ExecutionOptions.None,
        );

      await expect(
        roles
          .connect(invoker)
          .execTransactionFromModule(
            await testContract.getAddress(),
            0,
            testContract.interface.encodeFunctionData("doNothing"),
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "NoMembership");

      await roles
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_KEY], [true]);

      await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

      await expect(
        roles
          .connect(invoker)
          .execTransactionFromModule(
            await testContract.getAddress(),
            0,
            testContract.interface.encodeFunctionData("doNothing"),
            0,
          ),
      ).to.emit(testContract, "DoNothing");
    });
    it("revokes roles to a module", async () => {
      const { roles, testContract, owner, invoker } = await loadFixture(setup);

      await roles
        .connect(owner)
        .allowTarget(
          ROLE_KEY,
          await testContract.getAddress(),
          ExecutionOptions.None,
        );

      //authorize
      await roles
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_KEY], [true]);
      await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

      // expect it to succeed, after assigning role
      await expect(
        roles
          .connect(invoker)
          .execTransactionFromModule(
            await testContract.getAddress(),
            0,
            testContract.interface.encodeFunctionData("doNothing"),
            0,
          ),
      ).to.emit(testContract, "DoNothing");

      //revoke
      await roles
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_KEY], [false]);

      // expect it to fail, after revoking
      await expect(
        roles
          .connect(invoker)
          .execTransactionFromModule(
            await testContract.getAddress(),
            0,
            testContract.interface.encodeFunctionData("doNothing"),
            0,
          ),
      ).to.be.revertedWithCustomError(roles, "NoMembership");
    });
    it("it enables the module if necessary", async () => {
      const { roles, owner, alice } = await loadFixture(setup);

      await roles
        .connect(owner)
        .assignRoles(alice.address, [ROLE_KEY1], [true]);

      await expect(await roles.isModuleEnabled(alice.address)).to.equal(true);

      await expect(
        roles
          .connect(owner)
          .assignRoles(alice.address, [ROLE_KEY1, ROLE_KEY2], [true, true]),
      ).to.not.be.reverted;
    });
    it("emits the AssignRoles event", async () => {
      const { owner, alice, roles } = await loadFixture(setup);

      await expect(
        roles.connect(owner).assignRoles(alice.address, [ROLE_KEY1], [true]),
      )
        .to.emit(roles, "AssignRoles")
        .withArgs(alice.address, [ROLE_KEY1], [true]);
    });
  });

  describe("setDefaultRole()", () => {
    it("reverts if not authorized", async () => {
      const { roles, alice, bob } = await loadFixture(setup);
      await expect(
        roles.connect(alice).setDefaultRole(bob.address, ROLE_KEY1),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("sets default role", async () => {
      const { roles, testContract, owner, invoker } = await loadFixture(setup);

      // grant roles 1 and 2 to invoker
      await roles
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_KEY1, ROLE_KEY2], [true, true]);

      // make ROLE2 the default for invoker
      await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY2);

      // allow all calls to testContract from ROLE1
      await roles
        .connect(owner)
        .allowTarget(
          ROLE_KEY1,
          await testContract.getAddress(),
          ExecutionOptions.None,
        );

      // expect it to fail
      await expect(
        roles
          .connect(invoker)
          .execTransactionFromModule(
            await testContract.getAddress(),
            0,
            testContract.interface.encodeFunctionData("doNothing"),
            0,
          ),
      ).to.be.reverted;

      // make ROLE1 the default to invoker
      await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY1);
      await expect(
        roles
          .connect(invoker)
          .execTransactionFromModule(
            await testContract.getAddress(),
            0,
            testContract.interface.encodeFunctionData("doNothing"),
            0,
          ),
      ).to.emit(testContract, "DoNothing");
    });
    it("emits event with correct params", async () => {
      const { roles, owner, invoker } = await loadFixture(setup);

      await expect(
        roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY2),
      )
        .to.emit(roles, "SetDefaultRole")
        .withArgs(invoker.address, ROLE_KEY2);
    });
  });

  describe("execTransactionFromModule()", () => {
    async function setup_() {
      const { roles, testContract, allowanceKey, owner, invoker } =
        await setupWitSpendAndRevert();
      async function invoke(toSpend: number, success: boolean) {
        const executionRevert = !success;

        return roles
          .connect(invoker)
          .execTransactionFromModule(
            await testContract.getAddress(),
            0,
            (
              await testContract.spendAndMaybeRevert.populateTransaction(
                toSpend,
                executionRevert,
              )
            ).data as string,
            0,
          );
      }

      return { roles, invoke, allowanceKey, owner, invoker };
    }
    it("invoker not enabled as a module is not authorized", async () => {
      const { roles, invoke, owner, invoker } = await loadFixture(setup_);

      await roles.connect(owner).disableModule(AddressOne, invoker.address);

      await expect(invoke(0, true)).to.revertedWithCustomError(
        roles,
        "NotAuthorized",
      );
    });
    it("success=true, flushes consumptions to storage", async () => {
      const { roles, invoke, allowanceKey } = await loadFixture(setup_);

      const success = true;

      let result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(1000);

      await expect(invoke(500, success)).to.not.be.reverted;

      result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(500);
    });
    it("success=false, does not flush consumptions to storage", async () => {
      const { roles, invoke, allowanceKey } = await loadFixture(setup_);

      const success = false;

      let result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(1000);

      await expect(invoke(500, success)).to.not.be.reverted;

      result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(1000);
    });
  });

  describe("execTransactionFromModuleReturnData()", () => {
    async function setup_() {
      const { roles, testContract, allowanceKey, owner, invoker } =
        await setupWitSpendAndRevert();
      async function invoke(toSpend: number, success: boolean) {
        const executionRevert = !success;
        return roles
          .connect(invoker)
          .execTransactionFromModuleReturnData(
            await testContract.getAddress(),
            0,
            (
              await testContract.spendAndMaybeRevert.populateTransaction(
                toSpend,
                executionRevert,
              )
            ).data as string,
            0,
          );
      }

      return { roles, invoke, allowanceKey, owner, invoker };
    }
    it("invoker not enabled as a module is not authorized", async () => {
      const { roles, invoke, owner, invoker } = await loadFixture(setup_);

      await roles.connect(owner).disableModule(AddressOne, invoker.address);

      await expect(invoke(0, true)).to.revertedWithCustomError(
        roles,
        "NotAuthorized",
      );
    });
    it("success=true, flushes consumptions to storage", async () => {
      const { roles, invoke, allowanceKey } = await loadFixture(setup_);

      const success = true;

      let result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(1000);

      await expect(invoke(500, success)).to.not.be.reverted;

      result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(500);
    });
    it("success=false, does not flush consumptions to storage", async () => {
      const { roles, invoke, allowanceKey } = await loadFixture(setup_);

      const success = false;

      let result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(1000);

      await expect(invoke(500, success)).to.not.be.reverted;

      result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(1000);
    });
  });

  describe("execTransactionWithRole()", () => {
    async function setup_() {
      const { roles, testContract, roleKey, allowanceKey, owner, invoker } =
        await setupWitSpendAndRevert();

      async function invoke(
        toSpend: number,
        success: boolean,
        shouldModifierRevert: boolean,
      ) {
        const executionRevert = !success;
        return roles
          .connect(invoker)
          .execTransactionWithRole(
            await testContract.getAddress(),
            0,
            (
              await testContract.spendAndMaybeRevert.populateTransaction(
                toSpend,
                executionRevert,
              )
            ).data as string,
            0,
            roleKey,
            shouldModifierRevert,
          );
      }

      return { roles, invoke, allowanceKey, owner, invoker };
    }
    it("invoker not enabled as a module is not authorized", async () => {
      const { roles, invoke, owner, invoker } = await loadFixture(setup_);

      await roles.connect(owner).disableModule(AddressOne, invoker.address);

      await expect(invoke(0, true, true)).to.revertedWithCustomError(
        roles,
        "NotAuthorized",
      );
    });
    it("success=true shouldRevert=true, flush YES revert NO", async () => {
      const { roles, invoke, allowanceKey } = await loadFixture(setup_);

      const success = true;
      const shouldRevert = true;

      let result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(1000);

      await expect(invoke(500, success, shouldRevert)).to.not.be.reverted;

      result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(500);
    });
    it("success=true shouldRevert=false, flush YES revert NO", async () => {
      const { roles, invoke, allowanceKey } = await loadFixture(setup_);

      const success = true;
      const shouldRevert = false;

      let result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(1000);

      await expect(invoke(500, success, shouldRevert)).to.not.be.reverted;

      result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(500);
    });
    it("success=false shouldRevert=true, flush NO revert YES", async () => {
      const { roles, invoke, allowanceKey } = await loadFixture(setup_);

      const success = false;
      const shouldRevert = true;

      let result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(1000);

      await expect(invoke(500, success, shouldRevert)).to.be.reverted;

      result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(1000);
    });
    it("success=false shouldRevert=false, flush NO revert NO", async () => {
      const { roles, invoke, allowanceKey } = await loadFixture(setup_);

      const success = false;
      const shouldRevert = false;

      let result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(1000);

      await expect(invoke(500, success, shouldRevert)).to.not.be.reverted;

      result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(1000);
    });
  });

  describe("execTransactionWithRoleReturnData()", () => {
    async function setup_() {
      const { roles, testContract, roleKey, allowanceKey, owner, invoker } =
        await setupWitSpendAndRevert();

      async function invoke(
        toSpend: number,
        success: boolean,
        shouldModifierRevert: boolean,
      ) {
        const executionRevert = !success;
        return roles
          .connect(invoker)
          .execTransactionWithRoleReturnData(
            await testContract.getAddress(),
            0,
            (
              await testContract.spendAndMaybeRevert.populateTransaction(
                toSpend,
                executionRevert,
              )
            ).data as string,
            0,
            roleKey,
            shouldModifierRevert,
          );
      }

      return { roles, invoke, allowanceKey, owner, invoker };
    }
    it("invoker not enabled as a module is not authorized", async () => {
      const { roles, invoke, owner, invoker } = await loadFixture(setup_);

      await roles.connect(owner).disableModule(AddressOne, invoker.address);

      await expect(invoke(0, true, true)).to.revertedWithCustomError(
        roles,
        "NotAuthorized",
      );
    });
    it("success=true shouldRevert=true, flush YES revert NO", async () => {
      const { roles, invoke, allowanceKey } = await loadFixture(setup_);

      const success = true;
      const shouldRevert = true;

      let result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(1000);

      await expect(invoke(500, success, shouldRevert)).to.not.be.reverted;

      result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(500);
    });
    it("success=true shouldRevert=false, flush YES revert NO", async () => {
      const { roles, invoke, allowanceKey } = await loadFixture(setup_);

      const success = true;
      const shouldRevert = false;

      let result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(1000);

      await expect(invoke(500, success, shouldRevert)).to.not.be.reverted;

      result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(500);
    });
    it("success=false shouldRevert=true, flush NO revert YES", async () => {
      const { roles, invoke, allowanceKey } = await loadFixture(setup_);

      const success = false;
      const shouldRevert = true;

      let result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(1000);

      await expect(invoke(500, success, shouldRevert)).to.be.reverted;

      result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(1000);
    });
    it("success=false shouldRevert=false, flush NO revert NO", async () => {
      const { roles, invoke, allowanceKey } = await loadFixture(setup_);

      const success = false;
      const shouldRevert = false;

      let result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(1000);

      await expect(invoke(500, success, shouldRevert)).to.not.be.reverted;

      result = await roles.allowances(allowanceKey);
      expect(result.balance).to.equal(1000);
    });
  });

  describe("Misc", async () => {
    it("reuses a permission blob from storage", async () => {
      const { roles, testContract, owner, invoker } = await loadFixture(setup);

      const TestContract = await hre.ethers.getContractFactory("TestContract");
      const testContract2 = await TestContract.deploy();

      await roles
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_KEY1], [true]);
      await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY1);
      await roles
        .connect(owner)
        .scopeTarget(ROLE_KEY1, await testContract.getAddress());
      await roles
        .connect(owner)
        .scopeTarget(ROLE_KEY1, await testContract2.getAddress());

      const SELECTOR =
        testContract.interface.getFunction("fnWithSingleParam").selector;

      await roles.connect(owner).scopeFunction(
        ROLE_KEY1,
        await testContract.getAddress(),
        SELECTOR,
        [
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["uint256"], [11]),
          },
        ],
        ExecutionOptions.None,
      );

      await roles.connect(owner).scopeFunction(
        ROLE_KEY1,
        await testContract2.getAddress(),
        SELECTOR,
        [
          {
            parent: 0,
            paramType: AbiType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: AbiType.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["uint256"], [11]),
          },
        ],
        ExecutionOptions.None,
      );

      const invoke = async (targetAddress: string, a: number) =>
        roles
          .connect(invoker)
          .execTransactionFromModule(
            targetAddress,
            0,
            (await testContract.fnWithSingleParam.populateTransaction(a))
              .data as string,
            0,
          );

      await expect(invoke(await testContract.getAddress(), 11)).to.not.be
        .reverted;
      await expect(invoke(await testContract2.getAddress(), 11)).to.not.be
        .reverted;
      await expect(invoke(await testContract.getAddress(), 0)).to.be.reverted;
      await expect(invoke(await testContract2.getAddress(), 0)).to.be.reverted;
    });

    it("a permission with fields insided a nested Calldata", async () => {
      const { roles, testContract, owner, invoker } = await loadFixture(setup);

      await roles
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_KEY1], [true]);
      await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY1);
      await roles
        .connect(owner)
        .scopeTarget(ROLE_KEY1, await testContract.getAddress());

      await roles.connect(owner).scopeFunction(
        ROLE_KEY1,
        await testContract.getAddress(),
        testContract.interface.getFunction("dynamic").selector,
        flattenCondition({
          paramType: AbiType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
          children: [
            {
              paramType: AbiType.Calldata,
              operator: Operator.Matches,
              compValue: "0x",
              children: [
                {
                  paramType: AbiType.Tuple,
                  operator: Operator.Matches,
                  compValue: "0x",
                  children: [
                    {
                      paramType: AbiType.Static,
                      operator: Operator.EqualTo,
                      compValue: defaultAbiCoder.encode(["uint256"], [123456]),
                    },
                    {
                      paramType: AbiType.Dynamic,
                      operator: Operator.EqualTo,
                      compValue: defaultAbiCoder.encode(
                        ["bytes"],
                        ["0xaabbccdd4500d1"],
                      ),
                    },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.None,
      );

      const invoke = async (a: number, b: BytesLike) => {
        const inner = (
          await testContract.oneParamDynamicTuple.populateTransaction({
            a,
            b,
          })
        ).data as string;
        return roles
          .connect(invoker)
          .execTransactionFromModule(
            await testContract.getAddress(),
            0,
            (await testContract.dynamic.populateTransaction(inner))
              .data as string,
            0,
          );
      };

      await expect(invoke(123457, "0xaabbccdd4500d1"))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);

      await expect(invoke(123456, "0xaabb"))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);

      await expect(invoke(123456, "0xaabbccdd4500d1")).to.not.be.reverted;

      await roles.connect(owner).scopeFunction(
        ROLE_KEY1,
        await testContract.getAddress(),
        testContract.interface.getFunction("dynamic").selector,
        flattenCondition({
          paramType: AbiType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
          children: [
            {
              paramType: AbiType.Tuple,
              operator: Operator.EqualTo,
              compValue:
                "0x0000000000000000000000000000000000000000000000000000000000000011",
              children: [
                {
                  paramType: AbiType.Calldata,
                  operator: Operator.Pass,
                  compValue: "0x",
                  children: [
                    {
                      paramType: AbiType.Static,
                      operator: Operator.Pass,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.None,
      );
    });

    it("covering a test branch", async () => {
      const { roles, testContract, owner } = await loadFixture(setup);

      await roles.connect(owner).scopeFunction(
        ROLE_KEY1,
        await testContract.getAddress(),
        testContract.interface.getFunction("dynamic").selector,
        flattenCondition({
          paramType: AbiType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
          children: [
            {
              paramType: AbiType.Tuple,
              operator: Operator.EqualTo,
              compValue:
                "0x0000000000000000000000000000000000000000000000000000000000000011",
              children: [
                {
                  paramType: AbiType.Calldata,
                  operator: Operator.Pass,
                  compValue: "0x",
                  children: [
                    {
                      paramType: AbiType.Static,
                      operator: Operator.Pass,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.None,
      );
    });
  });
});
