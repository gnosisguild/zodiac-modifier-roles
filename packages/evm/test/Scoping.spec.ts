import { expect } from "chai";
import hre, { deployments, waffle, ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";

const COMP_EQUAL = 0;
// const COMP_GREATER = 1;
// const COMP_LESS = 2;
const COMP_ONE_OF = 3;

const OPTIONS_NONE = 0;
// const OPTIONS_SEND = 1;
// const OPTIONS_DELEGATECALL = 2;
// const OPTIONS_BOTH = 3;

const TYPE_NONE = 0;
const TYPE_STATIC = 1;
// const TYPE_DYNAMIC = 2;
const TYPE_DYNAMIC32 = 3;

const A_32_BYTES_VALUE = ethers.utils.defaultAbiCoder.encode(
  ["uint256"],
  [123]
);

describe("Scoping", async () => {
  const baseSetup = deployments.createFixture(async () => {
    await deployments.fixture();
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();
    return { Avatar, avatar, testContract };
  });

  const setupRolesWithOwnerAndInvoker = deployments.createFixture(async () => {
    const base = await baseSetup();

    const [owner, invoker] = waffle.provider.getWallets();

    const Modifier = await hre.ethers.getContractFactory("Roles");
    const modifier = await Modifier.deploy(
      owner.address,
      base.avatar.address,
      base.avatar.address
    );

    await modifier.enableModule(invoker.address);

    return {
      ...base,
      Modifier,
      modifier,
      owner,
      invoker,
    };
  });

  describe("Enforces Scope Max Param limit", () => {
    it("checks limit on scopeFunction", async () => {
      const { modifier, testContract, owner } =
        await setupRolesWithOwnerAndInvoker();

      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("doNothing")
      );

      const ROLE_ID = 0;
      await expect(
        modifier.connect(owner).scopeFunction(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          new Array(49).fill(null).map(() => ({
            isScoped: false,
            _type: TYPE_STATIC,
            comp: COMP_EQUAL,
            compValues: [],
          })),
          OPTIONS_NONE
        )
      ).to.be.revertedWith("ScopeMaxParametersExceeded()");

      await expect(
        modifier.connect(owner).scopeFunction(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          new Array(48).fill(null).map(() => ({
            isScoped: false,
            _type: TYPE_STATIC,
            comp: COMP_EQUAL,
            compValues: [],
          })),
          OPTIONS_NONE
        )
      ).to.not.be.reverted;
    });
  });

  describe("Enforces Parameter Size constraints", () => {
    const MORE_THAN_32_BYTES_TEXT =
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.";

    it("checks limit on scopeFunction", async () => {
      const { modifier, testContract, owner } =
        await setupRolesWithOwnerAndInvoker();

      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("doNothing")
      );

      const ROLE_ID = 0;
      const IS_SCOPED = true;

      await expect(
        modifier.connect(owner).scopeFunction(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          [
            {
              isScoped: true,
              _type: TYPE_STATIC,
              comp: COMP_EQUAL,
              compValues: [
                ethers.utils.solidityPack(
                  ["string"],
                  [MORE_THAN_32_BYTES_TEXT]
                ),
              ],
            },
          ],
          OPTIONS_NONE
        )
      ).to.be.revertedWith("UnsuitableStaticCompValueSize()");

      await expect(
        modifier.connect(owner).scopeFunction(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          [
            {
              isScoped: true,
              _type: TYPE_DYNAMIC32,
              comp: COMP_EQUAL,
              compValues: [
                ethers.utils.solidityPack(["string"], ["abcdefghijg"]),
              ],
            },
          ],
          OPTIONS_NONE
        )
      ).to.be.revertedWith("UnsuitableDynamic32CompValueSize()");

      await expect(
        modifier.connect(owner).scopeFunction(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          [
            {
              isScoped: true,
              _type: TYPE_DYNAMIC32,
              comp: COMP_EQUAL,
              compValues: [A_32_BYTES_VALUE],
            },
          ],
          OPTIONS_NONE
        )
      ).to.be.not.reverted;

      // it doesn't check for unscoped parameter
      await expect(
        modifier.connect(owner).scopeFunction(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          [
            {
              isScoped: true,
              _type: TYPE_DYNAMIC32,
              comp: COMP_EQUAL,
              compValues: [A_32_BYTES_VALUE],
            },
            {
              isScoped: false,
              _type: TYPE_NONE,
              comp: COMP_EQUAL,
              compValues: [
                ethers.utils.solidityPack(
                  ["string"],
                  [MORE_THAN_32_BYTES_TEXT]
                ),
              ],
            },
          ],
          OPTIONS_NONE
        )
      ).to.not.be.reverted;
    });

    it("checks limit on todo rename this", async () => {
      const { modifier, testContract, owner } =
        await setupRolesWithOwnerAndInvoker();

      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("doNothing")
      );

      const ROLE_ID = 0;
      await expect(
        modifier.connect(owner).scopeFunction(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          [
            {
              isScoped: true,
              _type: TYPE_STATIC,
              comp: COMP_ONE_OF,
              compValues: [
                ethers.utils.solidityPack(
                  ["string"],
                  [MORE_THAN_32_BYTES_TEXT]
                ),
                ethers.utils.solidityPack(
                  ["string"],
                  [MORE_THAN_32_BYTES_TEXT]
                ),
              ],
            },
          ],
          OPTIONS_NONE
        )
      ).to.be.revertedWith("UnsuitableStaticCompValueSize()");

      await expect(
        modifier.connect(owner).scopeFunction(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          [
            {
              isScoped: true,
              _type: TYPE_DYNAMIC32,
              comp: COMP_ONE_OF,
              compValues: [
                ethers.utils.solidityPack(["string"], ["abcdefghijg"]),
                ethers.utils.solidityPack(["string"], ["abcdefghijg"]),
              ],
            },
          ],
          OPTIONS_NONE
        )
      ).to.be.revertedWith("UnsuitableDynamic32CompValueSize()");

      await expect(
        modifier.connect(owner).scopeFunction(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          [
            {
              isScoped: true,
              _type: TYPE_STATIC,
              comp: COMP_ONE_OF,
              compValues: [A_32_BYTES_VALUE, A_32_BYTES_VALUE],
            },
          ],
          OPTIONS_NONE
        )
      ).to.not.be.reverted;
    });
  });
  it("enforces minimum 2 compValues when setting Comparison.OneOf", async () => {
    const { modifier, testContract, owner } =
      await setupRolesWithOwnerAndInvoker();

    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("doNothing")
    );

    const ROLE_ID = 0;
    await expect(
      modifier.connect(owner).scopeFunction(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        [
          {
            isScoped: true,
            _type: TYPE_STATIC,
            comp: COMP_ONE_OF,
            compValues: [A_32_BYTES_VALUE],
          },
        ],
        OPTIONS_NONE
      )
    ).to.be.revertedWith("NotEnoughCompValuesForScope()");

    await expect(
      modifier.connect(owner).scopeFunction(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        [
          {
            isScoped: true,
            _type: TYPE_STATIC,
            comp: COMP_ONE_OF,
            compValues: [
              ethers.utils.defaultAbiCoder.encode(["uint256"], [123]),
              ethers.utils.defaultAbiCoder.encode(["uint256"], [123]),
            ],
          },
        ],
        OPTIONS_NONE
      )
    ).to.not.be.reverted;
  });
});