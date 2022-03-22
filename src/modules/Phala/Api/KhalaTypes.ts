const KhalaTypes : {
    Address: string;
    LookupSource: string;
    Keys: string;
    ChainId: string;
    BridgeChainId: string;
    BridgeEvent: {
        _enum: {
            FungibleTransfer: string;
            NonFungibleTransfer: string;
            GenericTransfer: string;
        };
    };
    FungibleTransfer: {
        destId: string;
        nonce: string;
        resourceId: string;
        amount: string;
        recipient: string;
    };
    NonFungibleTransfer: {
        destId: string;
        nonce: string;
        resourceId: string;
        tokenId: string;
        recipient: string;
        metadata: string;
    };
    GenericTransfer: {
        destId: string;
        nonce: string;
        resourceId: string;
        metadata: string;
    };
    ResourceId: string;
    TokenId: string;
    DepositNonce: string;
    ProposalStatus: {
        _enum: {
            Initiated: null;
            Approved: null;
            Rejected: null;
        };
    };
    ProposalVotes: {
        votesFor: string;
        votesAgainst: string;
        status: string;
        expiry: string;
    };
    AssetInfo: {
        destId: string;
        assetIdentity: string;
    };
    ProxyType: {
        _enum: string[];
    };
    Sr25519PublicKey: string;
    MasterPublicKey: string;
    WorkerPublicKey: string;
    ContractPublicKey: string;
    EcdhPublicKey: string;
    MessageOrigin: {
        _enum: {
            Pallet: string;
            Contract: string;
            Worker: string;
            AccountId: string;
            MultiLocation: string;
            Gatekeeper: null;
        };
    };
    Attestation: {
        _enum: {
            SgxIas: string;
        };
    };
    AttestationSgxIas: {
        raReport: string;
        signature: string;
        rawSigningCert: string;
    };
    SenderId: string;
    Path: string;
    Topic: string;
    Message: {
        sender: string;
        destination: string;
        payload: string;
    };
    SignedMessage: {
        message: string;
        sequence: string;
        signature: string;
    };
    WorkerRegistrationInfo: {
        version: string;
        machineId: string;
        pubkey: string;
        ecdhPubkey: string;
        genesisBlockHash: string;
        features: string;
        operator: string;
    };
    PoolInfo: {
        pid: string;
        owner: string;
        payoutCommission: number;
        ownerReward: number;
        cap: number;
        rewardAcc: number;
        totalShares: number;
        totalStake: number;
        freeStake: number;
        releasingStake: number;
        workers: string[];
        withdrawQueue: {
            user: string,
            shares: number,
            startTime: number
        }[];
    };
    WithdrawInfo: {
        user: string;
        shares: string;
        startTime: string;
    };
    WorkerInfo: {
        pubkey: string;
        ecdhPubkey: string;
        runtimeVersion: string;
        lastUpdated: number;
        operator: string;
        confidenceLevel: number;
        initialScore: number;
        features: number[];
    };
    MinerInfo: {
        state: string;
        ve: number;
        v: number;
        vUpdatedAt: number;
        benchmark: {
            pInit: number,
            pInstant: number,
            // ...
        };
        coolDownStart: number;
        stats: {
            totalReward: number,
        }
    };
    Benchmark: {
        pInit: number;
        pInstant: number;
        iterations: number;
        miningStartTime: number;
        challengeTimeLast: number;
    };
    MinerState: {
        _enum: {
            Ready: null;
            MiningIdle: null;
            MiningActive: null;
            MiningUnresponsive: null;
            MiningCoolingDown: null;
        };
    };
    MinerStats: {
        totalReward: string;
    };
    HeartbeatChallenge: {
        seed: string;
        onlineTarget: string;
    };
    KeyDistribution: {
        _enum: {
            MasterKeyDistribution: string;
        };
    };
    GatekeeperLaunch: {
        _enum: {
            FirstGatekeeper: string;
            MasterPubkeyOnChain: null;
        };
    };
    GatekeeperChange: {
        _enum: {
            GatekeeperRegistered: string;
        };
    };
    GatekeeperEvent: {
        _enum: {
            NewRandomNumber: string;
            TokenomicParametersChanged: string;
        };
    };
    NewGatekeeperEvent: {
        pubkey: string;
        ecdhPubkey: string;
    };
    DispatchMasterKeyEvent: {
        dest: string;
        ecdhPubkey: string;
        encryptedMasterKey: string;
        iv: string;
    };
    RandomNumberEvent: {
        blockNumber: number;
        randomNumber: number;
        lastRandomNumber: number;
    };
    TokenomicParameters: {
        phaRate: number;
        rho: number;
        budgetPerBlock: number;
        vMax: number;
        costK: number;
        costB: number;
        slashRate: number;
        treasuryRatio: number;
        heartbeatWindow: number;
        rigK: number;
        rigB: number;
        re: number;
        k: number;
        kappa: number;
    };
    TokenomicParams: string;
    U64F64Bits: string;
    UserStakeInfo: {
        user: string;
        locked: number;
        shares: number;
        availableRewards: number;
        rewardDebt: number;
    };
} = null;

export { KhalaTypes }


export enum LockReason {
    Staking = 'phala/sp',
}
