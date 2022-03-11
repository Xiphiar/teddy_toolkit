const csv = require('csv-parser');
const fs = require('fs');
var crypto = require('crypto');
require('dotenv').config();
const {
    EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey
  } = require("secretjs");
const { exit } = require('process');
var mysql = require('mysql'); 




function pad(num, size) {
    var s = "000" + num;
    return s.substr(s.length-size);
}

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

    fs.createReadStream('data/results.csv')
    .pipe(csv())
    .on('data', (row) => {

        //pad ID with leading 0's (123 => 0123)
        let fullid = pad(row["Teddy #"], 4);


        let sql = `INSERT INTO pub_data (id, base_design, total_rarity) VALUES ('${row["Teddy #"]}', '${row["base design"]}', '${row["Total score"].replace('.','')}');`
        //console.log(sql);


        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log(`Result ${row["Teddy #"]}: ` + result);
        });
        

    })
    .on('end', async() => {
        console.log('CSV file successfully processed');

    });

});