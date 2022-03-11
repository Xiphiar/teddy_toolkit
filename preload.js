const csv = require('csv-parser');
const fs = require('fs');
var crypto = require('crypto');
const axios = require("axios");
require('dotenv').config();
const {
    EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey,BroadcastMode
  } = require("secretjs");
const { AsyncClient } = require('./utils/AsyncClient')
const { exit } = require('process');

const customFees = {
    exec: {
        amount: [{ amount: "2000000", denom: "uscrt" }],
        gas: "5500000",
    }
}

function csvJSONWL(csv){
    //console.log(csv)
    var lines=csv.split("\r\n");
    var result = [];
  
    // NOTE: If your columns contain commas in their values, you'll need
    // to deal with those before doing the next step 
    // (you might convert them to &&& or something, then covert them back later)
    // jsfiddle showing the issue https://jsfiddle.net/
    var headers=lines[0].split(",");
    for(var i=1;i<lines.length;i++){
        
        var obj = {};
        var currentline=lines[i].split(",");
        
        for(var j=0;j<headers.length;j++){
            obj[headers[j]] = currentline[j];
        }

        if (obj['Wallets for W/L'] && obj['Wallets for W/L'].includes('secret')){
            //result.push(obj);
            result.push = obj['Wallets for W/L'];
        }
    }
  
    return result; //JavaScript object
    //return JSON.stringify(result); //JSON
}

function csvJSONArweave(csv){
    //console.log(csv)
    var lines=csv.split("\r\n");
    var result = [];
  
    // NOTE: If your columns contain commas in their values, you'll need
    // to deal with those before doing the next step 
    // (you might convert them to &&& or something, then covert them back later)
    // jsfiddle showing the issue https://jsfiddle.net/
    var headers=lines[0].split(",");
    for(var i=1;i<lines.length;i++){
        
        var obj = {};
        var currentline=lines[i].split(",");
        
        for(var j=0;j<headers.length;j++){
            obj[headers[j]] = currentline[j];
        }

        if (obj['Parent Folder ID'] && obj['Parent Folder ID'].includes('f8b71fb6-c0a5-4a6a-956f-1577ef39d02f')){
            //result.push(obj);
            result[obj['File Name']] = obj;
        }
    }
  
    return result; //JavaScript object
    //return JSON.stringify(result); //JSON
}

function csvJSONAlter(csv){
    //console.log(csv)
    var lines=csv.split("\r\n");
    var result = [];
  
    // NOTE: If your columns contain commas in their values, you'll need
    // to deal with those before doing the next step 
    // (you might convert them to &&& or something, then covert them back later)
    // jsfiddle showing the issue https://jsfiddle.net/
    var headers=lines[0].split(",");
    for(var i=1;i<lines.length;i++){
        
        var obj = {};
        var currentline=lines[i].split(",");
        
        for(var j=0;j<headers.length;j++){
            obj[headers[j]] = currentline[j];
        }
        result[obj['ID']] = obj;
        //result.push(obj);
    }
  
    return result; //JavaScript object
    //return JSON.stringify(result); //JSON
}

//const limit = 3030;
const limit = 4000;

//empty pre-load handle message
var data = {
    pre_load: {
        new_data: []
    }
};



const uploadData = fs.readFileSync('data/upload.csv', 'utf8');
const uploadObj = csvJSONArweave(uploadData);

const alterData = fs.readFileSync('data/3030_acc.csv', 'utf8');
const alterObj = csvJSONAlter(alterData);

