### Degen Dogs - Mission 3

The Dogs are teleporting to Base Mainnet. Woof.

## Key Steps

1. Degen Chain auctions will be paused. Bids can still be made in the active auction. I will settle that final auction. The winner gets the Dog as usual, and will be able to teleport it to Base.
2. The `WOOFx` stream to Dog owners on Degen chain will be stopped.
3. The not-yet-streamed `WOOFx` will be unwrapped and withdrawn from the contract and deposited into the WOOF Vault by dogmaster.eth
4. Deposits into the WOOF Vault will be closed (paused).
5. Proportional share data will be saved via the `membersWithUnits()` view function.
6. The WOOF in the vault will be withdrawn via `adminWithdraw()` function.
7. The vault WOOF will be swapped (burned) via Mint Club for `DEGEN`.
8. dogmaster.eth will claim MintClub sell fees as `WDEGEN`.
9. All `WDEGEN` will be unwrapped to (native) `DEGEN`.
10. All dogmaster.eth `DEGEN` will be bridged to Base (both WOOF Vault proceeds ***plus*** `DEGEN` held prior)
11. All dogmaster.eth Base `DEGEN` will be swapped for `ETH` or `WETH`. (both bridged `DEGEN` ***plus*** Base `DEGEN` held prior).
12. Proportional shares recalculated to include dogmaster.eth amounts that were not in the WOOF Vault. Txns and Google Sheet to be shared for review.
13. Prebuy contract (for Base WOOF) created based on proportional shares. The swap will buy WOOF on behalf Vault depositors and staked proportionately to each user on Base. Staking lock period will apply.
14. Base `WOOF` stakers receive staking rewards + relevant Streme and super token `SUP` rewards.
15. Depositors to WOOF Vault are added to a Streme Vault for a streaming airdrop of 10B WOOF (10% of supply) with a 30 day lock then 365 day stream. Amounts and durations tentative.
16. NFT, Auction, and PoolStreamer contracts deployed to Base. (Contract deployment will actually happen before the WOOF migration.)
17. Mini app will be updated with a feature for Dog owners to teleport their Dogs. Dog must be owned by one the Farcaster-verified addresses of the connected `fid`. (Send a DM to @markcarey if this requirement is a blocker for you)
18. Dog owners on Base will be eligible for Season 4 SUP rewards plus ongoing streams of WOOF and SUP, though the latter 2 may not start immediately.
19. Auctions will be restarted on Base, with a minimum bid of `0.0005 ETH` (bids in native `ETH`). Other auction settings remain the same: 24 hour duration, 5 minute popcorn bidding, 10% minimum bid increment.
20. Auction proceeds will be swapped for WOOF. To start, this may happen periodically and later automated. Ultimately, this WOOF will be streamed to Dog owners ... but in the short term in may be staked to maximize SUP yield, which will also get streamed to Dog owners. Any txns will be sent from dogmaster.eth.
21. Fees earned from LP will be shared with Dog owners. `WETH` fees will be swapped for `WOOF`. Ultimately added to the WOOFstream to Dog owners.
22. Degen Dog NFTs will be available on secondary markets on Base (ie. OpenSea)

## Base WOOF Token Allocation

10% - WOOF Vault members. 30 day lock, 365 day stream.
10% - Staking rewards. 30 day lock, 365 day stream.
80% - Locked LP