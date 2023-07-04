import hre from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import {
  BYTES32_ZERO,
  ExecutionOptions,
  Operator,
  ParameterType,
  PermissionCheckerStatus,
  deployRolesMod,
} from "../utils";
import { AddressOne } from "@gnosis.pm/safe-contracts";
import { ConditionFlatStruct } from "../../typechain-types/contracts/Integrity";

describe("AvatarIsOwnerOfERC721", async () => {
  async function setup() {
    const ROLE_KEY =
      "0x0000000000000000000000000000000000000000000000000000000000000001";

    const [owner, invoker] = await hre.ethers.getSigners();

    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    const roles = await deployRolesMod(
      hre,
      owner.address,
      avatar.address,
      avatar.address
    );
    await roles.enableModule(invoker.address);

    await roles.connect(owner).assignRoles(invoker.address, [ROLE_KEY], [true]);
    await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

    const MockERC721 = await hre.ethers.getContractFactory("MockERC721");
    const mockERC721 = await MockERC721.deploy();

    const SELECTOR = mockERC721.interface.getSighash(
      mockERC721.interface.getFunction("doSomething")
    );

    await roles.connect(owner).scopeTarget(ROLE_KEY, mockERC721.address);

    const CustomChecker = await hre.ethers.getContractFactory(
      "AvatarIsOwnerOfERC721"
    );
    const customChecker = await CustomChecker.deploy();

    async function scopeFunction(
      conditions: ConditionFlatStruct[],
      options: ExecutionOptions = ExecutionOptions.None
    ) {
      await roles
        .connect(owner)
        .scopeFunction(
          ROLE_KEY,
          mockERC721.address,
          SELECTOR,
          conditions,
          options
        );
    }

    async function invoke(tokenId: number, someParam: number) {
      return roles
        .connect(invoker)
        .execTransactionFromModule(
          mockERC721.address,
          0,
          (await mockERC721.populateTransaction.doSomething(tokenId, someParam))
            .data as string,
          0
        );
    }

    return {
      owner,
      invoker,
      avatar,
      roles,
      mockERC721,
      customChecker,
      scopeFunction,
      invoke,
    };
  }

  it("passes a comparison", async () => {
    const { roles, avatar, mockERC721, customChecker, scopeFunction, invoke } =
      await loadFixture(setup);

    const extra = "000000000000000000000000";
    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.Custom,
        compValue: `${customChecker.address}${extra}`,
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.Pass,
        compValue: `0x`,
      },
    ]);

    const notOwnedByAvatar = 12345;
    const ownedByAvatar = 6789;
    const someParam = 123;

    await mockERC721.mint(AddressOne, notOwnedByAvatar);
    await mockERC721.mint(avatar.address, ownedByAvatar);

    await expect(invoke(notOwnedByAvatar, someParam))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.CustomConditionViolation, BYTES32_ZERO);

    await expect(invoke(ownedByAvatar, someParam)).to.not.be.reverted;
  });
});