fs.createReadStream('data/Traits.csv', "utf8")
  .pipe(csv())
  .on('data', (row) => {
    const id = row["Teddy #"];
    if (parseInt(id) > limit) {
        return;
    }

    let encryptData = fs.readFileSync(`data/keys/out-${id}.json`);
    encryptData = JSON.parse(encryptData);
    if (!encryptData.id === row["Teddy #"]){
        throw "Key ID mismatch"
    }

    //pad ID with leading 0's (123 => 0123)
    //let fullid = pad(row["Teddy #"], 4);
    let pubUrl;
    let baseString;
    
    if (row['base design'].includes("Ro-Bear")){
        pubUrl = "https://arweave.net/9JmggQG3JV5eLFZdvBfL3Vk7APLOmgN_WK4km7qq7fE";
        baseString = "Ro-Bear";
    }
    if (row['base design'].includes("Zom-Bear")){
        pubUrl = "https://arweave.net/X2nzHkuIKvtucDp1UhxuHjS2OgwhyqF3wKS0U4gBlpk";
        baseString = "Zom-Bear";
    }
    //if (row['base design'].includes("Imposter") || row['base design'].includes("Teddy-bear") || row['base design'].includes("Parody")){
    else {
        console.log("else")
        pubUrl = "https://arweave.net/0ZP_yaIeYc4vGwMxqoJdqgOGKjZpspl7ktGUmUvNee4";
        baseString = "Teddy Bear";
    }
    console.log(row['base design'], baseString);
    //setup data for single-item in collection
    let singleItemData = {
        id: row["Teddy #"],
        img_url: pubUrl,
        //priv_img_url: `https://arweave.net/${uploadObj[id]['Data Transaction ID']}`,
        priv_img_url: `https://ipfs.io/ipfs/${encryptData.hashes[0]}`,
        pub_attributes: [
            {
            trait_type: "Base Design",
            value: baseString.trim()
            }
        ],
        priv_attributes: [
            {
            trait_type: "Base Design",
            value: row["base design"].trim().replace(/[^\x00-\x7F]/g, "")
            }
        ],
        priv_key: encryptData.key,
        alter_user: alterObj[id].UserId,
        alter_pass: alterObj[id].Password
    }

    if (row["bear color"]){
        singleItemData.priv_attributes.push({
            trait_type: "Color",
            value: row["bear color"].trim().replace(/[^\x00-\x7F]/g, "")
            })
    }

    if (row["background"]){
        singleItemData.priv_attributes.push({
            trait_type: "Background",
            value: row["background"].trim().replace(/[^\x00-\x7F]/g, "").replace(/["]/g, "")
            })
    }

    if (row["facial expression"]){
        singleItemData.priv_attributes.push({
            trait_type: "Face",
            value: row["facial expression"].trim().replace(/[^\x00-\x7F]/g, "")
            })
    }

    if (row["hand held"]){
        singleItemData.priv_attributes.push({
            trait_type: "Hand",
            value: row["hand held"].trim().replace(/[^\x00-\x7F]/g, "")
        })
    }

    if (row["on head"]){
        singleItemData.priv_attributes.push({
            trait_type: "Head",
            value: row["on head"].trim().replace(/[^\x00-\x7F]/g, "")
        })
    }
    if (row["on body"]){
        singleItemData.priv_attributes.push({
            trait_type: "Body",
            value: row["on body"].trim().replace(/[^\x00-\x7F]/g, "")
        })
    }
    if (row["eye wear"]){
        singleItemData.priv_attributes.push({
            trait_type: "Eyewear",
            value: row["eye wear"].trim().replace(/[^\x00-\x7F]/g, "")
        })
    }


    //console.log(singleItemData)

    //add the single-item to new_data array
    data.pre_load.new_data.push(singleItemData);

  })
  .on('end', async() => {
    console.log('CSV file successfully processed');

    var perChunk = 505 // items per chunk    


    var splitAry = data.pre_load.new_data.reduce((resultArray, item, index) => { 
        const chunkIndex = Math.floor(index/perChunk)

        if(!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = [] // start a new chunk
        }

        resultArray[chunkIndex].push(item)

        return resultArray
    }, [])

    console.log(splitAry.length);

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
    console.log(`Wallet address = ${accAddress}`)


    for (let i=0; i < splitAry.length; i++) {
        try {
            console.log(splitAry[i].length)

            const data2 = {
                pre_load: {
                    new_data: splitAry[i]
                }
            };

            //execute pre-load handle function
            response = await client.execute(process.env.NFT_ADDR, data2);
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

            console.log(full.raw_log);
        } catch(e){
            throw e;
        }

    }
    exit();
    const data2 = {
        pre_load: {
            new_data: splitAry[2]
        }
    };



    


    


});

