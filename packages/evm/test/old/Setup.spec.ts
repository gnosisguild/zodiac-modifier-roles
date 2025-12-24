import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { deployRolesMod } from "../setup";

const ROLE_KEY = hre.ethers.id("TEST_ROLE");
const MAX_UINT64 = (1n << 64n) - 1n;
const MAX_UINT128 = (1n << 128n) - 1n;

describe("Setup", () => {
  async function setup() {
    const [owner, member] = await hre.ethers.getSigners();

    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const avatarAddress = await avatar.getAddress();

    const roles = await deployRolesMod(
      hre,
      owner.address,
      avatarAddress,
      avatarAddress,
    );

    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

    return { roles, owner, member, testContract };
  }

  describe("grantRole", () => {
    it("sets defaults when zero", async () => {
      const { roles, owner, member } = await loadFixture(setup);

      await expect(
        roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0),
      )
        .to.emit(roles, "GrantRole")
        .withArgs(ROLE_KEY, member.address, 0, MAX_UINT64, MAX_UINT128);
    });
  });

  describe("revokeRole", () => {
    it("clears membership", async () => {
      const { roles, owner, member, testContract } = await loadFixture(setup);
      const target = await testContract.getAddress();

      await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);
      await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
      await roles.connect(owner).allowTarget(ROLE_KEY, target, [], 0);

      await expect(roles.connect(owner).revokeRole(member.address, ROLE_KEY))
        .to.emit(roles, "RevokeRole")
        .withArgs(ROLE_KEY, member.address);
    });
  });
});
