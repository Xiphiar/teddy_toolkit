require('dotenv').config();
const {
    EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey
  } = require("secretjs");
const textEncoding = require('text-encoding');
const TextDecoder = textEncoding.TextDecoder;

const customFees = {
    exec: {
        amount: [{ amount: "50000", denom: "uscrt" }],
        gas: "200000",
    }
}

const swapMsg = {
    mint_mutant: {
        //token_id:"10001",
        public_metadata: {
            extension: {
                attributes: [{
                    trait_type: "Base Design",
                    value: "Zom-Bear"
                }],
                image: "https://arweave.net/0ZP_yaIeYc4vGwMxqoJdqgOGKjZpspl7ktGUmUvNee4",
            }
        },
        private_metadata: {
            extension: {
                attributes: [{
                    trait_type: "Base Design",
                    value: "Zom-Bear"
                }],
                media: [{
                    authentication: {key: "538f94f8a3692083317250229e2d9d5c"},
                    extension: 'png',
                    file_type: 'image',
                    url: 'https://arweave.net/1F0HVHbBO6BtxFGM_Ie-KMpF6xPCrCJRfKdcuizRyDA',
                }]
            }
        },
    }
}  

const costMsg = {
    fac_cost: {
        fac_cost: "1"
    }
}  


const main = async () => {
    const signingPen = await Secp256k1Pen.fromMnemonic(process.env.MNEMONIC);
    const pubkey = encodeSecp256k1Pubkey(signingPen.pubkey);
    const accAddress = pubkeyToAddress(pubkey, 'secret');
    const txEncryptionSeed = EnigmaUtils.GenerateNewSeed();
    
    const client = new SigningCosmWasmClient(
        process.env.REST_URL,
        accAddress,
        (signBytes) => signingPen.sign(signBytes),
        txEncryptionSeed
    );

    console.log(`Wallet address = ${accAddress}`)

    response = await client.execute(process.env.NFT_ADDR, costMsg);
    //response.data = JSON.parse(new TextDecoder().decode(response.data));
    console.log(response);
}

main().then(resp => {
    console .log("Done.");
}).catch(err => {
    if (err.message.includes("timed out waiting for tx to be included in a block")) {
        console.error("ERROR: Timed out waiting for TX to be processed. The TX is in the mempool and will likely be processed soon, check an explorer to confirm.");
    } else {
        console.error(err);
    }
})
