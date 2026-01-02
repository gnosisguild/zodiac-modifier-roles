import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("MultiSendUnwrapper", () => {
  async function setup() {
    // TODO: setup fixture
  }

  it.skip("reverts if wrong selector used");

  it.skip("reverts if header offset incorrect");

  it.skip("reverts if calldata length incorrect");

  it.skip("reverts if value not zero");

  it.skip("reverts if operation not delegate call");

  it.skip("reverts if no transaction encoded");

  it.skip("reverts if single transaction length wrong");

  it.skip("unwraps a single transaction");

  it.skip("unwraps multiple transactions");

  it.skip("reverts if inner transaction operation incorrect");
});
