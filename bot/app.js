'use strict';

/**
* Bot server main app
* @module app
*/

//Telegram bot
const debug = require('debug')('bot');

const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const session = require('telegraf/session');
const Scene = require('telegraf/scenes/base');
const Stage = require('telegraf/stage');
const { enter, leave } = Stage;

const config = require('./config');
const mongoose = require('mongoose');
const crypto = require('./lib/crypto');

//MongoDb Connection
mongoose.set('useCreateIndex', true);
mongoose.connect(config.MONGO_URL, { useNewUrlParser: true, reconnectTries: Number.MAX_VALUE});
//Voter models
const voters = require('./controllers/voters');

//keyboard ordering
var keyorder = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  while (0 !== currentIndex) {

    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function createKeyboard(order){
  //pin inline Keyboard
  return Markup.inlineKeyboard([
    [
      Markup.callbackButton(order[0], 'digit:' + order[0]),
      Markup.callbackButton(order[1], 'digit:' + order[1]),
      Markup.callbackButton(order[2], 'digit:' + order[2])
    ],
    [
      Markup.callbackButton(order[3], 'digit:' + order[3]),
      Markup.callbackButton(order[4], 'digit:' + order[4]),
      Markup.callbackButton(order[5], 'digit:' + order[5])
    ],
    [
      Markup.callbackButton(order[6], 'digit:' + order[6]),
      Markup.callbackButton(order[7], 'digit:' + order[7]),
      Markup.callbackButton(order[8], 'digit:' + order[8])
    ],
    [
      Markup.callbackButton('🔙', 'back'),
      Markup.callbackButton(order[9], 'digit:' + order[9]),
      Markup.callbackButton('ok', 'submit')
    ]
  ]);
}

//Insert Pin Scene
const loginScene = new Scene('login');

loginScene.enter((ctx) => {
  debug('enter login scene');
  ctx.session.cf = "";
  ctx.session.pin = "";
  ctx.reply('Insert your CF code:');
});

loginScene.leave((ctx) => {
  debug("leave login scene");
  ctx.session.pin = "";
  ctx.session.cf = "";
  if (!ctx.message){
    ctx.deleteMessage();
  }
});

loginScene.command('cancel', (ctx, next) => {
  ctx.reply('ok');
  debug("annull previous command");
  next();
}, leave());

loginScene.on('text', (ctx) => {
  debug("login scene text:", ctx.message.text);
  if (ctx.session.cf.length > 0){
    ctx.replyWithMarkdown('Use `inline` keyboard.');
  }else{
    if (new RegExp('[a-z]{6}\\d{2}[abcdehlmprst]\\d{2}[a-z]\\d{3}[a-z]', 'i').test(ctx.message.text)){
      debug("cf correct form, search in db");
      voters.findByCF(ctx.message.text)
        .then((voter) => {
          if (voter){
            ctx.session.cf = ctx.message.text;
            ctx.session.order = shuffle(keyorder);
            ctx.reply('Insert your 5 digit pin and click "ok".', Extra.markup(createKeyboard(ctx.session.order)));
          }else{
            ctx.reply('CF not found.');
          }
        })
        .catch(() => {
          ctx.reply('CF not found.');
        });
    }else{
      ctx.reply("The CF isn't correct.\nInsert your CF code:");
    }
  }
});

//Bot setup
const bot = new Telegraf(config.TELEGRAM_TOKEN);
bot.use(session());

//add stage
const stage = new Stage([loginScene], { ttl: 10 });
bot.use(stage.middleware());


bot.action(/^digit:/, (ctx) =>  {
  debug("login scene insert pin digit", ctx.match.input.split("").pop());
  if (!ctx.session.pin){
    ctx.session.pin = "";
  }
  if (ctx.session.pin.length < 5){
    ctx.session.pin += ctx.match.input.split("").pop();
  }
  ctx.deleteMessage();
  ctx.reply('Insert your 5 digit pin and click "ok"."\n' + '•'.repeat(ctx.session.pin.length), Extra.markup(createKeyboard(ctx.session.order)));
  debug("pin:", ctx.session.pin);
});

bot.action('back', (ctx) => {
  debug("delete digit");
  if (ctx.session.pin && ctx.session.pin.length > 0){
    ctx.session.pin = ctx.session.pin.slice(0, -1);
  }else{
    ctx.session.pin = "";
  }
  ctx.deleteMessage();
  ctx.reply('Insert your 5 digit pin and type "ok."\n' + '•'.repeat(ctx.session.pin.length), Extra.markup(createKeyboard(ctx.session.order)));
  debug(ctx.session.pin);
});

bot.action('submit', (ctx, next) => {
  if (ctx.session.cf && ctx.session.cf.length == 16 && ctx.session.pin && ctx.session.pin.length == 5){
    voters.auth(ctx.session.cf, ctx.session.pin)
      .then((voter) => {
        if(voter.error){
          ctx.deleteMessage();
          ctx.reply(voter.error);
        }else if (voter.cf){
          voter.chatId = ctx.chat.id;
          voter.save(function (err, newVoter) {
            ctx.deleteMessage();
            if (err) {
              ctx.reply('The credentials is correct bat an error is occur. Please retry.');
            }else{
              ctx.reply('Login successful.\nYou will receive a qr code otp when I should vote');
            }
          });
        }else{
          ctx.deleteMessage();
          ctx.reply('Voter not found.');
        }
      })
      .catch(() => {
        ctx.deleteMessage();
        ctx.reply("Wrong pin.");
      });
  }else{
    ctx.deleteMessage();
    ctx.reply("Wrong pin.");
  }
  next();
}, leave());

//
bot.start((ctx, next) => {
  debug("start chat:", ctx.chat.id);
  ctx.reply('Hi ' + ctx.from.first_name + '!\n'
  + 'Welcome to VoteAuth bot, through this bot you can authenticate to vote.\n'
  + 'Type /help for commands list.');
});

//
bot.help((ctx) => {
  ctx.reply('⚙ Commands:\n'
    + ' • /start - show welcome message\n'
    + ' • /login - register CF in order to receive qr code for voting\n'
    + ' • /logout - unregister CF, you will not be able to receive the qrcode\n'
    + ' • /hub - show hub name\n'
    + ' • /cancel - cancel previous command\n'
    + ' • /help - show help\n'
  );
});

//
bot.command('login', enter('login'));

//
bot.command('hub', (ctx) =>{
  debug('hub');
  voters.findHub(ctx.chat.id)
    .then((data) => {
      if (data && data.hub){
        ctx.reply(data.hub);
      }else{
        ctx.reply('Please login /login');
      }
    })
    .catch(() => {
      ctx.reply('Please login /login');
    });
});

bot.command('logout', (ctx) => {
  debug('logout');
  voters.find(ctx.chat.id)
    .then((data) => {
      if (data && data.hub){
        data.chatId = null;
        data.save(function(err, newdata){
          if (err){
            ctx.reply('An error occur. Please retry.')
          }else{
            ctx.reply('Logout successful.');
          }
        });
      }else{
        ctx.reply('You are not loged in.');
      }
    })
    .catch(() => {
      ctx.reply('You are not loged in.');
    });
})
//
// bot.on('text', (ctx) => {
//   debug("ontext", ctx.message.text);
//   ctx.reply('Maybe you are lost, please type /help.');
// });

bot.startPolling();

console.log("bot started!");
