const csv = require('csv-parser');
const fs = require('fs');
var crypto = require('crypto');
require('dotenv').config();
const secureRandom = require("secure-random");
const { EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey } = require("secretjs");
const { Bip39, Random } = require("@iov/crypto");
const setEnv = require("./setEnv");

const customFees = {
    upload: {
        amount: [{ amount: "1000000", denom: "uscrt" }],
        gas: "4000000",
    },
    init: {
        amount: [{ amount: "50000", denom: "uscrt" }],
        gas: "200000",
    }
}

const main = async () => {
    // Create random address and mnemonic
    const mnemonic = Bip39.encode(Random.getBytes(16)).toString();
    
    // This wraps a single keypair and allows for signing.
    const signingPen = await Secp256k1Pen.fromMnemonic(mnemonic);

    // Get the public key
    const pubkey = encodeSecp256k1Pubkey(signingPen.pubkey);

    // Get the wallet address
    const accAddress = pubkeyToAddress(pubkey, 'secret');

    console.log(`Receiver address: ${accAddress}`);

    if (Boolean(process.env.UPDATE_ENV)){
        setEnv.setEnvValue('RECIP_MNEMONIC', mnemonic)
        setEnv.setEnvValue('RECIP_ADDR', accAddress)
    }
}
  
main().then(resp => {
    console.log("Done.");
}).catch(err => {
    if (err.message.includes("contract account already exists")){
        console.error(`ERROR: Contract label ${process.env.TOKEN_LABEL} already exists on this chain. Change the TOKEN_LABEL in .env`);
    } else if (err.message.includes("timed out waiting for tx to be included in a block")) {
        console.error("ERROR: Timed out waiting for TX to be processed. Please try again or check an explorer for the code-id or address (depending which step it failed on)");
    } else {
        console.error(err);
    }
})