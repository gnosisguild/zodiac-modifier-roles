import hre from "hardhat";
import assert from "assert";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { AddressOne } from "@gnosis.pm/safe-contracts";
import { BigNumber } from "ethers";
import { Interface, defaultAbiCoder } from "ethers/lib/utils";

import { Operator, ParameterType } from "../utils";

const DontRemoveOffset = false;

describe("Decoder library", async () => {
  async function setup() {
    const TestEncoder = await hre.ethers.getContractFactory("TestEncoder");
    const testEncoder = await TestEncoder.deploy();

    const MockDecoder = await hre.ethers.getContractFactory("MockDecoder");
    const decoder = await MockDecoder.deploy();

    return {
      testEncoder,
      decoder,
    };
  }

  describe("Static", () => {
    it("plucks Static from top level", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      // (bytes2[],string,uint32)

      const { data } =
        await testEncoder.populateTransaction.dynamic32DynamicStatic(
          ["0xaabb", "0x1234", "0xff33"],
          "Hello World!",
          123456789
        );

      assert(data);

      const layout = {
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: ParameterType.Array,
            operator: Operator.Pass,
            children: [
              {
                paramType: ParameterType.Static,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
          {
            paramType: ParameterType.Dynamic,
            operator: Operator.Pass,
            children: [],
          },
          {
            paramType: ParameterType.Static,
            operator: Operator.Pass,
            children: [],
          },
        ],
      };

      const result = await decoder.inspect(data, layout);
      expect(
        await decoder.pluck(
          data,
          result.children[2].location,
          result.children[2].size
        )
      ).to.equal(BigNumber.from(123456789));
    });

    it("plucks Static from Tuple", async () => {
      const { decoder } = await loadFixture(setup);

      const iface = new Interface([
        "function fn(tuple(uint256 a, address b) staticTupleValue)",
      ]);
      const data = iface.encodeFunctionData("fn", [[1999, AddressOne]]);

      const layout = {
        paramType: ParameterType.Calldata,
        operator: Operator.Pass,
        children: [
          {
            paramType: ParameterType.Tuple,
            operator: Operator.Pass,
            children: [
              {
                paramType: ParameterType.Static,
                operator: Operator.Pass,
                children: [],
              },
              {
                paramType: ParameterType.Static,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
        ],
      };

      const result = await decoder.inspect(data as string, layout);

      expect(
        await decoder.pluck(
          data,
          result.children[0].location,
          result.children[0].children[0].size
        )
      ).to.equal(encode(["uint256"], [1999]));

      expect(
        await decoder.pluck(
          data,
          result.children[0].children[1].location,
          result.children[0].children[1].size
        )
      ).to.equal(
        encode(["address"], ["0x0000000000000000000000000000000000000001"])
      );
    });
    it("plucks Static from Array", async () => {
      const { decoder, testEncoder } = await loadFixture(setup);

      // function arrayStaticTupleItems(tuple(uint256 a, address b)[])
      const { data } =
        await testEncoder.populateTransaction.arrayStaticTupleItems([
          {
            a: 95623,
            b: "0x00000000219ab540356cbb839cbe05303d7705fa",
          },
          {
            a: 11542,
            b: "0x0716a17fbaee714f1e6ab0f9d59edbc5f09815c0",
          },
        ]);

      const layout = {
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: ParameterType.Array,
            operator: Operator.Pass,
            children: [
              {
                paramType: ParameterType.Tuple,
                operator: Operator.Pass,
                children: [
                  {
                    paramType: ParameterType.Static,
                    operator: Operator.Pass,
                    children: [],
                  },
                  {
                    paramType: ParameterType.Static,
                    operator: Operator.Pass,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      };
      const result = await decoder.inspect(data as string, layout);
      const arrayEntry2 = result.children[0].children[1];
      expect(
        await decoder.pluck(
          data as string,
          arrayEntry2.children[0].location,
          arrayEntry2.children[0].size
        )
      ).to.equal(encode(["uint256"], [11542], DontRemoveOffset));

      expect(
        await decoder.pluck(
          data as string,
          arrayEntry2.children[1].location,
          arrayEntry2.children[1].size
        )
      ).to.equal(
        encode(
          ["address"],
          ["0x0716a17fbaee714f1e6ab0f9d59edbc5f09815c0"],
          DontRemoveOffset
        )
      );
    });

    it("plucks Static from embedded Calldata", async () => {
      const { decoder } = await loadFixture(setup);

      const iface = new Interface([
        "function a(bytes embedded)",
        "function b(uint256 staticValue)",
      ]);

      const staticValue = 98712;

      const data = iface.encodeFunctionData("a", [
        iface.encodeFunctionData("b", [staticValue]),
      ]);

      const layout = {
        paramType: ParameterType.Calldata,
        operator: Operator.Pass,
        children: [
          {
            // Embedded starts here
            paramType: ParameterType.Calldata,
            operator: Operator.Pass,
            children: [
              {
                paramType: ParameterType.Static,
                operator: Operator.Pass,
                children: [],
              },
            ],
          },
        ],
      };

      const result = await decoder.inspect(data as string, layout);

      const staticNode = result.children[0].children[0];
      expect(
        await decoder.pluck(
          data as string,
          staticNode.location,
          staticNode.size
        )
      ).to.equal(encode(["uint256"], [staticValue], DontRemoveOffset));
    });
  });
});

function encode(types: any, values: any, removeOffset = false) {
  const result = defaultAbiCoder.encode(types, values);
  return removeOffset ? `0x${result.slice(66)}` : result;
}
