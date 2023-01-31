import { expect } from "chai";
import hre, { deployments, waffle, ethers } from "hardhat";

import "@nomiclabs/hardhat-ethers";
import { Comparison, ExecutionOptions, ParameterType } from "./utils";

// Through abi.encodePacked() , Solidity supports a non-standard packed mode where:
// types shorter than 32 bytes are neither zero padded nor sign extended and
// dynamic types are encoded in-place and without the length.
// array elements are padded, but still encoded in-place
// Furthermore, structs as well as nested arrays are not supported.
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
    // it("checks limit on scopeFunction", async () => {
    //   const { modifier, testContract, owner } =
    //     await setupRolesWithOwnerAndInvoker();
    //   const SELECTOR = testContract.interface.getSighash(
    //     testContract.interface.getFunction("doNothing")
    //   );
    //   const ROLE_ID = 0;
    //   await expect(
    //     modifier.connect(owner).scopeFunction(
    //       ROLE_ID,
    //       testContract.address,
    //       SELECTOR,
    //       new Array(33).fill(null).map((_, index) => ({
    //         isScoped: false,
    //         parent: index,
    //         _type: ParameterType.Static,
    //         comp: Comparison.EqualTo,
    //         compValues: [],
    //       })),
    //       ExecutionOptions.None
    //     )
    //   ).to.be.revertedWith("ScopeMaxParametersExceeded()");
    //   await expect(
    //     modifier.connect(owner).scopeFunction(
    //       ROLE_ID,
    //       testContract.address,
    //       SELECTOR,
    //       new Array(32).fill(null).map((_, index) => ({
    //         isScoped: false,
    //         parent: index,
    //         _type: ParameterType.Static,
    //         comp: Comparison.EqualTo,
    //         compValues: [A_32_BYTES_VALUE],
    //       })),
    //       ExecutionOptions.None
    //     )
    //   ).to.not.be.reverted;
    // });
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

      await expect(
        modifier.connect(owner).scopeFunction(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          [
            {
              isScoped: true,
              parent: 0,
              _type: ParameterType.Static,
              comp: Comparison.EqualTo,
              compValues: [
                ethers.utils.solidityPack(
                  ["string"],
                  [MORE_THAN_32_BYTES_TEXT]
                ),
              ],
            },
          ],
          ExecutionOptions.None
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
              parent: 0,
              _type: ParameterType.Dynamic32,
              comp: Comparison.EqualTo,
              compValues: [
                ethers.utils.solidityPack(["string"], ["abcdefghijg"]),
              ],
            },
          ],
          ExecutionOptions.None
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
              parent: 0,
              _type: ParameterType.Dynamic32,
              comp: Comparison.EqualTo,
              compValues: [A_32_BYTES_VALUE],
            },
          ],
          ExecutionOptions.None
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
              parent: 0,
              _type: ParameterType.Dynamic32,
              comp: Comparison.EqualTo,
              compValues: [A_32_BYTES_VALUE],
            },
            {
              isScoped: true,
              parent: 1,
              _type: ParameterType.Dynamic,
              comp: Comparison.EqualTo,
              compValues: [
                ethers.utils.solidityPack(
                  ["string"],
                  [MORE_THAN_32_BYTES_TEXT]
                ),
              ],
            },
          ],
          ExecutionOptions.None
        )
      ).to.not.be.reverted;
    });

    it("checks well formed oneOf node", async () => {
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
              parent: 0,
              _type: ParameterType.Static,
              comp: Comparison.OneOf,
              compValues: [],
            },
            {
              isScoped: true,
              parent: 0,
              _type: ParameterType.Static,
              comp: Comparison.EqualTo,
              compValues: [
                ethers.utils.solidityPack(
                  ["string"],
                  [MORE_THAN_32_BYTES_TEXT]
                ),
              ],
            },
            {
              isScoped: true,
              parent: 0,
              _type: ParameterType.Static,
              comp: Comparison.EqualTo,
              compValues: [
                ethers.utils.solidityPack(
                  ["string"],
                  [MORE_THAN_32_BYTES_TEXT]
                ),
              ],
            },
          ],
          ExecutionOptions.None
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
              parent: 0,
              _type: ParameterType.Static,
              comp: Comparison.OneOf,
              compValues: [],
            },
            {
              isScoped: true,
              parent: 0,
              _type: ParameterType.Dynamic32,
              comp: Comparison.EqualTo,
              compValues: [
                ethers.utils.solidityPack(["string"], ["abcdefghijg"]),
              ],
            },
            {
              isScoped: true,
              parent: 0,
              _type: ParameterType.Dynamic32,
              comp: Comparison.EqualTo,
              compValues: [
                ethers.utils.solidityPack(["string"], ["abcdefghijg"]),
              ],
            },
          ],
          ExecutionOptions.None
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
              parent: 0,
              _type: ParameterType.Static,
              comp: Comparison.OneOf,
              compValues: [],
            },
            {
              isScoped: true,
              parent: 0,
              _type: ParameterType.Static,
              comp: Comparison.EqualTo,
              compValues: [A_32_BYTES_VALUE],
            },
            {
              isScoped: true,
              parent: 0,
              _type: ParameterType.Static,
              comp: Comparison.EqualTo,
              compValues: [A_32_BYTES_VALUE],
            },
          ],
          ExecutionOptions.None
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
            parent: 0,
            _type: 0,
            comp: Comparison.OneOf,
            compValues: [],
          },
          {
            isScoped: true,
            parent: 0,
            _type: ParameterType.Static,
            comp: Comparison.EqualTo,
            compValues: [A_32_BYTES_VALUE],
          },
        ],
        ExecutionOptions.None
      )
    ).to.be.revertedWith("TooFewCompValuesForOneOf(0)");

    await expect(
      modifier.connect(owner).scopeFunction(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        [
          {
            isScoped: true,
            parent: 0,
            _type: 0,
            comp: Comparison.OneOf,
            compValues: [],
          },
          {
            isScoped: true,
            parent: 0,
            _type: ParameterType.Static,
            comp: Comparison.EqualTo,
            compValues: [A_32_BYTES_VALUE],
          },
          {
            isScoped: true,
            parent: 0,
            _type: ParameterType.Static,
            comp: Comparison.EqualTo,
            compValues: [A_32_BYTES_VALUE],
          },
        ],
        ExecutionOptions.None
      )
    ).to.not.be.reverted;
  });
});
