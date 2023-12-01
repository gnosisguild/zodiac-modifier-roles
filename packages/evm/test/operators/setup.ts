import hre from "hardhat";
import { BigNumberish } from "ethers";

import { deployRolesMod, ExecutionOptions } from "../utils";

import { ConditionFlatStruct } from "../../typechain-types/contracts/Integrity";
import { TestContract } from "../../typechain-types/contracts/test/";

export async function baseSetup(
  functioName:
    | "fnThatMaybeReverts"
    | "oneParamStatic"
    | "twoParamsStatic"
    | "oneParamStaticTuple"
    | "oneParamStaticNestedTuple"
    | "twoParamsStaticTupleStatic"
    | "oneParamDynamicTuple"
    | "oneParamDynamicNestedTuple"
    | "oneParamArrayOfStatic"
    | "oneParamArrayOfStaticTuple"
    | "oneParamArrayOfDynamicTuple"
    | "oneParamUintWord"
    | "oneParamUintSmall"
    | "oneParamIntWord"
    | "oneParamIntSmall"
    | "oneParamBytesWord"
    | "oneParamBytesSmall"
    | "oneParamBytes"
    | "oneParamString"
    | "oneParamAddress"
    | "receiveEthAndDoNothing"
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

  async function scopeFunction(
    conditions: ConditionFlatStruct[],
    options: ExecutionOptions = ExecutionOptions.None
  ) {
    await roles
      .connect(owner)
      .scopeFunction(
        ROLE_KEY,
        testContract.address,
        SELECTOR,
        conditions,
        options
      );
  }

  return {
    owner,
    invoker,
    avatar,
    roles,
    testContract,
    scopeFunction,
  };
}

export async function setupFnThatMaybeReturns() {
  const { owner, invoker, roles, testContract, scopeFunction } =
    await baseSetup("fnThatMaybeReverts");

  async function invoke(a: BigNumberish, b: boolean) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (await testContract.populateTransaction.fnThatMaybeReverts(a, b))
          .data as string,
        0
      );
  }

  return {
    owner,
    roles,
    scopeFunction,
    invoke,
  };
}

export async function setupOneParamStatic() {
  const { owner, invoker, roles, testContract, scopeFunction } =
    await baseSetup("oneParamStatic");

  async function invoke(a: BigNumberish, operation: 0 | 1 = 0) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (await testContract.populateTransaction.oneParamStatic(a))
          .data as string,
        operation
      );
  }

  return {
    owner,
    roles,
    scopeFunction,
    invoke,
  };
}
export async function setupTwoParamsStatic() {
  const { owner, invoker, roles, testContract, scopeFunction } =
    await baseSetup("twoParamsStatic");

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
    owner,
    roles,
    scopeFunction,
    invoke,
  };
}
export async function setupOneParamStaticTuple() {
  const { invoker, roles, testContract, scopeFunction, owner } =
    await baseSetup("oneParamStaticTuple");

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
    owner,
  };
}
export async function setupOneParamStaticNestedTuple() {
  const { invoker, roles, testContract, scopeFunction } = await baseSetup(
    "oneParamStaticNestedTuple"
  );

  async function invoke(a: TestContract.StaticNestedTupleStruct) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (await testContract.populateTransaction.oneParamStaticNestedTuple(a))
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
export async function setupTwoParamsStaticTupleStatic() {
  const { invoker, roles, testContract, scopeFunction } = await baseSetup(
    "twoParamsStaticTupleStatic"
  );

  async function invoke(a: TestContract.StaticTupleStruct, b: number) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (
          await testContract.populateTransaction.twoParamsStaticTupleStatic(
            a,
            b
          )
        ).data as string,
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
export async function setupOneParamDynamicNestedTuple() {
  const { invoker, roles, testContract, scopeFunction } = await baseSetup(
    "oneParamDynamicNestedTuple"
  );

  async function invoke(a: TestContract.DynamicNestedTupleStruct) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (await testContract.populateTransaction.oneParamDynamicNestedTuple(a))
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
  const { invoker, roles, testContract, scopeFunction, owner } =
    await baseSetup("oneParamArrayOfStatic");

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
    owner,
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
export async function setupOneParamArrayOfDynamicTuple() {
  const { invoker, roles, testContract, scopeFunction, owner } =
    await baseSetup("oneParamArrayOfDynamicTuple");

  async function invoke(a: TestContract.DynamicTupleStruct[]) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (await testContract.populateTransaction.oneParamArrayOfDynamicTuple(a))
          .data as string,
        0
      );
  }

  return {
    roles,
    scopeFunction,
    invoke,
    owner,
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
export async function setupOneParamAddress() {
  const { invoker, roles, testContract, scopeFunction } = await baseSetup(
    "oneParamAddress"
  );

  async function invoke(a: string) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (await testContract.populateTransaction.oneParamAddress(a))
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
