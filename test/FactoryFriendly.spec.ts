import { expect } from "chai";
import hre, { deployments, ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import { AbiCoder } from "ethers/lib/utils";
import { AddressOne } from "@gnosis.pm/safe-contracts";

const FirstAddress = "0x0000000000000000000000000000000000000001";
const saltNonce = "0xfa";

describe("Module works with factory", () => {
  const paramsTypes = ["address", "address", "address"];

  const baseSetup = deployments.createFixture(async () => {
    await deployments.fixture();
    const Factory = await hre.ethers.getContractFactory("ModuleProxyFactory");
    const factory = await Factory.deploy();
    const TransactionCheck = await hre.ethers.getContractFactory(
      "TransactionCheck"
    );
    const transactionCheck = await TransactionCheck.deploy();
    const Modifier = await hre.ethers.getContractFactory("Roles", {
      libraries: {
        TransactionCheck: transactionCheck.address,
      },
    });

    const masterCopy = await Modifier.deploy(
      FirstAddress,
      FirstAddress,
      FirstAddress
    );

    return { factory, masterCopy };
  });

  it("should throw because master copy is already initialized", async () => {
    const { masterCopy } = await baseSetup();
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
    const { factory, masterCopy } = await baseSetup();
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

    const newProxy = await hre.ethers.getContractAt("Roles", newProxyAddress);
    expect(await newProxy.avatar()).to.be.eq(avatar.address);
    expect(await newProxy.target()).to.be.eq(target.address);
  });
});
