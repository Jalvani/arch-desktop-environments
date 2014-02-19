function BusinessNotebooks(d,b){this.getBizNotebookByGuid=function(c){c=c.replace(/^biz_/,"");for(var a=0;a<b.length;a++)if(b[a].guid===c)return b[a].auth=d,b[a];return null}};
