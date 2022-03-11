const csv = require('csv-parser');
const fs = require('fs');
var crypto = require('crypto');
const axios = require("axios");
require('dotenv').config();
const {
    EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey, BroadcastMode
  } = require("secretjs");
const { AsyncClient } = require('./utils/AsyncClient')
const { exit } = require('process');

function pad(num, size) {
    var s = "000" + num;
    return s.substr(s.length-size);
}

const customFees = {
    exec: {
        amount: [{ amount: "2000000", denom: "uscrt" }],
        gas: "8000000",
    }
}

//empty pre-load handle message
var data = {
    pre_load: {
        new_data: [
            {
                id: "1",
                img_url: "https://2gj77sncdzq44ly3amy2vas5vibymkrwngzjs64s2gkjss6nphxa.arweave.net/0ZP_yaIeYc4vGwMxqoJdqgOGKjZpspl7ktGUmUvNee4",
                priv_img_url: `http://teddysite.xiphiar.com/1`,
                attributes: [],
                priv_attributes: [
                    {
                    trait_type: "Base Design",
                    value: "teddy"
                    },            {
                    trait_type: "Face",
                    value: "bear"
                    },            {
                    trait_type: "Color",
                    value: "brown"
                    },            {
                    trait_type: "Background",
                    value: "bbb"
                    },
                ],
                priv_key: "538f94f8a3692083317250229e2d9d5c",
                alter_user: "aaa",
                alter_pass: "bbb"
            },
            {
                id: "2",
                img_url: "https://6sm2baibw4sv4xrmkzo3yf6l3vmtwahsz2nag72yvysjxovk5xyq.arweave.net/9JmggQG3JV5eLFZdvBfL3Vk7APLOmgN_WK4km7qq7fE",
                priv_img_url: `http://teddysite.xiphiar.com/2`,
                attributes: [],
                priv_attributes: [
                    {
                    trait_type: "Base Design",
                    value: "teddy"
                    },            {
                    trait_type: "Face",
                    value: "bear"
                    },            {
                    trait_type: "Color",
                    value: "brown"
                    },            {
                    trait_type: "Background",
                    value: "bbb"
                    },
                ],
                priv_key: "68f9898da3b6700290b7edf4f9e98ef1",
                alter_user: "aaa",
                alter_pass: "bbb"
            },
            {
                id: "3",
                img_url: "https://2gj77sncdzq44ly3amy2vas5vibymkrwngzjs64s2gkjss6nphxa.arweave.net/0ZP_yaIeYc4vGwMxqoJdqgOGKjZpspl7ktGUmUvNee4",
                priv_img_url: `http://teddysite.xiphiar.com/3`,
                attributes: [],
                priv_attributes: [
                    {
                    trait_type: "Base Design",
                    value: "teddy"
                    },            {
                    trait_type: "Face",
                    value: "bear"
                    },            {
                    trait_type: "Color",
                    value: "brown"
                    },            {
                    trait_type: "Background",
                    value: "bbb"
                    },
                ],
                priv_key: "31a4bbc83bf9609d0ad5985a8cce5a08",
                alter_user: "aaa",
                alter_pass: "bbb"
            }
        ]
    }
};
main = async() => {
    const signingPen = await Secp256k1Pen.fromMnemonic(process.env.MNEMONIC);
    const pubkey = encodeSecp256k1Pubkey(signingPen.pubkey);
    const accAddress = pubkeyToAddress(pubkey, 'secret');
    const txEncryptionSeed = EnigmaUtils.GenerateNewSeed();
    
    const client = new AsyncClient(
        process.env.REST_URL,
        accAddress,
        (signBytes) => signingPen.sign(signBytes),
        txEncryptionSeed, customFees,
        BroadcastMode.Sync
    );
    
    console.log(`Wallet address = ${accAddress}`)
    
    //execute pre-load handle function
    response = await client.asyncExecute(process.env.NFT_ADDR, data);
    console.log(response);
}
main();

