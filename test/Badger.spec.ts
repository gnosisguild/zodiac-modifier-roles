import crypto from "crypto";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, deployments } from "hardhat";

const baseUri = "https://api.test.com/stuff/{id}.json";

const setupTest = deployments.createFixture(async ({ deployments, ethers }) => {
  await deployments.fixture();
  const [owner] = await ethers.getSigners();
  const badgerFactory = await ethers.getContractFactory("Badger");
  const badgerInstance = await badgerFactory.deploy(owner.address, baseUri);
  await badgerInstance.deployed();

  return await badgerInstance.deployed();
});

describe("Badger", function () {
  // base config
  const defaultUriId = "QmTPHQWYMPrwsRuuhmehpbFtWYFNWLcWGmio9KxPk7fKfk";

  const amount = 2;
  const initalTokenId = 1;
  const secondTokenId = initalTokenId + 1;
  const defaultTransferability = false;

  let badgerInstance: Contract,
    owner: SignerWithAddress,
    alice: SignerWithAddress,
    bob: SignerWithAddress;
  //  owner, alice, bob;

  before("get signers", async () => {
    [owner, alice, bob] = await ethers.getSigners();
  });

  beforeEach(async () => {
    badgerInstance = await setupTest();
  });

  /*
    minting and burning
  */

  describe("#mint", () => {
    it("mints the correct token amount to the recipient", async function () {
      await badgerInstance.createTokenTier(defaultTransferability);
      await badgerInstance.mint(alice.address, initalTokenId, amount);

      const tokenAmount = await badgerInstance.balanceOf(
        alice.address,
        initalTokenId
      );

      expect(tokenAmount).to.equal(amount);
    });

    context("when token tier does not exist", () => {
      it("reverts 'Tier does not exist", async function () {
        await expect(
          badgerInstance.mint(alice.address, 2, amount)
        ).to.be.revertedWith("Tier does not exist");
      });
    });

    context("when called by non-contract-owner", () => {
      it("reverts 'Ownable: caller is not the owner", async function () {
        await expect(
          badgerInstance.connect(alice).mint(alice.address, 1, amount)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });
  });

  describe("#burn", () => {
    context("when token tier does not exist", () => {
      it("reverts 'Tier does not exist'", async function () {
        await expect(
          badgerInstance.burn(alice.address, 2, amount)
        ).to.be.revertedWith("Tier does not exist");
      });
    });

    context("when called by non-contract-owner", () => {
      it("reverts 'Ownable: caller is not the owner'", async function () {
        await expect(
          badgerInstance.connect(alice).burn(alice.address, 1, amount)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    context("with existing token tier", () => {
      beforeEach("create token tier & mint", async () => {
        await badgerInstance.createTokenTier(defaultTransferability);
        await badgerInstance.mint(alice.address, initalTokenId, amount);
      });

      it("burns one token from alice", async () => {
        const burnAmount = 1;
        await badgerInstance.burn(alice.address, initalTokenId, burnAmount);
        expect(
          await badgerInstance.balanceOf(alice.address, initalTokenId)
        ).to.equal(amount - burnAmount);
      });

      it("burns two tokens from alice", async () => {
        const burnAmount = 2;
        await badgerInstance.burn(alice.address, initalTokenId, burnAmount);
        expect(
          await badgerInstance.balanceOf(alice.address, initalTokenId)
        ).to.equal(amount - burnAmount);
      });
    });
  });

  describe("#mintToMultiple", () => {
    const amounts = [10, 20];
    const secondTokenId = initalTokenId + 1;
    const tokenIds = [initalTokenId, secondTokenId];

    let addresses: string[];

    beforeEach("create TWO token tiers", async () => {
      addresses = [alice.address, bob.address];

      await badgerInstance.createTokenTier(defaultTransferability);

      await badgerInstance.createTokenTier(defaultTransferability);
    });

    context("with valid inputs and access rights", () => {
      beforeEach("mint a batch of token to diff addresses", async () => {
        await badgerInstance.mintToMultiple(addresses, tokenIds, amounts);
      });

      it("mints correct amount of tokens to alice", async () => {
        const aliceBalance = await badgerInstance.balanceOf(
          alice.address,
          initalTokenId
        );
        expect(aliceBalance).to.equal(amounts[0]);
      });

      it("mints correct amount of tokens to bob", async () => {
        const bobBalance = await badgerInstance.balanceOf(
          bob.address,
          secondTokenId
        );
        expect(bobBalance).to.equal(amounts[1]);
      });
    });

    context("with invalid input arrays", () => {
      const tooManyAmounts = [...amounts, 420];

      it("reverts 'Input array mismatch'", async () => {
        expect(
          badgerInstance.mintToMultiple(addresses, tokenIds, tooManyAmounts)
        ).to.be.revertedWith("Input array mismatch");
      });
    });

    context("when called by non-contract-owner", () => {
      it("reverts 'Input array mismatch'", async () => {
        expect(
          badgerInstance
            .connect(alice)
            .mintToMultiple(addresses, tokenIds, amounts)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    context("when one token tier does not exist", () => {
      const nonExistentTokenId = 66;

      it("reverts 'Tier does not exist'", async () => {
        expect(
          badgerInstance.mintToMultiple(
            addresses,
            [initalTokenId, nonExistentTokenId],
            amounts
          )
        ).to.be.revertedWith("Tier does not exist");
      });
    });

    context("with large badge size", () => {
      const batchSize = 55;

      it("costs gas", async () => {
        const addresses = [];

        for (let i = 0; i < batchSize; i++) {
          const id = crypto.randomBytes(32).toString("hex");
          const privateKey = "0x" + id;
          const wallet = new ethers.Wallet(privateKey);
          addresses.push(wallet.address);
        }

        const ids = new Array(55).fill(initalTokenId);
        const amounts = new Array(55).fill(1);

        const gas = await badgerInstance.estimateGas.mintToMultiple(
          addresses,
          ids,
          amounts
        );
      });
    });
  });

  describe("#burnFromMultiple", () => {
    const burnAmounts = [2, 4];
    const amounts = [10, 20];
    const secondTokenId = initalTokenId + 1;
    const tokenIds = [initalTokenId, secondTokenId];

    let addresses: string[];

    beforeEach("create TWO token tiers", async () => {
      addresses = [alice.address, bob.address];
      await badgerInstance.createTokenTier(defaultTransferability);
      await badgerInstance.createTokenTier(defaultTransferability);
    });

    context("with valid inputs and access rights", () => {
      beforeEach("mint a batch of token to diff addresses", async () => {
        await badgerInstance.mintToMultiple(addresses, tokenIds, amounts);
      });

      beforeEach("burn tokens", async () => {
        await badgerInstance.burnFromMultiple(addresses, tokenIds, burnAmounts);
      });

      it("burns correct amount of tokens from alice", async () => {
        const aliceBalance = await badgerInstance.balanceOf(
          alice.address,
          initalTokenId
        );
        expect(aliceBalance).to.equal(amounts[0] - burnAmounts[0]);
      });

      it("burns correct amount of tokens from bob", async () => {
        const bobBalance = await badgerInstance.balanceOf(
          bob.address,
          secondTokenId
        );
        expect(bobBalance).to.equal(amounts[1] - burnAmounts[1]);
      });
    });

    context("with invalid inputs", () => {
      it("reverts 'Input array mismatch'", async () => {
        expect(
          badgerInstance.burnFromMultiple(
            addresses,
            tokenIds,
            burnAmounts.slice(0, burnAmounts.length - 1)
          )
        ).to.be.revertedWith("Input array mismatch");
      });
    });

    context("when called by non-contract-owner", () => {
      it("reverts 'Ownable: caller is not the owner'", async () => {
        expect(
          badgerInstance
            .connect(alice)
            .burnFromMultiple(addresses, tokenIds, burnAmounts)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });
  });

  /*
    creating/editing token tier
  */

  describe("#createTokenTier", () => {
    it("emits an event 'TierChange'", async () => {
      await expect(badgerInstance.createTokenTier(defaultTransferability))
        .to.emit(badgerInstance, "TierChange")
        .withArgs(initalTokenId, defaultTransferability);
    });

    context("when called by non-contract-owner", () => {
      it("reverts 'Ownable: caller is not the owner'", () => {
        expect(
          badgerInstance.connect(alice).createTokenTier(defaultTransferability)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });
  });

  describe("#updateTransferableStatus", () => {
    const newTransferability = true;

    beforeEach("create new token tier", async () => {
      await badgerInstance.createTokenTier(defaultTransferability);
    });

    it("saves the new uriId and returns correct uri", async () => {
      await badgerInstance.updateTransferableStatus(
        initalTokenId,
        newTransferability
      );

      const transferable = await badgerInstance.tokenTiers(initalTokenId);
      expect(transferable).to.equal(newTransferability);
    });

    it("emits an event 'TierChange'", async () => {
      await expect(
        badgerInstance.updateTransferableStatus(
          initalTokenId,
          newTransferability
        )
      )
        .to.emit(badgerInstance, "TierChange")
        .withArgs(initalTokenId, newTransferability);
    });

    context("when called by non-contract-owner", () => {
      it("reverts 'Ownable: caller is not the owner'", () => {
        expect(
          badgerInstance
            .connect(alice)
            .updateTransferableStatus(initalTokenId, newTransferability)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    context("when token tier does not exist", () => {
      const nonExistentTokenId = 66;

      it("reverts 'Tier does not exist'", () => {
        expect(
          badgerInstance.updateTransferableStatus(
            nonExistentTokenId,
            newTransferability
          )
        ).to.be.revertedWith("Tier does not exist");
      });
    });
  });

  // /*
  //   Transferring tokens
  // */

  describe("#safeTransferFrom", () => {
    context("with non-transferable token", () => {
      beforeEach("create token tier & mint", async () => {
        await badgerInstance.createTokenTier(defaultTransferability);
        await badgerInstance.mint(alice.address, initalTokenId, amount);
      });

      context("when called by owner of the token", () => {
        it("reverts 'Transfer disabled for this tokenId'", () => {
          expect(
            badgerInstance
              .connect(alice)
              .safeTransferFrom(
                alice.address,
                bob.address,
                initalTokenId,
                amount,
                "0x00"
              )
          ).to.be.revertedWith("Transfer disabled for this tier");
        });
      });

      context("when called by owner of the contract", () => {
        it("reverts 'Transfer disabled for this tokenId'", () => {
          expect(
            badgerInstance.safeTransferFrom(
              alice.address,
              bob.address,
              initalTokenId,
              amount,
              "0x00"
            )
          ).to.be.revertedWith("Transfer disabled for this tier");
        });
      });
    });

    context("with transferable token", () => {
      beforeEach("create token tier & mint", async () => {
        await badgerInstance.createTokenTier(true);
        await badgerInstance.mint(alice.address, initalTokenId, amount);
      });

      it("transfers token to bob", async () => {
        await badgerInstance
          .connect(alice)
          .safeTransferFrom(
            alice.address,
            bob.address,
            initalTokenId,
            amount,
            "0x00"
          );

        const bobsBalance = await badgerInstance.balanceOf(
          bob.address,
          initalTokenId
        );

        expect(bobsBalance).to.equal(amount);
      });
    });
  });

  describe("#safeBatchTransferFrom", () => {
    beforeEach("create token tier & mint", async () => {
      await badgerInstance.createTokenTier(defaultTransferability);
      await badgerInstance.mint(alice.address, initalTokenId, amount);
    });

    context("when non-transferable", () => {
      it("reverts 'Transfer disabled for this tier'", async () => {
        await expect(
          badgerInstance
            .connect(alice)
            .safeBatchTransferFrom(
              alice.address,
              bob.address,
              [initalTokenId, secondTokenId],
              [amount, amount],
              "0x00"
            )
        ).to.be.revertedWith("Transfer disabled for this tier");
      });
    });

    context("when transferable", () => {
      beforeEach("mint tokens and set transferability to true", async () => {
        await badgerInstance.mint(alice.address, initalTokenId, amount);
        await badgerInstance.mint(alice.address, secondTokenId, amount);

        await badgerInstance.updateTransferableStatus(initalTokenId, true);
        await badgerInstance.updateTransferableStatus(secondTokenId, true);
      });

      it("reverts 'Transfer disabled for this tier'", async () => {
        await badgerInstance
          .connect(alice)
          .safeBatchTransferFrom(
            alice.address,
            bob.address,
            [initalTokenId, secondTokenId],
            [amount, amount],
            "0x00"
          );

        const bobsBalances = [
          await badgerInstance.balanceOf(bob.address, initalTokenId),
          await badgerInstance.balanceOf(bob.address, secondTokenId),
        ];

        expect(bobsBalances.map((b) => b.toNumber())).to.eql([amount, amount]);
      });
    });
  });

  // /*
  //   Querying token URI
  // */

  describe("#uri", () => {
    beforeEach("create token tier & mint", async () => {
      await badgerInstance.createTokenTier(defaultTransferability);
      await badgerInstance.mint(alice.address, initalTokenId, amount);
    });

    it("returns the baseUri appended by tokenUri", async () => {
      const uri = await badgerInstance.uri(initalTokenId);
      expect(uri).to.equal(baseUri);
    });
  });
});
