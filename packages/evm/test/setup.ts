import { hexlify, randomBytes, ZeroHash } from "ethers";
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
  const conditionsTransform = await hre.artifacts.readArtifact(
    "ConditionsTransform",
  );
  const { address: conditionsTransformAddress } = await deployMastercopy({
    bytecode: conditionsTransform.bytecode,
    constructorArgs: { types: [], values: [] },
    salt: ZeroHash,
    provider,
  });

  const Modifier = await hre.ethers.getContractFactory("Roles", {
    libraries: {
      ConditionsTransform: conditionsTransformAddress,
    },
  });
  const modifier = await Modifier.deploy(owner, avatar, target);
  await modifier.waitForDeployment();
  return modifier;
}
