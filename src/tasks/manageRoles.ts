import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { writeFileSync } from "fs";

import Safe from "@gnosis.pm/safe-core-sdk";
import { EthAdapter } from "@gnosis.pm/safe-core-sdk-types";
import EthersAdapter from "@gnosis.pm/safe-ethers-lib";
import SafeServiceClient from "@gnosis.pm/safe-service-client";
import { ethers } from "ethers";
import { Interface } from "ethers/lib/utils";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Roles } from "../../typechain-types";
import applyPreset from "../sdk/applyPreset";
import { encodeApplyPresetMultisend } from "../sdk/encodeApplyPreset";
import gnosisChainDeFiHarvestPreset from "../sdk/presets/gnosisChainDeFiHarvest";
import gnosisChainDeFiManagePreset from "../sdk/presets/gnosisChainDeFiManage";

const MGMT_SAFE = "0xDA5A5816c54C436c69535Ca3172826de61546f6e";

const getContract = async (hre: HardhatRuntimeEnvironment) => {
  const signers = await hre.ethers.getSigners();
  const Roles = await hre.ethers.getContractFactory("Roles", {
    libraries: { Permissions: "0xc9826D544DBE637F386eA23EEef65ae7a1F5dF33" },
  });
  return new hre.ethers.Contract(
    "0x0Df1f08f765238dc0b8beAAdDd6681F62e54beC6",
    Roles.interface,
    signers[0]
  ) as Roles;
};

task("setMultisend").setAction(async (taskArgs, hre) => {
  const roles = await getContract(hre);
  const MULTISEND_ADDRESS = "0x8D29bE29923b68abfDD21e541b9374737B49cdAD";
  const tx = await roles.setMultisend(MULTISEND_ADDRESS);
  console.log(`TX hash: ${tx.hash}`);
  console.log("Waiting for confirmation...");
  await tx.wait();
  console.log("Done.");
});

task("assignRole1").setAction(async (taskArgs, hre) => {
  const roles = await getContract(hre);
  const tx = await roles.assignRoles(MGMT_SAFE, [1], [true]);
  console.log(`TX hash: ${tx.hash}`);
  console.log("Waiting for confirmation...");
  await tx.wait();
  console.log("Done.");
});

task("unassignRole1").setAction(async (taskArgs, hre) => {
  const roles = await getContract(hre);
  const tx = await roles.assignRoles(MGMT_SAFE, [1], [false]);
  console.log(`TX hash: ${tx.hash}`);
  console.log("Waiting for confirmation...");
  await tx.wait();
  console.log("Done.");
});

const DEFI_PROTOCOL_ADDRESSES = [""];
const WETH = "0xc778417e063141139fce010982780140aa0cd5ab";

task("allow")
  .addPositionalParam("address")
  .setAction(async (taskArgs, hre) => {
    const roles = await getContract(hre);
    // whitelist WETH (allow send calls)
    const tx = await roles.allowTarget(1, taskArgs.address, 1);
    console.log(`TX hash: ${tx.hash}`);
    console.log("Waiting for confirmation...");
    await tx.wait();
    console.log("Done.");
  });

task("revoke")
  .addPositionalParam("address")
  .setAction(async (taskArgs, hre) => {
    const roles = await getContract(hre);
    // whitelist WETH (allow send calls)
    const tx = await roles.revokeTarget(1, taskArgs.address);
    console.log(`TX hash: ${tx.hash}`);
    console.log("Waiting for confirmation...");
    await tx.wait();
    console.log("Done.");
  });

task("applyPresetManage").setAction(async (taskArgs, hre) => {
  await applyPreset(
    "0x057a5957AAd61946292a1f5F63dDFa1412E9d120",
    1,
    gnosisChainDeFiManagePreset,
    (
      await hre.ethers.getSigners()
    )[0],
    "0x8Bbd876d534e6E00E61414F00576627E4466bBde"
  );
});

