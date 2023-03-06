import { expect } from "chai";
import { BigNumber, BigNumberish } from "ethers";
import hre, { deployments, waffle } from "hardhat";

import "@nomiclabs/hardhat-ethers";

import { Comparison, ExecutionOptions, ParameterType } from "./utils";

describe("Comparison", async () => {
  const ROLE_ID = 0;

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

      return { invoke };
    }

    return { setRole, setRoleDynamic, modifier, owner, testContract };
  });

  describe("Bytemask", () => {
    it("triggers an integrity error at setup - bytemask is odd", async () => {
      const { modifier, owner, testContract } = await setup();

      await expect(
        modifier.connect(owner).scopeFunction(
          ROLE_ID,
          testContract.address,
          "0xaabbccdd",
          [
            {
              parent: 0,
              _type: ParameterType.Static,
              comp: Comparison.Bytemask,
              compValue: "0xaa",
            },
          ],
          ExecutionOptions.None
        )
      ).to.be.revertedWith("MalformedBytemask(0)");

      await expect(
        modifier.connect(owner).scopeFunction(
          ROLE_ID,
          testContract.address,
          "0xaabbccdd",
          [
            {
              parent: 0,
              _type: ParameterType.Static,
              comp: Comparison.Bytemask,
              compValue: "0x0a02ffffeeee",
            },
          ],
          ExecutionOptions.None
        )
      ).to.not.be.reverted;
    });

    it("triggers an integrity error at setup - bytemask is too large", async () => {
      const { modifier, owner, testContract } = await setup();

      const left = "ff";
      const right = "0f";
      const maskLong = "ffffffffffffffffffffffffffffffff";
      const maskOk = "ffffffffffffffffffffffffffffff";
      const expected = "ffffffffffffffffffffffffffffff";

      await expect(
        modifier.connect(owner).scopeFunction(
          ROLE_ID,
          testContract.address,
          "0xaabbccdd",
          [
            {
              parent: 0,
              _type: ParameterType.Static,
              comp: Comparison.Bytemask,
              compValue: `0x${left}${right}${maskLong}${expected}`,
            },
          ],
          ExecutionOptions.None
        )
      ).to.be.revertedWith("MalformedBytemask(0)");

      await expect(
        modifier.connect(owner).scopeFunction(
          ROLE_ID,
          testContract.address,
          "0xaabbccdd",
          [
            {
              parent: 0,
              _type: ParameterType.Static,
              comp: Comparison.Bytemask,
              compValue: `0x${left}${right}${maskOk}${expected}`,
            },
          ],
          ExecutionOptions.None
        )
      ).to.not.be.reverted;
    });

    describe("Static - Passes", async () => {
      it("left aligned", async () => {
        const { setRole } = await setup();

        const left = "00";
        const right = "01";
        const mask = "ff";
        const expected = "46";

        const { invoke } = await setRole(`0x${left}${right}${mask}${expected}`);

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
        ).to.be.revertedWith("BytemaskNotAllowed()");
      });
      it("middle aligned", async () => {
        const { setRole } = await setup();

        const left = "0a";
        const right = "0d";
        const mask = "f0f0f0";
        const expected = "103020";

        const { invoke } = await setRole(`0x${left}${right}${mask}${expected}`);

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
        ).to.be.revertedWith("BytemaskNotAllowed()");
      });
      it("right aligned", async () => {
        const { setRole } = await setup();

        const left = "1e";
        const right = "20";
        const mask = "ffff";
        const expected = "abcd";

        const { invoke } = await setRole(`0x${left}${right}${mask}${expected}`);

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
        ).to.be.revertedWith("BytemaskNotAllowed()");
      });
    });
    describe("Static - Fails", async () => {
      it("overflow", async () => {
        const { setRole } = await setup();

        // 30
        const left = "1e";
        const right = "21";
        const mask = "ffffff";
        const expected = "abcd11";

        const { invoke } = await setRole(`0x${left}${right}${mask}${expected}`);

        await expect(
          invoke(
            BigNumber.from(
              "0x000000000000000000000000000000000000000000000000000000000000000"
            )
          )
        ).to.be.revertedWith("BytemaskOverflow()");
      });
    });

    describe("Dynamic - Passes", async () => {
      it("left aligned", async () => {
        const { setRoleDynamic } = await setup();

        const left = "00";
        const right = "01";
        const mask = "ff";
        const expected = "46";

        const { invoke } = await setRoleDynamic(
          `0x${left}${right}${mask}${expected}`
        );

        await expect(invoke("0x46")).to.not.be.reverted;
        await expect(
          invoke(
            "0x4600ff0000000000000000000000000000000110000000000000000334400000"
          )
        ).to.not.be.reverted;

        await expect(invoke("0x45")).to.be.revertedWith("BytemaskNotAllowed()");
        await expect(invoke("0x45ff0077")).to.be.revertedWith(
          "BytemaskNotAllowed()"
        );
      });
      it.skip("middle aligned", async () => {});
      it.skip("right aligned", async () => {});
    });
    describe("Dynamic - Fails", async () => {
      it("overflow", async () => {
        const { setRoleDynamic } = await setup();

        // 30
        const left = "03";
        const right = "06";
        const mask = "ffffff";
        const expected = "aaaaaa";

        const { invoke } = await setRoleDynamic(
          `0x${left}${right}${mask}${expected}`
        );

        await expect(invoke("0x0000000000")).to.be.revertedWith(
          "BytemaskOverflow()"
        );
      });
      it.skip("mask efficacy - not exactly matching expected", async () => {});
    });
  });
});
