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

    it.skip("allows executing all transactions from the history of the Limited Safe on Gnosis Chain", async () => {
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
        // GNO transfers to some EOAs
        "0x5beb987553ce2d8cd2d033f82a46b3bc5f76552f51e942446ff080c65533469e",
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

    it("allows executing all transactions from the history of the DAO Safe on Gnosis Chain", async () => {
      const { owner, modifier } = await setup();
      await applyPreset(
        modifier.address,
        1,
        gnosisChainDeFiManagePreset,
        owner,
        "0x458cD345B4C05e8DF39d0A07220feb4Ec19F5e6f"
      );
      console.log("\n\n------- SUCCESSFULLY APPLIED PRESET -------\n\n");

      const multisigTransactions = (
        await safeService.getMultisigTransactions(
          "0x458cD345B4C05e8DF39d0A07220feb4Ec19F5e6f"
        )
      ).results;

      const SKIP_TRANSACTIONS = [
        // transactions that shall be performed by harvesting role tx
        // TODO: add these to test of the harvest role
        "0x1a5eacb22c7f9f3a0650c00a8eda60e4e59fb268bb56f87fa1640e2bb079a165",
        "0x3627b6009d3bc12688c286818e9d42b69e3d01b57faaa8e9d0217246d429689b",
        "0xeb5ff6c7b1ca7ae47e7c5e516b4567e5ead2f563c93ec2769720bd292cdd8448",
        "0x58e4a66b74da7ce5ca78a84e561d917e4f0b3f88ed91b758ebba19efdf2c2ea6",
        "0xdb0ac2b21aa8f469c10909d96035b4e0f63ff0bd4f8e8d592d5c7f6e997838bd",
        "0x3a3e19198b69cc7bb98f2e525c4cbd25e431abb19bf778f2fd86eae2a3fd2f99",
        "0xdf36282bc6e8672622dd76faff3472688f1dbaa801ff12025bbcde5a58fa8209",

        // on-chain rejections TODO: how do we handle these?
        "0xfebcf5465e098704e3939ccb6b3c32b8f6724ffd6e9b5d1edb559aec410228da",
        "0x539e1a0a39ad1cdab8dc2b3b1ebaba267d1a8cf0eefa1bc7c584fd57a68f9a9f",
        "0x5c9cfa3d9238515348a96c26a536495c9d097cca440ea53d0cce050f2f6c2a19",
        "0x9b80561c27d7bf09a02404e6e843edbd061b441e81eda9f42205e5efbd4c073a",

        // some interactions with mGNO pool https://gnosis-safe.io/app/gno:0x458cD345B4C05e8DF39d0A07220feb4Ec19F5e6f/transactions/0x58e504bd809709dfd97ef7f510ede3ee336986963fe0754b698cd931f01f35d8
        "0x107af1b6c4c0a6b9503b8b72dd4d0a893cb158ef9e7ffc08296d0e3fda2b30fd",
        "0x54486fc652192e9959f733e2363f2b0cd6527cd03cecb556bb87cf50c28b8956",

        // transfer GNO to some EOA and Safes
        "0x6911061ee0d8d1454027b09c2b54d6f372f905510210c65982df761fd28d77e0",
        "0x68d51d6db199d3e2aaf7e06312ac2a27058ede21a9ad24a73d3cc1caa83db1c1",
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
