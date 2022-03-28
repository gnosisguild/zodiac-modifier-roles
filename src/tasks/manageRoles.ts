import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { Interface } from "ethers/lib/utils";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Roles } from "../../typechain-types";

const MGMT_SAFE = "0xDA5A5816c54C436c69535Ca3172826de61546f6e";

const getContract = async (hre: HardhatRuntimeEnvironment) => {
  const signers = await hre.ethers.getSigners();
  const Roles = await hre.ethers.getContractFactory("Roles", {
    libraries: { Permissions: "0xc9826D544DBE637F386eA23EEef65ae7a1F5dF33" },
  });
  return new hre.ethers.Contract(
    "0x305f2D75A9D94e75291b4680ebF8E1A0D8ef1cAB",
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

task("enableTokenApprove").setAction(async (taskArgs, hre) => {
  const roles = await getContract(hre);

  const funcSigHash = new Interface([
    "function approve(address _spender, uint256 _value) public returns (bool success)",
  ]).getSighash("approve");

  const tx = await roles.scopeParameterAsOneOf(
    1,
    WETH,
    funcSigHash,
    0,
    0,
    DEFI_PROTOCOL_ADDRESSES
  );
  await tx.wait();
});
