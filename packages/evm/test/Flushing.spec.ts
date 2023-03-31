import { defaultAbiCoder } from "@ethersproject/abi";
import { expect } from "chai";
import hre from "hardhat";
import {
  deployRolesMod,
  ExecutionOptions,
  multisendPayload,
  Operator,
  ParameterType,
} from "./utils";

const ROLE_KEY =
  "0x000000000000000000000000000000000000000000000000000000000000000f";

async function setup() {
  const Avatar = await hre.ethers.getContractFactory("TestAvatar");
  const avatar = await Avatar.deploy();

  const TestContract = await hre.ethers.getContractFactory("TestContract");
  const testContract = await TestContract.deploy();

  const [owner, invoker] = await hre.ethers.getSigners();

  const roles = await deployRolesMod(
    hre,
    owner.address,
    avatar.address,
    avatar.address
  );

  const MultiSend = await hre.ethers.getContractFactory("MultiSend");
  const multisend = await MultiSend.deploy();

  const MultiSendUnwrapper = await hre.ethers.getContractFactory(
    "MultiSendUnwrapper"
  );
  const adapter = await MultiSendUnwrapper.deploy();

  await roles.connect(owner).setTransactionUnwrapper(
    multisend.address,
    //"0x8d80ff0a",
    multisend.interface.getSighash(
      multisend.interface.getFunction("multiSend")
    ),
    adapter.address
  );

  await roles.enableModule(invoker.address);

  await roles.connect(owner).assignRoles(invoker.address, [ROLE_KEY], [true]);
  await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);
  await roles.connect(owner).scopeTarget(ROLE_KEY, testContract.address);

  return {
    adapter,
    multisend,
    testContract,
    roles,
    owner,
    invoker,
  };
}

describe("Flushing", async () => {
  describe("singleEntrypoint", async () => {
    it.skip(
      "consumption in failing OR branch does not influence successful branch"
    );

    it.skip(
      "consumption in failing XOR branch does not influence successful branch"
    );

    it.skip("consumption in AND branch influences other branches");

    it.skip("consumption in ArraySome gets counted once");

    it.skip("consumption in ArrayEvery gets counted for all elements");

    it.skip("consumption in ArraySubset gets counted for every hit");

    it.skip("failing AND restores in memory consumptions");

    it.skip("failing OR restores in memory consumptions");

    it.skip("failing XOR restores in memory consumptions");

    it.skip("failing Matches restores in memory consumptions");
  });

  describe("multiEntrypoint", async () => {
    it.skip(
      "several entrypoints with consumptions and no overlap get carried and flushed"
    );
    it("several entrypoints with consumptions and overlap exhaust an allowance", async () => {
      const { multisend, roles, testContract, owner, invoker } = await setup();

      const allowanceKey = "0x01".padEnd(66, "0");

      const balance = 100;
      const value1 = 10;
      const value2 = 20;

      await roles
        .connect(owner)
        .setAllowance(allowanceKey, balance, 0, 0, 0, 0);

      await roles.connect(owner).scopeFunction(
        ROLE_KEY,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("oneParamStatic")
        ),
        [
          {
            parent: 0,
            paramType: ParameterType.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.WithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
          },
        ],
        ExecutionOptions.None
      );

      await roles.connect(owner).scopeFunction(
        ROLE_KEY,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("twoParamsStatic")
        ),
        [
          {
            parent: 0,
            paramType: ParameterType.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.WithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ],
        ExecutionOptions.None
      );

      const multisendCallData = (
        await multisend.populateTransaction.multiSend(
          multisendPayload([
            {
              to: testContract.address,
              value: 0,
              data: (
                await testContract.populateTransaction.oneParamStatic(value1)
              ).data as string,
              operation: 0,
            },
            {
              to: testContract.address,
              value: 0,
              data: (
                await testContract.populateTransaction.twoParamsStatic(
                  value2,
                  999999
                )
              ).data as string,
              operation: 0,
            },
          ])
        )
      ).data as string;

      expect((await roles.allowances(allowanceKey)).balance).to.equal(balance);

      await expect(
        roles
          .connect(invoker)
          .execTransactionFromModule(multisend.address, 0, multisendCallData, 1)
      ).to.emit(roles, "ConsumeAllowance");

      // fails here as expected
      expect((await roles.allowances(allowanceKey)).balance).to.equal(
        balance - (value1 + value2)
      );
    });
    it.skip(
      "several entrypoints with consumptions and overlap get carried and flushed"
    );
    it.skip("middle entrypoint with no consumptions still carries");
  });
});
