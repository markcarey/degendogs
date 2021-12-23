require('dotenv').config();
  const API_URL = process.env.API_URL;
  const PUBLIC_KEY = process.env.PUBLIC_KEY;
  const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function main() {
    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY);
    console.log(nonce);

    // Grab the contract factory 
<<<<<<< Updated upstream
    //const Dog = await ethers.getContractFactory("Dog");
    const Dog = await ethers.getContractFactory("DogsAuctionHouse");
 
=======
    const Dog = await ethers.getContractFactory("Dog");
    //const Dog = await ethers.getContractFactory("DogsAuctionHouse");
>>>>>>> Stashed changes
    // Start deployment, returning a promise that resolves to a contract object
    // nounce+0
    const myDog = await Dog.deploy(); // Instance of the contract 
<<<<<<< Updated upstream
    console.log("Contract deployed to address:", myDog.address);
=======
    console.log("Dog deployed to address:", myDog.address);

    const Logic = await ethers.getContractFactory("DegenDAOLogicV1");
    // nounce+1
    const myLogic = await Logic.deploy();
    console.log("Logic deployed to address:", myLogic.address);
    //await myLogic.initialize(myExec.address,myDog.address,"0xFa083DfD09F3a7380f6dF6E25dd277E2780de41D",5760,1,1,200);

    
    const futureExecAddress = ethers.utils.getContractAddress({ from: PUBLIC_KEY, nonce: nonce+3 });
    console.log("future Exec address",futureExecAddress);

    const Proxy = await ethers.getContractFactory("DegenDAOProxy");
    // nounce+2
    //const myProxy = await Proxy.deploy(myExec.address,myDog.address,"0xFa083DfD09F3a7380f6dF6E25dd277E2780de41D","0xFa083DfD09F3a7380f6dF6E25dd277E2780de41D",myLogic.address,5760,1,1,200,{ gasLimit: 5000000 });
    const myProxy = await Proxy.deploy(futureExecAddress,myDog.address,PUBLIC_KEY,PUBLIC_KEY,myLogic.address,101,1,1,200,{ gasLimit: 5000000 });
    console.log("Proxy deployed to address:", myProxy.address);

    const Exec = await ethers.getContractFactory("DegenDAOExecutor");
    // nounce+3
    const myExec = await Exec.deploy(myProxy.address, 3);
    console.log("Executor deployed to address:", myExec.address);

>>>>>>> Stashed changes
 }
 
 main()
   .then(() => process.exit(0))
   .catch(error => {
     console.error(error);
     process.exit(1);
   });