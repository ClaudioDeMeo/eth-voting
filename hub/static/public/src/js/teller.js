'use strict'

$('.list').hide();

var hub = null;

function calculateAge(birthday) {
    var ageDifMs = Date.now() - birthday.getTime();
    var ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function dateToString(date){
  var dd = date.getDate();
  var mm = date.getMonth()+1; //January is 0!
  var yyyy = date.getFullYear();
   if(dd<10){
          dd='0'+dd
      }
      if(mm<10){
          mm='0'+mm
      }

  return yyyy+'-'+mm+'-'+dd;
}

var today = new Date();
today.setFullYear(today.getFullYear() - 17);
$('#birthDay').prop('max', dateToString(today));

function getTeller(){
  $.get('/access', function(data, status){
    if (status && data.ready){
      if (data.teller){
        $('#tellername').html(data.teller.lastname + " " + data.teller.firstname);
        hub = data.teller.hub;
        $('#hubname').html(hub);

        var socket = io();

        socket.on('connect', function(){
          if (hub){
            socket.emit('ready', {hub: hub});
          }
        });

        socket.on('stats', function(stats){
          var perc = ((stats.voted/stats.total)*100).toFixed(2);
          $('#total').html(stats.total);
          $('#total').prop('title', stats.total + " voters");
          $('#voted').html(stats.voted);
          $('#voted').prop('title', stats.voted + " have voted (" + perc + "%)");
          $('#notVoted').html(stats.notVoted);
          $('#notVoted').prop('title', stats.notVoted + " have not voted (" + (100 - perc) + "%)");
          $('#perc').html(perc);
        });

      }else{
        $('#exitBtn')[0].click();
      }
    }else{
      setTimeout(getAccount, 500);
    }
  });
}

getTeller();

$('#exitBtn').on('click', function(){
  deleteCookie('cf');
  deleteCookie('tellerPassword');
  deleteCookie('tellerRemember');
});

function getValue(name){
  var val = $('#' + name).val();
  switch (name) {
    case "birthDay":
      $('#' + name).val("");
      return val != "" ? new Date(val): undefined;
      break;
    case "doctype":
        return $('#doctype').find("option:selected").attr('value');
      break;
    default:
      $('#' + name).val("");
      return val.length > 0 ? val : undefined;
  }
}

function onSubmit(){
  var entry = {};
  entry.firstname = getValue('name');
  entry.lastname = getValue('surname');
  entry.cf = getValue('cf');
  entry.docId = getValue('docid');
  entry.hub = hub;
  entry.address = getValue('via');
  entry.number = getValue('number');
  entry.city = getValue('city');
  entry.cap = getValue('cap');
  entry.province = getValue('province');
  entry.birthDay = getValue('birthDay');
  entry.birthPlace = getValue('birthPlace');
  entry.birthProvince = getValue('birthProvince');
  $.get('/voters', entry, function(data, status){
    if (status && data){
      if (data.error){
        $('#errorMessage').html(data.error);
        setTimeout(function(){
          $('#errorMessage').html("");
        },5000);
      }else{
        if (data.result.length > 0){
          $('#entryFound').html(data.result.length + ' entry found');
          data.result.forEach(function(element){
            $('#list').append('<tr id="' + element._id + '">'
              + '<td title="' + element.cf + '">' + (element.cf || "") + '</td>'
              + '<td title="' + element.firstname + '">' + (element.firstname || "") + '</td>'
              + '<td title="' + element.lastname + '">' + (element.lastname || "") + '</td>'
              + '<td title="' + element.docId + '">' + (element.docId || "") + '</td>'
              + '<td title="' + (element.birthDay && element.birthDay.substr(0, 10)) + '">' + ((element.birthDay && element.birthDay.substr(0, 10)) || "") + '</td>'
              + '<td title="' + element.city + '">' + (element.city || "") + '</td>'
              + '<td title="' + (element.address && (element.address + ", n°" + (element.number || "")) || "") + '" class="voters">' + (element.address && (element.address + ", n°" + (element.number || "")) || "") + '</td>'
              + '<td class="voted" title="' + (element.voted ? "Yes" : "No") + '">' + (element.voted ? "Yes" : "No") + '</td>'
              + (!element.voted ? ('<td title="enable to vote" class="vote"><button class="voteBtn" title="enable to vote" onclick="enableVoteFor(\'' + element._id + '\');">Enable vote</button></td>'
              + '<td title="Set voted" class="vote"><button class="voteBtn" title="Set voted" onclick="setVoted(\'' + element._id + '\');">Voted</button></td>') : '')
              + '</tr>');
          });
          $('#table').removeClass('hidden');
          $('.form').hide();
          $('.list').show();
        }else{
          $('#infoMessage').html("0 entry found.");
          setTimeout(function(){
            $('#infoMessage').html("");
          },5000);
        }
      }
    }
  });
}

function resetList(){
  $('#list').html("");
  $('.form').show();
  $('.list').hide();
}

$('form').on("submit",function(e){
    e.preventDefault();
    return  false;
});

function enableVoteFor(id){
  $.post('/enableVote', {voter: id}, function(data, status){
    if (status && !data.error){
      $('#voteinfoMessage').html(data.result);
      setTimeout(function(){
        $('#voteinfoMessage').html("");
      },5000);
    }else{
      $('#voteerrorMessage').html(data.error || "Error!");
      setTimeout(function(){
        $('#voteerrorMessage').html("");
      },5000);
    }
  });
}

function setVoted(id){
  $.post('/voted', {voter: id}, function(data, status){
    if (status && ((!data.error && data.result == "voted") || data.error == "Already voted")){
      $('#' + id + ">.vote").remove();
      $('#' + id + ">.voted").html("Yes");
    }else{
      $('#voteerrorMessage').html(data.error || "Error!");
      setTimeout(function(){
        $('#voteerrorMessage').html("");
      },5000);
    }
  });
}
