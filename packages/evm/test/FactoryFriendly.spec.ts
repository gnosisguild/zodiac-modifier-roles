import { AddressOne } from "@gnosis.pm/safe-contracts";
import { expect } from "chai";

import hre, { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder } from "ethers";
import createAdapter from "./createEIP1193";
import { deployFactories, deployProxy } from "@gnosis-guild/zodiac-core";

const FirstAddress = "0x0000000000000000000000000000000000000001";
const saltNonce = "0xfa";

describe("Module works with factory", () => {
  const paramsTypes = ["address", "address", "address"];

  async function setup() {
    const [deployer] = await hre.ethers.getSigners();
    const Factory = await hre.ethers.getContractFactory("ModuleProxyFactory");
    const factory = await Factory.deploy();
    const Packer = await hre.ethers.getContractFactory("Packer");
    const packer = await Packer.deploy();

    const Integrity = await hre.ethers.getContractFactory("Integrity");
    const integrity = await Integrity.deploy();

    const Modifier = await hre.ethers.getContractFactory("Roles", {
      libraries: {
        Integrity: await integrity.getAddress(),
        Packer: await packer.getAddress(),
      },
    });
    const masterCopy = await Modifier.deploy(
      FirstAddress,
      FirstAddress,
      FirstAddress
    );
    const eip1193Provider = createAdapter({
      provider: hre.network.provider,
      signer: deployer,
    });
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
      "Initializable: contract is already initialized"
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
      saltNonce,
      provider: eip1193Provider,
    });

    const proxy = await hre.ethers.getContractAt("Roles", deployProxyAddress);

    expect(await proxy.avatar()).to.be.eq(avatar.address);
  });
});
