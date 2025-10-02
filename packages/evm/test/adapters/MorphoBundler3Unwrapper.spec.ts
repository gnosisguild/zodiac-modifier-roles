import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { ZeroAddress, ZeroHash } from "ethers";

const AddressOne = "0x0000000000000000000000000000000000000001";
const AddressTwo = "0x0000000000000000000000000000000000000002";
const AddressThree = "0x0000000000000000000000000000000000000003";
const AddressFour = "0x0000000000000000000000000000000000000004";

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

  it("reverts if wrong selector used", async () => {});

  it("reverts if not Operation.Call", async () => {});

  it("reverts if encoding out of bounds", async () => {});

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
});

function sliceData(data: string, location: bigint, size: bigint) {
  return data
    .slice(2)
    .slice(Number(location) * 2, Number(location) * 2 + Number(size) * 2);
}
