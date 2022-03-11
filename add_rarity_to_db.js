const csv = require('csv-parser');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();
const {
    EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey
  } = require("secretjs");
const { exit } = require('process');
const mysql = require('mysql');
const axios = require('axios');

const getRarityData = async(traitValue) => {
    const data = await axios.get(`http://localhost:9176/rarity/score/${traitValue}`);
    return data.data;
}

var con = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB
});

for (let i = 1; i < 3031; i++){
    //console.log(i);
    let sql = `SELECT * FROM all_data WHERE id like ${i};`
    //console.log(sql);

    con.query(sql,async function (err, result) {
        if (err) throw err;
        //console.log(result);

        let baseDesign = 0;
        if (result[0].base_design){
            const data = await getRarityData(result[0].base_design);
            baseDesign = data.score
        }

        let face = 0;
        if (result[0].face){
            const data = await getRarityData(result[0].face);
            face = data.score
        }

        let color = 0;
        if (result[0].color){
            const data = await getRarityData(result[0].color);
            color = data.score
        }

        let background = 0;
        if (result[0].background){
            const data = await getRarityData(result[0].background);
            background = data.score
        }

        let hand = 0;
        if (result[0].hand){
            const data = await getRarityData(result[0].hand);
            hand = data.score
        }

        let head = 0;
        if (result[0].head){
            const data = await getRarityData(result[0].head);
            head = data.score
        }

        let body = 0;
        if (result[0].body){
            const data = await getRarityData(result[0].body);
            body = data.score
        }

        let eyewear = 0;
        if (result[0].eyewear){
            const data = await getRarityData(result[0].eyewear);
            eyewear = data.score
        }

        const total = baseDesign + face + color + background + hand + head + body + eyewear;
        console.log("TOTAL:", total)

        //UPDATE all_data SET total_rarity=3 WHERE id = 2
        let sql = `UPDATE all_data SET total_rarity=${total} WHERE id = ${i};`
        con.query(sql,async function (err, result) {
            if (err) throw err;
            console.log(result.message);
        });
    }); 
}