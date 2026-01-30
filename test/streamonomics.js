const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Streamonomics", function () {
  it("reverts when step is zero", async function () {
    const Streamonomics = await ethers.getContractFactory("Streamonomics");
    const stream = await Streamonomics.deploy();
    await stream.deployed();

    const percentage = [10];
    const start = [1];
    const step = [0];
    const limit = [1];

    await expect(stream.setStreamonomics(percentage, start, step, limit))
      .to.be.revertedWith("!step");
  });
});