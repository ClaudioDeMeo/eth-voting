'use strict'

function getAccount(){
  $.get('/account', function(data, status){
    if (status && data.ready){
      $('#address').val(data.account || "New Account");
      $('#address').prop('title', data.account || "New Account");
      if (!data.account){
        $('#repeatedPassword').show();
        $('button').html('Create New Account');
        $('#password').prop('title', "Must contain at least one number and one uppercase and lowercase letter, and at least 8 or more characters");
      }else{
        $('#repeatedPassword').hide();
        $('button').html('Login');
        $('#password').prop('title', "Insert Password");
        let password = getCookie('minerPassword');
        let remember = getCookie('minerRemember');
        if (password){
          $('#password').val(password);
          $(':checkbox').prop('checked', remember);
          onSubmit();
        }
      }
    }else{
      setTimeout(getAccount, 500);
    }
  });
}

getAccount();

function onSubmit(){

  function postData(data){
    if (data){
      if (data.ready){
        if (data.error){
          $('#accountError').html(data.error);
          setTimeout(function(){
            $('#accountError').html("");
          },5000);
        }else{
          if ($(':checkbox').prop('checked')){
            setCookie('minerPassword', $('#password').val(), 30);
            setCookie('minerRemember', true, 1);
          }else{
            deleteCookie('minerPassword');
            deleteCookie('minerRemember');
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
  }

  let address = $('#address').val();
  let password = $('#password').val();
  let repeatedPassword = $('#repeatedPassword').val();
  if (address == "New Account"){
    if (password.length > 7 && password == repeatedPassword){
      $.post('/newaccount', {password: password}, function(data, status){
        postData(data);
      });
    }else{
      if(password != repeatedPassword){
        $('#password')[0].setCustomValidity("Must be equale to confirm password field");
      }else{
        $('#password')[0].setCustomValidity($('#password').attr('title'));
      }
    }
  }else{
    if (password.length > 7){
      $.post('/login', {password: password}, function(data, status){
        if (data){
          postData(data);
        }
      });
    }else{
      $('#password')[0].setCustomValidity("Must contain at least one number and one uppercase and lowercase letter, and at least 8 or more characters");
    }
  }
}

$('form').on("submit",function(e){
    e.preventDefault();
    return  false;
});
