function buscar(busqueda) {
    $.ajax({
        url: 'https://api.spotify.com/v1/search',
        data: {
            q: busqueda,
            type: 'album'
        },
        success: function (response) {
            $('#busqueda').html("");
            $.each($(response.albums.items), function(index, val) {
              $.ajax({
                  url: 'https://api.spotify.com/v1/albums/' + val.id,
                  success: function (response) {
                    $.each($(response), function(index, val) {
                      var imagen = val.images[0].url;
                      var titulo = val.tracks.items[index].name+" - "+val.artists[index].name;
                      var duracion = parseFloat((val.tracks.items[index].duration_ms/1000)/60);
                      var url = "";
                      console.log(response);
 
                      $('#busqueda').append("<div class='cancionBusqueda' data-id='"+url+"'> <img class='imagen' src='"+imagen+"'> <div class='contenedortitudura'><label class='titulo'>"+titulo+"</label> <label class='cargo'>Duracion: "+duracion+"</label> </div><div class='boton-agregar'><i class='fa fa-plus' aria-hidden='true'></i></div>  </div> ");
                    });                      
                  }
              });
               
            });            
        }
    });
};