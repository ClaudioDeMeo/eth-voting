'use strict'

$(document).ready(function() {
  updateType();
});

$('.list').hide();

var search = false;

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

function updateType(){
  var type = $('#entryType').find("option:selected").attr('value');
  switch (type) {
    case "voters":
      $('.tellers').hide();
      $('.voters').show();
      $('#password').prop('disabled', true);
      break;
    case "tellers":
      $('.tellers').show();
      $('.voters').hide();
      if(!search){
        $('#password').prop('disabled', false);
      }
      break;
  }
}

$('#entryType').change(function(){
  updateType();
});

function getAccount(){
  $.get('/account', function(data, status){
    if (status && data.ready){
      if (data.account && data.hub){
        $('#address').html(data.account);
        $('#hubname').html(data.hub);

        var socket = io.connect("https://" + window.location.host.replace(window.location.port, data.publicPort), {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax : 5000,
          reconnectionAttempts: 99999
        });

        socket.on('connect', function(){
          if ($('#hubname').html() != ""){
            socket.emit('ready', {hub: $('#hubname').html()});
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

getAccount();

$('#exitBtn').on('click', function(){
  deleteCookie('hubname');
  deleteCookie('hubPassword');
  deleteCookie('hubRemember');
});

$('#addBtn').on('click', function(){
  resetList();
});

$('#searchBtn').on('click', function(){
  $('#addBtn').prop('disabled', false);
  $('#searchBtn').prop('disabled', true);
  $('.add').hide();
  search = true;
  $('#password').prop('disabled', true);
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

function validate(type, entry){
  var docType = getValue('doctype');
  if (!entry.firstname || entry.firstname.length == 0){
    $('#name')[0].setCustomValidity($('#name').attr('title'));
    return false;
  }
  if (!entry.lastname || entry.lastname.length == 0){
    $('#surname')[0].setCustomValidity($('#surname').attr('title'));
    return false;
  }
  if (type == "voter" && (!entry.password || entry.password.length != 5 || !(new RegExp('[0-9]$').test(entry.password)))){
    $('#pin')[0].setCustomValidity("Incorrect Format");
    return false;
  }
  if(!entry.cf || entry.cf.length != 16 || !(new RegExp('[a-z]{6}\\d{2}[abcdehlmprst]\\d{2}[a-z]\\d{3}[a-z]', 'i').test(entry.cf))){
    $('#cf')[0].setCustomValidity("Incorrect Format");
    return false;
  }
  if(!entry.docId || (docType == "identity card" && entry.docId.length != 9 && !(new RegExp('au\\d{7}|c\\[a-z]{1}\\d{5}\\[a-z]{2}','i').test(entry.docId)))
  || (docType != "identity card" && entry.docId.length != 10 && !(new RegExp('\\[a-z]{2}\\d{7}\\[a-z]{1}').test(entry.docId)))){
    $('#docid')[0].setCustomValidity("Incorrect Format");
    return false;
  }
  if (!entry.hub || entry.hub.length == 0){
    $('#hub')[0].setCustomValidity($('#hub').attr('title'));
    return false;
  }
  if (entry.email && !(new RegExp('\\w+@\\w+\\.\\w{2,4}', 'i').test(entry.email))){
    $('#email')[0].setCustomValidity("Email incorrect format");
    return false;
  }
  if (type == "teller" && (entry.password && !(new RegExp('(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}').test(entry.password)))){
    $('#password')[0].setCustomValidity($('#password').attr('title'));
    return false;
  }
  return true;
}

function onSubmit(){
  var type = $('#entryType').find("option:selected").attr('value');
  var method = search ? "GET" : "POST";
  var entry = {};
  entry.firstname = getValue('name');
  entry.lastname = getValue('surname');
  entry.cf = getValue('cf');
  // entry.docType = getValue('doctype');
  entry.docId = getValue('docid');
  entry.hub = getValue('hub');
  switch (type) {
    case "voters":
      entry.password = getValue('pin');
      entry.address = getValue('via');
      entry.number = getValue('number');
      entry.city = getValue('city');
      entry.cap = getValue('cap');
      entry.province = getValue('province');
      entry.birthDay = getValue('birthDay');
      entry.birthPlace = getValue('birthPlace');
      entry.birthProvince = getValue('birthProvince');
      break;
    case "tellers":
      entry.email = getValue('email');
      entry.password = getValue('password');
      break;
  }
  type = search ? type : type.slice(0, -1);
  if (method == "GET" || validate(type, entry)){
    $.ajax({
      url: '/' + type,
      data: (method == "POST") ? JSON.stringify(entry) : entry,
      type: method,
      contentType: 'application/json',
      success: function(data, status){
        if (status && data){
          if (data.error){
            $('#errorMessage').html(data.error);
            setTimeout(function(){
              $('#errorMessage').html("");
            },5000);
          }else{
            if (data.result == "ok"){
              $('#infoMessage').html("1 entry inserted.");
              setTimeout(function(){
                $('#infoMessage').html("");
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
                    + '<td title="' + element.hub + '">' + (element.hub || "") + '</td>'
                    + '<td title="' + element.email + '" class="tellers">' + (element.email || "") + '</td>'
                    + '<td title="' + (element.birthDay && element.birthDay.substr(0, 10)) + '" class="voters">' + ((element.birthDay && element.birthDay.substr(0, 10)) || "") + '</td>'
                    + '<td title="' + element.city + '" class="voters">' + (element.city || "") + '</td>'
                    + '<td title="' + (element.address && (element.address + ", n°" + (element.number || "")) || "") + '" class="voters">' + (element.address && (element.address + ", n°" + (element.number || "")) || "") + '</td>'
                    + '<td title="' + (element.voted ? "Yes" : "No") + '" class="voters">' + (element.voted ? "Yes" : "No") + '</td>'
                    + '<td title="delete" class="delete"><button class="deleteBtn" title="delete" onclick="deleteEntry(\'' + element._id + '\');"><img src="src/image/delete-icon.png" alt="delete"></button></td>'
                    + '</tr>');
                    updateType();
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
        }
      }
    });
  }else{

  }
}

function onSubmitCSV(){
  $('#fileInput').val("");
  $('#fileInput').click();
}

$('#fileInput').change(function(e){
  var file = $('#fileInput').prop('files')[0];
  if (file){
    var form_data = new FormData();
    form_data.append('file', file);
    var type = $('#entryType').find("option:selected").attr('value');
    $.ajax({
      url: '/' + type,
      data: form_data,
      type: "POST",
      contentType: false,
      processData: false,
      success: function(data, status){
        if (status && data){
          if (data.error){
            $('#errorMessage').html(data.error);
            setTimeout(function(){
              $('#errorMessage').html("");
            },5000);
          }else{
            $('#infoMessage').html(data.inserted + " entry inserted; " + data.discarded + "entri discarded.");
            setTimeout(function(){
              $('#infoMessage').html("");
            },5000);
          }
        }
      }
    });
  }
});

function resetList(){
  $('#searchBtn').prop('disabled', false);
  $('#addBtn').prop('disabled', true);
  $('.add').show();
  search = false;
  if ($('#entryType').find("option:selected").attr('value') == "tellers"){
    $('#password').prop('disabled', false);
  }
  $('#list').html("");
  $('.form').show();
  $('.list').hide();

}

$('form').on("submit",function(e){
    e.preventDefault();
    return  false;
});

function deleteEntry(id){
  var type = $('#entryType').find("option:selected").attr('value').slice(0, -1);
  $.ajax({
    url: '/' + type + '/' + id,
    type: "DELETE",
    success: (data, status) => {
      if (status && !data.error && data.result == "ok"){
        $('#' + id).remove();
        $('#entryFound').html(($('#entryFound').html().substring(0, 1) - 1) + " entry found");
      }
    }
  });
}
