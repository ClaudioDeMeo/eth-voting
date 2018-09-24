'use strict'

var mining = false;

var socket = io();

function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = date + '/' + month + '/' + year + '/' + hour + ':' + min + ':' + sec ;
  return time;
}

socket.on('status', function(data){
  if (data.balance !== undefined && data.balance !== null){
    $('#balance').html(parseInt(data.balance).toFixed(2));
  }
  if (data.cpu !== undefined && data.cpu !== null){
    $('#cpu').html(data.cpu);
  }
  if (data.mining !== undefined && data.mining!== null){
    mining = data.mining;
  }
  updateMining(mining);
});

socket.on('block', function(block){
  $('#table').removeClass('hidden');
  let date = timeConverter(block.timestamp);
  let row = '<tr>' +
    '<td title="' + block.number + '">' + block.number + '</td>' +
    '<td title="' + block.hash + '">' + block.hash + '</td>' +
    '<td title="' + block.gasLimit + ' Gwei">' + block.gasLimit + 'Gwei</td>' +
    '<td title="' + block.gasUsed + ' Gwei">' + block.gasUsed + 'Gwei</td>' +
    '<td title="' + block.count + '">' + block.count + '</td>' +
    '<td title="' + date + '">' + date + '</td>' +
    '</tr>';
  $('#data').append(row);
  let i = 0;
  let tr = ',,,,,,,\n';
  let data = block.number + ',' + block.hash + ',' + block.gasLimit + ',' +
    block.gasUsed + ',' + date + ',' + block.count;
  block.transactions && block.transactions.forEach(function(el, index){
    tr = el.index + ',' + el.hash + ',' + el.from + ',' + el.to + ',' +
      el.value + ',' + el.gasPrice + ',' + el.gas + ',' +  el.input;
    data += ',' + tr + '\n';
  });
  writeFile(data + tr, function(e){
    if (e.error){
      console.log('Failed to write File, Error:', e.error.toString());
    }else{
      console.log('Data written', e.result, 'data:', data);
    }
  });
})

function getAccount(){
  $.get('/account', function(data, status){
    if (status && data.ready){
      if (data.account){
        $('#address').html(data.account);
      }else{
        $('#exitBtn')[0].click();
      }
    }else{
      setTimeout(getAccount, 500);
    }
  });
}

getAccount();

$('#exitBtn').on('click', function(){
  deleteCookie('minerPassword');
  deleteCookie('minerRemember');
});

function updateMining(mining){
  if (mining){
    $('#mineBtn').addClass('mining');
    $('#mineBtn').prop('title', "Stop Mining!");
    $('#fun').show();
  }else{
    $('#mineBtn').removeClass('mining');
    $('#mineBtn').prop('title', "Start Mining!");
    $('#fun').hide();
  }
}

$('#mineBtn').click(function(){
  $('#mineBtn').prop('disabled', true);
  if (!mining){
    let threads = $('#threads').val();
    $.get('/start', {threads: (threads.length > 0) ? threads: 1}, function(data, status){
      if (status && !data.error){
        mining = data.mining;
        updateMining(mining);
      }else if (data.error == "access deined"){
        location.reload();
      }
      $('#mineBtn').prop('disabled', false);
    });
  }else{
    $.get('/stop', function(data, status){
      if (status && !data.error){
        mining = data.mining;
        updateMining(mining);
      }else if (data.error == "access deined"){
        location.reload();
      }
      $('#mineBtn').prop('disabled', false);
    });
  }
});
