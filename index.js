const mineflayer = require("mineflayer")
const config = require('./config.json');
const chalk = require('chalk');
const autoeat = require("mineflayer-auto-eat")
const async = require("async");

let prefix = config.bot_prefix;
let join_command = config.join_command;
let ver = config.version;
let ip = config.ip;
let username = config.username;
let mc_pass = config.mcpass;
let auth = config.auth;
let login_pass = config.password;
var bot

let whitelist = config.whitelist;
let sudo_regex = new RegExp(`(${whitelist.join("|")}): ${prefix}sudo(.*)`, 'g');
let grind_regex = new RegExp(`(${whitelist.join("|")}): ${prefix}grind(.*)`, 'g');
let emptyinv_regex = new RegExp(`(${whitelist.join("|")}): ${prefix}emptyinv`, 'g');

let grind 
let activated = false
if (mc_pass == "") {
  bot = mineflayer.createBot({
    host: ip,
    username: username,
    version: ver
  })
} else {
  bot = mineflayer.createBot({
    host: ip,
    username: username,
    password: mc_pass,
    auth: auth,
    version: ver
  })
}

bot.on("login", async =>{
  if (mc_pass == "") {
    bot.chat(`/login ${login_pass}`)
  }
  bot.chat(`/${join_command}`)
  console.log(chalk.green(`Logged in as ${username} in ${ip}`))
})

bot.loadPlugin(autoeat)

bot.once("spawn", () => {
  bot.autoEat.options = {
    priority: "foodPoints",
    startAt: 14,
    bannedFood: ["rotten_flesh", "poisonous_potato", "pufferfish"]
  }
})

bot.on("autoeat_started", () => {
  clearInterval(grind)
  console.log("Auto Eat started!")
})

bot.on("autoeat_stopped", () => {
  if (activated){
    grinder()
  }
  console.log("Auto Eat stopped!")
})

bot.on("health", () => {
  if (bot.food === 20) bot.autoEat.disable()
  // Disable the plugin if the bot is at 20 food points
  else bot.autoEat.enable() // Else enable the plugin again
})

function grinder(){
  grind = setInterval(() => {
    const mobFilter = e => e.type === 'mob'
    const mob = bot.nearestEntity(mobFilter)

    if (!mob) return;

    const pos = mob.position;
    bot.lookAt(pos, true, () => {
        bot.attack(mob);
    });
}, 500);
}

bot.on("message", message =>{
  console.log(message)
  if (sudo_regex.test(`${message}`)){
    bot.chat((String(message).split(`: ${prefix}sudo `))[1])

  } else if (grind_regex.test(`${message}`)){
    var args = (String(message).split(`: ${prefix}grind `))[1]
    if (args == 'on'){
      activated = true
      grinder()
    }else if (args == 'off'){
      activated = false
      clearInterval(grind)
    }else {
      bot.chat(`Invalid argument. Command usage - ${prefix}grind {on/off}`)
    }
  } else if (emptyinv_regex.test(`${message}`)){
    async.eachSeries(bot.inventory.items(), function(item, done) {
      bot.tossStack(item, done);
    });
  }

})

