'use strict'

var token = null;
var time_remaining = null;
var timer = null;

var candidateId = null;
var listId = null;

function candidateHTML(candidate, id, lists){
  let html = $( '<div id="' + id + '" class="candidate layout vertical">'
                + '<div class="layout vertical box">'
                  + '<div class="candidateName layout center" title="' + candidate.name + ' ' + candidate.surname + '">'
                    + candidate.name + ' ' + candidate.surname
                  + '</div>'
                  + '<div class="layout center" style="font-size: small;padding-bottom:2px;">(uninominal candidate)</div>'
                + '</div>'
                + '<div class="lists layout horizontal wrap"></div>'
              + '</div>');
  lists.forEach(function(list, index){
    let htmlList = $( '<div id="' + id + '-' + index + '" class="list box">'
                      + '<div class="layout horizontal center">'
                        + '<div class="listName layout center" title="' + list.name + '">'
                          + list.name
                        + '</div>'
                        + '<ul class="members"></ul>'
                      + '</div>'
                    + '</div>');
    list.members.forEach(function(member){
      let htmlMember = $('<li>' + member.name + ' ' + member.surname + '</li>');
      htmlList.find('.members').append(htmlMember);
    });
    html.find('.lists').append(htmlList);
  });
  return html;
}

function getModel(model){
  model.forEach(function(element, index){
    $('#model').append(candidateHTML(element.candidate, index, element.lists));
  });

  $('.candidateName').click(function(){
    if (candidateId){
      $('#image' + candidateId).remove();
    }
    var newId = $(this).parent('.box').parent('.candidate').attr('id');
    if (candidateId != newId){
      candidateId = newId;
      $(this).parent('.box').append('<div id="image' + candidateId + '" class="image" style="top:-5px;left: 205px;">'
                                    + '<img src="src/image/sign.png" alt="selected">'
                                  + '</div>');
      if (listId && listId.split('-')[0] != candidateId){
        $('#image' + listId).remove();
        listId = null;
      }
    }else{
      candidateId = null;
    }
  });

  $('.listName').click(function(){
    if (listId){
      $('#image' + listId).remove();
    }
    var newId = $(this).parent('div').parent('.list').attr('id');
    if (listId != newId){
      listId = newId;
      $(this).append( '<div id="image' + listId + '" class="image imageBig" style="top:5px;left: 15px;">'
                      + '<img src="src/image/sign.png" alt="selected">'
                    + '</div>');

      if (candidateId && listId && listId.split('-')[0] != candidateId){
        $('#image' + candidateId).remove();
        candidateId = null;
      }
    }else{
      listId = null;
    }
  });
}

function getSession(){
  $.get('/session', function(data, status){
    if (status && data.ready){
      if (data.auth && data.token && !data.error){
        token = data.token;
        time_remaining = data.time_remaining - 1;
        timer = setInterval(function(){
          time_remaining--;
          $('#timer').html(time_remaining);
          if (time_remaining <= 0){
            clearInterval(timer);
            if (candidateId){
              $('#image' + candidateId).remove();
            }
            if (listId){
              $('#image' + listId).remove();
            }
            fullScreenMsg("Your time is expired!", function(){
              location.reload();
            });
          }
        },1000);
        getModel(data.model);
      }else{
        location.reload();
      }
    }else{
      setTimeout(getSession, 500);
    }
  });
}

getSession();


function fullScreenMsg(msg, onSubmit){
  $('body').append( '<div class="fullscreen layout center">'
                    + '<div class="main-container" style="max-height: calc(100vh - 390px); max-width: calc(100vw - 45%);">'
                      + '<div class="layout vertical">'
                        + '<div class="layout center grow">' + msg + '</div>'
                        + '<div class="layout end">'
                          + '<button>Ok</button>'
                        + '</div>'
                      + '</div>'
                    + '</div>'
                  + '</div>').find('button').click(onSubmit);
}

$(document).ready(function(){

  $('#submit').click(function(){
    $.post('/submitVote',{candidate: candidateId, list: listId}, function(data, status){
      if (status && data.ready){
        fullScreenMsg(data.tx || data.error, function(){
          location.reload();
        });
      }else{
        fullScreenMsg("Error: an error occurred", function(){
          $('.fullscreen').remove();
        });
      }
    });
  });
});
