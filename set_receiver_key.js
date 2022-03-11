require('dotenv').config();
const {
    EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey
  } = require("secretjs");
const textEncoding = require('text-encoding');
const TextDecoder = textEncoding.TextDecoder;

const tokenAddress = process.env.TOKEN_ADDR;

const keyMsg = {
    set_viewing_key: {
        key: process.env.VIEW_KEY
    }
};    


const main = async () => {
    const signingPen = await Secp256k1Pen.fromMnemonic(process.env.RECIP_MNEMONIC);
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

    response = await client.execute(tokenAddress, keyMsg);
    response.data = JSON.parse(new TextDecoder().decode(response.data));
    console.log(response);

    const balanceQuery = { 
        balance: {
            key: process.env.VIEW_KEY, 
            address: accAddress
        }
    };
    const balance = await client.queryContractSmart(tokenAddress, balanceQuery);
    console.log(balance)
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
