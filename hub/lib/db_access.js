'use strict';

/**
* Moongose Database access module
* @module db_access
*/

const debug = require('debug')('hub:db_access');
const config = require('../config');
const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);

module.exports = async function(url, app){
  var connection = null;
  try {
    connection = await mongoose.createConnection(url, { useNewUrlParser: true, reconnectTries: Number.MAX_VALUE});
    debug('mongodb', connection.user, 'connected');
  } catch (err) {
    debug('mongodb', connection.user, 'error:', err);
    return err;
  }

  return {
    hub : require('../controllers/hub')(connection),
    voters : require('../controllers/voters')(connection, app),
    tellers : require('../controllers/tellers')(connection, app)
  };

}
