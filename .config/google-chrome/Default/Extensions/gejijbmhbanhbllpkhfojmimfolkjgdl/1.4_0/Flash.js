chrome.extension.onRequest.addListener(function(request,sender, sendResponse){
objectList = document.getElementsByTagName("object");
for(var i=0;i<objectList.length;i++){

if(!objectList[i].data == ""){sendResponse(objectList[i].data); 
break;}
if(objectList[i].getElementsByTagName("embed")[0]){
if(!objectList[i].getElementsByTagName("embed")[0].src == ""){sendResponse(objectList[i].getElementsByTagName("embed")
[0].src); 
break;}}
if(objectList[i].getElementsByTagName("movie")[0]){
if(!objectList[i].getElementsByName("movie")[0].value == ""){sendResponse(objectList[i].getElementsByName("movie")[0].value); 
break;}}
}
objectList = document.getElementsByTagName("embed");
for(var i=0;i<objectList.length;i++){
if(!objectList[i].src == ""){sendResponse(objectList[i].src); 
break;}
}


 });