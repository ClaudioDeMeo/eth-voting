'use strict';

/**
* ADB Monitor
* @module adb
*/

const debug = require('debug')('miner:adb');
const config = require('../config');

// adb monitor
const adb = require('adbkit');

module.exports = function(){
    const client = adb.createClient();
    var openPage_id;

    function openPage(id){
        client.reverse(id, 'tcp:8080', 'tcp:' + config.API_HTTPS_PORT)
        .then(function(res){
            debug('reverse', res);
            // shell am start -a android.intent.action.VIEW -e com.android.browser.application_id com.android.browser -d http://$IP:$PORT/
            return client.startActivity(id, {
                action: 'android.intent.action.VIEW',
                data: 'https://localhost:8080',
                extras: [{
                    key: 'com.android.browser.application_id',
                    type: 'string',
                    value: 'com.android.browser',
                }],
            });
        })
        .then(function(res){
            debug('openPage', res);
        })
        .catch(function(err){
            console.error('openPage error:', err);
            //
            clearTimeout(openPage_id);
            openPage_id = setTimeout(function(){
                openPage(id);
            }, 2000);
        });
    }

    client.trackDevices()
    .then(function(tracker){
        tracker.on('add', function(device){
            debug('device was plugged in', device.id);
            //
            clearTimeout(openPage_id);
            openPage_id = setTimeout(function(){
                openPage(device.id);
            }, 1000);
        })
        tracker.on('remove', function(device){
            debug('device was unplugged', device.id);
            clearTimeout(openPage_id);
        });
        tracker.on('end', function(){
            debug('tracking stopped');
        });
        tracker.on('error', function(err){
            debug('tracking error:', err);
        });
    })
    .catch(function(err){
        console.error('error:', err);
    });
}
