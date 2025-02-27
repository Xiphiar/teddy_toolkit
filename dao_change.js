 
require('dotenv').config();
const {
  EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey
} = require("secretjs");

const setMsg = {
  change_dao : {
    dao_addr: process.env.RECIP_ADDR
    //dao_addr: "secret1zc5l6mvfrvskv23vu7hefl9tsfjmmdtuy7rmln"
  }
}

const adminMsg = {
  change_admin : {
    admin_addr: process.env.RECIP_ADDR
    //admin_addr: "secret1zc5l6mvfrvskv23vu7hefl9tsfjmmdtuy7rmln"
  }
}

const main = async () => {
  const signingPen = await Secp256k1Pen.fromMnemonic(process.env.RECIP_MNEMONIC);
  const pubkey = encodeSecp256k1Pubkey(signingPen.pubkey);
  const accAddress = pubkeyToAddress(pubkey, 'secret');
  const txEncryptionSeed = EnigmaUtils.GenerateNewSeed();
  const enigmaUtils = new EnigmaUtils(process.env.RESTURL, txEncryptionSeed);

  const client = new SigningCosmWasmClient(
      process.env.REST_URL,
      accAddress,
      (signBytes) => signingPen.sign(signBytes),
      txEncryptionSeed
  );

  console.log(`Wallet address = ${accAddress}`)

  response = await client.execute(process.env.DAO_ADDR, setMsg);
  //response.data = JSON.parse(new TextDecoder().decode(response.data));
  console.log(response);
}

main().then(resp => {
  console.log("Done");
}).catch(err => {
  console.log(err);
})
