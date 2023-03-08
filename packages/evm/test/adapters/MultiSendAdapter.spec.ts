import "@nomiclabs/hardhat-ethers";
import assert from "assert";

import { expect } from "chai";
import { BigNumberish } from "ethers";
import { getAddress, solidityPack } from "ethers/lib/utils";
import hre, { deployments } from "hardhat";

describe("MultiSendAdapter", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();

    const MultiSend = await hre.ethers.getContractFactory("MultiSend");
    const multisend = await MultiSend.deploy();

    const TestEncoder = await hre.ethers.getContractFactory("TestEncoder");
    const testEncoder = await TestEncoder.deploy();

    const MultiSendAdapter = await hre.ethers.getContractFactory(
      "MultiSendAdapter"
    );
    const unwrapper = await MultiSendAdapter.deploy();

    return {
      multisend,
      testEncoder,
      unwrapper,
    };
  });

  it("reverts if wrong selector used", async () => {
    const { unwrapper, multisend, testEncoder } = await setup();

    const { data: simpleCalldata } =
      await testEncoder.populateTransaction.simple(1);

    const { data } = await multisend.populateTransaction.multiSend(
      multisendPayload([
        {
          to: "0x0000000000000000000000000000000000000001",
          value: 0,
          operation: 1,
          data: simpleCalldata as string,
        },
      ])
    );

    assert(data);

    const selectorWrong = "bbccddee";
    const selectorOk = "8d80ff0a";

    await expect(
      unwrapper.unwrap(`${data.slice(0, 2)}${selectorWrong}${data.slice(10)}`)
    ).to.be.revertedWith("MultiSendMalformed()");

    await expect(
      unwrapper.unwrap(`${data.slice(0, 2)}${selectorOk}${data.slice(10)}`)
    ).to.not.be.reverted;
  });

  it("reverts if header offset incorrect", async () => {
    const { unwrapper, multisend, testEncoder } = await setup();

    const { data: simpleCalldata } =
      await testEncoder.populateTransaction.simple(1);

    const { data } = await multisend.populateTransaction.multiSend(
      multisendPayload([
        {
          to: "0x0000000000000000000000000000000000000001",
          value: 0,
          operation: 1,
          data: simpleCalldata as string,
        },
      ])
    );

    assert(data);

    const offsetOk =
      "0000000000000000000000000000000000000000000000000000000000000020";
    const offsetWrong =
      "f000000000000000000000000000000000000000000000000000000000000020";

    await expect(
      unwrapper.unwrap(`${data.slice(0, 10)}${offsetWrong}${data.slice(74)}`)
    ).to.be.revertedWith("MultiSendMalformed()");

    await expect(
      unwrapper.unwrap(`${data.slice(0, 10)}${offsetOk}${data.slice(74)}`)
    ).to.not.be.reverted;
  });

  it("reverts if no transaction encoded", async () => {
    const { unwrapper, multisend } = await setup();

    const { data } = await multisend.populateTransaction.multiSend("0x");

    assert(data);

    await expect(unwrapper.unwrap(data)).to.be.revertedWith(
      "MultiSendMalformed()"
    );
  });

  it("unwraps a single transaction", async () => {
    const { unwrapper, multisend, testEncoder } = await setup();

    const { data: txData } = await testEncoder.populateTransaction.simple(1);
    const { data } = await multisend.populateTransaction.multiSend(
      multisendPayload([
        {
          to: "0xaaff330000000000000000000aa0000ff0000000",
          value: 999444555,
          operation: 1,
          data: txData as string,
        },
      ])
    );

    assert(data);
    assert(txData);

    const result = await unwrapper.unwrap(data);

    expect(result).to.have.lengthOf(1);
    expect(getAddress(result[0].to)).to.equal(
      getAddress("0xaaff330000000000000000000aa0000ff0000000")
    );
    expect(result[0].value.toNumber()).to.equal(999444555);

    const location = result[0].location;
    const left = location.left.toNumber() * 2;
    const right = location.right.toNumber() * 2;
    expect(data.slice(2).slice(left, right)).to.equal(txData.slice(2));
  });

  it("unwraps multiple transactions", async () => {
    const { unwrapper, multisend, testEncoder } = await setup();

    const { data: txData1 } = await testEncoder.populateTransaction.simple(1);
    const { data: txData2 } = await testEncoder.staticDynamicDynamic32(
      "0x0000000000000000000000000000000000000001",
      "0xaabbcc",
      [1, 2, 3]
    );
    assert(txData1);
    assert(txData2);

    const { data } = await multisend.populateTransaction.multiSend(
      multisendPayload([
        {
          to: "0x0000000000000000000000000000000000000002",
          value: 999444555,
          operation: 1,
          data: txData1,
        },
        {
          to: "0x0000000000000000000000000000000000000003",
          value: 7654,
          operation: 0,
          data: txData2,
        },
      ])
    );
    assert(data);

    const result = await unwrapper.unwrap(data);

    expect(result).to.have.lengthOf(2);
    expect(result[0].to).to.equal("0x0000000000000000000000000000000000000002");
    expect(result[0].value.toNumber()).to.equal(999444555);
    expect(result[0].operation).to.equal(1);

    expect(result[1].to).to.equal("0x0000000000000000000000000000000000000003");
    expect(result[1].value.toNumber()).to.equal(7654);
    expect(result[1].operation).to.equal(0);

    const location1 = result[0].location;
    let left = location1.left.toNumber() * 2;
    let right = location1.right.toNumber() * 2;
    expect(data.slice(2).slice(left, right)).to.equal(txData1.slice(2));

    const location2 = result[1].location;
    left = location2.left.toNumber() * 2;
    right = location2.right.toNumber() * 2;
    expect(data.slice(2).slice(left, right)).to.equal(txData2.slice(2));
  });

  it("reverts if transaction operation incorrect", async () => {
    const { unwrapper, multisend, testEncoder } = await setup();

    const { data: txData } = await testEncoder.populateTransaction.simple(1);
    const { data } = await multisend.populateTransaction.multiSend(
      multisendPayload([
        {
          to: "0xaaff330000000000000000000aa0000ff0000000",
          value: 999444555,
          operation: 2,
          data: txData as string,
        },
      ])
    );

    assert(data);
    assert(txData);

    await expect(unwrapper.unwrap(data)).to.be.revertedWith(
      "MultiSendMalformed()"
    );
  });
});

interface MetaTransaction {
  to: string;
  value: BigNumberish;
  data: string;
  operation: number;
}

const multisendPayload = (txs: MetaTransaction[]): string => {
  return (
    "0x" +
    txs
      .map((tx) =>
        solidityPack(
          ["uint8", "address", "uint256", "uint256", "bytes"],
          [tx.operation, tx.to, tx.value, (tx.data.length - 2) / 2, tx.data]
        ).slice(2)
      )
      .join("")
  );
};
