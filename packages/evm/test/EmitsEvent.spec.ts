import { AddressOne } from "@gnosis.pm/safe-contracts";
import { expect } from "chai";
import hre, { deployments, waffle } from "hardhat";

import "@nomiclabs/hardhat-ethers";
import { ExecutionOptions, Operator, ParameterType } from "./utils";

const ROLE_KEY =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

describe("EmitsEvent", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();

    const [owner] = waffle.provider.getWallets();
    const Modifier = await hre.ethers.getContractFactory("Roles");

    const modifier = await Modifier.deploy(
      owner.address,
      owner.address,
      owner.address
    );

    return {
      modifier,
      owner,
    };
  });

  it("AllowTarget", async () => {
    const { owner, modifier } = await setup();

    await expect(
      modifier
        .connect(owner)
        .allowTarget(ROLE_KEY, AddressOne, ExecutionOptions.Send)
    )
      .to.emit(modifier, "AllowTarget")
      .withArgs(ROLE_KEY, AddressOne, ExecutionOptions.Send);
  });
  it("ScopeTarget", async () => {
    const { owner, modifier } = await setup();

    await expect(modifier.connect(owner).scopeTarget(ROLE_KEY, AddressOne))
      .to.emit(modifier, "ScopeTarget")
      .withArgs(ROLE_KEY, AddressOne);
  });
  it("RevokeTarget", async () => {
    const { owner, modifier } = await setup();

    await expect(modifier.connect(owner).revokeTarget(ROLE_KEY, AddressOne))
      .to.emit(modifier, "RevokeTarget")
      .withArgs(ROLE_KEY, AddressOne);
  });
  it("AllowFunction", async () => {
    const { modifier, owner } = await setup();
    await expect(
      modifier
        .connect(owner)
        .allowFunction(
          ROLE_KEY,
          AddressOne,
          "0x12345678",
          ExecutionOptions.Both
        )
    ).to.emit(modifier, "AllowFunction");
  });
  it("RevokeFunction", async () => {
    const { modifier, owner } = await setup();
    await expect(
      modifier.connect(owner).revokeFunction(ROLE_KEY, AddressOne, "0x12345678")
    )
      .to.emit(modifier, "RevokeFunction")
      .withArgs(ROLE_KEY, AddressOne, "0x12345678");
  });
  it("ScopeFunction", async () => {
    const { modifier, owner } = await setup();
    await expect(
      modifier.connect(owner).scopeFunction(
        ROLE_KEY,
        AddressOne,
        "0x12345678",
        [
          {
            parent: 0,
            paramType: ParameterType.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
        ],
        ExecutionOptions.None
      )
    ).to.emit(modifier, "ScopeFunction");
  });
  it("SetAllowance", async () => {
    const { modifier, owner } = await setup();
    const allowanceKey =
      "0x0000000000000000000000000000000000000000000000000000000000000000";
    await expect(
      modifier.connect(owner).setAllowance(allowanceKey, 2, 3, 4, 5, 6)
    )
      .to.emit(modifier, "SetAllowance")
      .withArgs(allowanceKey, 2, 3, 4, 5, 6);
  });
});
