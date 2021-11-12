async function main() {
    // Grab the contract factory 
    //const Dog = await ethers.getContractFactory("Dog");
    const Dog = await ethers.getContractFactory("DogsAuctionHouse");
 
    // Start deployment, returning a promise that resolves to a contract object
    const myDog = await Dog.deploy(); // Instance of the contract 
    console.log("Contract deployed to address:", myDog.address);
 }
 
 main()
   .then(() => process.exit(0))
   .catch(error => {
     console.error(error);
     process.exit(1);
   });

// npx hardhat run scripts/deploy.js --network mumbai
// npx hardhat verify --network mumbai DEPLOYED_CONTRACT_ADDRESS "Constructor argument 1"