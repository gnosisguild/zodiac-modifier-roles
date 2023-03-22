import { expect } from "chai";
import hre, { deployments, waffle } from "hardhat";

import "@nomiclabs/hardhat-ethers";
import { Operator, ParameterType } from "./utils";

const SomeAddress = "0x000000000000000000000000000000000000000f";

describe("OnlyOwner", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    const [owner, johnDoe] = waffle.provider.getWallets();

    const Modifier = await hre.ethers.getContractFactory("Roles");

    const modifier = await Modifier.deploy(
      owner.address,
      avatar.address,
      avatar.address
    );

    return {
      modifier,
      owner,
      johnDoe,
    };
  });

  it("onlyOwner for allowTarget simple invoker fails", async () => {
    const { modifier, owner, johnDoe } = await setup();

    const ROLE_ID = 0;

    await expect(
      modifier.connect(johnDoe).allowTarget(ROLE_ID, SomeAddress, 0)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(modifier.connect(owner).allowTarget(ROLE_ID, SomeAddress, 0))
      .to.not.be.reverted;
  });
  it("onlyOwner for scopeTarget, simple invoker fails", async () => {
    const { modifier, owner, johnDoe } = await setup();

    const ROLE_ID = 0;

    await expect(
      modifier.connect(johnDoe).scopeTarget(ROLE_ID, SomeAddress)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(modifier.connect(owner).scopeTarget(ROLE_ID, SomeAddress)).to
      .not.be.reverted;
  });
  it("onlyOwner for revokeTarget, simple invoker fails", async () => {
    const { modifier, owner, johnDoe } = await setup();

    const ROLE_ID = 0;

    await expect(
      modifier.connect(johnDoe).revokeTarget(ROLE_ID, SomeAddress)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(modifier.connect(owner).revokeTarget(ROLE_ID, SomeAddress)).to
      .not.be.reverted;
  });
  it("onlyOwner for allowFunction, simple invoker fails", async () => {
    const { modifier, owner, johnDoe } = await setup();

    const ROLE_ID = 0;

    await expect(
      modifier
        .connect(johnDoe)
        .allowFunction(ROLE_ID, SomeAddress, "0x00000000", 0)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier
        .connect(owner)
        .allowFunction(ROLE_ID, SomeAddress, "0x00000000", 0)
    ).to.not.be.reverted;
  });
  it("onlyOwner for revokeFunction, simple invoker fails", async () => {
    const { modifier, owner, johnDoe } = await setup();

    const ROLE_ID = 0;

    await expect(
      modifier
        .connect(johnDoe)
        .revokeFunction(ROLE_ID, SomeAddress, "0x00000000")
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier.connect(owner).revokeFunction(ROLE_ID, SomeAddress, "0x00000000")
    ).to.not.be.reverted;
  });
  it("onlyOwner for scopeFunction, simple invoker fails", async () => {
    const { modifier, owner, johnDoe } = await setup();

    const ROLE_ID = 0;

    await expect(
      modifier.connect(johnDoe).scopeFunction(
        ROLE_ID,
        SomeAddress,
        "0x00000000",
        [
          {
            parent: 0,
            paramType: ParameterType.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
        ],
        0
      )
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier.connect(owner).scopeFunction(
        ROLE_ID,
        SomeAddress,
        "0x00000000",
        [
          {
            parent: 0,
            paramType: ParameterType.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
        ],
        0
      )
    ).to.not.be.reverted;
  });
  it("onlyOwner for setAllowance, simple invoker fails", async () => {
    const { modifier, owner, johnDoe } = await setup();

    await expect(
      modifier.connect(johnDoe).setAllowance("An Allowance Key", 0, 0, 0, 0, 0)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      modifier.connect(owner).setAllowance("An Allowance Key", 0, 0, 0, 0, 0)
    ).to.not.be.reverted;
  });
});
