describe("Flushing", async () => {
  async function setup() {}

  describe("singleEntrypoint", async () => {
    it.skip(
      "consumption in failing OR branch does not influence successful branch"
    );

    it.skip(
      "consumption in failing XOR branch does not influence successful branch"
    );

    it.skip("consumption in AND branch influences other branches");

    it.skip("consumption in ArraySome gets counted once");

    it.skip("consumption in ArrayEvery gets counted for all elements");

    it.skip("consumption in ArraySubset gets counted for every hit");

    it.skip("failing AND restores in memory consumptions");

    it.skip("failing OR restores in memory consumptions");

    it.skip("failing XOR restores in memory consumptions");

    it.skip("failing Matches restores in memory consumptions");
  });

  describe("multiEntrypoint", async () => {
    it.skip(
      "several entrypoints with consumptions and no overlap get carried and flushed"
    );
    it.skip(
      "several entrypoints with consumptions and overlap exhaust an allowance"
    );
    it.skip(
      "several entrypoints with consumptions and overlap get carried and flushed"
    );
    it.skip("middle entrypoint with no consumptions still carries");
  });
});
