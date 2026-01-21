import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ZeroHash } from "ethers";

import {
  Encoding,
  ExecutionOptions,
  Operator,
  ConditionViolationStatus,
  packConditions,
} from "../utils";
import { deployRolesMod } from "../setup";

const AddressOne = "0x0000000000000000000000000000000000000001";

describe("AvatarIsOwnerOfERC721", () => {
  async function setup() {
    const ROLE_KEY =
      "0x0000000000000000000000000000000000000000000000000000000000000001";

    const [owner, invoker] = await hre.ethers.getSigners();

    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const avatarAddress = await avatar.getAddress();

    const roles = await deployRolesMod(
      hre,
      owner.address,
      avatarAddress,
      avatarAddress,
    );
    await roles.enableModule(invoker.address);

    await roles.connect(owner).grantRole(invoker.address, ROLE_KEY, 0, 0, 0);
    await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

    const MockERC721 = await hre.ethers.getContractFactory("MockERC721");
    const mockERC721 = await MockERC721.deploy();
    const mockERC721Address = await mockERC721.getAddress();
    const SELECTOR = mockERC721.interface.getFunction("doSomething").selector;

    await roles.connect(owner).scopeTarget(ROLE_KEY, mockERC721Address);

    const CustomChecker = await hre.ethers.getContractFactory(
      "AvatarIsOwnerOfERC721",
    );
    const customChecker = await CustomChecker.deploy();
    const customCheckerAddress = await customChecker.getAddress();

    // Extra bytes (padding) for the custom checker address in compValue
    const extra = "000000000000000000000000";

    const packed = await packConditions(roles, [
      {
        parent: 0,
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.Static,
        operator: Operator.Custom,
        compValue: `${customCheckerAddress}${extra}`,
      },
      {
        parent: 0,
        paramType: Encoding.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
    ]);
    await roles
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
        mockERC721Address,
        SELECTOR,
        packed,
        ExecutionOptions.None,
      );

    async function invoke(tokenId: number, someParam: number) {
      return roles
        .connect(invoker)
        .execTransactionFromModule(
          mockERC721Address,
          0,
          (await mockERC721.doSomething.populateTransaction(tokenId, someParam))
            .data as string,
          0,
        );
    }

    return {
      roles,
      avatar,
      mockERC721,
      invoke,
    };
  }

  it("passes when avatar owns the token", async () => {
    const { avatar, mockERC721, invoke } = await loadFixture(setup);
    const avatarAddress = await avatar.getAddress();

    const tokenId = 6789;
    const someParam = 123;

    await mockERC721.mint(avatarAddress, tokenId);

    await expect(invoke(tokenId, someParam)).to.not.be.reverted;
  });

  it("fails when avatar does not own the token", async () => {
    const { roles, mockERC721, invoke } = await loadFixture(setup);

    const tokenId = 12345;
    const someParam = 123;

    await mockERC721.mint(AddressOne, tokenId);

    await expect(invoke(tokenId, someParam))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        ConditionViolationStatus.CustomConditionViolation,
        1, // Custom node
        anyValue,
        anyValue,
      );
  });
});
