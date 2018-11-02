function filter(){
    var postElement = document.getElementsByClassName("post-title")
    if(postElement[0]){
        var parentElement = postElement[0].parentElement.parentElement
        var data = [];
        for(var j = 0; j < postElement.length; j++){
            var title = postElement[j].innerText;
            data.push({title:postElement[j].innerText,parent:postElement[j].parentElement.outerHTML})
        }
        var input =  document.getElementById("local-search-input");
        input.oninput=function(e){
            var content=""
            for(var i = 0;i<data.length;i++){
                if(data[i].title.indexOf(e.target.value)!=-1){
                    content+=data[i].parent
                }
            }
            parentElement.innerHTML = content
        }
    }
}