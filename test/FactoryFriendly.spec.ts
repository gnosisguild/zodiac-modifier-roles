import { expect } from "chai";
import hre, { deployments, ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import { AbiCoder } from "ethers/lib/utils";
import { AddressOne } from "@gnosis.pm/safe-contracts";

const FirstAddress = "0x0000000000000000000000000000000000000001";
const saltNonce = "0xfa";

describe("Module works with factory", () => {
  const cooldown = 100;
  const expiration = 180;
  const paramsTypes = ["address", "address", "address", "uint256", "uint256"];

  const baseSetup = deployments.createFixture(async () => {
    await deployments.fixture();
    const Factory = await hre.ethers.getContractFactory("ModuleProxyFactory");
    const DelayModifier = await hre.ethers.getContractFactory("Delay");
    const factory = await Factory.deploy();

    const masterCopy = await DelayModifier.deploy(
      FirstAddress,
      FirstAddress,
      FirstAddress,
      0,
      0
    );

    return { factory, masterCopy };
  });

  it("should throw because master copy is already initialized", async () => {
    const { masterCopy } = await baseSetup();
    const encodedParams = new AbiCoder().encode(paramsTypes, [
      AddressOne,
      AddressOne,
      AddressOne,
      100,
      180,
    ]);

    await expect(masterCopy.setUp(encodedParams)).to.be.revertedWith(
      "Initializable: contract is already initialized"
    );
  });

  it("should deploy new amb module proxy", async () => {
    const { factory, masterCopy } = await baseSetup();
    const [avatar, owner, target] = await ethers.getSigners();
    const paramsValues = [
      owner.address,
      avatar.address,
      target.address,
      100,
      180,
    ];
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

    const newProxy = await hre.ethers.getContractAt("Delay", newProxyAddress);
    expect(await newProxy.txCooldown()).to.be.eq(cooldown);
    expect(await newProxy.txExpiration()).to.be.eq(expiration);
  });
});
