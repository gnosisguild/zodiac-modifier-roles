import hre from "hardhat";

import { deployRolesMod, ExecutionOptions } from "../utils";

import { ConditionFlatStruct } from "../../typechain-types/contracts/Integrity";
import { TestContract } from "../../typechain-types/contracts/test/";

async function baseSetup(
  functioName:
    | "oneParamStatic"
    | "twoParamsStatic"
    | "oneParamStaticTuple"
    | "oneParamDynamicTuple"
    | "oneParamArrayOfStatic"
    | "oneParamArrayOfStaticTuple"
    | "oneParamUintWord"
    | "oneParamUintSmall"
    | "oneParamIntWord"
    | "oneParamIntSmall"
    | "oneParamBytesWord"
    | "oneParamBytesSmall"
    | "oneParamBytes"
    | "oneParamString"
) {
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
    testContract.interface.getFunction(functioName)
  );

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
    invoker,
    roles,
    testContract,
    scopeFunction,
  };
}

export async function setupOneParamStatic() {
  const { invoker, roles, testContract, scopeFunction } = await baseSetup(
    "oneParamStatic"
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

  return {
    roles,
    scopeFunction,
    invoke,
  };
}
export async function setupTwoParamsStatic() {
  const { invoker, roles, testContract, scopeFunction } = await baseSetup(
    "twoParamsStatic"
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

  return {
    roles,
    scopeFunction,
    invoke,
  };
}
export async function setupOneParamStaticTuple() {
  const { invoker, roles, testContract, scopeFunction } = await baseSetup(
    "oneParamStaticTuple"
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

  return {
    roles,
    scopeFunction,
    invoke,
  };
}
export async function setupOneParamDynamicTuple() {
  const { invoker, roles, testContract, scopeFunction } = await baseSetup(
    "oneParamDynamicTuple"
  );

  async function invoke(a: TestContract.DynamicTupleStruct) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (await testContract.populateTransaction.oneParamDynamicTuple(a))
          .data as string,
        0
      );
  }

  return {
    roles,
    scopeFunction,
    invoke,
  };
}
export async function setupOneParamArrayOfStatic() {
  const { invoker, roles, testContract, scopeFunction } = await baseSetup(
    "oneParamArrayOfStatic"
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

  return {
    roles,
    scopeFunction,
    invoke,
  };
}
export async function setupOneParamArrayOfStaticTuple() {
  const { invoker, roles, testContract, scopeFunction } = await baseSetup(
    "oneParamArrayOfStaticTuple"
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

  return {
    roles,
    scopeFunction,
    invoke,
  };
}
export async function setupOneParamUintWord() {
  const { invoker, roles, testContract, scopeFunction } = await baseSetup(
    "oneParamUintWord"
  );

  async function invoke(a: number) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (await testContract.populateTransaction.oneParamUintWord(a))
          .data as string,
        0
      );
  }

  return {
    roles,
    scopeFunction,
    invoke,
  };
}
export async function setupOneParamUintSmall() {
  const { invoker, roles, testContract, scopeFunction } = await baseSetup(
    "oneParamUintSmall"
  );

  async function invoke(a: number) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (await testContract.populateTransaction.oneParamUintSmall(a))
          .data as string,
        0
      );
  }

  return {
    roles,
    scopeFunction,
    invoke,
  };
}
export async function setupOneParamIntWord() {
  const { invoker, roles, testContract, scopeFunction } = await baseSetup(
    "oneParamIntWord"
  );

  async function invoke(a: number) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (await testContract.populateTransaction.oneParamIntWord(a))
          .data as string,
        0
      );
  }

  return {
    roles,
    scopeFunction,
    invoke,
  };
}
export async function setupOneParamIntSmall() {
  const { invoker, roles, testContract, scopeFunction } = await baseSetup(
    "oneParamIntSmall"
  );

  async function invoke(a: number) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (await testContract.populateTransaction.oneParamIntSmall(a))
          .data as string,
        0
      );
  }

  return {
    roles,
    scopeFunction,
    invoke,
  };
}
export async function setupOneParamBytesWord() {
  const { invoker, roles, testContract, scopeFunction } = await baseSetup(
    "oneParamBytesWord"
  );

  async function invoke(a: string) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (await testContract.populateTransaction.oneParamBytesWord(a))
          .data as string,
        0
      );
  }

  return {
    roles,
    scopeFunction,
    invoke,
  };
}
export async function setupOneParamBytesSmall() {
  const { invoker, roles, testContract, scopeFunction } = await baseSetup(
    "oneParamBytesSmall"
  );

  async function invoke(a: string) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (await testContract.populateTransaction.oneParamBytesSmall(a))
          .data as string,
        0
      );
  }

  return {
    roles,
    scopeFunction,
    invoke,
  };
}
export async function setupOneParamBytes() {
  const { invoker, roles, testContract, scopeFunction } = await baseSetup(
    "oneParamBytes"
  );

  async function invoke(a: string) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (await testContract.populateTransaction.oneParamBytes(a))
          .data as string,
        0
      );
  }

  return {
    roles,
    scopeFunction,
    invoke,
  };
}
export async function setupOneParamString() {
  const { invoker, roles, testContract, scopeFunction } = await baseSetup(
    "oneParamString"
  );

  async function invoke(a: string) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (await testContract.populateTransaction.oneParamString(a))
          .data as string,
        0
      );
  }

  return {
    roles,
    scopeFunction,
    invoke,
  };
}
