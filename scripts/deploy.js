async function main() {
    const vestorAddress = "0x8f678d16918bc16F9EB23259a8A7D4c2Baa26B4e"; // localhost:polygon
    const donationAddress = "0x47D057a7720A41a40C79Ea1c514A320F2972eCA6"; // localhost:polygon
    //const WETH = "0x3C68CE8504087f89c640D02d133646d98e64ddd9"; // mumbai
    const WETH = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"; // polygon
    const name = "Degen Dogs";
    const symbol = "DOG";
    const baseURI = "https://degendogs.club/meta/";
    const idleWETH = "0xfdA25D931258Df948ffecb66b5518299Df6527C4"; // polygon
    const bidTokenName = "Dog Biscuits";
    const bidTokenSymbol = "BSCT";

    // Grab the contract factory 
    const Dog = await ethers.getContractFactory("Dog");
    const House = await ethers.getContractFactory("DogsAuctionHouse");
 
    // Start deployment, returning a promise that resolves to a contract object
    const myDog = await Dog.deploy(vestorAddress, donationAddress, WETH, idleWETH, name, symbol, baseURI); // Instance of the contract 
    console.log("Dog deployed to address:", myDog.address);

    const auctionHouse = await House.deploy(); // Instance of the contract 
    console.log("Auction House deployed to address:", auctionHouse.address);
    await (await auctionHouse.initialize(myDog.address, WETH, 60*1, "100000000000000000", 10, 60*5, bidTokenName, bidTokenSymbol)).wait();
    console.log("Auction house initialized");

    await (await myDog.setMinter(auctionHouse.address)).wait();
    console.log("Minter set");

    await (await auctionHouse.unpause()).wait();
    console.log("Auction House Unpaused");

    const Exec = await ethers.getContractFactory("DegenDAOExecutor");
    const myExec = await Exec.deploy("0xFa083DfD09F3a7380f6dF6E25dd277E2780de41D", 3);
    console.log("Executor deployed to address:", myExec.address);
    
    const Logic = await ethers.getContractFactory("DegenDAOLogicV1");
    const myLogic = await Logic.deploy();
    console.log("Logic deployed to address:", myLogic.address);
    //await myLogic.initialize(myExec.address,myDog.address,"0xFa083DfD09F3a7380f6dF6E25dd277E2780de41D",5760,1,1,200);

    const Proxy = await ethers.getContractFactory("DegenDAOProxy");
    const myProxy = await Proxy.deploy(myExec.address,myDog.address,"0xFa083DfD09F3a7380f6dF6E25dd277E2780de41D","0xFa083DfD09F3a7380f6dF6E25dd277E2780de41D",myLogic.address,5760,1,1,200,{ gasLimit: 5000000 });
    console.log("Proxy deployed to address:", myProxy.address);
 }
 
 main()
   .then(() => process.exit(0))
   .catch(error => {
     console.error(error);
     process.exit(1);
   });

// npx hardhat run scripts/deploy.js --network mumbai
// npx hardhat verify --network mumbai DEPLOYED_CONTRACT_ADDRESS "Constructor argument 1"