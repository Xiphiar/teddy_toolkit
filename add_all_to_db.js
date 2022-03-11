const csv = require('csv-parser');
const fs = require('fs');
var crypto = require('crypto');
require('dotenv').config();
const {
    EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey
  } = require("secretjs");
const { exit } = require('process');
var mysql = require('mysql');

var con = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB
});


con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");

    fs.createReadStream('data/Traits.csv')
    .pipe(csv())
    .on('data', (row) => {

        let sql = `REPLACE INTO all_data (id, base_design, face, color, background, hand, head, body, eyewear, dao_value)
                        VALUES (
                            "${row["Teddy #"]}",
                            "${row["base design"].trim().replace(/[^\x00-\x7F]/g, "")}",
                            "${row["facial expression"].trim().replace(/[^\x00-\x7F]/g, "")}",
                            "${row["bear color"].trim().replace(/[^\x00-\x7F]/g, "")}",
                            "${row["background"].trim().replace(/[^\x00-\x7F]/g, "").replace(/["]/g, "")}",
                            "${row["hand held"].trim().replace(/[^\x00-\x7F]/g, "")}",
                            "${row["on head"].trim().replace(/[^\x00-\x7F]/g, "")}",
                            "${row["on body"].trim().replace(/[^\x00-\x7F]/g, "")}",
                            "${row["eye wear"].trim().replace(/[^\x00-\x7F]/g, "")}",
                            "${row["Dao value"].trim().replace(/[^\x00-\x7F]/g, "")}"
                        );`
        console.log(sql);

        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log(`Result ${row["Teddy #"]}: ` + result);
        });  

    })
    .on('end', async() => {
        console.log('CSV file successfully processed');
    });
});