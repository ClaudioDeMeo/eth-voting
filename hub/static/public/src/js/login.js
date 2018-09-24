'use strict'

$(document).ready(function() {
  let password = getCookie('tellerPassword');
  let cf = getCookie('cf');
  let remember = getCookie('tellerRemember');
  if (password && cf){
    $('#password').val(password);
    $('#cf').val(cf);
    $(':checkbox').prop('checked', remember);
    onSubmit();
  }
});

function onSubmit(){
  let cf = $('#cf').val();
  let password = $('#password').val();
  if (cf.length == 16 && new RegExp('[a-z]{6}\\d{2}[abcdehlmprst]\\d{2}[a-z]\\d{3}[a-z]', 'i').test(cf)){
    if (password.length > 7){
      $.post('/login', {cf: cf, password: password}, function(data, status){
        if (status && data){
          if (data.ready){
            if (data.error){
              $('#password')[0].setCustomValidity(data.error);
              $('#accountError').html(data.error);
              setTimeout(function(){
                $('#accountError').html("");
              },5000);
            }else{
              if ($(':checkbox').prop('checked')){
                setCookie('cf', $('#cf').val(), 30);
                setCookie('tellerPassword', $('#password').val(), 30);
                setCookie('tellerRemember', true, 1);
              }else{
                deleteCookie('cf');
                deleteCookie('tellerPassword');
                deleteCookie('tellerRemember');
              }
              location.reload();
            }
          }else{
            $('#serverError').html(data.error);
            setTimeout(function(){
              $('#serverError').html("");
            },5000);
          }
        }
      });
    }else{
      $('#password')[0].setCustomValidity("Password too short");
    }
  }else{
    $('#cf')[0].setCustomValidity("CF invalid format");
  }
}

$('form').on("submit",function(e){
    e.preventDefault();
    return  false;
});
