// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BountyEscrow {
    uint8 private constant SEV_MAX = 4;
    uint256 public constant WITHDRAW_DELAY = 3 days;

    struct Program {
        address sponsor;
        address target;
        uint256 balance;
        uint256[5] rewards;
        uint256 withdrawUnlockAt;
        bool exists;
    }

    struct Verdict {
        uint8 severity;
        uint256 lossAmount;
        bytes32 exploitHash;
        address researcher;
        uint256 programId;
        address target;
        uint256 deadline;
    }

    bytes32 private constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant VERDICT_TYPEHASH =
        keccak256(
            "Verdict(uint8 severity,uint256 lossAmount,bytes32 exploitHash,address researcher,uint256 programId,address target,uint256 deadline)"
        );
    uint256 private constant HALF_N =
        0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0;

    string public constant NAME = "BountyEscrow";
    string public constant VERSION = "1";

    bytes32 public immutable DOMAIN_SEPARATOR;
    address public immutable trustedAttestor;

    uint256 public nextProgramId = 1;
    mapping(uint256 => Program) private _programs;
    mapping(bytes32 => bool) public claimed;

    uint256 private _lock = 1;

    event ProgramCreated(
        uint256 indexed programId,
        address indexed sponsor,
        address indexed target,
        uint256[5] rewards,
        uint256 funding
    );
    event BountyFunded(uint256 indexed programId, address indexed from, uint256 amount, uint256 newBalance);
    event RewardClaimed(
        uint256 indexed programId,
        bytes32 indexed exploitHash,
        address indexed researcher,
        uint8 severity,
        uint256 reward,
        bytes32 claimId
    );
    event WithdrawRequested(uint256 indexed programId, address indexed sponsor, uint256 unlockAt);
    event Withdrawn(uint256 indexed programId, address indexed sponsor, uint256 amount);

    error NotSponsor();
    error UnknownProgram();
    error BadSeverity();
    error TargetMismatch();
    error Expired();
    error BadSignature();
    error AlreadyClaimed();
    error InsufficientPool();
    error TransferFailed();
    error Reentrancy();
    error WithdrawNotRequested();
    error WithdrawLocked();
    error ZeroAddress();

    modifier nonReentrant() {
        if (_lock == 2) revert Reentrancy();
        _lock = 2;
        _;
        _lock = 1;
    }

    constructor(address attestor) {
        if (attestor == address(0)) revert ZeroAddress();
        trustedAttestor = attestor;
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes(NAME)),
                keccak256(bytes(VERSION)),
                block.chainid,
                address(this)
            )
        );
    }

    function createProgram(address target, uint256[5] calldata rewards)
        external
        payable
        returns (uint256 programId)
    {
        if (target == address(0)) revert ZeroAddress();
        programId = nextProgramId++;
        Program storage p = _programs[programId];
        p.sponsor = msg.sender;
        p.target = target;
        p.rewards = rewards;
        p.balance = msg.value;
        p.exists = true;
        emit ProgramCreated(programId, msg.sender, target, rewards, msg.value);
    }

    function fundProgram(uint256 programId) external payable {
        Program storage p = _programs[programId];
        if (!p.exists) revert UnknownProgram();
        p.balance += msg.value;
        p.withdrawUnlockAt = 0;
        emit BountyFunded(programId, msg.sender, msg.value, p.balance);
    }

    function claimReward(Verdict calldata v, bytes calldata signature) external nonReentrant {
        if (v.severity == 0 || v.severity > SEV_MAX) revert BadSeverity();
        if (v.deadline != 0 && block.timestamp > v.deadline) revert Expired();
        if (_recover(v, signature) != trustedAttestor) revert BadSignature();

        Program storage p = _programs[v.programId];
        if (!p.exists) revert UnknownProgram();
        if (p.target != v.target) revert TargetMismatch();

        bytes32 claimId = keccak256(abi.encode(v.programId, v.exploitHash));
        if (claimed[claimId]) revert AlreadyClaimed();

        uint256 reward = p.rewards[v.severity];
        if (reward == 0 || p.balance < reward) revert InsufficientPool();

        claimed[claimId] = true;
        p.balance -= reward;
        emit RewardClaimed(v.programId, v.exploitHash, v.researcher, v.severity, reward, claimId);

        (bool okSent, ) = v.researcher.call{value: reward}("");
        if (!okSent) revert TransferFailed();
    }

    function requestWithdraw(uint256 programId) external {
        Program storage p = _programs[programId];
        if (!p.exists) revert UnknownProgram();
        if (p.sponsor != msg.sender) revert NotSponsor();
        p.withdrawUnlockAt = block.timestamp + WITHDRAW_DELAY;
        emit WithdrawRequested(programId, msg.sender, p.withdrawUnlockAt);
    }

    function withdraw(uint256 programId) external nonReentrant {
        Program storage p = _programs[programId];
        if (!p.exists) revert UnknownProgram();
        if (p.sponsor != msg.sender) revert NotSponsor();
        if (p.withdrawUnlockAt == 0) revert WithdrawNotRequested();
        if (block.timestamp < p.withdrawUnlockAt) revert WithdrawLocked();

        uint256 amount = p.balance;
        p.balance = 0;
        p.withdrawUnlockAt = 0;
        emit Withdrawn(programId, msg.sender, amount);

        (bool okSent, ) = msg.sender.call{value: amount}("");
        if (!okSent) revert TransferFailed();
    }

    function getProgram(uint256 programId) external view returns (Program memory) {
        return _programs[programId];
    }

    function _recover(Verdict calldata v, bytes calldata sig) internal view returns (address) {
        if (sig.length != 65) revert BadSignature();
        bytes32 structHash = keccak256(
            abi.encode(
                VERDICT_TYPEHASH,
                v.severity,
                v.lossAmount,
                v.exploitHash,
                v.researcher,
                v.programId,
                v.target,
                v.deadline
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        bytes32 r;
        bytes32 s;
        uint8 vv;
        assembly {
            r := calldataload(sig.offset)
            s := calldataload(add(sig.offset, 32))
            vv := byte(0, calldataload(add(sig.offset, 64)))
        }
        if (uint256(s) > HALF_N) revert BadSignature();
        if (vv < 27) vv += 27;
        address signer = ecrecover(digest, vv, r, s);
        if (signer == address(0)) revert BadSignature();
        return signer;
    }

    receive() external payable {
        revert("use fundProgram");
    }
}
