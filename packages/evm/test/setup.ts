import { BigNumberish, ZeroHash } from "ethers";
import hre from "hardhat";
import { EthereumProvider, HardhatRuntimeEnvironment } from "hardhat/types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  deployFactories,
  deployMastercopy,
  EIP1193Provider,
} from "@gnosis-guild/zodiac-core";

import { ExecutionOptions } from "./utils";

import { ConditionFlatStruct } from "../typechain-types/contracts/Integrity";
import { TestContract } from "../typechain-types/contracts/test";

const DEFAULT_ROLE_KEY =
  "0x000000000000000000000000000000000000000000000000000000000aabbcc1";

export function createEip1193(
  provider: EthereumProvider,
  signer: HardhatEthersSigner
): EIP1193Provider {
  return {
    request: async ({ method, params }) => {
      if (method == "eth_sendTransaction") {
        const { hash } = await signer.sendTransaction((params as any[])[0]);
        return hash;
      }

      return provider.request({ method, params });
    },
  };
}

export async function deployRolesMod(
  hre: HardhatRuntimeEnvironment,
  owner: string,
  avatar: string,
  target: string
) {
  const [signer] = await hre.ethers.getSigners();
  const provider = createEip1193(hre.network.provider, signer);

  await deployFactories({ provider });
  const integrity = await hre.artifacts.readArtifact("Integrity");
  const { address: integrityAddress } = await deployMastercopy({
    bytecode: integrity.bytecode,
    constructorArgs: { types: [], values: [] },
    salt: ZeroHash,
    provider,
  });
  const packer = await hre.artifacts.readArtifact("Packer");
  const { address: packerAddress } = await deployMastercopy({
    bytecode: packer.bytecode,
    constructorArgs: { types: [], values: [] },
    salt: ZeroHash,
    provider,
  });

  const Modifier = await hre.ethers.getContractFactory("Roles", {
    libraries: {
      Integrity: integrityAddress,
      Packer: packerAddress,
    },
  });
  const modifier = await Modifier.deploy(owner, avatar, target);
  await modifier.waitForDeployment();
  return modifier;
}

export async function setupAvatarAndRoles(roleKey = DEFAULT_ROLE_KEY) {
  const [owner, member, relayer] = await hre.ethers.getSigners();

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
  await roles.connect(owner).enableModule(member.address);
  await roles.connect(owner).assignRoles(member.address, [roleKey], [true]);
  await roles.connect(owner).setDefaultRole(member.address, roleKey);

  await roles
    .connect(owner)
    .scopeTarget(roleKey, await testContract.getAddress());

  const testContractAddress = await testContract.getAddress();

  const scopeFunction = (
    selector: string,
    conditions: ConditionFlatStruct[],
    options?: ExecutionOptions
  ) =>
    roles
      .connect(owner)
      .scopeFunction(
        roleKey,
        testContractAddress,
        selector,
        conditions,
        options || ExecutionOptions.Both
      );

  const execTransactionFromModule = async ({
    data,
    operation,
  }: {
    data: string;
    operation?: number;
  }) =>
    roles
      .connect(member)
      .execTransactionFromModule(
        await testContract.getAddress(),
        0,
        data,
        operation || 0
      );

  return {
    owner,
    member,
    relayer,
    avatar,
    roles,
    roleKey,
    testContract,
    scopeFunction,
    execTransactionFromModule,
  };
}

export async function setupFnThatMaybeReturns() {
  const {
    owner,
    member,
    roles,
    testContract,
    scopeFunction,
    execTransactionFromModule,
  } = await setupAvatarAndRoles();

  async function invoke(a: BigNumberish, b: boolean) {
    return execTransactionFromModule({
      data: (await testContract.fnThatMaybeReverts.populateTransaction(a, b))
        .data,
    });
  }

  const { selector } = testContract.interface.getFunction("fnThatMaybeReverts");

  return {
    owner,
    roles,
    scopeFunction: (
      conditions: ConditionFlatStruct[],
      options?: ExecutionOptions
    ) => scopeFunction(selector, conditions, options),
    invoke,
  };
}

