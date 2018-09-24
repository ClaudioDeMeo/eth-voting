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
        let password = getCookie('hubPassword');
        let hubname = getCookie('hubname');
        let remember = getCookie('hubRemember');
        if (password && hubname){
          $('#password').val(password);
          $('#hubname').val(hubname);
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
            setCookie('hubname', $('#hubname').val(), 30);
            setCookie('hubPassword', $('#password').val(), 30);
            setCookie('hubRemember', true, 1);
          }else{
            deleteCookie('hubPassword');
            deleteCookie('hubRemember');
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
  let hubname = $('#hubname').val();
  if (address == "New Account"){
    if(hubname.length > 0){
      if (password.length > 7 && password == repeatedPassword){
        $.post('/newaccount', {hubname: hubname, password: password}, function(data, status){
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
      $('#hubname')[0].setCustomValidity($('#hubname').attr('title'));
    }
  }else{
    if (password.length > 7){
      $.post('/login', {hubname: hubname, password: password}, function(data, status){
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
