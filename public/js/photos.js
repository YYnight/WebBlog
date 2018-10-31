function getAlbums(){
    $.getJSON('/data.json',function(data){
        console.log(data);
        var content = ""
        for(var i = 0; i < data.photos.length;i++){
            content += "<div class='album'>"+'<div><a class="img-bg" rel="example_group" href="https://raw.githubusercontent.com/YYnight/Blog-photos/master/photos/' + data.photos[i].index + '"></a>' + '<img src="https://raw.githubusercontent.com/YYnight/Blog-photos/master/photos/' + data.photos[i].index + '" /></div><span class="album-name">'+data.photos[i].name+"</span></div>"
        }
        $("#albums").html(content)
    })
}