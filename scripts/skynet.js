import { getEntryLink, SkynetClient } from 'skynet-js';

const client = new SkynetClient(); 

// setup keys and skylink
const seed = "verySecureSeed";
const { publicKey, privateKey } = genKeyPairFromSeed(seed);
const dataKey = "myResolverSkylinkForDocument";
const skylink = "sia://XABvi7JtJbQSMAcDwnUnmp2FKDPjg8_tTTFP4BwMSxVdEg";

// set a registry entry to point at 'skylink'
await client.db.setDataLink(privateKey, dataKey, skylink);

// get the resolver skylink which references the registry entry
const resolverSkylink = getEntryLink(publicKey, dataKey)