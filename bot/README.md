# TELEGRAM BOT

In order to authenticate voters to the hub, tellers send an otp qrcode to the voters that they can use to authenticate themself at voter interface to submit their votes.

To send qrcode is used a telegram bot.

## Installation

Move into the folder `bot`: `cd bot`.

#### Create documentation

If you are interested in read documentation install jsdoc: `sudo npm install -g jsdoc` and execute `yarn gendoc`.

#### Build the project

```
yarn build
```

#### Edit config file

In `config.js` there are different paramiter that you can edit.

#### Run the Bot

```
yarn bot
```

#### Run in debug mode

```
yarn debug
```

#### Useage

Add `VoteAuth` bot to your Telegram.

Login with your `CF` code and type your `pin`.

## Built With

* [telegraf](https://telegraf.js.org/#/) - Telegram bot framework for Node.js
* [Node.js](https://nodejs.org/en/) - Server implementation
* [Express.js](http://expressjs.com/) - Web app framework for Node.js

## Author

* **Claudio De Meo** - [cdemeo](https://github.com/ClaudioDeMeo)
