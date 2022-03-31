import SafeServiceClient, {
  SafeMultisigTransactionResponse,
} from "@gnosis.pm/safe-service-client";
import { expect } from "chai";
import hre, { deployments, waffle, ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";

import { Roles } from "../../../typechain-types";
import applyPreset from "../applyPreset";
import gnosisChainDeFiHarvestPreset from "../presets/gnosisChainDeFiHarvest";
import gnosisChainDeFiManagePreset from "../presets/gnosisChainDeFiManage";

describe("Replay Transactions Test", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();
    const [owner] = waffle.provider.getWallets();

    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    const Permissions = await hre.ethers.getContractFactory("Permissions");
    const permissions = await Permissions.deploy();
    const Modifier = await hre.ethers.getContractFactory("Roles", {
      libraries: {
        Permissions: permissions.address,
      },
    });

    const modifier = (await Modifier.deploy(
      owner.address,
      avatar.address,
      avatar.address
    )) as Roles;

    modifier.connect(owner);

    // add ethers default signer to role 1
    const defaultSigner = (await hre.ethers.getSigners())[0];
    await modifier.assignRoles(defaultSigner.address, [1], [true]);

    return { owner, Avatar, avatar, Modifier, modifier };
  });

  describe("Gnosis Chain DeFi Manage preset", () => {
    const safeService = new SafeServiceClient(
      "https://safe-transaction.xdai.gnosis.io"
    );

    it("allows executing all transactions from the history of the Limited Safe on Gnosis Chain", async () => {
      const { owner, modifier } = await setup();
      await applyPreset(
        modifier.address,
        1,
        gnosisChainDeFiManagePreset,
        owner,
        "0x10E4597fF93cbee194F4879f8f1d54a370DB6969"
      );
      console.log("\n\n------- SUCCESSFULLY APPLIED PRESET -------\n\n");

      // TODO currently broken in safe-service-client
      // const moduleTransactions = (
      //   await safeService.getModuleTransactions(
      //     "0x10E4597fF93cbee194F4879f8f1d54a370DB6969".toLowerCase()
      //   )
      // ).results;
      const multisigTransactions = (
        await safeService.getMultisigTransactions(
          "0x10E4597fF93cbee194F4879f8f1d54a370DB6969"
        )
      ).results;

      const SKIP_TRANSACTIONS = [
        "0xc80c51da7771331388b44eceaae7c4a46dee118943b63c4c1959c180803d0f39",
        "0xdc191fec6b1d9dc2c534b28da06822440c2fe06533f0043a7def01a7b2d13567",
      ];

      for (let i = 0; i < multisigTransactions.length; i++) {
        const tx = multisigTransactions[i];
        if (SKIP_TRANSACTIONS.includes(tx.transactionHash)) continue;

        console.log(`Simulating ${printCallData(tx)} ...`);
        try {
          await modifier.execTransactionWithRole(
            tx.to,
            tx.value,
            tx.data || "0x00",
            tx.operation,
            1,
            false
          );
        } catch (e) {
          console.log("Reverting transaction:", tx);
          throw new Error(e);
        }
      }
    });
  });
});

const printCallData = (tx: SafeMultisigTransactionResponse) => {
  if (!tx.data) return `call to ${tx.to}`;

  if (!tx.dataDecoded) {
    return `call ${tx.data} to ${tx.to}`;
  }

  const decoded = tx.dataDecoded as any;
  const params = decoded.parameters?.map((p: any) => p.value).join(", ") || "";
  return `call ${decoded.method}(${params}) to ${tx.to}`;
};
