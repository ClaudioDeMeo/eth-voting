'use strict'

let scanner = new Instascan.Scanner({ video: $('#video')[0] });
  scanner.addListener('scan', function (content) {
    var id = content.split(":")[0];
    var token = content.split(":")[1];
    $('#token').html("Token obtained: " + token);
    setTimeout(function(){
      $('#token').html("");
    }, 10000)
    $.post('/authOTP/' + id, {token: token}, function(data, status){
      if (status && data){
        if (data.result){
          if (data.result.auth){
            location.reload();
          }else{
            $('#errorMex').html("Token expired");
            setTimeout(function(){
              $('#errorMex').html("");
            }, 10000)
          }
        }else if(data.error){
          $('#errorMex').html(data.error);
          setTimeout(function(){
            $('#errorMex').html("");
          }, 10000)
        }
      }else{
        $('#errorMex').html("Error: " + status);
        setTimeout(function(){
          $('#errorMex').html("");
        }, 10000)
      }
    });
  });
  Instascan.Camera.getCameras().then(function (cameras) {
    if (cameras.length > 0) {
      scanner.start(cameras[0]);
    } else {
      console.error('No cameras found.');
    }
  }).catch(function (e) {
    console.error(e);
  });
