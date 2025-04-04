import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

<<<<<<< HEAD
import { setupAvatarAndRoles } from "../setup";

import { ExecutionOptions, Operator, AbiType } from "../utils";

describe("Operator - Pass", async () => {
  it("evaluates a Pass", async () => {
    const { owner, member, roles, roleKey, testContract } = await loadFixture(
      setupAvatarAndRoles
    );
=======
import { setupAvatarAndRoles } from "./setup";

import { ExecutionOptions, Operator, ParameterType } from "../utils";

describe("Operator - Pass", async () => {
  it("evaluates a Pass", async () => {
    const { owner, member, roles, roleKey, testContract } =
      await await loadFixture(setupAvatarAndRoles);
>>>>>>> 6bfb5d0c (Initial port of the new AbiDecoder with flat TypeTree)

    const conditions = [
      {
        parent: 0,
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: AbiType.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
    ];

    await roles
      .connect(owner)
      .scopeFunction(
        roleKey,
        await testContract.getAddress(),
        testContract.interface.getFunction("oneParamStatic").selector,
        conditions,
        ExecutionOptions.Both
      );

    const invoke = async () =>
      roles
        .connect(member)
        .execTransactionFromModule(
          await testContract.getAddress(),
          0,
          (await testContract.oneParamStatic.populateTransaction(0)).data,
          0
        );

    await expect(invoke()).to.not.be.reverted;
  });
});
