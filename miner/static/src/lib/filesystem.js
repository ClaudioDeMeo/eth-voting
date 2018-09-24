'use strict'

window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

var filesystem=null;

function errorHandler(error) {
  var message = '';
  switch (error.code) {
    case 1:
    message = 'Not Found Error';
    break;
    case 2:
    message = 'Security Error';
    break;
    case 10:
    message = 'Quota Exceeded Error';
    break;
    case 9:
    message = 'Invalid Modification Error';
    break;
    case 7:
    message = 'Invalid State Error';
    break;
    default:
    message = error.name;
    break;
  }
  console.log(message);
}

function writeFile(data, cb){
  console.log("Start writing", data);
	filesystem.root.getFile('log.csv', {create: true}, function(fileEntry){
		fileEntry.createWriter(function(fileWriter) {
			fileWriter.seek(fileWriter.length); //append to file if it exists
			fileWriter.onwriteend = function(e){
				// Update the file browser.
        console.log('onwriteend',e);
				cb && cb({result: e});
			};
			fileWriter.onerror = function(e){
				console.log('Write error: ' + e.toString());
        cb && cb({error: e})
			};
			var contentBlob = new Blob([data], {type: 'text/plain'});
			fileWriter.write(contentBlob);
		}, errorHandler);
	}, errorHandler);
}

function readFile(cb) {
	filesystem.root.getFile('log.csv', {}, function(fileEntry){
		fileEntry.file(function(file) {
			var reader = new FileReader();
			reader.onloadend = function(e){
				cb && cb({result: e});
			};
      reader.onerror = function(e){
        cb && cb({error: e});
      };
			reader.readAsText(file);
		}, errorHandler);
	}, errorHandler);
}

if (window.requestFileSystem){
	navigator.webkitPersistentStorage.requestQuota(10 * 1024 * 1000,function(grantedSize){
		window.requestFileSystem(window.PERSISTENT, grantedSize, function(fs){

      //remove file log.csv if exists
      fs.root.getFile('log.csv', {create: false}, function(fileEntry) {
        fileEntry.remove(function() {
          console.log('File removed.');

          //write header
          let data = "Block Number,Block Hash,Gas Limit (Gwei),Gas Used (Gwei),Timestamp,Number of Transactions," +
            "Transaction Index,Transactions Hash,From,To,Value (Eth),Gas Price (Gwei),Gas (Gwei),Input\n";
          writeFile(data, function(e){
            if (e.error){
              console.log('Failed to write File, Error:', e.error.toString());
            }else{
              console.log('Data written', e.result, 'data:', data);
            }
          });

        }, errorHandler);
      }, errorHandler);

      filesystem = fs;

    }, errorHandler);
	}, errorHandler);
}else{
	alert("Your browser doesn't support the FileSystem API");
}

function downloadFile(){
	readFile(function(e){
    if (e.error){
      console.log("downloadFile Error:", e.error);
    }else if (e.result){
      let blob = new Blob([e.result.srcElement.result], {type: {mimeType: 'text/plain'}});
      var url = window.URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = "log.csv";
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    }
	});
}
