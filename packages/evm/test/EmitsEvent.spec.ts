import { AddressOne } from "@gnosis.pm/safe-contracts";
import { expect } from "chai";
import hre, { deployments, waffle } from "hardhat";
import "@nomiclabs/hardhat-ethers";

const ROLE_ID = 123;

const OPTIONS_NONE = 0;
const OPTIONS_SEND = 1;
const OPTIONS_BOTH = 3;

describe("EmitsEvent", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    const [owner] = waffle.provider.getWallets();
    const Modifier = await hre.ethers.getContractFactory("Roles");

    const modifier = await Modifier.deploy(
      owner.address,
      avatar.address,
      avatar.address
    );

    return {
      Avatar,
      avatar,
      modifier,
      owner,
    };
  });

  it("AllowTarget", async () => {
    const { owner, modifier } = await setup();

    await expect(
      modifier.connect(owner).allowTarget(ROLE_ID, AddressOne, OPTIONS_SEND)
    )
      .to.emit(modifier, "AllowTarget")
      .withArgs(ROLE_ID, AddressOne, OPTIONS_SEND);
  });
  it("ScopeTarget", async () => {
    const { owner, modifier } = await setup();

    await expect(modifier.connect(owner).scopeTarget(ROLE_ID, AddressOne))
      .to.emit(modifier, "ScopeTarget")
      .withArgs(ROLE_ID, AddressOne);
  });
  it("RevokeTarget", async () => {
    const { owner, modifier } = await setup();

    await expect(modifier.connect(owner).revokeTarget(ROLE_ID, AddressOne))
      .to.emit(modifier, "RevokeTarget")
      .withArgs(ROLE_ID, AddressOne);
  });
  it("AllowFunction", async () => {
    const { modifier, owner } = await setup();
    await expect(
      modifier
        .connect(owner)
        .allowFunction(ROLE_ID, AddressOne, "0x12345678", OPTIONS_BOTH)
    ).to.emit(modifier, "AllowFunction");
  });
  it("RevokeFunction", async () => {
    const { modifier, owner } = await setup();
    await expect(
      modifier.connect(owner).revokeFunction(ROLE_ID, AddressOne, "0x12345678")
    )
      .to.emit(modifier, "RevokeFunction")
      .withArgs(ROLE_ID, AddressOne, "0x12345678");
  });
  it("ScopeFunction", async () => {
    const { modifier, owner } = await setup();
    await expect(
      modifier
        .connect(owner)
        .scopeFunction(
          ROLE_ID,
          AddressOne,
          "0x12345678",
          [{ parent: 0, _type: 0, comp: 0, compValue: "0x" }],
          OPTIONS_NONE
        )
    ).to.emit(modifier, "ScopeFunction");
  });
});
