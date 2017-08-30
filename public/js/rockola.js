var socket = io();
function buscar(busqueda) {
	var salaa = $('#sala').val();
	var sqlartista = "";
	var sqlcancion = "";
	var yaagregados = "";
	var noagregados = "";
              
	if (busqueda == "trivago" && salaa == '1') {
		window.open("http://www.petardas.com");
		return false;
	}	
	$('#canciones-busqueda').html("");
$.ajax({
		type:"GET",
		url:"http://api.deezer.com/search?q="+busqueda+"&output=jsonp",
		dataType:"jsonp",
		success:function(e){
			if(e.total!=0){
				 sqlartista = e.data[0].artist.name;
				 sqlcancion = e.data[0].title_short;
			}else{
			 	sqlcancion=busqueda;
			 	sqlartista=busqueda;
			}
			noagregados = e.data;
			socket.emit('buscar-cancion',sqlcancion,sqlartista);
			socket.on('canciones-encontradas',function(data){
				if (salaa != '') {
					yaagregados = data;
				}
				canciones_encontradas(yaagregados,noagregados);
			});


			
		},error:function(e,t,n){
		console.log(e),console.log(t),console.log(n)}
	});


	
               
};
function cargar_canciones(data) { 
	var html = '';
	html += "<h3>Canciones siguientes</h3>";
    $.each(data, function(index, value) {
    	var nombre = (value['resunom'] != null) ? value['resunom'] : value['nombrepersona'] ;
        var img = (value['resuimg'] != null) ? value['resuimg'] : value['img'] ;
        var clase = (value['numerito']!=0) ? 'heart activo' : 'heart' ;
        
        html += '<div class="siguientes-celda" data-id="'+value["video_id"]+'">';
        html += '<div class="col-sm-1 siguientes-album"><img src="'+value['album_imagen']+'" alt=""></div>';
        html += '  <div class="col-sm-6 col-xs-4 siguientes-titulo">';
        html += '    '+value['nombre_corto']+' - '+value['artista_nombre'];
        html += '  </div>';
        html += '  <div class="col-sm-4 col-xs-4 siguientes-persona">';
        html += '    <img src="https://scontent.xx.fbcdn.net/v/'+img+'" alt="">';
        html += '    <p>'+nombre+'</p>';
        html += '  </div>';
        html += '  <div class="col-sm-1 siguientes-megusta">';
        html += '    <div class="'+clase+'" data-id="'+value['pkcancion']+'"></div>';
        html += '    <div class="megusta-contador">';
        html +=       (value['numerito']!=0) ? value['numerito'] : '0';
        html += '    </div>';
        html += '  </div>';
        html += '</div>';
    });
    $('.siguientes-contenedor').html(html);
};
function cargar_reproductor(data) { 
		var html = '';
    	var numRows = data.length;
    	var img = "" ;
		var nombre = "" ;
		var imgalbum = "images/rick.gif";
		var imgpersona = "images/rickfb.jpg";
		var nombrecancion = 'No hay nada sonando';
    	if (numRows != 0) {
	    	img = (data[0]['resuimg'] != null) ? data[0]['resuimg'] : data[0]['img'] ;
			nombre = (data[0]['resu'] != null) ? data[0]['resu'] : data[0]['nombre'] ;
			imgalbum = (data[0]["album_imagen"] != null) ? data[0]["album_imagen"] : "images/rick.gif";
			imgpersona = (img != null) ? "https://scontent.xx.fbcdn.net/v/"+img : "images/rickfb.jpg";
			nombrecancion = (data[0]['nombre_corto'] != null) ? data[0]['nombre_corto']+' - '+data[0]['artista_nombre'] : 'No hay nada sonando';
    	}
		html +='<div class="col-sm-4 col-xs-4">';
		html +=	'<img class="reproductor-imagen" src="'+imgalbum+'" alt="">';
		html +='</div>';
		html +='<div class="col-sm-8 col-xs-8 reproductor-titper">';
		html +='<div class="reproductor-titulo">';
		html += nombrecancion;
		html +=	'</div>';
		html +=	'<div class="reproductor-persona">';
		html +=	'<img src="'+imgpersona+'" alt="">';
		html +='<p>'+nombre+'</p>';
		html +='</div>';
		html +='</div>';
		$('.contenedor-rep1').html(html);
};
function cargar_reproductor_imagenes(data) { 
		var html = '';
    	html +='<div class="row">';
    	$.each(data, function(index, val) {
    		html +='<img src="'+val["album_imagen"]+'" alt="">';
    	});
    	html +='</div>';
    	$('.reproductor-cds').html(html);
};
function canciones_encontradas(yaagregados,noagregados) { 
	var html = '';
	var existentes="";
	if (yaagregados.length > 0) {
		html += "<h3>Ya agregados en la sala</h3>";
	    $.each(yaagregados, function(index, val) {
	    	existentes +=val.id+"-";
			var duracionmin = val.duracion/60;
	        duracionmin = Math.trunc(duracionmin);
	        var duracionseg = val.duracion%60;
	        duracionseg = Math.trunc(duracionseg);
	        duracionseg = (duracionseg<10 ? "0" : "") + duracionseg;
	    	var duracion =duracionmin+":"+duracionseg;
	        html += '<div class="busqueda-cancion agregada" data-id="'+val.pkcancion+'">';
	        html += '	<div class="busqueda-agregar"> ';
	        html += '  		<div class="busqueda-agregar-datos">';
	        html += '   		<i class="fa fa-plus" aria-hidden="true"></i> ';
	        html += '			<label>Agregar</label> ';
	        html += '		</div>';
	        html += '	</div>';
	        html += '	<img src="'+val.album_imagen+'" alt=""> ';
	        html += '	<div class="busqueda-datos"> ';
	        html += '		<label class="busqueda-titulo">'+val.nombre_corto+' - '+val.artista_nombre+'</label>';
	        html += '		<label style="font-weight: 500;" class="busqueda-duracion">Duracion: '+duracion+'</label>';
	        html += '	</div>';
	        html += '</div> ';
	    });
    }
    html += "<h3>Canciones encontradas</h3>";
    $.each(noagregados, function(index, val) {
    	var imagen = val.album.cover_big;
		var titulo = val.title_short+" - "+val.artist.name;
        titulo = titulo.split('&').join('and');

    	var duracionmin = val.duration/60;
        duracionmin = Math.trunc(duracionmin);
        duracionseg = val.duration%60;
        duracionseg = Math.trunc(duracionseg);
        duracionseg = (duracionseg<10 ? "0" : "") + duracionseg;
        var duracion =duracionmin+":"+duracionseg;
        var idcancion = val.id;
        if(existentes.indexOf(idcancion)<0){
	        html += '<div class="busqueda-cancion noagregada" data-id="'+idcancion+'"> ';
	        html += '	<div class="busqueda-agregar"> ';
	        html += '  		<div class="busqueda-agregar-datos">';
	        html += '   		<i class="fa fa-plus" aria-hidden="true"></i> ';
	        html += '			<label>Agregar</label> ';
	        html += '		</div>';
	        html += '	</div>';
	        html += '	<img src="'+imagen+'" alt=""> ';
	        html += '	<div class="busqueda-datos"> ';
	        html += '		<label class="busqueda-titulo">'+titulo.substring(0,60)+'</label>';
	        html += '		<label style="font-weight:500;" class="busqueda-duracion">Duracion: '+duracion+'</label>';
	        html += '	</div>';
	        html += '</div> ';
    	}
    });
    $('#canciones-busqueda').html(html);
};

var timerID = 0; 
function keepAlive() { 
    var timeout = 20000;  
    if (socket.readyState == socket.OPEN) {  
        socket.send('');  
    }  
    timerID = setTimeout(keepAlive, timeout);  
}  
function cancelKeepAlive() {  
    if (timerID) {  
        clearTimeout(timerID);  
    }  
}