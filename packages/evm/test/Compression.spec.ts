import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { keccak256, solidityPack } from "ethers/lib/utils";
import hre, { deployments } from "hardhat";

enum Compression {
  None = 0,
  Static,
  Bytes,
  Keccak256,
}

describe.only("Compression", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();

    const MockCompValueCompression = await hre.ethers.getContractFactory(
      "MockCompValueCompression"
    );
    const CompValueCompression = await MockCompValueCompression.deploy();

    return {
      CompValueCompression,
    };
  });

  describe("compressBytes32", async () => {
    describe("None", async () => {
      it("Misses compression efficiency", async () => {
        const { CompValueCompression } = await setup();
        const { compression } = await CompValueCompression.compressBytes32(
          "0xf00000000000000000000000000000000000000000000000000000000000000f"
        );
        expect(compression).to.equal(Compression.None);
      });
      it("Misses compression efficiency by one byte", async () => {
        const { CompValueCompression } = await setup();
        let { compression } = await CompValueCompression.compressBytes32(
          "0x000001ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        );
        expect(compression).to.equal(Compression.None);

        ({ compression } = await CompValueCompression.compressBytes32(
          "0x000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        ));
        expect(compression).to.not.equal(Compression.None);

        ({ compression } = await CompValueCompression.compressBytes32(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffff800000"
        ));
        expect(compression).to.equal(Compression.None);

        ({ compression } = await CompValueCompression.compressBytes32(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000"
        ));
        expect(compression).to.not.equal(Compression.None);

        ({ compression } = await CompValueCompression.compressBytes32(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffff800000"
        ));
        expect(compression).to.equal(Compression.None);

        ({ compression } = await CompValueCompression.compressBytes32(
          "0x00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00"
        ));
        expect(compression).to.equal(Compression.None);
        ({ compression } = await CompValueCompression.compressBytes32(
          "0x0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00"
        ));
        expect(compression).to.not.equal(Compression.None);

        ({ compression } = await CompValueCompression.compressBytes32(
          "0x00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000"
        ));
        expect(compression).to.not.equal(Compression.None);
      });
    });
    describe("Bytes32", async () => {
      it("compressing zero", async () => {
        const { CompValueCompression } = await setup();
        const { compression, size, result } =
          await CompValueCompression.compressBytes32(
            "0x0000000000000000000000000000000000000000000000000000000000000000"
          );

        const expectedSize = 2;
        const expectedOffset = 0;

        expect(compression).to.equal(Compression.Static);
        expect(size).to.equal(expectedSize);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "bytes"],
            [expectedSize, expectedOffset, "0x"]
          ).padEnd(66, "0")
        );
      });
      it("compressible amount shifted to the left", async () => {
        const { CompValueCompression } = await setup();
        const { compression, size, result } =
          await CompValueCompression.compressBytes32(
            "0xffaabbc000000000000000000000000000000000000000000000000000000000"
          );

        const expectedSize = 6;
        const expectedOffset = 0;

        expect(compression).to.equal(Compression.Static);
        expect(size).to.equal(expectedSize);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "bytes"],
            [expectedSize, expectedOffset, "0xffaabbc0"]
          ).padEnd(66, "0")
        );
      });
      it("compressible amount shifted to the right", async () => {
        const { CompValueCompression } = await setup();
        const { compression, size, result } =
          await CompValueCompression.compressBytes32(
            "0x000000000000000000000000000000000000000000000000000000000000000a"
          );

        const expectedSize = 3;
        const expectedOffset = 31;

        expect(compression).to.equal(Compression.Static);
        expect(size).to.equal(expectedSize);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "bytes"],
            [expectedSize, expectedOffset, "0x0a"]
          ).padEnd(66, "0")
        );
      });
      it("compressible amount in the middle", async () => {
        const { CompValueCompression } = await setup();
        const { compression, size, result } =
          await CompValueCompression.compressBytes32(
            "0x0000000000000000000100004512aafe0000000001ff00000000000000000000"
          );

        const expectedSize = 15;
        const expectedOffset = 9;

        expect(compression).to.equal(Compression.Static);
        expect(size).to.equal(expectedSize);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "bytes"],
            [expectedSize, expectedOffset, "0x0100004512aafe0000000001ff"]
          ).padEnd(66, "0")
        );
      });
    });
  });

  describe("compressBytes", async () => {
    describe("Bytes", async () => {
      it("empty string", async () => {
        const { CompValueCompression } = await setup();
        const { compression, size, result } =
          await CompValueCompression.compressBytes("0x");

        const expectedPackedSize = 3;
        const expectedOffset = 0;
        const expectedOriginalSize = 0;

        expect(compression).to.equal(Compression.Bytes);
        expect(size).to.equal(expectedPackedSize);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [expectedPackedSize, expectedOffset, expectedOriginalSize, "0x"]
          ).padEnd(66, "0")
        );
      });
      it("smaller than 32 only zeroes", async () => {
        const { CompValueCompression } = await setup();
        const { compression, size, result } =
          await CompValueCompression.compressBytes("0x0000000000");

        const expectedPackedSize = 3;
        const expectedOffset = 0;
        const expectedOriginalSize = 5;

        expect(compression).to.equal(Compression.Bytes);
        expect(size).to.equal(expectedPackedSize);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [expectedPackedSize, expectedOffset, expectedOriginalSize, "0x"]
          ).padEnd(66, "0")
        );
      });
      it("Smaller than 32 bytes that saves one byte", async () => {
        const { CompValueCompression } = await setup();
        const { compression, size, result } =
          await CompValueCompression.compressBytes(
            "0xf000000000000000000100004512aafe0000000001ff00000000000f"
          );

        const expectedPackedSize = 31;
        const expectedOffset = 0;
        const expectedOriginalSize = 28;

        expect(compression).to.equal(Compression.Bytes);
        expect(size).to.equal(expectedPackedSize);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedPackedSize,
              expectedOffset,
              expectedOriginalSize,
              "0xf000000000000000000100004512aafe0000000001ff00000000000f",
            ]
          ).padEnd(66, "0")
        );
      });
      it("Smaller than 32 bytes that saves a lot -> content shifted to the left", async () => {
        const { CompValueCompression } = await setup();
        const { compression, size, result } =
          await CompValueCompression.compressBytes("0x0100004512aafe");

        expect(compression).to.equal(Compression.Bytes);
        expect(size).to.equal(10);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [10, 0, 7, "0x0100004512aafe"]
          ).padEnd(66, "0")
        );
      });
      it("Smaller than 32 bytes that saves a lot -> content shifted to the right", async () => {
        const { CompValueCompression } = await setup();
        const { compression, size, result } =
          await CompValueCompression.compressBytes("0x000000000010aabbc0");

        const expectedPackedSize = 7;
        const expectedOffset = 5;
        const expectedOriginalSize = 9;

        expect(compression).to.equal(Compression.Bytes);
        expect(size).to.equal(expectedPackedSize);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedPackedSize,
              expectedOffset,
              expectedOriginalSize,
              "0x10aabbc0",
            ]
          ).padEnd(66, "0")
        );
      });
      it("Smaller than 32 bytes that saves a lot -> content in the middle", async () => {
        const { CompValueCompression } = await setup();
        const { compression, size, result } =
          await CompValueCompression.compressBytes(
            "0x00000000000ff100004512aafe000000"
          );

        const expectedPackedSize = 11;
        const expectedOffset = 5;
        const expectedOriginalSize = 16;

        expect(compression).to.equal(Compression.Bytes);
        expect(size).to.equal(expectedPackedSize);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedPackedSize,
              expectedOffset,
              expectedOriginalSize,
              "0x0ff100004512aafe",
            ]
          ).padEnd(66, "0")
        );
      });
      it("Larger than 32 only zeroes", async () => {
        const { CompValueCompression } = await setup();
        const { compression, size, result } =
          await CompValueCompression.compressBytes(
            "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
          );

        const expectedPackedSize = 3;
        const expectedOffset = 0;
        const expectedOriginalSize = 42;

        expect(compression).to.equal(Compression.Bytes);
        expect(size).to.equal(expectedPackedSize);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [expectedPackedSize, expectedOffset, expectedOriginalSize, "0x"]
          ).padEnd(66, "0")
        );
      });
      it("Larger than 32 bytes that saves a lot", async () => {
        const { CompValueCompression } = await setup();
        const { compression, size, result } =
          await CompValueCompression.compressBytes(
            "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff100004512aafe000000"
          );

        const expectedPackedSize = 11;
        const expectedOffset = 55;
        const expectedOriginalSize = 66;

        expect(compression).to.equal(Compression.Bytes);
        expect(size).to.equal(expectedPackedSize);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedPackedSize,
              expectedOffset,
              expectedOriginalSize,
              "0x0ff100004512aafe",
            ]
          ).padEnd(66, "0")
        );
      });
      it("Larger than 32 bytes that saves one byte", async () => {
        const { CompValueCompression } = await setup();
        const { compression, size, result } =
          await CompValueCompression.compressBytes(
            "0x00000000ff2382837000000000000000000000000000000000000000000000ff000000000000000000000000000000"
          );

        const expectedPackedSize = 31;
        const expectedOffset = 4;
        const expectedOriginalSize = 47;

        expect(compression).to.equal(Compression.Bytes);
        expect(size).to.equal(expectedPackedSize);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [
              expectedPackedSize,
              expectedOffset,
              expectedOriginalSize,
              "0xff2382837000000000000000000000000000000000000000000000ff",
            ]
          ).padEnd(66, "0")
        );
      });
    });
    describe("Keccak256", async () => {
      it("Smaller than 32 bytes that misses compression by one byte", async () => {
        const { CompValueCompression } = await setup();
        const { compression, size, result } =
          await CompValueCompression.compressBytes(
            "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
          );

        expect(compression).to.equal(Compression.Keccak256);
        expect(size).to.equal(32);
        expect(result).to.equal(
          keccak256(
            "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
          )
        );
      });
      it("Larger than 32 bytes that misses compression by one byte", async () => {
        const { CompValueCompression } = await setup();
        const { compression, size, result } =
          await CompValueCompression.compressBytes(
            "0x000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000"
          );

        expect(compression).to.equal(Compression.Keccak256);
        expect(size).to.equal(32);
        expect(result).to.equal(
          keccak256(
            "0x000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000"
          )
        );
      });
      it("Larger than 32 bytes that misses compression efficiency by a lot", async () => {
        const { CompValueCompression } = await setup();
        const { compression, size, result } =
          await CompValueCompression.compressBytes(
            "0x10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001"
          );

        expect(compression).to.equal(Compression.Keccak256);
        expect(size).to.equal(32);
        expect(result).to.equal(
          keccak256(
            "0x10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001"
          )
        );
      });
      it("Larger than 32 bytes that could be compressed but is larger than 256", async () => {
        const { CompValueCompression } = await setup();

        const compValue256Bytes =
          "0xff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

        const compValue255Bytes =
          "0xff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

        let { compression, size, result } =
          await CompValueCompression.compressBytes(compValue256Bytes);

        expect(compression).to.equal(Compression.Keccak256);
        expect(size).to.equal(32);
        expect(result).to.equal(keccak256(compValue256Bytes));

        ({ compression, size, result } =
          await CompValueCompression.compressBytes(compValue255Bytes));

        expect(compression).to.equal(Compression.Bytes);
        expect(size).to.equal(4);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [4, 0, 255, "0xff"]
          ).padEnd(66, "0")
        );
      });
    });
  });
});
