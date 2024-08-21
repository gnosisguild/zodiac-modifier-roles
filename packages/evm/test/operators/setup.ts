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
  const avatarAddress = await avatar.getAddress();
  const roles = await deployRolesMod(
    hre,
    owner.address,
    avatarAddress,
    avatarAddress
  );
  await roles.enableModule(invoker.address);

  await roles.connect(owner).assignRoles(invoker.address, [ROLE_KEY], [true]);
  await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);
  const SELECTOR = testContract.interface.getFunction(functioName).selector;
  const testContractAddress = await testContract.getAddress();

  await roles.connect(owner).scopeTarget(ROLE_KEY, testContractAddress);

  async function scopeFunction(
    conditions: ConditionFlatStruct[],
    options: ExecutionOptions = ExecutionOptions.None
  ) {
    await roles
      .connect(owner)
      .scopeFunction(
        ROLE_KEY,
        testContractAddress,
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
  const testContractAddress = await testContract.getAddress();
  async function invoke(a: BigNumberish, b: boolean) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContractAddress,
        0,
        (await testContract.fnThatMaybeReverts.populateTransaction(a, b))
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
  const testContractAddress = await testContract.getAddress();

  async function invoke(a: BigNumberish, operation: 0 | 1 = 0) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContractAddress,
        0,
        (await testContract.oneParamStatic.populateTransaction(a))
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
  const testContractAddress = await testContract.getAddress();

  async function invoke(a: number, b: number) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContractAddress,
        0,
        (await testContract.twoParamsStatic.populateTransaction(a, b))
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
  const testContractAddress = await testContract.getAddress();
  async function invoke(a: TestContract.StaticTupleStruct) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContractAddress,
        0,
        (await testContract.oneParamStaticTuple.populateTransaction(a))
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
  const testContractAddress = await testContract.getAddress();
  async function invoke(a: TestContract.StaticNestedTupleStruct) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContractAddress,
        0,
        (await testContract.oneParamStaticNestedTuple.populateTransaction(a))
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
  const testContractAddress = await testContract.getAddress();
  async function invoke(a: TestContract.StaticTupleStruct, b: number) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContractAddress,
        0,
        (
          await testContract.twoParamsStaticTupleStatic.populateTransaction(
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
  const testContractAddress = await testContract.getAddress();
  async function invoke(a: TestContract.DynamicTupleStruct) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContractAddress,
        0,
        (await testContract.oneParamDynamicTuple.populateTransaction(a))
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
  const testContractAddress = await testContract.getAddress();
  async function invoke(a: TestContract.DynamicNestedTupleStruct) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContractAddress,
        0,
        (await testContract.oneParamDynamicNestedTuple.populateTransaction(a))
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
  const testContractAddress = await testContract.getAddress();
  async function invoke(a: number[]) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContractAddress,
        0,
        (await testContract.oneParamArrayOfStatic.populateTransaction(a))
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
  const testContractAddress = await testContract.getAddress();
  async function invoke(a: TestContract.StaticTupleStruct[]) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContractAddress,
        0,
        (await testContract.oneParamArrayOfStaticTuple.populateTransaction(a))
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
  const testContractAddress = await testContract.getAddress();
  async function invoke(a: TestContract.DynamicTupleStruct[]) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContractAddress,
        0,
        (await testContract.oneParamArrayOfDynamicTuple.populateTransaction(a))
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
  const testContractAddress = await testContract.getAddress();
  async function invoke(a: number) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContractAddress,
        0,
        (await testContract.oneParamUintWord.populateTransaction(a))
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
  const testContractAddress = await testContract.getAddress();
  async function invoke(a: number) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContractAddress,
        0,
        (await testContract.oneParamUintSmall.populateTransaction(a))
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
  const testContractAddress = await testContract.getAddress();
  async function invoke(a: number) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContractAddress,
        0,
        (await testContract.oneParamIntWord.populateTransaction(a))
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
  const testContractAddress = await testContract.getAddress();
  async function invoke(a: number) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContractAddress,
        0,
        (await testContract.oneParamIntSmall.populateTransaction(a))
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
  const testContractAddress = await testContract.getAddress();
  async function invoke(a: string) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContractAddress,
        0,
        (await testContract.oneParamBytesWord.populateTransaction(a))
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
  const testContractAddress = await testContract.getAddress();
  async function invoke(a: string) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContractAddress,
        0,
        (await testContract.oneParamBytesSmall.populateTransaction(a))
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
  const testContractAddress = await testContract.getAddress();
  async function invoke(a: string) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContractAddress,
        0,
        (await testContract.oneParamBytes.populateTransaction(a))
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
  const testContractAddress = await testContract.getAddress();
  async function invoke(a: string) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContractAddress,
        0,
        (await testContract.oneParamString.populateTransaction(a))
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
  const testContractAddress = await testContract.getAddress();
  async function invoke(a: string) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContractAddress,
        0,
        (await testContract.oneParamAddress.populateTransaction(a))
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
