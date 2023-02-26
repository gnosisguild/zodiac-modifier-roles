import { expect } from "chai";
import { defaultAbiCoder } from "ethers/lib/utils";
import hre, { deployments, waffle, ethers } from "hardhat";

import "@nomiclabs/hardhat-ethers";

import {
  DynamicTupleStruct,
  StaticTupleStruct,
} from "../typechain-types/contracts/test/TestEncoder";

import {
  Comparison,
  ExecutionOptions,
  ParameterType,
  removeTrailingOffset,
} from "./utils";

describe("Allowance", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

    const TestEncoder = await hre.ethers.getContractFactory("TestEncoder");
    const testEncoder = await TestEncoder.deploy();

    const [owner, invoker] = waffle.provider.getWallets();

    const Modifier = await hre.ethers.getContractFactory("Roles");
    const modifier = await Modifier.deploy(
      owner.address,
      avatar.address,
      avatar.address
    );

    await modifier.enableModule(invoker.address);

    return {
      Avatar,
      avatar,
      testContract,
      testEncoder,
      Modifier,
      modifier,
      owner,
      invoker,
    };
  });

  describe("Checking", () => {
    it.skip("passes a check with enough balance available", async () => {
      const { modifier, testContract, owner, invoker } = await setup();

      const ROLE_ID = 0;
      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("fnWithSingleParam")
      );

      const invoke = async (a: number) =>
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            (await testContract.populateTransaction.fnWithSingleParam(a))
              .data as string,
            0
          );

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      // set it to true
      await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);
      await modifier.connect(owner).scopeFunction(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        [
          {
            isScoped: true,
            parent: 0,
            _type: ParameterType.Static,
            comp: Comparison.EqualTo,
            compValue: ethers.utils.solidityPack(["uint256"], [123]),
          },
        ],
        ExecutionOptions.None
      );

      await expect(invoke(321)).to.be.revertedWith("ParameterNotAllowed()");
      await expect(invoke(123)).to.not.be.reverted;
    });

    it.skip("passes a check with enough balance available and no refill (interval = 0)", async () => {});

    it.skip("passes a check with enough balance available and refill available", async () => {});

    it.skip("passes a check balance from available and from refill", async () => {});

    it.skip("fails a check, with some balance and not enough elapedg to next refill", async () => {});
  });

  describe("Tracking", async () => {
    it.skip("Updates tracking with balance and last refill", async () => {});
    it.skip("Fails at tracking level if double spend is detected", async () => {});
  });
});
