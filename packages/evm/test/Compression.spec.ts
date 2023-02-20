import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { keccak256, solidityPack } from "ethers/lib/utils";
import hre, { deployments } from "hardhat";

enum Mode {
  Empty = 0,
  Uncompressed,
  Word,
  Bytes,
  Hashed,
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

  describe("compressWord", async () => {
    describe("Uncompressed", async () => {
      it("Misses compression efficiency", async () => {
        const { Compression } = await setup();
        const { compression } = await Compression.compressWord(
          "0xf00000000000000000000000000000000000000000000000000000000000000f"
        );
        expect(compression).to.equal(Mode.Uncompressed);
      });
      it("Misses compression efficiency by one byte", async () => {
        const { Compression } = await setup();
        let { compression } = await Compression.compressWord(
          "0x000001ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        );
        expect(compression).to.equal(Mode.Uncompressed);

        ({ compression } = await Compression.compressWord(
          "0x000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        ));
        expect(compression).to.not.equal(Mode.Uncompressed);

        ({ compression } = await Compression.compressWord(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffff800000"
        ));
        expect(compression).to.equal(Mode.Uncompressed);

        ({ compression } = await Compression.compressWord(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000"
        ));
        expect(compression).to.not.equal(Mode.Uncompressed);

        ({ compression } = await Compression.compressWord(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffff800000"
        ));
        expect(compression).to.equal(Mode.Uncompressed);

        ({ compression } = await Compression.compressWord(
          "0x00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00"
        ));
        expect(compression).to.equal(Mode.Uncompressed);
        ({ compression } = await Compression.compressWord(
          "0x0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00"
        ));
        expect(compression).to.not.equal(Mode.Uncompressed);

        ({ compression } = await Compression.compressWord(
          "0x00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000"
        ));
        expect(compression).to.not.equal(Mode.Uncompressed);
      });
    });
    describe("Word", async () => {
      it("compressing zero", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compressWord(
          "0x0000000000000000000000000000000000000000000000000000000000000000"
        );

        const expectedSize = 2;
        const expectedOffset = 0;

        expect(compression).to.equal(Mode.Word);
        expect(size).to.equal(expectedSize);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "bytes"],
            [expectedSize, expectedOffset, "0x"]
          ).padEnd(66, "0")
        );
      });
      it("compressible amount shifted to the left", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compressWord(
          "0xffaabbc000000000000000000000000000000000000000000000000000000000"
        );

        const expectedSize = 6;
        const expectedOffset = 0;

        expect(compression).to.equal(Mode.Word);
        expect(size).to.equal(expectedSize);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "bytes"],
            [expectedSize, expectedOffset, "0xffaabbc0"]
          ).padEnd(66, "0")
        );
      });
      it("compressible amount shifted to the right", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compressWord(
          "0x000000000000000000000000000000000000000000000000000000000000000a"
        );

        const expectedSize = 3;
        const expectedOffset = 31;

        expect(compression).to.equal(Mode.Word);
        expect(size).to.equal(expectedSize);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "bytes"],
            [expectedSize, expectedOffset, "0x0a"]
          ).padEnd(66, "0")
        );
      });
      it("compressible amount in the middle", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compressWord(
          "0x0000000000000000000100004512aafe0000000001ff00000000000000000000"
        );

        const expectedSize = 15;
        const expectedOffset = 9;

        expect(compression).to.equal(Mode.Word);
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
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compressBytes(
          "0x"
        );

        const expectedPackedSize = 3;
        const expectedOffset = 0;
        const expectedOriginalSize = 0;

        expect(compression).to.equal(Mode.Bytes);
        expect(size).to.equal(expectedPackedSize);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [expectedPackedSize, expectedOffset, expectedOriginalSize, "0x"]
          ).padEnd(66, "0")
        );
      });
      it("smaller than 32 only zeroes", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compressBytes(
          "0x0000000000"
        );

        const expectedPackedSize = 3;
        const expectedOffset = 0;
        const expectedOriginalSize = 5;

        expect(compression).to.equal(Mode.Bytes);
        expect(size).to.equal(expectedPackedSize);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [expectedPackedSize, expectedOffset, expectedOriginalSize, "0x"]
          ).padEnd(66, "0")
        );
      });
      it("Smaller than 32 bytes that saves one byte", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compressBytes(
          "0xf000000000000000000100004512aafe0000000001ff00000000000f"
        );

        const expectedPackedSize = 31;
        const expectedOffset = 0;
        const expectedOriginalSize = 28;

        expect(compression).to.equal(Mode.Bytes);
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
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compressBytes(
          "0x0100004512aafe"
        );

        expect(compression).to.equal(Mode.Bytes);
        expect(size).to.equal(10);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [10, 0, 7, "0x0100004512aafe"]
          ).padEnd(66, "0")
        );
      });
      it("Smaller than 32 bytes that saves a lot -> content shifted to the right", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compressBytes(
          "0x000000000010aabbc0"
        );

        const expectedPackedSize = 7;
        const expectedOffset = 5;
        const expectedOriginalSize = 9;

        expect(compression).to.equal(Mode.Bytes);
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
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compressBytes(
          "0x00000000000ff100004512aafe000000"
        );

        const expectedPackedSize = 11;
        const expectedOffset = 5;
        const expectedOriginalSize = 16;

        expect(compression).to.equal(Mode.Bytes);
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
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compressBytes(
          "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        );

        const expectedPackedSize = 3;
        const expectedOffset = 0;
        const expectedOriginalSize = 42;

        expect(compression).to.equal(Mode.Bytes);
        expect(size).to.equal(expectedPackedSize);
        expect(result).to.equal(
          solidityPack(
            ["uint8", "uint8", "uint8", "bytes"],
            [expectedPackedSize, expectedOffset, expectedOriginalSize, "0x"]
          ).padEnd(66, "0")
        );
      });
      it("Larger than 32 bytes that saves a lot", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compressBytes(
          "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff100004512aafe000000"
        );

        const expectedPackedSize = 11;
        const expectedOffset = 55;
        const expectedOriginalSize = 66;

        expect(compression).to.equal(Mode.Bytes);
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
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compressBytes(
          "0x00000000ff2382837000000000000000000000000000000000000000000000ff000000000000000000000000000000"
        );

        const expectedPackedSize = 31;
        const expectedOffset = 4;
        const expectedOriginalSize = 47;

        expect(compression).to.equal(Mode.Bytes);
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
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compressBytes(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        );

        expect(compression).to.equal(Mode.Hashed);
        expect(size).to.equal(32);
        expect(result).to.equal(
          keccak256(
            "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
          )
        );
      });
      it("Larger than 32 bytes that misses compression by one byte", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compressBytes(
          "0x000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000"
        );

        expect(compression).to.equal(Mode.Hashed);
        expect(size).to.equal(32);
        expect(result).to.equal(
          keccak256(
            "0x000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000"
          )
        );
      });
      it("Larger than 32 bytes that misses compression efficiency by a lot", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compressBytes(
          "0x10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001"
        );

        expect(compression).to.equal(Mode.Hashed);
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

        let { compression, size, result } = await Compression.compressBytes(
          compValue256Bytes
        );

        expect(compression).to.equal(Mode.Hashed);
        expect(size).to.equal(32);
        expect(result).to.equal(keccak256(compValue256Bytes));

        ({ compression, size, result } = await Compression.compressBytes(
          compValue255Bytes
        ));

        expect(compression).to.equal(Mode.Bytes);
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

  describe("extractWord", async () => {
    describe("Word", async () => {
      it("extracting zero", async () => {
        const { Compression } = await setup();
        const { result } = await Compression.compressWord(
          "0x0000000000000000000000000000000000000000000000000000000000000000"
        );

        expect(await Compression.extractWord(result)).to.equal(
          "0x0000000000000000000000000000000000000000000000000000000000000000"
        );
      });
      it("compressible amount shifted to the left", async () => {
        const { Compression } = await setup();
        const { result } = await Compression.compressWord(
          "0xffaabbc000000000000000000000000000000000000000000000000000000000"
        );

        expect(await Compression.extractWord(result)).to.equal(
          "0xffaabbc000000000000000000000000000000000000000000000000000000000"
        );
      });
      it("compressible amount shifted to the right", async () => {
        const { Compression } = await setup();
        const { compression, size, result } = await Compression.compressWord(
          "0x000000000000000000000000000000000000000000000000000000000000000a"
        );

        expect(compression).to.equal(Mode.Word);
        expect(size).to.equal(3);
        expect(await Compression.extractWord(result)).to.equal(
          "0x000000000000000000000000000000000000000000000000000000000000000a"
        );
      });

      it("compressible amount in the middle", async () => {
        const { Compression } = await setup();
        const { compression, result } = await Compression.compressWord(
          "0x0000000000000000000100004512aafe0000000001ff00000000000000000000"
        );

        expect(compression).to.equal(Mode.Word);
        expect(await Compression.extractWord(result)).to.equal(
          "0x0000000000000000000100004512aafe0000000001ff00000000000000000000"
        );
      });
    });
  });

  describe("extractBytes", async () => {
    it("empty string", async () => {
      const { Compression } = await setup();
      const { compression, result } = await Compression.compressBytes("0x");
      expect(compression).to.equal(Mode.Bytes);
      expect(await Compression.extractBytes(result)).to.equal("0x");
    });
    it("smaller than 32 only zeroes", async () => {
      const { Compression } = await setup();
      const { compression, result } = await Compression.compressBytes(
        "0x0000000000"
      );

      expect(compression).to.equal(Mode.Bytes);
      expect(await Compression.extractBytes(result)).to.equal("0x0000000000");
    });

    it("Smaller than 32 bytes that saves one byte", async () => {
      const { Compression } = await setup();
      const { compression, result } = await Compression.compressBytes(
        "0xf000000000000000000100004512aafe0000000001ff00000000000f"
      );

      expect(compression).to.equal(Mode.Bytes);
      expect(await Compression.extractBytes(result)).to.equal(
        "0xf000000000000000000100004512aafe0000000001ff00000000000f"
      );
    });
    it("Smaller than 32 bytes that saves a lot -> content shifted to the left", async () => {
      const { Compression } = await setup();
      const { compression, result } = await Compression.compressBytes(
        "0x0100004512aafe"
      );

      expect(compression).to.equal(Mode.Bytes);
      expect(await Compression.extractBytes(result)).to.equal(
        "0x0100004512aafe"
      );
    });
    it("Smaller than 32 bytes that saves a lot -> content shifted to the right", async () => {
      const { Compression } = await setup();
      const { compression, result } = await Compression.compressBytes(
        "0x000000000010aabbc0"
      );

      expect(compression).to.equal(Mode.Bytes);
      expect(await Compression.extractBytes(result)).to.equal(
        "0x000000000010aabbc0"
      );
    });
    it("Smaller than 32 bytes that saves a lot -> content in the middle", async () => {
      const { Compression } = await setup();
      const { compression, result } = await Compression.compressBytes(
        "0x00000000000ff100004512aafe000000"
      );

      expect(compression).to.equal(Mode.Bytes);
      expect(await Compression.extractBytes(result)).to.equal(
        "0x00000000000ff100004512aafe000000"
      );
    });
    it("Larger than 32 only zeroes", async () => {
      const { Compression } = await setup();
      const { compression, result } = await Compression.compressBytes(
        "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
      );

      expect(compression).to.equal(Mode.Bytes);
      expect(await Compression.extractBytes(result)).to.equal(
        "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
      );
    });
    it("Larger than 32 bytes that saves a lot", async () => {
      const { Compression } = await setup();
      const { compression, result } = await Compression.compressBytes(
        "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff100004512aafe000000"
      );

      expect(compression).to.equal(Mode.Bytes);
      expect(await Compression.extractBytes(result)).to.equal(
        "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff100004512aafe000000"
      );
    });
    it("Larger than 32 bytes that saves one byte", async () => {
      const { Compression } = await setup();
      const { compression, result } = await Compression.compressBytes(
        "0x00000000ff2382837000000000000000000000000000000000000000000000ff000000000000000000000000000000"
      );

      expect(compression).to.equal(Mode.Bytes);
      expect(await Compression.extractBytes(result)).to.equal(
        "0x00000000ff2382837000000000000000000000000000000000000000000000ff000000000000000000000000000000"
      );
    });
  });
});
