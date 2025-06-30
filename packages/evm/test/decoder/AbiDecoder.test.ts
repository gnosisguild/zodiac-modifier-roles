import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { AbiCoder, Interface } from "ethers";
import hre from "hardhat";

import { AbiType } from "../utils";

const YesRemoveOffset = true;

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

const AddressA = "0x0000000000000000000000000000000000000af1";

describe("Decoder library", async () => {
  async function setup() {
    return {
      decoder: await (
        await hre.ethers.getContractFactory("MockDecoder")
      ).deploy(),
    };
  }

  it("top level static", async () => {
    const { decoder } = await loadFixture(setup);

    const data = Interface.from(["function a(uint256)"]).encodeFunctionData(
      "a",
      [987],
    );

    const typeTree = [
      {
        _type: AbiType.Calldata,
        fields: [1],
      },
      {
        _type: AbiType.Static,
        fields: [],
      },
    ];

    const payload = await decoder.inspectRaw(data, typeTree);
    const [_static] = payload.children;
    expect(await decoder.pluck(data, _static.location, _static.size)).to.equal(
      encode("uint256", 987),
    );
  });

  it("top level dynamic", async () => {
    const { decoder } = await loadFixture(setup);

    const data = AbiCoder.defaultAbiCoder().encode(
      ["string"],
      ["Hello World!"],
    );

    const typeTree = [
      {
        _type: AbiType.AbiEncoded,
        fields: [1],
      },
      {
        _type: AbiType.Dynamic,
        fields: [],
      },
    ];

    const payload = await decoder.inspectRaw(data, typeTree);
    const [dynamic] = payload.children;

    expect(
      await decoder.pluck(data as string, dynamic.location, dynamic.size),
    ).to.equal(encode("string", "Hello World!", true));
  });

  it("top level mixed", async () => {
    const { decoder } = await loadFixture(setup);

    const data = AbiCoder.defaultAbiCoder().encode(
      ["uint256", "string", "bytes1", "bytes", "address"],
      [123, "John Doe", "0xbf", "0xbadbadbeef", AddressA],
    );

    const typeTree = [
      {
        _type: AbiType.AbiEncoded,
        fields: [1, 2, 1, 2, 1],
      },
      {
        _type: AbiType.Static,
        fields: [],
      },
      {
        _type: AbiType.Dynamic,
        fields: [],
      },
    ];

    const payload = await decoder.inspectRaw(data, typeTree);
    const [a, b, c, d, e] = payload.children;

    expect(await decoder.pluck(data as string, a.location, a.size)).to.equal(
      encode("uint256", 123),
    );
    expect(await decoder.pluck(data as string, b.location, b.size)).to.equal(
      encode("string", "John Doe", YesRemoveOffset),
    );
    expect(await decoder.pluck(data as string, c.location, c.size)).to.equal(
      encode("bytes1", "0xbf"),
    );
    expect(await decoder.pluck(data as string, d.location, d.size)).to.equal(
      encode("bytes", "0xbadbadbeef", YesRemoveOffset),
    );
    expect(await decoder.pluck(data as string, e.location, e.size)).to.equal(
      encode("address", AddressA),
    );
  });

  describe("top level tuple", () => {
    it("nested static", async () => {
      const { decoder } = await loadFixture(setup);

      const data = AbiCoder.defaultAbiCoder().encode(
        ["tuple(uint256)"],
        [[123456789]],
      );

      // it's the same plus +4 bytes
      // const _data = Interface.from([
      //   "function a((uint256))",
      // ]).encodeFunctionData("a", [[0]]);
      // expect(data.length + 8).to.equal(_data.length);

      const typeTree = [
        {
          _type: AbiType.AbiEncoded,
          fields: [1],
        },
        {
          _type: AbiType.Tuple,
          fields: [2],
        },
        {
          _type: AbiType.Static,
          fields: [],
        },
      ];

      const payload = await decoder.inspectRaw(data, typeTree);
      const [tuple] = payload.children;
      const [_static] = tuple.children;
      expect(
        await decoder.pluck(data as string, _static.location, _static.size),
      ).to.equal(encode("uint256", 123456789));
    });

    it("nested dynamic", async () => {
      const { decoder } = await loadFixture(setup);

      const value =
        "0xaabb000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ffff";

      const data = AbiCoder.defaultAbiCoder().encode(
        ["tuple(bytes)"],
        [[value]],
      );

      // it's the same plus +4 bytes
      // const _data = Interface.from(["function a((bytes))"]).encodeFunctionData(
      //   "a",
      //   [[value]],
      // );
      // expect(data.length + 8).to.equal(_data.length);

      const typeTree = [
        {
          _type: AbiType.AbiEncoded,
          fields: [1],
        },
        {
          _type: AbiType.Tuple,
          fields: [2],
        },
        {
          _type: AbiType.Dynamic,
          fields: [],
        },
      ];

      const payload = await decoder.inspectRaw(data, typeTree);
      const [tuple] = payload.children;
      const [dynamic] = tuple.children;
      expect(
        await decoder.pluck(data as string, dynamic.location, dynamic.size),
      ).to.equal(encode("bytes", value, YesRemoveOffset));
    });

    it("nested mixed", async () => {
      const { decoder } = await loadFixture(setup);

      const data = Interface.from([
        "function a((uint256, string, bytes1, bytes, address))",
      ]).encodeFunctionData("a", [
        [123, "John Doe", "0xbf", "0xbadbadbeef", AddressA],
      ]);

      const typeTree = [
        {
          _type: AbiType.Calldata,
          fields: [1],
        },
        {
          _type: AbiType.Tuple,
          fields: [2, 3, 2, 3, 2],
        },

        {
          _type: AbiType.Static,
          fields: [],
        },
        {
          _type: AbiType.Dynamic,
          fields: [],
        },
      ];

      const payload = await decoder.inspectRaw(data, typeTree);
      const [tuple] = payload.children;
      const [a, b, c, d, e] = tuple.children;

      expect(await decoder.pluck(data as string, a.location, a.size)).to.equal(
        encode("uint256", 123),
      );
      expect(await decoder.pluck(data as string, b.location, b.size)).to.equal(
        encode("string", "John Doe", YesRemoveOffset),
      );
      expect(await decoder.pluck(data as string, c.location, c.size)).to.equal(
        encode("bytes1", "0xbf"),
      );
      expect(await decoder.pluck(data as string, d.location, d.size)).to.equal(
        encode("bytes", "0xbadbadbeef", YesRemoveOffset),
      );
      expect(await decoder.pluck(data as string, e.location, e.size)).to.equal(
        encode("address", AddressA),
      );
    });

    it("nested tuple static", async () => {
      const { decoder } = await loadFixture(setup);

      const data = AbiCoder.defaultAbiCoder().encode(
        ["tuple(uint256)"],
        [[123456789]],
      );

      const typeTree = [
        {
          _type: AbiType.AbiEncoded,
          fields: [1],
        },
        {
          _type: AbiType.Tuple,
          fields: [2],
        },
        {
          _type: AbiType.Static,
          fields: [],
        },
      ];

      const payload = await decoder.inspectRaw(data, typeTree);
      const [tuple] = payload.children;
      const [_static] = tuple.children;
      expect(
        await decoder.pluck(data as string, _static.location, _static.size),
      ).to.equal(encode("uint256", 123456789));
    });

    it("nested tuple dynamic", async () => {
      const { decoder } = await loadFixture(setup);

      const data = AbiCoder.defaultAbiCoder().encode(
        ["tuple(uint256,tuple(uint256,bytes))"],
        [[123, [456, "0xaabbcc"]]],
      );

      const typeTree = [
        {
          _type: AbiType.AbiEncoded,
          fields: [1],
        },
        {
          _type: AbiType.Tuple,
          fields: [3, 2],
        },
        {
          // 2
          _type: AbiType.Tuple,
          fields: [3, 4],
        },
        {
          // 3
          _type: AbiType.Static,
          fields: [],
        },
        {
          // 4
          _type: AbiType.Dynamic,
          fields: [],
        },
      ];

      const payload = await decoder.inspectRaw(data, typeTree);
      const [tuple] = payload.children;
      const [_static, _tuple] = tuple.children;
      const [__static, __dynamic] = _tuple.children;
      expect(
        await decoder.pluck(data as string, _static.location, _static.size),
      ).to.equal(encode("uint256", 123));
      expect(
        await decoder.pluck(data as string, __static.location, __static.size),
      ).to.equal(encode("uint256", 456));
      expect(
        await decoder.pluck(data as string, __dynamic.location, __dynamic.size),
      ).to.equal(encode("bytes", "0xaabbcc", YesRemoveOffset));
    });

    it.skip("nested array static");

    it.skip("nested array dynamic");

    it.skip("nested array dynamic");

    it("nested array dynamic tuple", async () => {
      const { decoder } = await loadFixture(setup);

      const longBytesValue =
        "0xaabbccaabbccaabbccaabbccffff00aabbccaabbccaabbccaabbccffff00aabbccaabbccaabbccaabbccffff00aabbccaabbccaabbccaabbccaabbccaabbccaabbccffff00aabbccaabbccaabbccaabbccffff00aabbccaabbccaabbccaabbccffff00aabbccaabbccaabbccaabbccaabbccaabbccaabbccffff00aabbccaabbccaabbccaabbccffff00aabbccaabbccaabbccaabbccffff00aabbccaabbccaabbccaabbccaabbccaabbccaabbccffff00aabbccaabbccaabbccaabbccffff00aabbccaabbccaabbccaabbccffff00aabbccaabbccaabbcc";

      const value = [
        [123, "0xaabb00cc"],
        [6768, longBytesValue],
      ];

      const data = AbiCoder.defaultAbiCoder().encode(
        ["tuple(tuple(uint256,bytes)[])"],
        [[value]],
      );

      const typeTree = [
        {
          _type: AbiType.AbiEncoded,
          fields: [1],
        },
        {
          _type: AbiType.Tuple,
          fields: [2],
        },
        {
          // 2
          _type: AbiType.Array,
          fields: [3],
        },
        {
          // 3
          _type: AbiType.Tuple,
          fields: [4, 5],
        },
        {
          // 4
          _type: AbiType.Static,
          fields: [],
        },
        {
          // 5
          _type: AbiType.Dynamic,
          fields: [],
        },
      ];

      const payload = await decoder.inspectRaw(data, typeTree);
      const [tuple] = payload.children;
      const [array] = tuple.children;
      const [_tuple] = array.children;
      const [__static, __dynamic] = _tuple.children;
      expect(
        await decoder.pluck(data as string, array.location, array.size),
      ).to.equal(
        encode(
          "tuple(uint256,bytes)[]",
          [
            [
              [123, "0xaabb00cc"],
              [6768, longBytesValue],
            ],
          ],
          YesRemoveOffset,
        ),
      );
      expect(
        await decoder.pluck(data as string, __static.location, __static.size),
      ).to.equal(encode("uint256", 123));
      expect(
        await decoder.pluck(data as string, __dynamic.location, __dynamic.size),
      ).to.equal(encode("bytes", "0xaabb00cc", YesRemoveOffset));
    });
  });

  describe("top level array", () => {
    it.skip("array of static");
    it.skip("array of dynamic");

    it.skip("array of static tuple");
    it.skip("array of dynamic tuple");

    it.skip("array of dynamic array");
    it.skip("array of static array");
  });

  describe("embedded encoded", () => {
    it("plucks StaticTuple from embedded AbiEncodedWithSelector", async () => {
      const { decoder } = await loadFixture(setup);

      const typeTree = [
        {
          _type: AbiType.Calldata,
          fields: [1],
        },
        {
          _type: AbiType.Calldata,
          fields: [2],
        },
        {
          _type: AbiType.Tuple,
          fields: [3, 3],
        },
        {
          _type: AbiType.Static,
          fields: [],
        },
      ];

      const embedded = Interface.from([
        "function embedded((uint256, address))",
      ]).encodeFunctionData("embedded", [[12345, AddressA]]);

      const data = Interface.from(["function entry(bytes)"]).encodeFunctionData(
        "entry",
        [embedded],
      );

      const payload = await decoder.inspectRaw(data, typeTree);

      const [placeholder] = payload.children;

      const [tuple] = placeholder.children;
      const [s1, s2] = tuple.children;

      expect(
        await decoder.pluck(data as string, tuple.location, tuple.size),
      ).to.equal(`0x${embedded.slice(10)}`);

      expect(
        await decoder.pluck(data as string, s1.location, s1.size),
      ).to.equal(defaultAbiCoder.encode(["uint256"], [12345]));

      expect(
        await decoder.pluck(data as string, s2.location, s2.size),
      ).to.equal(defaultAbiCoder.encode(["address"], [AddressA]));
    });
    it("plucks DynamicTuple from embedded AbiEncodedWithSelector", async () => {
      const { decoder } = await loadFixture(setup);

      const typeTree = [
        {
          _type: AbiType.Calldata,
          fields: [1],
        },
        {
          _type: AbiType.Calldata,
          fields: [2],
        },
        {
          _type: AbiType.Tuple,
          fields: [3, 4],
        },
        {
          _type: AbiType.Static,
          fields: [],
        },
        {
          _type: AbiType.Dynamic,
          fields: [],
        },
      ];

      const embedded = Interface.from([
        "function embedded((uint256, string))",
      ]).encodeFunctionData("embedded", [[12345, "Johnny Doe"]]);

      const data = Interface.from(["function entry(bytes)"]).encodeFunctionData(
        "entry",
        [embedded],
      );

      const payload = await decoder.inspectRaw(data, typeTree);

      const [placeholder] = payload.children;

      const [tuple] = placeholder.children;
      const [_static, dynamic] = tuple.children;

      // expect(
      //   await decoder.pluck(data as string, tuple.location, tuple.size),
      // ).to.equal(`0x${embedded.slice(10)}`);

      expect(
        await decoder.pluck(data as string, _static.location, _static.size),
      ).to.equal(encode(["uint256"], [12345]));

      expect(
        await decoder.pluck(data as string, dynamic.location, dynamic.size),
      ).to.equal(encode(["string"], ["Johnny Doe"], YesRemoveOffset));
    });
    it("plucks StaticTuple from embedded AbiEncoded", async () => {
      const { decoder } = await loadFixture(setup);

      const typeTree = [
        {
          _type: AbiType.Calldata,
          fields: [1],
        },
        {
          _type: AbiType.Tuple,
          fields: [2],
        },
        {
          _type: AbiType.AbiEncoded,
          fields: [3],
        },
        {
          _type: AbiType.Tuple,
          fields: [4, 4],
        },
        {
          _type: AbiType.Static,
          fields: [],
        },
      ];

      const embedded = AbiCoder.defaultAbiCoder().encode(
        ["tuple(uint256, address)"],
        [[12345, AddressA]],
      );

      const data = Interface.from([
        "function entry(tuple(bytes))",
      ]).encodeFunctionData("entry", [[embedded]]);

      const payload = await decoder.inspectRaw(data, typeTree);
      const [tuple] = payload.children;

      const [placeholder] = tuple.children;

      const [_tuple] = placeholder.children;
      const [s1, s2] = _tuple.children;

      expect(
        await decoder.pluck(data as string, _tuple.location, _tuple.size),
      ).to.equal(embedded);

      expect(
        await decoder.pluck(data as string, s1.location, s1.size),
      ).to.equal(defaultAbiCoder.encode(["uint256"], [12345]));

      expect(
        await decoder.pluck(data as string, s2.location, s2.size),
      ).to.equal(defaultAbiCoder.encode(["address"], [AddressA]));
    });
    it("plucks DynamicTuple from embedded AbiEncoded", async () => {
      const { decoder } = await loadFixture(setup);

      const typeTree = [
        {
          _type: AbiType.Calldata,
          fields: [1],
        },
        {
          _type: AbiType.Tuple,
          fields: [2],
        },
        {
          _type: AbiType.AbiEncoded,
          fields: [3],
        },
        {
          _type: AbiType.Tuple,
          fields: [4, 5],
        },
        {
          _type: AbiType.Static,
          fields: [],
        },
        {
          _type: AbiType.Dynamic,
          fields: [],
        },
      ];

      const embedded = AbiCoder.defaultAbiCoder().encode(
        ["tuple(uint256, string)"],
        [[12345, "Johnny Doe"]],
      );

      const data = Interface.from([
        "function entry(tuple(bytes))",
      ]).encodeFunctionData("entry", [[embedded]]);

      const payload = await decoder.inspectRaw(data, typeTree);
      const [tuple] = payload.children;
      const [placeholder] = tuple.children;
      const [_tuple] = placeholder.children;
      const [_static, dynamic] = _tuple.children;

      // expect(
      //   await decoder.pluck(data as string, _tuple.location, _tuple.size),
      // ).to.equal(embedded);

      expect(
        await decoder.pluck(data as string, _static.location, _static.size),
      ).to.equal(encode(["uint256"], [12345]));

      expect(
        await decoder.pluck(data as string, dynamic.location, dynamic.size),
      ).to.equal(encode(["string"], ["Johnny Doe"], YesRemoveOffset));
    });
  });
});

function encode(types: any, values: any, removeOffset = false) {
  types = Array.isArray(types) ? types : [types];
  values = Array.isArray(values) ? values : [values];

  const result = defaultAbiCoder.encode(types, values);
  return removeOffset ? `0x${result.slice(66)}` : result;
}
