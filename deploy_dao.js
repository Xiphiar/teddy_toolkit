const csv = require('csv-parser');
const fs = require('fs');
var crypto = require('crypto');
require('dotenv').config();
const {
    EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey
  } = require("secretjs");
const { AsyncClient } = require('./utils/AsyncClient')
const secureRandom = require("secure-random");
const setEnv = require("./setEnv");

const customFees = {
    upload: {
        amount: [{ amount: "1250000", denom: "uscrt" }],
        gas: "2000000",
    },
    init: {
        amount: [{ amount: "50000", denom: "uscrt" }],
        gas: "200000",
    }
}

const initMsg = {
    admin: process.env.ACCT_ADDRESS,
    dao: process.env.ACCT_ADDRESS,
    sscrt_addr: process.env.TOKEN_ADDR,
    sscrt_hash: process.env.TOKEN_CODE_HASH,
}
console.log(initMsg);

const main = async () => {
    const signingPen = await Secp256k1Pen.fromMnemonic(process.env.MNEMONIC);
    const pubkey = encodeSecp256k1Pubkey(signingPen.pubkey);
    const accAddress = pubkeyToAddress(pubkey, 'secret');
    const txEncryptionSeed = EnigmaUtils.GenerateNewSeed();

    const client = new AsyncClient(
        process.env.REST_URL,
        accAddress,
        (signBytes) => signingPen.sign(signBytes),
        txEncryptionSeed, customFees
    );

    console.log(`Wallet address: ${accAddress}`)

    // Upload the wasm of the random minting SNIP721
    const wasm = fs.readFileSync("contracts/teddydao.wasm");
    console.log('Uploading wasm...')
    //const uploadReceipt = await client.upload(wasm, {});

    console.log('Success!')

    // Get the code ID from the receipt
    const codeId = 387;
    //const codeId = uploadReceipt.codeId;
    console.log('Code ID: ', codeId);

    // contract hash, useful for contract composition
    const contractCodeHash = await client.restClient.getCodeHashByCodeId(codeId);
    console.log(`Code hash: ${contractCodeHash}`);

    //instantiate NFT contract
    console.log('Instantiating NFT contract...')
    const randomLabel = Buffer.from(secureRandom(8, { type: "Uint8Array" })).toString("base64")
    const daoLabel = "teddy-dao-directory"
    const contract = await client.instantiate(codeId, initMsg, daoLabel); //process.env.DAO_LABEL);

    console.log("Success!")
    console.log(`DAO address: ${contract.contractAddress}`);

    if (Boolean(process.env.UPDATE_ENV)){
        setEnv.setEnvValue('DAO_ADDR', contract.contractAddress)
        setEnv.setEnvValue('DAO_CODE_HASH', contractCodeHash)
    }
}
  
main().then(resp => {
    console.log("Done: ",resp);
}).catch(err => {
    if (err.message.includes("contract account already exists")){
        console.error(`ERROR: Contract label ${process.env.DAO_LABEL} already exists on this chain. Change the DAO_LABEL in .env`);
    } else if (err.message.includes("timed out waiting for tx to be included in a block")) {
        console.error("ERROR: Timed out waiting for TX to be processed. Please try again or check an explorer for the code-id or address (depending which step it failed on)");
    } else {
        console.error(err);
    }
})