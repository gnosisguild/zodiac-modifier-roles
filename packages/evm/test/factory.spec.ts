import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, ZeroHash } from "ethers";
import { deployFactories, deployProxy } from "@gnosis-guild/zodiac-core";
import { createEip1193 } from "./setup";

const AddressOne = "0x0000000000000000000000000000000000000001";

/**
 * Factory tests
 *
 * Scope: Module Deployment & Initialization.
 *
 * This file verifies the deployment process via the ModuleProxyFactory:
 * - Master Copy Safety: Ensuring the master copy is initialized and cannot be taken over.
 * - Proxy Deployment: Verifying that new module proxies are correctly deployed and initialized with the specified parameters.
 */

describe("Module works with factory", () => {
  const paramsTypes = ["address", "address", "address"];

  async function setup() {
    const [deployer] = await hre.ethers.getSigners();
    const Factory = await hre.ethers.getContractFactory("ModuleProxyFactory");
    const factory = await Factory.deploy();

    const ConditionsTransform = await hre.ethers.getContractFactory(
      "ConditionsTransform",
    );
    const conditionsTransform = await ConditionsTransform.deploy();
    const conditionsTransformAddress = await conditionsTransform.getAddress();

    const Modifier = await hre.ethers.getContractFactory("Roles", {
      libraries: {
        ConditionsTransform: conditionsTransformAddress,
      },
    });
    const masterCopy = await Modifier.deploy(
      AddressOne,
      AddressOne,
      AddressOne,
    );
    const eip1193Provider = createEip1193(hre.network.provider, deployer);
    return { factory, masterCopy, Modifier, eip1193Provider };
  }

  it("should throw because master copy is already initialized", async () => {
    const { masterCopy } = await loadFixture(setup);
    const encodedParams = AbiCoder.defaultAbiCoder().encode(paramsTypes, [
      AddressOne,
      AddressOne,
      AddressOne,
    ]);

    await expect(masterCopy.setUp(encodedParams)).to.be.revertedWith(
      "Initializable: contract is already initialized",
    );
  });

  it("should deploy new roles module proxy", async () => {
    const { masterCopy, eip1193Provider } = await loadFixture(setup);
    const [avatar, owner, target] = await ethers.getSigners();
    await deployFactories({ provider: eip1193Provider });
    const { address: deployProxyAddress } = await deployProxy({
      mastercopy: await masterCopy.getAddress(),
      setupArgs: {
        types: ["address", "address", "address"],
        values: [owner.address, avatar.address, target.address],
      },
      saltNonce: ZeroHash,
      provider: eip1193Provider,
    });

    const proxy = await hre.ethers.getContractAt("Roles", deployProxyAddress);

    expect(await proxy.avatar()).to.be.eq(avatar.address);
  });
});
