### Degen Dogs - Mission 2

Here are some high-level thoughts on my idea for Mission 2. Feedback appreciated.

Super high-level: use treasury funds to earn Degen as a form of yield, which is streamed to Dog owners over time as a form of vesting, to reduce sell pressure of the yield token.

- travel from planet Polygon to planet Degen (we are "degen" dogs, after all)
- bridge remaining treasury funds to Base or Degen chain
- swap most/all WETH to DEGEN and lock it in the Degen Staking contract
- this maximizes daily tip allowance on Farcaster
- automatically direct 100% of tips to buy tokens on MintClub (daily) (I have already coded an automation tool for this: https://warpcast.com/markcarey/0x035fb668)
- token on MintClub (degen chain) could be called BSCT or something else (mintclub tokens are bonging curve ERC20s)
- Superfluid streaming version of token (ie. BSCTx) is streamed to Dog owners via a "Distribution Pool" over a predefined period (ie. 365 days).
- one Dog equals one share in Pool
- periodically (daily? incentivized? tbd) minted tokens are added to the input stream, so the total streamed to Dog owners keeps going up.
- Dogs minted on Polygon would be claimable on the new planet, same IDs, same artwork. You keep your Dogs.
- Unclaimed treasury Dogs allocated to promotional giveaways, etc.
- Daily auctions continue on Degen Chain -- or some other distribution mechanism (ideas welcome)
- Primary UI is Farcaster frames, heavy emphasis on social to build/expand community

### ERC721PoolManager

- ERC721 Hook contract
- Separate contract called from the `_beforeTokenTransfer()` hook in the ERC721 contract
- NFT holders get units in the Distribution pool
- when tokens are minted, burned, or transferred, the PoolManager contract will automatically adjust the member units in the pool accordingly.
- if you send or sell your NFT, your pool membership units go to the new receipient.
- The `ERC721PoolManager` contract also provides an admin function enabling an admin to `updateMemberUnits()` outside of NFT transfers (TODO: maybe add a means to disable this function)
- general use cases: yield, rewards, incentives for onchain communities -- or attaching the same to game NFT assets
- Degen Dogs use case: one Dog equals one Pool unit. Dog owners receive a share of a SuperFluid-wrapped bonding-curve token. The `flowRate` to the pool will be adjusted periodically (daily?).

### Updates
- Pool Manager deployed to testnet https://sepolia.basescan.org/address/0x968c61b9F7E492EBB7352c3A0E08408c6443e1E8

- Testnet Pool at https://explorer.superfluid.finance/base-sepolia/pools/0x9Ce2062b085A2268E8d769fFC040f6692315fd2c

- Oct 2024: - Pool Manager deployed to Base as part of "Found Pixel Nouns" collection on Base. This collection is not related to Degen Dogs, but serves as a pilot with real users. So far, very smooth. But any feeback or learnings could lead to improvements to the ERC721PoolManager contract prior to Mission 2 Launch. Pool: https://explorer.superfluid.finance/base-mainnet/pools/0x80f1D6CBa779D1E401C689D9a6c27C4548C362CC Collection: https://opensea.io/collection/pixelnouns PoolManager contract: https://basescan.org/address/0x2afb79be1e80f0d2ed0c415a147b28fa84fee4dd#code
