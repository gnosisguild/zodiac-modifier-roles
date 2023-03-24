import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { BigNumber, BigNumberish } from "ethers";

import { Operator, ExecutionOptions, ParameterType } from "./utils";

const ROLE_KEY =
  "0x00000000000000000000000000000000000000000000000000000000000000ff";

describe("Operator", async () => {
  async function setup() {
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

    const [owner, invoker] = await hre.ethers.getSigners();

    const Modifier = await hre.ethers.getContractFactory("Roles");
    const modifier = await Modifier.deploy(
      owner.address,
      avatar.address,
      avatar.address
    );

    await modifier.enableModule(invoker.address);

    async function setRole(compValue: string) {
      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("fnWithSingleParam")
      );

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_KEY], [true]);

      await modifier.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

      // set it to true
      await modifier.connect(owner).scopeTarget(ROLE_KEY, testContract.address);
      await modifier.connect(owner).scopeFunction(
        ROLE_KEY,
        testContract.address,
        SELECTOR,
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
            operator: Operator.Bitmask,
            compValue,
          },
        ],
        ExecutionOptions.None
      );

      async function invoke(a: BigNumberish) {
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

      return { invoke };
    }

    async function setRoleDynamic(compValue: string) {
      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("dynamic")
      );

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_KEY], [true]);

      await modifier.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

      // set it to true
      await modifier.connect(owner).scopeTarget(ROLE_KEY, testContract.address);
      await modifier.connect(owner).scopeFunction(
        ROLE_KEY,
        testContract.address,
        SELECTOR,
        [
          {
            parent: 0,
            paramType: ParameterType.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.Dynamic,
            operator: Operator.Bitmask,
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

      return { invoke };
    }

    return { setRole, setRoleDynamic, modifier, owner, testContract };
  }

  describe("Bitmask", () => {
    describe("Static - Passes", async () => {
      it("left aligned", async () => {
        const { modifier, setRole } = await loadFixture(setup);

        const shift = "0000";
        const mask = "ff".padEnd(30, "0");
        const expected = "46".padEnd(30, "0");

        const { invoke } = await setRole(`0x${shift}${mask}${expected}`);

        await expect(
          invoke(
            BigNumber.from(
              "0x4600000000000000000000000000000000000000000000000000000000000000"
            )
          )
        ).to.not.be.reverted;

        await expect(
          invoke(
            BigNumber.from(
              "0x4600ff0000000000000000000000000000000110000000000000000334400000"
            )
          )
        ).to.not.be.reverted;

        await expect(
          invoke(
            BigNumber.from(
              "0x4500000000000000000000000000000000000000000000000000000000000000"
            )
          )
        ).to.be.revertedWithCustomError(modifier, "BitmaskNotAllowed");
      });
      it("middle aligned", async () => {
        const { modifier, setRole } = await loadFixture(setup);

        const shift = "000a";
        const mask = "f0f0f0".padEnd(30, "0");
        const expected = "103020".padEnd(30, "0");

        const { invoke } = await setRole(`0x${shift}${mask}${expected}`);

        await expect(
          invoke(
            BigNumber.from(
              "0x0000000000000000000010302000000000000000000000000000000000000000"
            )
          )
        ).to.not.be.reverted;
        await expect(
          invoke(
            BigNumber.from(
              "0x000000000000000000001030200000000000000000000000000000ffffffffff"
            )
          )
        ).to.not.be.reverted;

        await expect(
          invoke(
            BigNumber.from(
              "0x000000000000000000001030400000000000000000000000000000ffffffffff"
            )
          )
        ).to.be.revertedWithCustomError(modifier, "BitmaskNotAllowed");
      });
      it("right aligned", async () => {
        const { modifier, setRole } = await loadFixture(setup);

        const shift = "001e";
        const mask = "ffff".padEnd(30, "0");
        const expected = "abcd".padEnd(30, "0");

        const { invoke } = await setRole(`0x${shift}${mask}${expected}`);

        await expect(
          invoke(
            BigNumber.from(
              "0x00000000000000000000000000000000000000000000000000000000000abcd"
            )
          )
        ).to.not.be.reverted;
        await expect(
          invoke(
            BigNumber.from(
              "0x00000000ffffffff000000000000000000000000000000000000000000fabcd"
            )
          )
        ).to.not.be.reverted;

        await expect(
          invoke(
            BigNumber.from(
              "0x00000000ffffffff0000000000000000000000000000000000000000000bbcd"
            )
          )
        ).to.be.revertedWithCustomError(modifier, "BitmaskNotAllowed");
      });
    });
    describe("Static - Fails", async () => {
      it("overflow", async () => {
        const { modifier, setRole } = await loadFixture(setup);

        // 30
        const shift = "0020";
        const mask = "ffffff".padEnd(30, "0");
        const expected = "abcd11".padEnd(30, "0");

        const { invoke } = await setRole(`0x${shift}${mask}${expected}`);

        await expect(
          invoke(
            BigNumber.from(
              "0x000000000000000000000000000000000000000000000000000000000000000"
            )
          )
        ).to.be.revertedWithCustomError(modifier, "BitmaskOverflow");
      });
    });

    describe("Dynamic - Passes", async () => {
      it("left aligned", async () => {
        const { modifier, setRoleDynamic } = await loadFixture(setup);

        const shift = "0000";
        const mask = "ff".padEnd(30, "0");
        const expected = "46".padEnd(30, "0");

        const { invoke } = await setRoleDynamic(`0x${shift}${mask}${expected}`);

        await expect(invoke("0x46")).to.not.be.reverted;
        await expect(invoke("0x4600ff000000000000000000000000")).to.not.be
          .reverted;

        await expect(invoke("0x45")).to.be.revertedWithCustomError(
          modifier,
          "BitmaskNotAllowed"
        );
        await expect(invoke("0x45ff0077")).to.be.revertedWithCustomError(
          modifier,
          "BitmaskNotAllowed"
        );
      });
      it("right aligned", async () => {
        const { setRoleDynamic } = await loadFixture(setup);

        const shift = "000a";
        const mask = "0000000f".padEnd(30, "0");
        const expected = "00000003".padEnd(30, "0");

        const { invoke } = await setRoleDynamic(`0x${shift}${mask}${expected}`);

        await expect(invoke("0x0000000000000000000000000003")).to.not.be
          .reverted;

        await expect(invoke("0x000f200000120000aa00000000f3")).to.not.be
          .reverted;

        await expect(invoke("0x0000000000000000000000000003ffff")).to.not.be
          .reverted;
      });
    });
    describe("Dynamic - Fails", async () => {
      it("overflow", async () => {
        const { modifier, setRoleDynamic } = await loadFixture(setup);

        // 30
        const shift = "0050";
        const mask = "ffffff".padEnd(30, "0");
        const expected = "aaaaaa".padEnd(30, "0");

        const { invoke } = await setRoleDynamic(`0x${shift}${mask}${expected}`);

        await expect(invoke("0x0000000000")).to.be.revertedWithCustomError(
          modifier,
          "BitmaskOverflow"
        );
      });
    });
  });
});
