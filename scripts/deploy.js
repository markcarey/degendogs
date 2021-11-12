async function main() {
    // Grab the contract factory 
    const Dog = await ethers.getContractFactory("Dog");
    //const Dog = await ethers.getContractFactory("DogsAuctionHouse");
 
    // Start deployment, returning a promise that resolves to a contract object
    const myDog = await Dog.deploy(); // Instance of the contract 
    console.log("Dog deployed to address:", myDog.address);

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