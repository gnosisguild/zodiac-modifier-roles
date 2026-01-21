import { hexlify, Interface, randomBytes, ZeroHash } from "ethers";

import { ExecutionOptions, packConditions } from "./utils";
import { ConditionFlatStruct } from "../typechain-types/contracts/Roles";
import hre from "hardhat";
import { EthereumProvider, HardhatRuntimeEnvironment } from "hardhat/types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  deployFactories,
  deployMastercopy,
  EIP1193Provider,
} from "@gnosis-guild/zodiac-core";

export async function setupTestContract() {
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

  const testContractAddress = await testContract.getAddress();
  const roleKey = hexlify(randomBytes(32));

  await roles.connect(owner).enableModule(member.address);
  await roles.connect(owner).grantRole(member.address, roleKey, 0, 0, 0);
  await roles.connect(owner).setDefaultRole(member.address, roleKey);
  await roles.connect(owner).scopeTarget(roleKey, testContractAddress);

  return {
    roles: roles.connect(owner),
    owner,
    member,
    testContract,
    testContractAddress,
    roleKey,
  };
}

export function createEip1193(
  provider: EthereumProvider,
  signer: HardhatEthersSigner,
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
  target: string,
) {
  const [signer] = await hre.ethers.getSigners();
  const provider = createEip1193(hre.network.provider, signer);

  await deployFactories({ provider });
  const conditionStorer = await hre.artifacts.readArtifact("ConditionStorer");
  const { address: conditionStorerAddress } = await deployMastercopy({
    bytecode: conditionStorer.bytecode,
    constructorArgs: { types: [], values: [] },
    salt: ZeroHash,
    provider,
  });

  const Modifier = await hre.ethers.getContractFactory("Roles", {
    libraries: {
      ConditionStorer: conditionStorerAddress,
    },
  });
  const modifier = await Modifier.deploy(owner, avatar, target);
  await modifier.waitForDeployment();
  return modifier;
}

export async function setupOneParam() {
  const iface = new Interface(["function fn(uint256)"]);
  const fn = iface.getFunction("fn")!;
  const { owner, roles, member, testContractAddress, roleKey } =
    await setupTestContract();

  const allowFunction = async (
    conditions: ConditionFlatStruct[],
    options = ExecutionOptions.None,
  ) => {
    const packed = await packConditions(roles, conditions);
    return roles.allowFunction(
      roleKey,
      testContractAddress,
      fn.selector,
      packed,
      options,
    );
  };

  const invoke = (
    a: bigint | number,
    options?: { value?: bigint | number; operation?: number },
  ) =>
    roles
      .connect(member)
      .execTransactionFromModule(
        testContractAddress,
        options?.value ?? 0,
        iface.encodeFunctionData(fn, [a]),
        options?.operation ?? 0,
      );

  return {
    owner,
    roles,
    member,
    testContractAddress,
    roleKey,
    fn,
    allowFunction,
    invoke,
  };
}

export async function setupOneParamSigned() {
  const iface = new Interface(["function fn(int256)"]);
  const fn = iface.getFunction("fn")!;
  const { owner, roles, member, testContractAddress, roleKey } =
    await setupTestContract();

  const allowFunction = async (
    conditions: ConditionFlatStruct[],
    options = ExecutionOptions.None,
  ) => {
    const packed = await packConditions(roles, conditions);
    return roles.allowFunction(
      roleKey,
      testContractAddress,
      fn.selector,
      packed,
      options,
    );
  };

  const invoke = (
    a: bigint | number,
    options?: { value?: bigint | number; operation?: number },
  ) =>
    roles
      .connect(member)
      .execTransactionFromModule(
        testContractAddress,
        options?.value ?? 0,
        iface.encodeFunctionData(fn, [a]),
        options?.operation ?? 0,
      );

  return {
    owner,
    roles,
    member,
    testContractAddress,
    roleKey,
    fn,
    allowFunction,
    invoke,
  };
}

export async function setupTwoParams() {
  const iface = new Interface(["function fn(uint256, uint256)"]);
  const fn = iface.getFunction("fn")!;
  const { owner, roles, member, testContractAddress, roleKey } =
    await setupTestContract();

  const allowFunction = async (
    conditions: ConditionFlatStruct[],
    options = ExecutionOptions.None,
  ) => {
    const packed = await packConditions(roles, conditions);
    return roles.allowFunction(
      roleKey,
      testContractAddress,
      fn.selector,
      packed,
      options,
    );
  };

  const invoke = (
    a: bigint | number,
    b: bigint | number,
    options?: { value?: bigint | number; operation?: number },
  ) =>
    roles
      .connect(member)
      .execTransactionFromModule(
        testContractAddress,
        options?.value ?? 0,
        iface.encodeFunctionData(fn, [a, b]),
        options?.operation ?? 0,
      );

  return {
    owner,
    roles,
    member,
    testContractAddress,
    roleKey,
    fn,
    allowFunction,
    invoke,
  };
}

export async function setupDynamicParam() {
  const iface = new Interface(["function fn(bytes)"]);
  const fn = iface.getFunction("fn")!;
  const { owner, roles, member, testContractAddress, roleKey } =
    await setupTestContract();

  const allowFunction = async (
    conditions: ConditionFlatStruct[],
    options = ExecutionOptions.None,
  ) => {
    const packed = await packConditions(roles, conditions);
    return roles.allowFunction(
      roleKey,
      testContractAddress,
      fn.selector,
      packed,
      options,
    );
  };

  const invoke = (
    data: string,
    options?: { value?: bigint | number; operation?: number },
  ) =>
    roles
      .connect(member)
      .execTransactionFromModule(
        testContractAddress,
        options?.value ?? 0,
        iface.encodeFunctionData(fn, [data]),
        options?.operation ?? 0,
      );

  return {
    owner,
    roles,
    member,
    testContractAddress,
    roleKey,
    fn,
    allowFunction,
    invoke,
  };
}

export async function setupArrayParam() {
  const iface = new Interface(["function fn(uint256[])"]);
  const fn = iface.getFunction("fn")!;
  const { owner, roles, member, testContractAddress, roleKey } =
    await setupTestContract();

  const allowFunction = async (
    conditions: ConditionFlatStruct[],
    options = ExecutionOptions.None,
  ) => {
    const packed = await packConditions(roles, conditions);
    return roles.allowFunction(
      roleKey,
      testContractAddress,
      fn.selector,
      packed,
      options,
    );
  };

  const invoke = (
    arr: (bigint | number)[],
    options?: { value?: bigint | number; operation?: number },
  ) =>
    roles
      .connect(member)
      .execTransactionFromModule(
        testContractAddress,
        options?.value ?? 0,
        iface.encodeFunctionData(fn, [arr]),
        options?.operation ?? 0,
      );

  return {
    roles,
    owner,
    member,
    testContractAddress,
    roleKey,
    fn,
    allowFunction,
    invoke,
  };
}
