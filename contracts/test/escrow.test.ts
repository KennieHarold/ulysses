import { ethers } from "hardhat";
import { expect } from "chai";

const NONE = 0;
const CRITICAL = 4;

const REWARDS: [bigint, bigint, bigint, bigint, bigint] = [
  0n,
  ethers.parseEther("0.1"),
  ethers.parseEther("0.5"),
  ethers.parseEther("2"),
  ethers.parseEther("10"),
];

const VERDICT_TYPES = {
  Verdict: [
    { name: "severity", type: "uint8" },
    { name: "lossAmount", type: "uint256" },
    { name: "exploitHash", type: "bytes32" },
    { name: "researcher", type: "address" },
    { name: "programId", type: "uint256" },
    { name: "target", type: "address" },
    { name: "deadline", type: "uint256" },
  ],
};

async function expectRevert(promise: Promise<unknown>, errorName: string): Promise<void> {
  try {
    await promise;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    expect(message).to.contain(errorName);
    return;
  }
  throw new Error(`expected revert with ${errorName}, but the call succeeded`);
}

async function deploy() {
  const [sponsor, researcher, attestor, stranger] = await ethers.getSigners();
  const Escrow = await ethers.getContractFactory("BountyEscrow");
  const escrow: any = await Escrow.deploy(attestor.address);
  await escrow.waitForDeployment();
  const escrowAddress: string = await escrow.getAddress();
  const { chainId } = await ethers.provider.getNetwork();
  const domain = {
    name: "BountyEscrow",
    version: "1",
    chainId,
    verifyingContract: escrowAddress,
  };
  return { escrow, escrowAddress, sponsor, researcher, attestor, stranger, domain };
}

function makeVerdict(o: {
  researcher: string;
  programId: bigint;
  target: string;
  severity?: number;
  lossAmount?: bigint;
  exploitHash?: string;
  deadline?: bigint;
}) {
  return {
    severity: o.severity ?? CRITICAL,
    lossAmount: o.lossAmount ?? ethers.parseEther("100"),
    exploitHash: o.exploitHash ?? ethers.keccak256("0x3ccfd60b"),
    researcher: o.researcher,
    programId: o.programId,
    target: o.target,
    deadline: o.deadline ?? 0n,
  };
}

