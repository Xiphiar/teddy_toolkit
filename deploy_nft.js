const csv = require('csv-parser');
const fs = require('fs');
var crypto = require('crypto');
require('dotenv').config();
const {
    EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey, BroadcastMode
  } = require("secretjs");
const { AsyncClient } = require('./utils/AsyncClient')
const secureRandom = require("secure-random");
const setEnv = require("./setEnv");
const { exit } = require('process');

const customFees = {
    upload: {
        amount: [{ amount: "2000000", denom: "uscrt" }],
        gas: "6000000",
    },
    init: {
        amount: [{ amount: "50000", denom: "uscrt" }],
        gas: "200000",
    }
}
const d = new Date();
const initMsg = {
    //name: d.toISOString().slice(0,19).replace(/T/g," "),
    name: "Midnight Teddy Club",
    symbol: "MTC",
    entropy: Buffer.from(secureRandom(32, { type: "Uint8Array" })).toString("base64"),
    snip20_address: process.env.TOKEN_ADDR,
    snip20_hash: process.env.TOKEN_CODE_HASH,
    fac_cost: "5000000",
    royalty_info: {
        decimal_places_in_rates: 2,
        royalties: [
            {
                recipient: process.env.DAO_ADDR,
                rate: 05
            }
        ]
    },
    mint_funds_distribution_info: {
        decimal_places_in_rates: 4,
        royalties: [
            {
                recipient: "secret1kw60atrdvqsjqcwlheuuy9ch6wyljnydtz0jcd",
                rate: 3335
            },
            {
                recipient: "secret180m35fr9lv6d8h6yzym80x5jgmne4fj8akedxp",
                rate: 3536
            },
            {
                recipient: "secret1ha0aq3qmlywgthgyjkmhpg697jw22f3xe8rh4y",
                rate: 1429
            },
            {
                recipient: "secret1p6xc2hgrr6nt50zgx9n49yeacdtesn84xtwcpm",
                rate: 1000
            },
            {
                recipient: "secret14fa9jm9g5mjs35yxarh057lesy4zszw5gavcun",
                rate: 0700
            },
        ]
    },
    factory_funds_dist_info: {
        decimal_places_in_rates: 2,
        royalties: [
            {
                recipient: process.env.DAO_ADDR,
                rate: 100
            },
        ]
    },
    config: {
        public_token_supply: true,
        public_owner: false,
        enable_sealed_metadata: false,
        unwrapped_metadata_is_private: true,
        minter_may_update_metadata: false,
        owner_may_update_metadata: false,
        enable_burn: false
    }
};
console.log(initMsg.factory_funds_dist_info.royalties)

const main = async () => {
    const signingPen = await Secp256k1Pen.fromMnemonic(process.env.MNEMONIC);
    const pubkey = encodeSecp256k1Pubkey(signingPen.pubkey);
    const accAddress = pubkeyToAddress(pubkey, 'secret');
    const txEncryptionSeed = EnigmaUtils.GenerateNewSeed();

    const client = new AsyncClient(
        process.env.REST_URL,
        accAddress,
        (signBytes) => signingPen.sign(signBytes),
        txEncryptionSeed, customFees, BroadcastMode.Sync
    );

    console.log(`Wallet address: ${accAddress}`)

    // Upload the wasm of the random minting SNIP721
    const wasm = fs.readFileSync("contracts/teddyfinal.wasm");
    console.log('Uploading wasm...')
    const uploadReceipt = await client.upload(wasm, {});
    console.log(uploadReceipt)
    console.log('Success!')

    // Get the code ID from the receipt
    //const codeId = 386;
    //const codeId = 6493;
    const codeId = uploadReceipt.codeId;
    console.log('Code ID: ', codeId);

    // contract hash, useful for contract composition
    const contractCodeHash = await client.restClient.getCodeHashByCodeId(codeId);
    console.log(`Code hash: ${contractCodeHash}`);

    //instantiate NFT contract
    console.log('Instantiating NFT contract...')
    const randomLabel = Buffer.from(secureRandom(8, { type: "Uint8Array" })).toString("base64")
    const label = "midnight-teddy-club"
    const response = await client.instantiate(codeId, initMsg, randomLabel); //process.env.NFT_LABEL);

    console.log(response);
    if (response.code) throw response.raw_log;

    //get full TX with logs from REST
    let full = await client.checkTx(response.transactionHash);
    if (full.code) throw full.raw_log;

    //decode response data to plain text
    if (full.data.length){
        full.data = JSON.parse(new TextDecoder().decode(full.data));
    }

    let logs = {};
    full.logs[0].events[1].attributes.map((obj) => { logs[obj.key.trim()] = obj.value.trim() });

    console.log(full.logs[0].events[1].attributes[0].value);
    
    console.log("Success!")
    console.log(`NFT address: ${full.logs[0].events[1].attributes[0].value}`);
    

    if (Boolean(process.env.UPDATE_ENV)){
        setEnv.setEnvValue('NFT_ADDR', full.logs[0].events[1].attributes[0].value)
        setEnv.setEnvValue('NFT_CODE_HASH', contractCodeHash)
    }
}
  
main().then(resp => {
    console.log("Done: ",resp);
}).catch(err => {
    if (err.message?.includes("contract account already exists")){
        console.error(`ERROR: Contract label ${process.env.NFT_LABEL} already exists on this chain. Change the NFT_LABEL in .env`);
    } else if (err.message?.includes("timed out waiting for tx to be included in a block")) {
        console.error("ERROR: Timed out waiting for TX to be processed. Please try again or check an explorer for the code-id or address (depending which step it failed on)");
    } else {
        console.error(err);
    }
})