import { AddressOne } from "@gnosis.pm/safe-contracts";
import { expect } from "chai";
import { AbiCoder } from "ethers/lib/utils";

import hre, { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const FirstAddress = "0x0000000000000000000000000000000000000001";
const saltNonce = "0xfa";

describe("Module works with factory", () => {
  const paramsTypes = ["address", "address", "address"];

  async function setup() {
    const Factory = await hre.ethers.getContractFactory("ModuleProxyFactory");
    const factory = await Factory.deploy();
    const Packer = await hre.ethers.getContractFactory("Packer");
    const packer = await Packer.deploy();

    const Integrity = await hre.ethers.getContractFactory("Integrity");
    const integrity = await Integrity.deploy();

    const Modifier = await hre.ethers.getContractFactory("Roles", {
      libraries: {
        Integrity: integrity.address,
        Packer: packer.address,
      },
    });
    const masterCopy = await Modifier.deploy(
      FirstAddress,
      FirstAddress,
      FirstAddress
    );

    return { factory, masterCopy, Modifier };
  }

  it("should throw because master copy is already initialized", async () => {
    const { masterCopy } = await loadFixture(setup);
    const encodedParams = new AbiCoder().encode(paramsTypes, [
      AddressOne,
      AddressOne,
      AddressOne,
    ]);

    await expect(masterCopy.setUp(encodedParams)).to.be.revertedWith(
      "Initializable: contract is already initialized"
    );
  });

  it("should deploy new roles module proxy", async () => {
    const { factory, masterCopy, Modifier } = await loadFixture(setup);
    const [avatar, owner, target] = await ethers.getSigners();
    const paramsValues = [owner.address, avatar.address, target.address];
    const encodedParams = [new AbiCoder().encode(paramsTypes, paramsValues)];
    const initParams = masterCopy.interface.encodeFunctionData(
      "setUp",
      encodedParams
    );
    const receipt = await factory
      .deployModule(masterCopy.address, initParams, saltNonce)
      .then((tx: any) => tx.wait());

    // retrieve new address from event
    const {
      args: [newProxyAddress],
    } = receipt.events.find(
      ({ event }: { event: string }) => event === "ModuleProxyCreation"
    );

    const newProxy = Modifier.attach(newProxyAddress);
    // const newProxy = await hre.ethers.getContractAt("Roles", newProxyAddress);
    expect(await newProxy.avatar()).to.be.eq(avatar.address);
    expect(await newProxy.target()).to.be.eq(target.address);
  });
});
