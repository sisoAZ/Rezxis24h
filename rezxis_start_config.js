const yaml = require("js-yaml");
const fs = require("fs");
const sleep = require('sleep-async')();

let mail_pass_login;
let mail;
let password;
let discord;
let token;
let userid;

try {
    const body = yaml.safeLoad(fs.readFileSync(`${process.cwd()}\\config.yml`, 'utf8'));
    console.log(body);
    mail_pass_login = body["settings"]["mail_pass_login"];
    if (mail_pass_login === "yes") {
        mail = body["account"]["mail"];
        password = body["account"]["password"];

    }
    discord = body["discord"]["discord_notification"];
    if (discord === "yes") {
        token = body["discord"]["token"];
        userid = body["discord"]["userid"];
        if (token === "" || userid === "") {
            token = null;
            userid = null;
        }
    }
} catch (e) {
    console.log("configファイルが見つかりませんでした。");
}

exports.mail_pass_login = mail_pass_login;
exports.mail = mail;
exports.password = password;
exports.discord = discord;
exports.token = token;
exports.userid = userid;