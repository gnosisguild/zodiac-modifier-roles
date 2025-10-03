import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { ZeroAddress, ZeroHash } from "ethers";

const AddressOne = "0x0000000000000000000000000000000000000001";
const AddressTwo = "0x0000000000000000000000000000000000000002";
const AddressThree = "0x0000000000000000000000000000000000000003";

describe("MorphoBundler3Unwrapper", async () => {
  async function setup() {
    const Bundler3 = await hre.ethers.getContractFactory("Bundler3");
    const bundler3 = await Bundler3.deploy();

    const Adapter = await hre.ethers.getContractFactory(
      "MorphoBundler3Unwrapper",
    );
    const adapter = await Adapter.deploy();

    const TestEncoder = await hre.ethers.getContractFactory("TestEncoder");
    const testEncoder = await TestEncoder.deploy();

    return {
      bundler3,
      adapter,
      testEncoder,
    };
  }

  it("correctly unwrapps single entry", async () => {
    const { bundler3, adapter } = await loadFixture(setup);
    const tx = await bundler3.multicall.populateTransaction([
      {
        to: AddressOne,
        data: "0xaabbccddeeff",
        value: 123456,
        skipRevert: false,
        callbackHash: ZeroHash,
      },
    ]);
    const result = await adapter.unwrap(ZeroAddress, 0, tx.data, 0);
    expect(result.length).to.be.equal(1);

    const [{ to, value, dataLocation, dataSize }] = result;
    expect(to).to.equal(AddressOne);
    expect(value).to.equal(123456);
    expect(sliceData(tx.data, dataLocation, dataSize)).to.equal("aabbccddeeff");
  });

  it("correctly unwrapps multi entry", async () => {
    const { bundler3, adapter } = await loadFixture(setup);
    const tx = await bundler3.multicall.populateTransaction([
      {
        to: AddressThree,
        data: "0x998877cc11ff",
        value: 9876,
        skipRevert: false,
        callbackHash: ZeroHash,
      },
      {
        to: AddressOne,
        data: "0xaabbccddeeff",
        value: 123456,
        skipRevert: false,
        callbackHash: ZeroHash,
      },
    ]);
    const result = await adapter.unwrap(ZeroAddress, 0, tx.data, 0);
    expect(result.length).to.be.equal(2);

    {
      const [{ to, value, dataLocation, dataSize }] = result;
      expect(to).to.equal(AddressThree);
      expect(value).to.equal(9876);
      expect(sliceData(tx.data, dataLocation, dataSize)).to.equal(
        "998877cc11ff",
      );
    }

    {
      const [, { to, value, dataLocation, dataSize }] = result;
      expect(to).to.equal(AddressOne);
      expect(value).to.equal(123456);
      expect(sliceData(tx.data, dataLocation, dataSize)).to.equal(
        "aabbccddeeff",
      );
    }
  });

  it("reverts if wrong selector used", async () => {
    const { bundler3, adapter } = await loadFixture(setup);
    const tx = await bundler3.multicall.populateTransaction([
      {
        to: AddressOne,
        data: "0xaabbccddeeff",
        value: 123456,
        skipRevert: false,
        callbackHash: ZeroHash,
      },
    ]);

    // corrupt the selector
    tx.data = "0xdeadbeef" + tx.data.slice(10);

    await expect(
      adapter.unwrap(ZeroAddress, 0, tx.data, 0),
    ).to.be.revertedWithCustomError(adapter, "MalformedHeader");
  });

  it("reverts if not Operation.Call", async () => {
    const { adapter } = await loadFixture(setup);
    await expect(
      adapter.unwrap(AddressTwo, 1, "0x", 1),
    ).to.be.revertedWithCustomError(adapter, "UnsupportedMode");
  });

  it("reverts if offset is not 0x20", async () => {
    const { bundler3, adapter } = await loadFixture(setup);
    const tx = await bundler3.multicall.populateTransaction([]);
    const corruptedData =
      tx.data.slice(0, 10) +
      "0000000000000000000000000000000000000000000000000000000000000000" +
      tx.data.slice(74);
    await expect(
      adapter.unwrap(ZeroAddress, 0, corruptedData, 0),
    ).to.be.revertedWithCustomError(adapter, "MalformedHeader");
  });

  it("reverts when buffer length too short", async () => {
    const { bundler3, adapter } = await loadFixture(setup);
    const tx = await bundler3.multicall.populateTransaction([
      {
        to: AddressOne,
        data: "0xaabbcc",
        value: 123,
        skipRevert: false,
        callbackHash: ZeroHash,
      },
    ]);

    // Remove some bytes from the end to make buffer too short
    const corruptedData = tx.data.slice(0, tx.data.length - 10);

    await expect(
      adapter.unwrap(ZeroAddress, 0, corruptedData, 0),
    ).to.be.revertedWithCustomError(adapter, "MalformedBody");
  });

  it("reverts when buffer length too wide", async () => {
    const { bundler3, adapter } = await loadFixture(setup);
    const tx = await bundler3.multicall.populateTransaction([
      {
        to: AddressOne,
        data: "0xaabbcc",
        value: 123,
        skipRevert: false,
        callbackHash: ZeroHash,
      },
    ]);

    // Add extra bytes to make buffer too wide
    const corruptedData = tx.data + "deadbeef";

    await expect(
      adapter.unwrap(ZeroAddress, 0, corruptedData, 0),
    ).to.be.revertedWithCustomError(adapter, "MalformedBody");
  });

  it("reverts when inner calldata length wrong", async () => {
    const { bundler3, adapter } = await loadFixture(setup);
    const tx = await bundler3.multicall.populateTransaction([
      {
        to: AddressOne,
        data: "0xaabbccdd",
        value: 123,
        skipRevert: false,
        callbackHash: ZeroHash,
      },
    ]);

    const innerLengthLocation = 2 + 8 + 8 * 64;

    {
      const corruptedData =
        tx.data.slice(0, innerLengthLocation) +
        "0000000000000000000000000000000000000000000000000000000000000000" + // too small
        tx.data.slice(innerLengthLocation + 64);

      await expect(adapter.unwrap(ZeroAddress, 0, corruptedData, 0)).to.be
        .reverted;
    }

    {
      const corruptedData =
        tx.data.slice(0, innerLengthLocation) +
        "0000000000000000000000000000000000000000000000000000000000000021" + // too large
        tx.data.slice(innerLengthLocation + 64);

      await expect(adapter.unwrap(ZeroAddress, 0, corruptedData, 0)).to.be
        .reverted;
    }

    {
      const corruptedData =
        tx.data.slice(0, innerLengthLocation) +
        "0000000000000000000000000000000000000000000000000000000000000004" +
        tx.data.slice(innerLengthLocation + 64);

      await expect(adapter.unwrap(ZeroAddress, 0, corruptedData, 0)).to.not.be
        .reverted;
    }
  });
});

function sliceData(data: string, location: bigint, size: bigint) {
  return data
    .slice(2)
    .slice(Number(location) * 2, Number(location) * 2 + Number(size) * 2);
}
