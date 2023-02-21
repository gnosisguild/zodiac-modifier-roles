import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { keccak256, solidityPack } from "ethers/lib/utils";
import hre, { deployments } from "hardhat";

enum Mode {
  Empty = 0,
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
        expect(compression).to.equal(Mode.Uncompressed);
      });
      it("Misses compression efficiency by one byte", async () => {
        const { Compression } = await setup();
        let { compression } = await Compression.compress(
          "0x000001ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        );
        expect(compression).to.equal(Mode.Uncompressed);

        ({ compression } = await Compression.compress(
          "0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        ));
        expect(compression).to.equal(Mode.Compressed);

        ({ compression } = await Compression.compress(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffff80000000"
        ));
        expect(compression).to.equal(Mode.Uncompressed);

        ({ compression } = await Compression.compress(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000"
        ));
        expect(compression).to.equal(Mode.Compressed);

        ({ compression } = await Compression.compress(
          "0x00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000"
        ));
        expect(compression).to.equal(Mode.Uncompressed);

        ({ compression } = await Compression.compress(
          "0x0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000"
        ));
        expect(compression).to.equal(Mode.Compressed);
      });
    });
    describe("Mode Compressed", async () => {
      it("compressing zero", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compress(
          "0x0000000000000000000000000000000000000000000000000000000000000000"
        );

        const expectedSizeCompressed = 3;
        const expectedSizeExtracted = 32;
        const expectedOffset = 0;

        expect(compression).to.equal(Mode.Compressed);
        expect(size).to.equal(expectedSizeCompressed);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedSizeCompressed,
              expectedSizeExtracted,
              expectedOffset,
              "0x",
            ]
          ).padEnd(66, "0")
        );
      });
      it("compressible amount shifted to the left", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compress(
          "0xffaabbc000000000000000000000000000000000000000000000000000000000"
        );

        const expectedSizeCompressed = 7;
        const expectedSizeExtracted = 32;
        const expectedOffset = 0;

        expect(compression).to.equal(Mode.Compressed);
        expect(size).to.equal(expectedSizeCompressed);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedSizeCompressed,
              expectedSizeExtracted,
              expectedOffset,
              "0xffaabbc0",
            ]
          ).padEnd(66, "0")
        );
      });
      it("compressible amount shifted to the right", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compress(
          "0x000000000000000000000000000000000000000000000000000000000000000a"
        );

        const expectedSizeCompressed = 4;
        const expectedSizeExtracted = 32;
        const expectedOffset = 31;

        expect(compression).to.equal(Mode.Compressed);
        expect(size).to.equal(expectedSizeCompressed);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedSizeCompressed,
              expectedSizeExtracted,
              expectedOffset,
              "0x0a",
            ]
          ).padEnd(66, "0")
        );
      });
      it("compressible amount in the middle", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compress(
          "0x0000000000000000000100004512aafe0000000001ff00000000000000000000"
        );

        const expectedSizeCompressed = 16;
        const expectedSizeExtracted = 32;
        const expectedOffset = 9;

        expect(compression).to.equal(Mode.Compressed);
        expect(size).to.equal(expectedSizeCompressed);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedSizeCompressed,
              expectedSizeExtracted,
              expectedOffset,
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
        const { compression, size, result } = await Compression.compress("0x");

        const expectedSizeCompressed = 3;
        const expectedSizeExtracted = 0;
        const expectedOffset = 0;

        expect(compression).to.equal(Mode.Compressed);
        expect(size).to.equal(expectedSizeCompressed);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedSizeCompressed,
              expectedSizeExtracted,
              expectedOffset,
              "0x",
            ]
          ).padEnd(66, "0")
        );
      });
      it("smaller than 32 only zeroes", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compress(
          "0x0000000000"
        );

        const expectedSizeCompressed = 3;
        const expectedSizeExtracted = 5;
        const expectedOffset = 0;

        expect(compression).to.equal(Mode.Compressed);
        expect(size).to.equal(expectedSizeCompressed);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedSizeCompressed,
              expectedSizeExtracted,
              expectedOffset,
              "0x",
            ]
          ).padEnd(66, "0")
        );
      });
      it("Smaller than 32 bytes that saves one byte", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compress(
          "0xf000000000000000000100004512aafe0000000001ff00000000000f"
        );

        const expectedSizeCompressed = 31;
        const expectedSizeExtracted = 28;
        const expectedOffset = 0;

        expect(compression).to.equal(Mode.Compressed);
        expect(size).to.equal(expectedSizeCompressed);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedSizeCompressed,
              expectedSizeExtracted,
              expectedOffset,
              "0xf000000000000000000100004512aafe0000000001ff00000000000f",
            ]
          ).padEnd(66, "0")
        );
      });
      it("Smaller than 32 bytes that saves a lot -> content shifted to the left", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compress(
          "0x0100004512aafe"
        );

        expect(compression).to.equal(Mode.Compressed);
        expect(size).to.equal(10);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [10, 7, 0, "0x0100004512aafe"]
          ).padEnd(66, "0")
        );
      });

      it("Smaller than 32 bytes that saves a lot -> content shifted to the right", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compress(
          "0x000000000010aabbc0"
        );

        const expectedSizeCompressed = 7;
        const expectedSizeExtracted = 9;
        const expectedOffset = 5;

        expect(compression).to.equal(Mode.Compressed);
        expect(size).to.equal(expectedSizeCompressed);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedSizeCompressed,
              expectedSizeExtracted,
              expectedOffset,
              "0x10aabbc0",
            ]
          ).padEnd(66, "0")
        );
      });
      it("Smaller than 32 bytes that saves a lot -> content in the middle", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compress(
          "0x00000000000ff100004512aafe000000"
        );

        const expectedSizeCompressed = 11;
        const expectedSizeExtracted = 16;
        const expectedOffset = 5;

        expect(compression).to.equal(Mode.Compressed);
        expect(size).to.equal(expectedSizeCompressed);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedSizeCompressed,
              expectedSizeExtracted,
              expectedOffset,
              "0x0ff100004512aafe",
            ]
          ).padEnd(66, "0")
        );
      });
      it("Larger than 32 only zeroes", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compress(
          "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        );

        const expectedSizeCompressed = 3;
        const expectedSizeExtracted = 42;
        const expectedOffset = 0;

        expect(compression).to.equal(Mode.Compressed);
        expect(size).to.equal(expectedSizeCompressed);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedSizeCompressed,
              expectedSizeExtracted,
              expectedOffset,
              "0x",
            ]
          ).padEnd(66, "0")
        );
      });
      it("Larger than 32 bytes that saves a lot", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compress(
          "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff100004512aafe000000"
        );

        const expectedSizeCompressed = 11;
        const expectedSizeExtracted = 66;
        const expectedOffset = 55;

        expect(compression).to.equal(Mode.Compressed);
        expect(size).to.equal(expectedSizeCompressed);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedSizeCompressed,
              expectedSizeExtracted,
              expectedOffset,
              "0x0ff100004512aafe",
            ]
          ).padEnd(66, "0")
        );
      });
      it("Larger than 32 bytes that saves one byte", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compress(
          "0x00000000ff2382837000000000000000000000000000000000000000000000ff000000000000000000000000000000"
        );

        const expectedSizeCompressed = 31;
        const expectedSizeExtracted = 47;
        const expectedOffset = 4;

        expect(compression).to.equal(Mode.Compressed);
        expect(size).to.equal(expectedSizeCompressed);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedSizeCompressed,
              expectedSizeExtracted,
              expectedOffset,
              "0xff2382837000000000000000000000000000000000000000000000ff",
            ]
          ).padEnd(66, "0")
        );
      });
    });
    describe("Mode: Hash", async () => {
      it("Larger than 32 bytes that misses compression by one byte", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compress(
          "0x000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000"
        );

        expect(compression).to.equal(Mode.Hash);
        expect(size).to.equal(32);
        expect(result).to.equal(
          keccak256(
            "0x000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000"
          )
        );
      });
      it("Larger than 32 bytes that misses compression efficiency by a lot", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compress(
          "0x10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001"
        );

        expect(compression).to.equal(Mode.Hash);
        expect(size).to.equal(32);
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

        let { compression, size, result } = await Compression.compress(
          compValue256Bytes
        );

        expect(compression).to.equal(Mode.Hash);
        expect(size).to.equal(32);
        expect(result).to.equal(keccak256(compValue256Bytes));

        ({ compression, size, result } = await Compression.compress(
          compValue255Bytes
        ));

        expect(compression).to.equal(Mode.Compressed);
        expect(size).to.equal(4);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [4, 255, 0, "0xff"]
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
        const { compression, size, result } = await Compression.compress(
          "0x000000000000000000000000000000000000000000000000000000000000000a"
        );

        expect(compression).to.equal(Mode.Compressed);
        expect(size).to.equal(4);
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
