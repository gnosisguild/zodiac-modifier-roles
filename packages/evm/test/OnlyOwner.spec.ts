import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { deployRolesMod, Operator, ParameterType } from "./utils";

const SomeAddress = "0x000000000000000000000000000000000000000f";

async function setup() {
  const Avatar = await hre.ethers.getContractFactory("TestAvatar");
  const avatar = await Avatar.deploy();

  const [owner, johnDoe] = await hre.ethers.getSigners();

  const modifier = await deployRolesMod(
    hre,
    owner.address,
    avatar.address,
    avatar.address
  );

  return {
    modifier,
    owner,
    johnDoe,
  };
}

describe("OnlyOwner", async () => {
  const ROLE_KEY =
    "0x0000000000000000000000000000000000000000000000000000000000001111";

  it("onlyOwner for allowTarget simple invoker fails", async () => {
    const { modifier, owner, johnDoe } = await loadFixture(setup);

    await expect(
      modifier.connect(johnDoe).allowTarget(ROLE_KEY, SomeAddress, 0)
    )
      .to.be.revertedWithCustomError(modifier, "OwnableUnauthorizedAccount")
      .withArgs(johnDoe.address);

    await expect(modifier.connect(owner).allowTarget(ROLE_KEY, SomeAddress, 0))
      .to.not.be.reverted;
  });
  it("onlyOwner for scopeTarget, simple invoker fails", async () => {
    const { modifier, owner, johnDoe } = await loadFixture(setup);

    await expect(modifier.connect(johnDoe).scopeTarget(ROLE_KEY, SomeAddress))
      .to.be.revertedWithCustomError(modifier, "OwnableUnauthorizedAccount")
      .withArgs(johnDoe.address);

    await expect(modifier.connect(owner).scopeTarget(ROLE_KEY, SomeAddress)).to
      .not.be.reverted;
  });
  it("onlyOwner for revokeTarget, simple invoker fails", async () => {
    const { modifier, owner, johnDoe } = await loadFixture(setup);

    await expect(modifier.connect(johnDoe).revokeTarget(ROLE_KEY, SomeAddress))
      .to.be.revertedWithCustomError(modifier, "OwnableUnauthorizedAccount")
      .withArgs(johnDoe.address);

    await expect(modifier.connect(owner).revokeTarget(ROLE_KEY, SomeAddress)).to
      .not.be.reverted;
  });
  it("onlyOwner for allowFunction, simple invoker fails", async () => {
    const { modifier, owner, johnDoe } = await loadFixture(setup);

    await expect(
      modifier
        .connect(johnDoe)
        .allowFunction(ROLE_KEY, SomeAddress, "0x00000000", 0)
    )
      .to.be.revertedWithCustomError(modifier, "OwnableUnauthorizedAccount")
      .withArgs(johnDoe.address);
    await expect(
      modifier
        .connect(owner)
        .allowFunction(ROLE_KEY, SomeAddress, "0x00000000", 0)
    ).to.not.be.reverted;
  });
  it("onlyOwner for revokeFunction, simple invoker fails", async () => {
    const { modifier, owner, johnDoe } = await loadFixture(setup);

    await expect(
      modifier
        .connect(johnDoe)
        .revokeFunction(ROLE_KEY, SomeAddress, "0x00000000")
    )
      .to.be.revertedWithCustomError(modifier, "OwnableUnauthorizedAccount")
      .withArgs(johnDoe.address);

    await expect(
      modifier
        .connect(owner)
        .revokeFunction(ROLE_KEY, SomeAddress, "0x00000000")
    ).to.not.be.reverted;
  });
  it("onlyOwner for scopeFunction, simple invoker fails", async () => {
    const { modifier, owner, johnDoe } = await loadFixture(setup);

    await expect(
      modifier.connect(johnDoe).scopeFunction(
        ROLE_KEY,
        SomeAddress,
        "0x00000000",
        [
          {
            parent: 0,
            paramType: ParameterType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ],
        0
      )
    )
      .to.be.revertedWithCustomError(modifier, "OwnableUnauthorizedAccount")
      .withArgs(johnDoe.address);

    await expect(
      modifier.connect(owner).scopeFunction(
        ROLE_KEY,
        SomeAddress,
        "0x00000000",
        [
          {
            parent: 0,
            paramType: ParameterType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ],
        0
      )
    ).to.not.be.reverted;
  });
  it("onlyOwner for setAllowance, simple invoker fails", async () => {
    const { modifier, owner, johnDoe } = await loadFixture(setup);

    const allowanceKey =
      "0x0000000000000000000000000000000000000000000000000000000000000001";

    await expect(
      modifier.connect(johnDoe).setAllowance(allowanceKey, 0, 0, 0, 0, 0)
    )
      .to.be.revertedWithCustomError(modifier, "OwnableUnauthorizedAccount")
      .withArgs(johnDoe.address);

    await expect(
      modifier.connect(owner).setAllowance(allowanceKey, 0, 0, 0, 0, 0)
    ).to.not.be.reverted;
  });
  it("onlyOwner for setTransactionUnwrapper, simple invoker fails", async () => {
    const { modifier, owner, johnDoe } = await loadFixture(setup);

    await expect(
      modifier
        .connect(johnDoe)
        .setTransactionUnwrapper(
          "0x0000000000000000000000000000000000000003",
          "0xaabbccdd",
          "0x0000000000000000000000000000000000000004"
        )
    )
      .to.be.revertedWithCustomError(modifier, "OwnableUnauthorizedAccount")
      .withArgs(johnDoe.address);

    await expect(
      modifier
        .connect(owner)
        .setTransactionUnwrapper(
          "0x0000000000000000000000000000000000000003",
          "0xaabbccdd",
          "0x0000000000000000000000000000000000000004"
        )
    ).to.not.be.reverted;
  });
});
