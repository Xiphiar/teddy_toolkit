const csv = require('csv-parser');
const fs = require('fs');
const { createWriteStream } = require('fs');
var crypto = require('crypto');
const axios = require("axios");
const { AxiosInstance } = require("axios");
require('dotenv').config();
const {
    EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey
  } = require("secretjs");
const {sleep} = require('./utils/AsyncClient')
const { exit } = require('process');
var http = require('http')
var FormData = require('form-data');
const tunnel = require('tunnel');
const {Encoder} = require("form-data-encoder");
const { Blob } = require('buffer');
const retry = require('async-await-retry');

/*
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
process.env['HTTP_PROXY'] = 'http://127.0.0.1:8866';
process.env['HTTPS_PROXY'] = 'http://127.0.0.1:8866';
*/

//let ids = [...Array(3031).keys()].slice(1)
let ids = [123, 456, 1000]
console.log(ids);

fileExists = (file) => {
    try {
        //try to lod file
        const img = fs.readFileSync(file);

        //check if file is empty
        if (img.length){
            return true;
        } else {
            return false;
        }

    } catch(e) {
        //error is thrown if file doesnt exist
        if (e.toString().includes("no such file or directory")){
            return false;
        } else {
            throw e;
        }
    }
}

async function downloadFile(fileUrl, outputLocationPath) {
    const writer = createWriteStream(outputLocationPath);

    const res = await retry(
        () => {
            console.log("trying to download", outputLocationPath)
            return axios({
                method: 'get',
                url: fileUrl,
                responseType: 'stream',
              }).then(response => {
            
                //ensure that the user can call `then()` only when the file has
                //been downloaded entirely.
            
                return new Promise((resolve, reject) => {
                  response.data.pipe(writer);
                  let error = null;
                  writer.on('error', err => {
                    error = err;
                    writer.close();
                    reject(err);
                  });
                  writer.on('close', () => {
                    if (!error) {
                      resolve(true);
                    }
                    //no need to call the reject here, as it will have been called in the
                    //'error' stream;
                  });
                });
              });

        },
        null,
        { retriesMax: 20, interval: 6000 },
    );

    return res;
  

}
    

main = async() => {
    for (let i = 0; i < ids.length; i++) {
        if (!fileExists(`data/encrypted/${ids[i]}`)) {

            //get JSON data
            const json = fs.readFileSync(`data/keys/out-123.json`);
            const jsonData = JSON.parse(json);

            try {                
                await downloadFile(`https://ipfs.io/ipfs/${jsonData.hashes[0]}`, `data/encrypted/${ids[i]}`);

            } catch (e) {
                console.log(e)

                // write error to a file
                const output = JSON.stringify(e);
                fs.writeFile(`data/keys/error-download-${ids[i]}.json`, output, (err) => {
                    if (err) {
                        throw err;
                    }
                });

                console.log(`#${ids[i]} download error is saved.`);
            }
        }
    }
}
main();
