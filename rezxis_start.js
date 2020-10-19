const mineflayer = require("mineflayer");
const path = require('path')
const sleep = require('sleep-async')();
const chalk = require('chalk');
const Discord = require('discord.js');
const pressAnyKey = require('press-any-key');
const config = require("./rezxis_start_config");

let session;
let auth;
let profileID;
let bot;
let client;

if (config.mail_pass_login === "no") {
    try {
        var profile = require(path.resolve(`${process.env.APPDATA}\\.minecraft`, 'launcher_profiles.json'))
        auth = profile.authenticationDatabase[profile.selectedUser.account]
        profileID = profile.selectedUser.profile
    }
    catch {
        console.log(chalk.red("プロファイルが見つかりませんでした、メールアドレス、パスワードでログインしてください"));
    }
}

//console.log(profile + ", " + auth + "," + profileID + "test ->" + process.env.APPDATA);
//console.log(`kuso seiyaku ${config.mail_pass_login} ${config.mail} ${config.password}`);

if (config.mail_pass_login === "yes") {}
else {
    session = {
        accessToken: auth.accessToken,
        clientToken: profile.clientToken,
        selectedProfile: {
          id: profileID,
          name: auth.profiles[profileID].displayName
        }
    }
}

function main() {
    if (config.mail_pass_login === "yes") {
        bot = mineflayer.createBot({
            host: "mchosting.rezxis.net",
                port: 25565,
                username: config.mail,
                password: config.password
        })
    }
    else {
        bot = mineflayer.createBot({
            host: "mchosting.rezxis.net",
            port: 25565,
            session
        })
    }
    
    bot.once("spawn", function () {
        console.log(`Logged in ${bot.username}`)
        bot.chat("/manage");
        send_discord_message(`Logged in ${bot.username}`);
    });

    bot.on("windowOpen", function (window) {
        sleep.sleep(1000, function () {
            if (window.slots[0] === null) {
                console.log("null now");
                return;
            }
            const item_name = window.slots[0].nbt.value.display.value.Name.value;
            if (item_name.includes("オフライン")) {
                //Start
                console.log(chalk.green("Server Starting..."));
                bot.clickWindow(0, 0, 0);
            }
            else if (item_name.includes("オンライン")) {
                //Connect
                console.log(chalk.green("Joining Server..."));
                bot.clickWindow(4, 0, 0);
            }
        })
    })

    bot.on("message", function (msg) {
        const message = msg.toString();
        console.log(message);
        if (message.includes("サーバーが起動しました。")) {
            bot.chat("/manage");
        }
        if (message.includes("サーバーの起動上限に到達しているので")) {
            sleep.sleep(5000, function () { // 5秒ごとにreconnect
                bot.chat("/manage");
            })
        }
        if (message.includes("Exception Connecting")) {
            sleep.sleep(20000, function () { // 20秒後にreconnect
                bot.chat("/manage");
            })
        }
    });

    // Error or Kick or Disconnect
    bot.on("kicked", function (reason) {
        console.log(`Kicked reason by ${reason}`);
        if (reason.includes("whitelisted")) {
            console.log("Server is whitelist");
            send_discord_message(`Rezxis bot Ended -> ${reason}`);
            sleep.sleep(2000, function (){
                process.exit(1);
            })
        }
    }, true);

    bot.on("error", function (reason) {
        if (reason.toString().includes("Invalid credentials.")) {
            console.log(chalk.red("パスワード又はメールアドレスが間違っています."));
        }
        if (reason.toString().includes("Invalid token.")) {
            console.log(chalk.red("正常にログインできませんでした、ランチャーを起動してアカウントにログインしてから再度お試しください。"));
        }
        console.log(`Server Connection Error reason by ${reason}`);
        send_discord_message(`Rezxis bot Ended -> ${reason}`);
        program_end();
    });

    bot.on("end", function() {
        console.log("Bot Reconnecting...");
        main();
    });
}

if (config.discord === "yes") {
    if (config.token !== null && config.userid !== null) {
        client = new Discord.Client()
        client.login(config.token)
        .then(function () {
            console.log(chalk.green(`Discord bot logged in ${client.user.username}`));
        })
        .catch(function () {
            console.log(chalk.red("Discord TOKENが無効です"));
            client = undefined;
        })
    }
    else {
        console.log(chalk.red("Please enter bot token in config filebot token or userid is not set, please check the config file"));
    }
}

main();

//functions
function program_end() {
    pressAnyKey("Press any key.", {
        ctrlC: "reject"
    })
    .then(() => {
        process.exit(1);
    })
    .catch(() => {
        process.exit(1);
    })
}

function send_discord_message(message) {
    if (typeof client === "undefined") {return};
    const user = client.users.cache.get(config.userid);
    try {
        user.send(message);
    }
    catch {
        console.log(chalk.red("Discordのメッセージ送信に失敗しました。"));
    }
}