task("applyPresetManageMultisend").setAction(async (taskArgs, hre) => {
  let nonce = 21;

  // Limited GC
  // const AVATAR = "0x10E4597fF93cbee194F4879f8f1d54a370DB6969";
  // const ROLES_MOD = "0x494ec5194123487E8A6ba0b6bc96D57e340025e7";

  // DAO GC
  const AVATAR = "0x458cD345B4C05e8DF39d0A07220feb4Ec19F5e6f";
  const ROLES_MOD = "0x10785356E66b93432e9E8D6F9e532Fa55e4fc058";

  const signer = (await hre.ethers.getSigners())[0];
  const ethAdapter = new EthersAdapter({
    ethers,
    signer,
  });

  const txServiceUrl = "https://safe-transaction.xdai.gnosis.io";
  const safeService = new SafeServiceClient({
    txServiceUrl,
    ethAdapter: ethAdapter as EthAdapter,
  });

  const txs = await encodeApplyPresetMultisend(
    ROLES_MOD,
    1,
    gnosisChainDeFiManagePreset,
    AVATAR
  );

  const safeSdk = await Safe.create({
    ethAdapter: ethAdapter as EthAdapter,
    safeAddress: "0x8Bbd876d534e6E00E61414F00576627E4466bBde",
  });
  const safeTransaction1 = await safeSdk.createTransaction(txs[0], {
    nonce: nonce++,
  });
  await safeSdk.signTransaction(safeTransaction1);
  const safeTxHash1 = await safeSdk.getTransactionHash(safeTransaction1);
  await safeService.proposeTransaction({
    safeAddress: "0x8Bbd876d534e6E00E61414F00576627E4466bBde",
    safeTransaction: safeTransaction1,
    safeTxHash: safeTxHash1,
    senderAddress: signer.address,
    origin: "Init Roles mod permissions",
  });
  const safeTransaction2 = await safeSdk.createTransaction(txs[1], {
    nonce: nonce++,
  });
  await safeSdk.signTransaction(safeTransaction2);
  const safeTxHash2 = await safeSdk.getTransactionHash(safeTransaction2);
  await safeService.proposeTransaction({
    safeAddress: "0x8Bbd876d534e6E00E61414F00576627E4466bBde",
    safeTransaction: safeTransaction2,
    safeTxHash: safeTxHash2,
    senderAddress: signer.address,
    origin: "Init Roles mod permissions",
  });
});

task("applyPresetHarvestMultisend").setAction(async (taskArgs, hre) => {
  let nonce = 20;

  // Limited GC
  // const AVATAR = "0x10E4597fF93cbee194F4879f8f1d54a370DB6969";
  // const ROLES_MOD = "0x494ec5194123487E8A6ba0b6bc96D57e340025e7";

  // DAO GC
  const AVATAR = "0x458cD345B4C05e8DF39d0A07220feb4Ec19F5e6f";
  const ROLES_MOD = "0x10785356E66b93432e9E8D6F9e532Fa55e4fc058";

  const signer = (await hre.ethers.getSigners())[0];
  const ethAdapter = new EthersAdapter({
    ethers,
    signer,
  });

  const txServiceUrl = "https://safe-transaction.xdai.gnosis.io";
  const safeService = new SafeServiceClient({
    txServiceUrl,
    ethAdapter: ethAdapter as EthAdapter,
  });

  const txs = await encodeApplyPresetMultisend(
    ROLES_MOD,
    2,
    gnosisChainDeFiHarvestPreset,
    AVATAR
  );

  const safeSdk = await Safe.create({
    ethAdapter: ethAdapter as EthAdapter,
    safeAddress: "0x8Bbd876d534e6E00E61414F00576627E4466bBde",
  });
  const safeTransaction1 = await safeSdk.createTransaction(txs[0], {
    nonce: nonce++,
  });
  await safeSdk.signTransaction(safeTransaction1);
  const safeTxHash1 = await safeSdk.getTransactionHash(safeTransaction1);
  await safeService.proposeTransaction({
    safeAddress: "0x8Bbd876d534e6E00E61414F00576627E4466bBde",
    safeTransaction: safeTransaction1,
    safeTxHash: safeTxHash1,
    senderAddress: signer.address,
    origin: "Init Roles mod permissions",
  });
});
