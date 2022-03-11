 
require('dotenv').config();
const {
  EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey
} = require("secretjs");

const deactivateMsg = {
  deactivate_whitelist : { }
}

const main = async () => {
  console.log(process.env.MNEMONIC);
  const signingPen = await Secp256k1Pen.fromMnemonic(process.env.MNEMONIC);
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

  response = await client.execute(process.env.NFT_ADDR, deactivateMsg);
  if (response.data.length) response.data = JSON.parse(new TextDecoder().decode(response.data));
  console.log(response);
}

main().then(resp => {
  console.log("Done");
}).catch(err => {
  console.log(err);
})
