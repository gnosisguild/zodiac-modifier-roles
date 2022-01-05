import { expect } from "chai";
import hre, { deployments, waffle, ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import { buildContractCall, buildMultiSendSafeTx } from "./utils";
import { AddressOne } from "@gnosis.pm/safe-contracts";
const ZeroAddress = "0x0000000000000000000000000000000000000000";
const FirstAddress = "0x0000000000000000000000000000000000000001";

describe("Clearance", async () => {
  const baseSetup = deployments.createFixture(async () => {
    await deployments.fixture();
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();
    return { Avatar, avatar, testContract };
  });

  const setupRolesWithOwnerAndInvoker = deployments.createFixture(async () => {
    const base = await baseSetup();

    const [owner, invoker] = waffle.provider.getWallets();

    const Permissions = await hre.ethers.getContractFactory("Permissions");
    const permissions = await Permissions.deploy();
    const Modifier = await hre.ethers.getContractFactory("Roles", {
      libraries: {
        Permissions: permissions.address,
      },
    });

    const modifier = await Modifier.deploy(
      owner.address,
      base.avatar.address,
      base.avatar.address
    );

    await modifier.enableModule(invoker.address);

    return {
      ...base,
      Modifier,
      modifier,
      owner,
      invoker,
    };
  });

  const [user1] = waffle.provider.getWallets();

  describe("Clearance", () => {
    // it("sets parameters scoped to true", async () => {
    //   const { modifier, testContract, owner, invoker } =
    //     await setupRolesWithOwnerAndInvoker();
    //   const ROLE_ID = 0;
    //   const COMP_TYPE_EQ = 0;
    //   const SELECTOR = testContract.interface.getSighash(
    //     testContract.interface.getFunction("fnWithSingleParam")
    //   );
    //   const EXEC_ARGS = (n: number) => [
    //     testContract.address,
    //     0,
    //     testContract.interface.encodeFunctionData(
    //       "fnWithSingleParam(uint256)",
    //       [n]
    //     ),
    //     0,
    //   ];
    //   await modifier
    //     .connect(owner)
    //     .assignRoles(invoker.address, [ROLE_ID], [true]);
    //   await modifier
    //     .connect(owner)
    //     .allowTarget(ROLE_ID, testContract.address, true);
    //   // works before making function parameter scoped
    //   await expect(
    //     modifier.connect(invoker).execTransactionFromModule(...EXEC_ARGS(1))
    //   ).to.not.be.reverted;
    //   await modifier
    //     .connect(owner)
    //     .allowFunction(ROLE_ID, testContract.address, SELECTOR, true);
    //   await modifier
    //     .connect(owner)
    //     .scopeFunction(
    //       ROLE_ID,
    //       testContract.address,
    //       SELECTOR,
    //       [true],
    //       [false],
    //       [COMP_TYPE_EQ]
    //     );
    //   // turn scoping on
    //   await modifier
    //     .connect(owner)
    //     .setParameterAllowedValue(
    //       ROLE_ID,
    //       testContract.address,
    //       SELECTOR,
    //       0,
    //       ethers.utils.defaultAbiCoder.encode(["uint256"], [2]),
    //       true
    //     );
    //   // ngmi
    //   await expect(
    //     modifier.connect(invoker).execTransactionFromModule(...EXEC_ARGS(1))
    //   ).to.be.revertedWith("ParameterNotAllowed");
    //   // gmi
    //   await expect(
    //     modifier.connect(invoker).execTransactionFromModule(...EXEC_ARGS(2))
    //   ).to.not.be.reverted;
    // });

    it("allows and then disallows a target");
    it("allowing a target does not allow other targets");
    it("allows and then disallows a function");
    it(
      "allowing a function on a target does not allow same function on other target"
    );
    it("allowing a function restricts a previously allowed target");
    it("allowing a target relaxes a previously allowed function");
    it("disallowing one function does not impact other function allowances");
  });
});
