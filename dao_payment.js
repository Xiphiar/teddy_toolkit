require('dotenv').config();
const {
    EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey, logs
  } = require("secretjs");
const textEncoding = require('text-encoding');
const TextDecoder = textEncoding.TextDecoder;
//
const customFees = {
    exec: {
        amount: [{ amount: "2000000", denom: "uscrt" }],
        gas: "8000000",
    }
}

const daoAddress = process.env.DAO_ADDR;
const tokenAddress = process.env.TOKEN_ADDR;

const sendMsg = {
    send: {
        amount:"1000000",
        recipient: daoAddress,
    }
}

const main = async () => {
    const signingPen = await Secp256k1Pen.fromMnemonic(process.env.MNEMONIC);
    const pubkey = encodeSecp256k1Pubkey(signingPen.pubkey);
    const accAddress = pubkeyToAddress(pubkey, 'secret');
    const txEncryptionSeed = EnigmaUtils.GenerateNewSeed();
    const enigmaUtils = new EnigmaUtils(process.env.RESTURL, txEncryptionSeed);

    const client = new SigningCosmWasmClient(
        process.env.REST_URL,
        accAddress,
        (signBytes) => signingPen.sign(signBytes),
        txEncryptionSeed, customFees
    );

    console.log(`Wallet address = ${accAddress}`)

    response = await client.execute(tokenAddress, sendMsg);
    response.data = JSON.parse(new TextDecoder().decode(response.data));
    console.log(response);

    //get full TX with logs from REST
    let full = await client.restClient.txById(response.transactionHash);

    //decode response data to plain text
    full.data = JSON.parse(new TextDecoder().decode(full.data));

    let logs = {};
    full.logs[0].events[1].attributes.map((obj) => { logs[obj.key.trim()] = obj.value.trim() });

    console.log(logs);

    console.log(`Recip address = ${process.env.RECIP_ADDR}`)

    const balanceQuery = { 
        balance: {
            key: process.env.VIEW_KEY, 
            address: process.env.RECIP_ADDR
        }
    };

    const balance = await client.queryContractSmart(tokenAddress, balanceQuery);
    console.log(balance)
    const account = await client.getAccount(process.env.RECIP_ADDR)
    console.log(account.balance);
}

main().then(resp => {
    console.log("Done.");
}).catch(err => {
    console.log(err);
})