describe("BountyEscrow", function () {
  it("pays the tier reward, marks claimed, and rejects a second claim", async function () {
    const { escrow, sponsor, researcher, attestor, domain } = await deploy();
    const target = ethers.Wallet.createRandom().address;
    await escrow.connect(sponsor).createProgram(target, REWARDS, { value: ethers.parseEther("20") });

    const v = makeVerdict({ researcher: researcher.address, programId: 1n, target });
    const sig = await attestor.signTypedData(domain, VERDICT_TYPES, v);

    const before = await ethers.provider.getBalance(researcher.address);
    const receipt = await (await escrow.claimReward(v, sig)).wait();
    const claimedEvent = receipt.logs.some((log: any) => {
      try {
        return escrow.interface.parseLog(log)?.name === "RewardClaimed";
      } catch {
        return false;
      }
    });
    expect(claimedEvent).to.equal(true);

    const after = await ethers.provider.getBalance(researcher.address);
    expect(after - before).to.equal(REWARDS[CRITICAL]);

    const program = await escrow.getProgram(1n);
    expect(program.balance).to.equal(ethers.parseEther("20") - REWARDS[CRITICAL]);

    await expectRevert(escrow.claimReward(v, sig), "AlreadyClaimed");
  });

  it("rejects a signature from a non-attestor", async function () {
    const { escrow, sponsor, researcher, stranger, domain } = await deploy();
    const target = ethers.Wallet.createRandom().address;
    await escrow.connect(sponsor).createProgram(target, REWARDS, { value: ethers.parseEther("20") });

    const v = makeVerdict({ researcher: researcher.address, programId: 1n, target });
    const sig = await stranger.signTypedData(domain, VERDICT_TYPES, v);

    await expectRevert(escrow.claimReward(v, sig), "BadSignature");
  });

  it("rejects NONE severity", async function () {
    const { escrow, sponsor, researcher, attestor, domain } = await deploy();
    const target = ethers.Wallet.createRandom().address;
    await escrow.connect(sponsor).createProgram(target, REWARDS, { value: ethers.parseEther("20") });

    const v = makeVerdict({ researcher: researcher.address, programId: 1n, target, severity: NONE });
    const sig = await attestor.signTypedData(domain, VERDICT_TYPES, v);

    await expectRevert(escrow.claimReward(v, sig), "BadSeverity");
  });

  it("rejects an expired deadline", async function () {
    const { escrow, sponsor, researcher, attestor, domain } = await deploy();
    const target = ethers.Wallet.createRandom().address;
    await escrow.connect(sponsor).createProgram(target, REWARDS, { value: ethers.parseEther("20") });

    const now = BigInt((await ethers.provider.getBlock("latest"))!.timestamp);
    const v = makeVerdict({ researcher: researcher.address, programId: 1n, target, deadline: now - 1n });
    const sig = await attestor.signTypedData(domain, VERDICT_TYPES, v);

    await expectRevert(escrow.claimReward(v, sig), "Expired");
  });

  it("rejects a target mismatch", async function () {
    const { escrow, sponsor, researcher, attestor, domain } = await deploy();
    const target = ethers.Wallet.createRandom().address;
    await escrow.connect(sponsor).createProgram(target, REWARDS, { value: ethers.parseEther("20") });

    const wrongTarget = ethers.Wallet.createRandom().address;
    const v = makeVerdict({ researcher: researcher.address, programId: 1n, target: wrongTarget });
    const sig = await attestor.signTypedData(domain, VERDICT_TYPES, v);

    await expectRevert(escrow.claimReward(v, sig), "TargetMismatch");
  });

  it("rejects when the pool is insufficient", async function () {
    const { escrow, sponsor, researcher, attestor, domain } = await deploy();
    const target = ethers.Wallet.createRandom().address;
    await escrow.connect(sponsor).createProgram(target, REWARDS, { value: ethers.parseEther("1") });

    const v = makeVerdict({ researcher: researcher.address, programId: 1n, target });
    const sig = await attestor.signTypedData(domain, VERDICT_TYPES, v);

    await expectRevert(escrow.claimReward(v, sig), "InsufficientPool");
  });

  it("isolates funds across programs", async function () {
    const { escrow, escrowAddress, sponsor, researcher, attestor, domain } = await deploy();
    const target1 = ethers.Wallet.createRandom().address;
    const target2 = ethers.Wallet.createRandom().address;
    await escrow.connect(sponsor).createProgram(target1, REWARDS, { value: ethers.parseEther("20") });
    await escrow.connect(sponsor).createProgram(target2, REWARDS, { value: 0n });

    expect(await ethers.provider.getBalance(escrowAddress)).to.equal(ethers.parseEther("20"));

    const v = makeVerdict({ researcher: researcher.address, programId: 2n, target: target2 });
    const sig = await attestor.signTypedData(domain, VERDICT_TYPES, v);

    await expectRevert(escrow.claimReward(v, sig), "InsufficientPool");
  });

  it("allows a timelocked sponsor withdraw only after the delay", async function () {
    const { escrow, sponsor, stranger } = await deploy();
    const target = ethers.Wallet.createRandom().address;
    await escrow.connect(sponsor).createProgram(target, REWARDS, { value: ethers.parseEther("5") });

    await expectRevert(escrow.connect(sponsor).withdraw(1n), "WithdrawNotRequested");
    await expectRevert(escrow.connect(stranger).requestWithdraw(1n), "NotSponsor");

    await escrow.connect(sponsor).requestWithdraw(1n);
    await expectRevert(escrow.connect(sponsor).withdraw(1n), "WithdrawLocked");

    await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    await (await escrow.connect(sponsor).withdraw(1n)).wait();
    const program = await escrow.getProgram(1n);
    expect(program.balance).to.equal(0n);
  });
});