export async function setupOneParamStatic() {
  const {
    owner,
    member,
    roles,
    testContract,
    scopeFunction,
    execTransactionFromModule,
  } = await setupAvatarAndRoles();

  const { selector } = testContract.interface.getFunction("oneParamStatic");
  return {
    owner,
    member,
    roles,
    scopeFunction: (
      conditions: ConditionFlatStruct[],
      options?: ExecutionOptions
    ) => scopeFunction(selector, conditions, options),
    invoke: async (a: number, operation: 0 | 1 = 0) =>
      execTransactionFromModule({
        data: (await testContract.oneParamStatic.populateTransaction(a)).data,
        operation,
      }),
  };
}

export async function setupTwoParamsStatic() {
  const {
    owner,
    member,
    roles,
    testContract,
    scopeFunction,
    execTransactionFromModule,
  } = await setupAvatarAndRoles();

  async function invoke(a: number, b: number) {
    return execTransactionFromModule({
      data: (await testContract.twoParamsStatic.populateTransaction(a, b)).data,
    });
  }

  const { selector } = testContract.interface.getFunction("twoParamsStatic");

  return {
    owner,
    member,
    roles,
    scopeFunction: (
      conditions: ConditionFlatStruct[],
      options?: ExecutionOptions
    ) => scopeFunction(selector, conditions, options),
    invoke,
  };
}
export async function setupOneParamStaticTuple() {
  const {
    owner,
    member,
    roles,
    testContract,
    scopeFunction,
    execTransactionFromModule,
  } = await setupAvatarAndRoles();

  async function invoke(a: TestContract.StaticTupleStruct) {
    return execTransactionFromModule({
      data: (await testContract.oneParamStaticTuple.populateTransaction(a))
        .data,
    });
  }

  const { selector } = testContract.interface.getFunction(
    "oneParamStaticTuple"
  );

  return {
    roles,
    owner,
    member,
    scopeFunction: (
      conditions: ConditionFlatStruct[],
      options?: ExecutionOptions
    ) => scopeFunction(selector, conditions, options),
    invoke,
  };
}
export async function setupOneParamStaticNestedTuple() {
  const {
    owner,
    member,
    roles,
    testContract,
    scopeFunction,
    execTransactionFromModule,
  } = await setupAvatarAndRoles();

  async function invoke(a: TestContract.StaticNestedTupleStruct) {
    return execTransactionFromModule({
      data: (
        await testContract.oneParamStaticNestedTuple.populateTransaction(a)
      ).data,
    });
  }

  const { selector } = testContract.interface.getFunction(
    "oneParamStaticNestedTuple"
  );

  return {
    roles,
    owner,
    member,
    scopeFunction: (
      conditions: ConditionFlatStruct[],
      options?: ExecutionOptions
    ) => scopeFunction(selector, conditions, options),
    invoke,
  };
}
export async function setupTwoParamsStaticTupleStatic() {
  const {
    owner,
    member,
    roles,
    testContract,
    scopeFunction,
    execTransactionFromModule,
  } = await setupAvatarAndRoles();

  async function invoke(a: TestContract.StaticTupleStruct, b: number) {
    return execTransactionFromModule({
      data: (
        await testContract.twoParamsStaticTupleStatic.populateTransaction(a, b)
      ).data,
    });
  }

  const { selector } = testContract.interface.getFunction(
    "twoParamsStaticTupleStatic"
  );

  return {
    roles,
    owner,
    member,
    scopeFunction: (
      conditions: ConditionFlatStruct[],
      options?: ExecutionOptions
    ) => scopeFunction(selector, conditions, options),
    invoke,
  };
}
export async function setupOneParamDynamicTuple() {
  const {
    owner,
    member,
    roles,
    testContract,
    scopeFunction,
    execTransactionFromModule,
  } = await setupAvatarAndRoles();

  async function invoke(a: TestContract.DynamicTupleStruct) {
    return execTransactionFromModule({
      data: (await testContract.oneParamDynamicTuple.populateTransaction(a))
        .data,
    });
  }

  const { selector } = testContract.interface.getFunction(
    "oneParamDynamicTuple"
  );

  return {
    roles,
    owner,
    member,
    scopeFunction: (
      conditions: ConditionFlatStruct[],
      options?: ExecutionOptions
    ) => scopeFunction(selector, conditions, options),
    invoke,
  };
}
export async function setupOneParamDynamicNestedTuple() {
  const {
    owner,
    member,
    roles,
    testContract,
    scopeFunction,
    execTransactionFromModule,
  } = await setupAvatarAndRoles();

  async function invoke(a: TestContract.DynamicNestedTupleStruct) {
    return execTransactionFromModule({
      data: (
        await testContract.oneParamDynamicNestedTuple.populateTransaction(a)
      ).data,
    });
  }

  const { selector } = testContract.interface.getFunction(
    "oneParamDynamicNestedTuple"
  );

  return {
    roles,
    owner,
    member,
    scopeFunction: (
      conditions: ConditionFlatStruct[],
      options?: ExecutionOptions
    ) => scopeFunction(selector, conditions, options),
    invoke,
  };
}
export async function setupOneParamArrayOfStatic() {
  const {
    owner,
    member,
    roles,
    testContract,
    scopeFunction,
    execTransactionFromModule,
  } = await setupAvatarAndRoles();

  async function invoke(a: number[]) {
    return execTransactionFromModule({
      data: (await testContract.oneParamArrayOfStatic.populateTransaction(a))
        .data,
    });
  }

  const { selector } = testContract.interface.getFunction(
    "oneParamArrayOfStatic"
  );

  return {
    owner,
    member,
    roles,
    scopeFunction: (
      conditions: ConditionFlatStruct[],
      options?: ExecutionOptions
    ) => scopeFunction(selector, conditions, options),
    invoke,
  };
}
export async function setupOneParamArrayOfStaticTuple() {
  const {
    owner,
    member,
    roles,
    testContract,
    scopeFunction,
    execTransactionFromModule,
  } = await setupAvatarAndRoles();

  async function invoke(a: TestContract.StaticTupleStruct[]) {
    return execTransactionFromModule({
      data: (
        await testContract.oneParamArrayOfStaticTuple.populateTransaction(a)
      ).data,
    });
  }

  const { selector } = testContract.interface.getFunction(
    "oneParamArrayOfStaticTuple"
  );

  return {
    roles,
    owner,
    member,
    scopeFunction: (
      conditions: ConditionFlatStruct[],
      options?: ExecutionOptions
    ) => scopeFunction(selector, conditions, options),
    invoke,
  };
}
export async function setupOneParamArrayOfDynamicTuple() {
  const {
    owner,
    member,
    roles,
    testContract,
    scopeFunction,
    execTransactionFromModule,
  } = await setupAvatarAndRoles();

  async function invoke(a: TestContract.DynamicTupleStruct[]) {
    return execTransactionFromModule({
      data: (
        await testContract.oneParamArrayOfDynamicTuple.populateTransaction(a)
      ).data,
    });
  }

  const { selector } = testContract.interface.getFunction(
    "oneParamArrayOfDynamicTuple"
  );

  return {
    roles,
    owner,
    member,
    scopeFunction: (
      conditions: ConditionFlatStruct[],
      options?: ExecutionOptions
    ) => scopeFunction(selector, conditions, options),
    invoke,
  };
}
export async function setupOneParamUintWord() {
  const {
    owner,
    member,
    roles,
    testContract,
    scopeFunction,
    execTransactionFromModule,
  } = await setupAvatarAndRoles();

  async function invoke(a: number) {
    return execTransactionFromModule({
      data: (await testContract.oneParamUintWord.populateTransaction(a)).data,
    });
  }

  const { selector } = testContract.interface.getFunction("oneParamUintWord");

  return {
    roles,
    owner,
    member,
    scopeFunction: (
      conditions: ConditionFlatStruct[],
      options?: ExecutionOptions
    ) => scopeFunction(selector, conditions, options),
    invoke,
  };
}
export async function setupOneParamUintSmall() {
  const {
    owner,
    member,
    roles,
    testContract,
    scopeFunction,
    execTransactionFromModule,
  } = await setupAvatarAndRoles();
  2;
  async function invoke(a: number) {
    return execTransactionFromModule({
      data: (await testContract.oneParamUintSmall.populateTransaction(a)).data,
    });
  }

  const { selector } = testContract.interface.getFunction("oneParamUintSmall");

  return {
    roles,
    owner,
    member,
    scopeFunction: (
      conditions: ConditionFlatStruct[],
      options?: ExecutionOptions
    ) => scopeFunction(selector, conditions, options),
    invoke,
  };
}
export async function setupOneParamIntWord() {
  const {
    owner,
    member,
    roles,
    testContract,
    scopeFunction,
    execTransactionFromModule,
  } = await setupAvatarAndRoles();

  async function invoke(a: number) {
    return execTransactionFromModule({
      data: (await testContract.oneParamIntWord.populateTransaction(a)).data,
    });
  }

  const { selector } = testContract.interface.getFunction("oneParamIntWord");

  return {
    roles,
    owner,
    member,
    scopeFunction: (
      conditions: ConditionFlatStruct[],
      options?: ExecutionOptions
    ) => scopeFunction(selector, conditions, options),
    invoke,
  };
}
export async function setupOneParamIntSmall() {
  const {
    owner,
    member,
    roles,
    testContract,
    scopeFunction,
    execTransactionFromModule,
  } = await setupAvatarAndRoles();

  async function invoke(a: number) {
    return execTransactionFromModule({
      data: (await testContract.oneParamIntSmall.populateTransaction(a)).data,
    });
  }

  const { selector } = testContract.interface.getFunction("oneParamIntSmall");

  return {
    roles,
    owner,
    member,
    scopeFunction: (
      conditions: ConditionFlatStruct[],
      options?: ExecutionOptions
    ) => scopeFunction(selector, conditions, options),
    invoke,
  };
}
export async function setupOneParamBytesWord() {
  const {
    owner,
    member,
    roles,
    testContract,
    scopeFunction,
    execTransactionFromModule,
  } = await setupAvatarAndRoles();

  async function invoke(a: number) {
    return execTransactionFromModule({
      data: (await testContract.oneParamUintWord.populateTransaction(a)).data,
    });
  }

  const { selector } = testContract.interface.getFunction("oneParamUintWord");

  return {
    roles,
    owner,
    member,
    scopeFunction: (
      conditions: ConditionFlatStruct[],
      options?: ExecutionOptions
    ) => scopeFunction(selector, conditions, options),
    invoke,
  };
}
export async function setupOneParamBytesSmall() {
  const {
    owner,
    member,
    roles,
    testContract,
    scopeFunction,
    execTransactionFromModule,
  } = await setupAvatarAndRoles();

  async function invoke(a: string) {
    return execTransactionFromModule({
      data: (await testContract.oneParamBytesSmall.populateTransaction(a)).data,
    });
  }

  const { selector } = testContract.interface.getFunction("oneParamBytesSmall");

  return {
    roles,
    owner,
    member,
    scopeFunction: (
      conditions: ConditionFlatStruct[],
      options?: ExecutionOptions
    ) => scopeFunction(selector, conditions, options),
    invoke,
  };
}
export async function setupOneParamBytes() {
  const {
    owner,
    member,
    roles,
    testContract,
    scopeFunction,
    execTransactionFromModule,
  } = await setupAvatarAndRoles();

  async function invoke(a: string) {
    return execTransactionFromModule({
      data: (await testContract.oneParamBytes.populateTransaction(a)).data,
    });
  }

  const { selector } = testContract.interface.getFunction("oneParamBytes");

  return {
    roles,
    owner,
    member,
    scopeFunction: (
      conditions: ConditionFlatStruct[],
      options?: ExecutionOptions
    ) => scopeFunction(selector, conditions, options),
    invoke,
  };
}
export async function setupOneParamString() {
  const {
    owner,
    member,
    roles,
    testContract,
    scopeFunction,
    execTransactionFromModule,
  } = await setupAvatarAndRoles();

  async function invoke(a: string) {
    return execTransactionFromModule({
      data: (await testContract.oneParamString.populateTransaction(a)).data,
    });
  }

  const { selector } = testContract.interface.getFunction("oneParamString");

  return {
    roles,
    owner,
    member,
    scopeFunction: (
      conditions: ConditionFlatStruct[],
      options?: ExecutionOptions
    ) => scopeFunction(selector, conditions, options),
    invoke,
  };
}
export async function setupOneParamAddress() {
  const {
    owner,
    member,
    roles,
    testContract,
    scopeFunction,
    execTransactionFromModule,
  } = await setupAvatarAndRoles();

  async function invoke(a: string) {
    return execTransactionFromModule({
      data: (await testContract.oneParamAddress.populateTransaction(a)).data,
    });
  }

  const { selector } = testContract.interface.getFunction("oneParamAddress");

  return {
    roles,
    scopeFunction: (
      conditions: ConditionFlatStruct[],
      options?: ExecutionOptions
    ) => scopeFunction(selector, conditions, options),
    invoke,
  };
}
