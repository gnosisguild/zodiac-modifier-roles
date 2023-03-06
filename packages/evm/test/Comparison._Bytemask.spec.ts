import { expect } from "chai";
import hre, { deployments, waffle } from "hardhat";

import "@nomiclabs/hardhat-ethers";

import { Comparison, ExecutionOptions, ParameterType } from "./utils";

describe("Comparison", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();

    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

    const [owner, invoker] = waffle.provider.getWallets();

    const Modifier = await hre.ethers.getContractFactory("Roles");
    const modifier = await Modifier.deploy(
      owner.address,
      avatar.address,
      avatar.address
    );

    await modifier.enableModule(invoker.address);

    async function setRole(compValue: string) {
      const ROLE_ID = 0;
      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("fnWithSingleParam")
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
            parent: 0,
            _type: ParameterType.Static,
            comp: Comparison.Bytemask,
            compValue,
          },
        ],
        ExecutionOptions.None
      );

      async function invoke(a: number) {
        return modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            (await testContract.populateTransaction.fnWithSingleParam(a))
              .data as string,
            0
          );
      }

      return { invoke, modifier };
    }

    async function setRoleDynamic(compValue: string) {
      const ROLE_ID = 0;
      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("dynamic")
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
            parent: 0,
            _type: ParameterType.Dynamic,
            comp: Comparison.Bytemask,
            compValue,
          },
        ],
        ExecutionOptions.None
      );

      async function invoke(a: string) {
        return modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            (await testContract.populateTransaction.dynamic(a)).data as string,
            0
          );
      }

      return { invoke, modifier };
    }

    return { setRole, setRoleDynamic };
  });

  describe("Bytemask", () => {
    it.skip("triggers an integrity error at setup - bytemask is odd", async () => {});
    it.skip("triggers an integrity error at setup - bytemask is too large", async () => {});
    it.skip("passes a bytemask comparison in static parameter", async () => {});
    it.skip("fails a bytemask comparison in a static parameter", async () => {});
    it.skip("oveflows a bytemask comparison in a static parameter", async () => {});
    it.skip("passes a bytemask comparison in dynamic parameter", async () => {});
    it.skip("fails a bytemask comparison in a dynamic parameter", async () => {});
    it.skip("oveflows a bytemask comparison in a dynamic parameter", async () => {});
  });
});
