import hre from "hardhat";

import { deployRolesMod, ExecutionOptions } from "../utils";

import { ConditionFlatStruct } from "../../typechain-types/contracts/Integrity";
import { TestContract } from "../../typechain-types/contracts/test/";

export async function setupOneParamStatic() {
  const ROLE_KEY =
    "0x0000000000000000000000000000000000000000000000000000000000000001";

  const [owner, invoker] = await hre.ethers.getSigners();

  const Avatar = await hre.ethers.getContractFactory("TestAvatar");
  const avatar = await Avatar.deploy();

  const TestContract = await hre.ethers.getContractFactory("TestContract");
  const testContract = await TestContract.deploy();

  const roles = await deployRolesMod(
    hre,
    owner.address,
    avatar.address,
    avatar.address
  );
  await roles.enableModule(invoker.address);

  await roles.connect(owner).assignRoles(invoker.address, [ROLE_KEY], [true]);
  await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

  const SELECTOR = testContract.interface.getSighash(
    testContract.interface.getFunction("oneParamStatic")
  );

  async function invoke(a: number) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (await testContract.populateTransaction.oneParamStatic(a))
          .data as string,
        0
      );
  }

  await roles.connect(owner).scopeTarget(ROLE_KEY, testContract.address);

  async function scopeFunction(conditions: ConditionFlatStruct[]) {
    await roles
      .connect(owner)
      .scopeFunction(
        ROLE_KEY,
        testContract.address,
        SELECTOR,
        conditions,
        ExecutionOptions.None
      );
  }

  return {
    roles,
    scopeFunction,
    invoke,
  };
}

export async function setupTwoParamsStatic() {
  const ROLE_KEY =
    "0x0000000000000000000000000000000000000000000000000000000000000001";

  const [owner, invoker] = await hre.ethers.getSigners();

  const Avatar = await hre.ethers.getContractFactory("TestAvatar");
  const avatar = await Avatar.deploy();

  const TestContract = await hre.ethers.getContractFactory("TestContract");
  const testContract = await TestContract.deploy();

  const roles = await deployRolesMod(
    hre,
    owner.address,
    avatar.address,
    avatar.address
  );
  await roles.enableModule(invoker.address);

  await roles.connect(owner).assignRoles(invoker.address, [ROLE_KEY], [true]);
  await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

  const SELECTOR = testContract.interface.getSighash(
    testContract.interface.getFunction("twoParamsStatic")
  );

  async function invoke(a: number, b: number) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (await testContract.populateTransaction.twoParamsStatic(a, b))
          .data as string,
        0
      );
  }

  await roles.connect(owner).scopeTarget(ROLE_KEY, testContract.address);

  async function scopeFunction(conditions: ConditionFlatStruct[]) {
    await roles
      .connect(owner)
      .scopeFunction(
        ROLE_KEY,
        testContract.address,
        SELECTOR,
        conditions,
        ExecutionOptions.None
      );
  }

  return {
    roles,
    scopeFunction,
    invoke,
  };
}

export async function setupOneParamStaticTuple() {
  const ROLE_KEY =
    "0x0000000000000000000000000000000000000000000000000000000000000001";

  const [owner, invoker] = await hre.ethers.getSigners();

  const Avatar = await hre.ethers.getContractFactory("TestAvatar");
  const avatar = await Avatar.deploy();

  const TestContract = await hre.ethers.getContractFactory("TestContract");
  const testContract = await TestContract.deploy();

  const roles = await deployRolesMod(
    hre,
    owner.address,
    avatar.address,
    avatar.address
  );
  await roles.enableModule(invoker.address);

  await roles.connect(owner).assignRoles(invoker.address, [ROLE_KEY], [true]);
  await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

  const SELECTOR = testContract.interface.getSighash(
    testContract.interface.getFunction("oneParamStaticTuple")
  );

  async function invoke(a: TestContract.StaticTupleStruct) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (await testContract.populateTransaction.oneParamStaticTuple(a))
          .data as string,
        0
      );
  }

  await roles.connect(owner).scopeTarget(ROLE_KEY, testContract.address);

  async function scopeFunction(conditions: ConditionFlatStruct[]) {
    await roles
      .connect(owner)
      .scopeFunction(
        ROLE_KEY,
        testContract.address,
        SELECTOR,
        conditions,
        ExecutionOptions.None
      );
  }

  return {
    roles,
    scopeFunction,
    invoke,
  };
}

export async function setupOneParamArrayOfStatic() {
  const ROLE_KEY =
    "0x0000000000000000000000000000000000000000000000000000000000000001";

  const [owner, invoker] = await hre.ethers.getSigners();

  const Avatar = await hre.ethers.getContractFactory("TestAvatar");
  const avatar = await Avatar.deploy();

  const TestContract = await hre.ethers.getContractFactory("TestContract");
  const testContract = await TestContract.deploy();

  const roles = await deployRolesMod(
    hre,
    owner.address,
    avatar.address,
    avatar.address
  );
  await roles.enableModule(invoker.address);

  await roles.connect(owner).assignRoles(invoker.address, [ROLE_KEY], [true]);
  await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

  const SELECTOR = testContract.interface.getSighash(
    testContract.interface.getFunction("oneParamArrayOfStatic")
  );

  async function invoke(a: number[]) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (await testContract.populateTransaction.oneParamArrayOfStatic(a))
          .data as string,
        0
      );
  }

  await roles.connect(owner).scopeTarget(ROLE_KEY, testContract.address);

  async function scopeFunction(conditions: ConditionFlatStruct[]) {
    await roles
      .connect(owner)
      .scopeFunction(
        ROLE_KEY,
        testContract.address,
        SELECTOR,
        conditions,
        ExecutionOptions.None
      );
  }

  return {
    roles,
    scopeFunction,
    invoke,
  };
}
export async function setupOneParamArrayOfStaticTuple() {
  const ROLE_KEY =
    "0x0000000000000000000000000000000000000000000000000000000000000001";

  const [owner, invoker] = await hre.ethers.getSigners();

  const Avatar = await hre.ethers.getContractFactory("TestAvatar");
  const avatar = await Avatar.deploy();

  const TestContract = await hre.ethers.getContractFactory("TestContract");
  const testContract = await TestContract.deploy();

  const roles = await deployRolesMod(
    hre,
    owner.address,
    avatar.address,
    avatar.address
  );
  await roles.enableModule(invoker.address);

  await roles.connect(owner).assignRoles(invoker.address, [ROLE_KEY], [true]);
  await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

  const SELECTOR = testContract.interface.getSighash(
    testContract.interface.getFunction("oneParamArrayOfStaticTuple")
  );

  async function invoke(a: TestContract.StaticTupleStruct[]) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (await testContract.populateTransaction.oneParamArrayOfStaticTuple(a))
          .data as string,
        0
      );
  }

  await roles.connect(owner).scopeTarget(ROLE_KEY, testContract.address);

  async function scopeFunction(conditions: ConditionFlatStruct[]) {
    await roles
      .connect(owner)
      .scopeFunction(
        ROLE_KEY,
        testContract.address,
        SELECTOR,
        conditions,
        ExecutionOptions.None
      );
  }

  return {
    roles,
    scopeFunction,
    invoke,
  };
}
