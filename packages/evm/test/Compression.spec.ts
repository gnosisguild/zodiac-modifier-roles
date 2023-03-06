import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { keccak256, solidityPack } from "ethers/lib/utils";
import hre, { deployments } from "hardhat";

enum Mode {
  Empty = 0,
  UncompressedWord,
  Uncompressed,
  Compressed,
  Hash,
}

describe("Compression", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();

    const MockCompression = await hre.ethers.getContractFactory(
      "MockCompression"
    );
    const Compression = await MockCompression.deploy();

    return {
      Compression,
    };
  });

  describe("compress - 32 bytes iput", async () => {
    describe("Mode Uncompressed", async () => {
      it("Misses compression efficiency", async () => {
        const { Compression } = await setup();
        const { compression } = await Compression.compress(
          "0xf00000000000000000000000000000000000000000000000000000000000000f"
        );
        expect(compression).to.equal(Mode.UncompressedWord);
      });
      it("Misses compression efficiency by one byte", async () => {
        const { Compression } = await setup();
        let { compression } = await Compression.compress(
          "0x000001ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        );
        expect(compression).to.equal(Mode.UncompressedWord);

        ({ compression } = await Compression.compress(
          "0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        ));
        expect(compression).to.equal(Mode.Compressed);

        ({ compression } = await Compression.compress(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffff80000000"
        ));
        expect(compression).to.equal(Mode.UncompressedWord);

        ({ compression } = await Compression.compress(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000"
        ));
        expect(compression).to.equal(Mode.Compressed);

        ({ compression } = await Compression.compress(
          "0x00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000"
        ));
        expect(compression).to.equal(Mode.UncompressedWord);

        ({ compression } = await Compression.compress(
          "0x0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000"
        ));
        expect(compression).to.equal(Mode.Compressed);
      });
    });
    describe("Mode Compressed", async () => {
      it("compressing zero", async () => {
        const { Compression } = await setup();
        const { compression, resultLength, result } =
          await Compression.compress(
            "0x0000000000000000000000000000000000000000000000000000000000000000"
          );

        const expectedResultLength = 3;
        const expectedPayloadLength = expectedResultLength - 1;
        const expectedLeftPad = 32;
        const expectedRightPad = 0;

        expect(compression).to.equal(Mode.Compressed);
        expect(resultLength).to.equal(expectedResultLength);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [expectedPayloadLength, expectedLeftPad, expectedRightPad, "0x"]
          ).padEnd(66, "0")
        );
      });

      it("compressible amount shifted to the left", async () => {
        const { Compression } = await setup();
        const { compression, resultLength, result } =
          await Compression.compress(
            "0xffaabbc000000000000000000000000000000000000000000000000000000000"
          );

        const expectedResultLength = 7;
        const expectedPayloadLength = expectedResultLength - 1;
        const expectedLeftPad = 0;
        const expectedRightPad = 28;

        expect(compression).to.equal(Mode.Compressed);
        expect(resultLength).to.equal(expectedResultLength);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedPayloadLength,
              expectedLeftPad,
              expectedRightPad,
              "0xffaabbc0",
            ]
          ).padEnd(66, "0")
        );
      });

      it("compressible amount shifted to the right", async () => {
        const { Compression } = await setup();
        const { compression, resultLength, result } =
          await Compression.compress(
            "0x000000000000000000000000000000000000000000000000000000000000000a"
          );

        const expectedResultLength = 4;
        const expectedPayloadLength = expectedResultLength - 1;
        const expectedLeftPad = 31;
        const expectedRightPad = 0;

        expect(compression).to.equal(Mode.Compressed);
        expect(resultLength).to.equal(expectedResultLength);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [expectedPayloadLength, expectedLeftPad, expectedRightPad, "0x0a"]
          ).padEnd(66, "0")
        );
      });
      it("compressible amount in the middle", async () => {
        const { Compression } = await setup();
        const { compression, resultLength, result } =
          await Compression.compress(
            "0x0000000000000000000100004512aafe0000000001ff00000000000000000000"
          );

        const expectedResultLength = 16;
        const expectedPayloadLength = expectedResultLength - 1;
        const expectedLeftPad = 9;
        const expectedRightPad = 10;

        expect(compression).to.equal(Mode.Compressed);
        expect(resultLength).to.equal(expectedResultLength);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedPayloadLength,
              expectedLeftPad,
              expectedRightPad,
              "0x0100004512aafe0000000001ff",
            ]
          ).padEnd(66, "0")
        );
      });
    });
  });

  describe("compress - not 32 bytes", async () => {
    describe("Mode: Compressed", async () => {
      it("empty string", async () => {
        const { Compression } = await setup();
        const { compression, resultLength, result } =
          await Compression.compress("0x");

        const expectedResultLength = 3;
        const expectedPayloadLength = expectedResultLength - 1;
        const expectedLeftPad = 0;
        const expectedRightPad = 0;

        expect(compression).to.equal(Mode.Compressed);
        expect(resultLength).to.equal(expectedResultLength);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [expectedPayloadLength, expectedLeftPad, expectedRightPad, "0x"]
          ).padEnd(66, "0")
        );
      });
      it("smaller than 32 only zeroes", async () => {
        const { Compression } = await setup();
        const { compression, resultLength, result } =
          await Compression.compress("0x0000000000");

        const expectedResultLength = 3;
        const expectedPayloadLength = expectedResultLength - 1;
        const expectedLeftPad = 5;
        const expectedRightPad = 0;

        expect(compression).to.equal(Mode.Compressed);
        expect(resultLength).to.equal(expectedResultLength);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [expectedPayloadLength, expectedLeftPad, expectedRightPad, "0x"]
          ).padEnd(66, "0")
        );
      });
      it("Smaller than 32 bytes that saves one byte", async () => {
        const { Compression } = await setup();
        const { compression, resultLength, result } =
          await Compression.compress(
            "0xf000000000000000000100004512aafe0000000001ff00000000000f"
          );

        const expectedResultLength = 31;
        const expectedPayloadLength = expectedResultLength - 1;
        const expectedLeftPad = 0;
        const expectedRightPad = 0;

        expect(compression).to.equal(Mode.Compressed);
        expect(resultLength).to.equal(expectedResultLength);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedPayloadLength,
              expectedLeftPad,
              expectedRightPad,
              "0xf000000000000000000100004512aafe0000000001ff00000000000f",
            ]
          ).padEnd(66, "0")
        );
      });
      it("Smaller than 32 bytes that saves a lot -> content shifted to the left", async () => {
        const { Compression } = await setup();
        const { compression, resultLength, result } =
          await Compression.compress("0x0100004512aafe");

        expect(compression).to.equal(Mode.Compressed);
        expect(resultLength).to.equal(10);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [9, 0, 0, "0x0100004512aafe"]
          ).padEnd(66, "0")
        );
      });

      it("Smaller than 32 bytes that saves a lot -> content shifted to the right", async () => {
        const { Compression } = await setup();
        const { compression, resultLength, result } =
          await Compression.compress("0x000000000010aabbc0");

        const expectedResultLength = 7;
        const expectedPayloadLength = expectedResultLength - 1;
        const expectedLeftPad = 5;
        const expectedRightPad = 0;

        expect(compression).to.equal(Mode.Compressed);
        expect(resultLength).to.equal(expectedResultLength);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedPayloadLength,
              expectedLeftPad,
              expectedRightPad,
              "0x10aabbc0",
            ]
          ).padEnd(66, "0")
        );
      });

      it("Smaller than 32 bytes that saves a lot -> content in the middle", async () => {
        const { Compression } = await setup();
        const { compression, resultLength, result } =
          await Compression.compress("0x00000000000ff100004512aafe000000");

        const expectedResultLength = 11;
        const expectedPayloadLength = expectedResultLength - 1;
        const expectedLeftPad = 5;
        const expectedRightPad = 3;

        expect(compression).to.equal(Mode.Compressed);
        expect(resultLength).to.equal(expectedResultLength);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedPayloadLength,
              expectedLeftPad,
              expectedRightPad,
              "0x0ff100004512aafe",
            ]
          ).padEnd(66, "0")
        );
      });
      it("Larger than 32 only zeroes", async () => {
        const { Compression } = await setup();
        const { compression, resultLength, result } =
          await Compression.compress(
            "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
          );

        const expectedResultLength = 3;
        const expectedPayloadLength = expectedResultLength - 1;
        const expectedLeftPad = 42;
        const expectedRightPad = 0;

        expect(compression).to.equal(Mode.Compressed);
        expect(resultLength).to.equal(expectedResultLength);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [expectedPayloadLength, expectedLeftPad, expectedRightPad, "0x"]
          ).padEnd(66, "0")
        );
      });
      it("Larger than 32 bytes that saves a lot", async () => {
        const { Compression } = await setup();
        const { compression, resultLength, result } =
          await Compression.compress(
            "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff100004512aafe000000"
          );

        const expectedResultLength = 11;
        const expectedPayloadLength = expectedResultLength - 1;
        const expectedLeftPad = 55;
        const expectedRightPad = 3;

        expect(compression).to.equal(Mode.Compressed);
        expect(resultLength).to.equal(expectedResultLength);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedPayloadLength,
              expectedLeftPad,
              expectedRightPad,
              "0x0ff100004512aafe",
            ]
          ).padEnd(66, "0")
        );
      });
      it("Larger than 32 bytes that saves one byte", async () => {
        const { Compression } = await setup();
        const { compression, resultLength, result } =
          await Compression.compress(
            "0x00000000ff2382837000000000000000000000000000000000000000000000ff000000000000000000000000000000"
          );

        const expectedResultLength = 31;
        const expectedPayloadLength = expectedResultLength - 1;
        const expectedLeftPad = 4;
        const expectedRightPad = 15;

        expect(compression).to.equal(Mode.Compressed);
        expect(resultLength).to.equal(expectedResultLength);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedPayloadLength,
              expectedLeftPad,
              expectedRightPad,
              "0xff2382837000000000000000000000000000000000000000000000ff",
            ]
          ).padEnd(66, "0")
        );
      });
    });
    describe("Mode: Hash", async () => {
      it("Larger than 32 bytes that misses compression by one byte", async () => {
        const { Compression } = await setup();
        const { compression, resultLength, result } =
          await Compression.compress(
            "0x000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000"
          );

        expect(compression).to.equal(Mode.Hash);
        expect(resultLength).to.equal(32);
        expect(result).to.equal(
          keccak256(
            "0x000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000"
          )
        );
      });
      it("Larger than 32 bytes that misses compression efficiency by a lot", async () => {
        const { Compression } = await setup();
        const { compression, resultLength, result } =
          await Compression.compress(
            "0x10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001"
          );

        expect(compression).to.equal(Mode.Hash);
        expect(resultLength).to.equal(32);
        expect(result).to.equal(
          keccak256(
            "0x10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001"
          )
        );
      });
      it("Larger than 32 bytes that could be compressed but is larger than 256", async () => {
        const { Compression } = await setup();

        const compValue256Bytes =
          "0xff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

        const compValue255Bytes =
          "0xff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

        let { compression, resultLength, result } = await Compression.compress(
          compValue256Bytes
        );

        expect(compression).to.equal(Mode.Hash);
        expect(resultLength).to.equal(32);
        expect(result).to.equal(keccak256(compValue256Bytes));

        ({ compression, resultLength, result } = await Compression.compress(
          compValue255Bytes
        ));

        expect(compression).to.equal(Mode.Compressed);
        expect(resultLength).to.equal(4);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [3, 0, 254, "0xff"]
          ).padEnd(66, "0")
        );
      });
    });
  });

  describe("extract", async () => {
    describe("32 bytes long data", async () => {
      it("extracting zero", async () => {
        const { Compression } = await setup();
        const { result } = await Compression.compress(
          "0x0000000000000000000000000000000000000000000000000000000000000000"
        );

        expect(await Compression.extract(result)).to.equal(
          "0x0000000000000000000000000000000000000000000000000000000000000000"
        );
      });
      it("compressible amount shifted to the left", async () => {
        const { Compression } = await setup();
        const { result } = await Compression.compress(
          "0xffaabbc000000000000000000000000000000000000000000000000000000000"
        );

        expect(await Compression.extract(result)).to.equal(
          "0xffaabbc000000000000000000000000000000000000000000000000000000000"
        );
      });
      it("compressible amount shifted to the right", async () => {
        const { Compression } = await setup();
        const { compression, resultLength, result } =
          await Compression.compress(
            "0x000000000000000000000000000000000000000000000000000000000000000a"
          );

        expect(compression).to.equal(Mode.Compressed);
        expect(resultLength).to.equal(4);
        expect(await Compression.extract(result)).to.equal(
          "0x000000000000000000000000000000000000000000000000000000000000000a"
        );
      });

      it("compressible amount in the middle", async () => {
        const { Compression } = await setup();
        const { compression, result } = await Compression.compress(
          "0x0000000000000000000100004512aafe0000000001ff00000000000000000000"
        );

        expect(compression).to.equal(Mode.Compressed);
        expect(await Compression.extract(result)).to.equal(
          "0x0000000000000000000100004512aafe0000000001ff00000000000000000000"
        );
      });
    });
    describe("different than 32 bytes long data", async () => {
      it("empty string", async () => {
        const { Compression } = await setup();
        const { compression, result } = await Compression.compress("0x");
        expect(compression).to.equal(Mode.Compressed);
        expect(await Compression.extract(result)).to.equal("0x");
      });
      it("smaller than 32 only zeroes", async () => {
        const { Compression } = await setup();
        const { compression, result } = await Compression.compress(
          "0x0000000000"
        );

        expect(compression).to.equal(Mode.Compressed);
        expect(await Compression.extract(result)).to.equal("0x0000000000");
      });

      it("Smaller than 32 bytes that saves one byte", async () => {
        const { Compression } = await setup();
        const { compression, result } = await Compression.compress(
          "0xf000000000000000000100004512aafe0000000001ff00000000000f"
        );

        expect(compression).to.equal(Mode.Compressed);
        expect(await Compression.extract(result)).to.equal(
          "0xf000000000000000000100004512aafe0000000001ff00000000000f"
        );
      });
      it("Smaller than 32 bytes that saves a lot -> content shifted to the left", async () => {
        const { Compression } = await setup();
        const { compression, result } = await Compression.compress(
          "0x0100004512aafe"
        );

        expect(compression).to.equal(Mode.Compressed);
        expect(await Compression.extract(result)).to.equal("0x0100004512aafe");
      });
      it("Smaller than 32 bytes that saves a lot -> content shifted to the right", async () => {
        const { Compression } = await setup();
        const { compression, result } = await Compression.compress(
          "0x000000000010aabbc0"
        );

        expect(compression).to.equal(Mode.Compressed);
        expect(await Compression.extract(result)).to.equal(
          "0x000000000010aabbc0"
        );
      });
      it("Smaller than 32 bytes that saves a lot -> content in the middle", async () => {
        const { Compression } = await setup();
        const { compression, result } = await Compression.compress(
          "0x00000000000ff100004512aafe000000"
        );

        expect(compression).to.equal(Mode.Compressed);
        expect(await Compression.extract(result)).to.equal(
          "0x00000000000ff100004512aafe000000"
        );
      });
      it("Larger than 32 only zeroes", async () => {
        const { Compression } = await setup();
        const { compression, result } = await Compression.compress(
          "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        );

        expect(compression).to.equal(Mode.Compressed);
        expect(await Compression.extract(result)).to.equal(
          "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        );
      });
      it("Larger than 32 bytes that saves a lot", async () => {
        const { Compression } = await setup();
        const { compression, result } = await Compression.compress(
          "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff100004512aafe000000"
        );

        expect(compression).to.equal(Mode.Compressed);
        expect(await Compression.extract(result)).to.equal(
          "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff100004512aafe000000"
        );
      });
      it("Larger than 32 bytes that saves one byte", async () => {
        const { Compression } = await setup();
        const { compression, result } = await Compression.compress(
          "0x00000000ff2382837000000000000000000000000000000000000000000000ff000000000000000000000000000000"
        );

        expect(compression).to.equal(Mode.Compressed);
        expect(await Compression.extract(result)).to.equal(
          "0x00000000ff2382837000000000000000000000000000000000000000000000ff000000000000000000000000000000"
        );
      });
    });
  });
});
