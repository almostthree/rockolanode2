var express   =     require("express");
var app       =     express();
var mysql     =     require("mysql");
var http      =     require('http').Server(app);
var io        =     require("socket.io")(http);
var session   =     session = require("express-session")({
    secret: "ssssssssssshhhhhhhhhhhh",
    resave: true,
    saveUninitialized: true
  }),
  sharedsession = require("express-socket.io-session");


app.use(session);
io.use(sharedsession(session));
var con = mysql.createConnection({
  host: "192.168.0.196",
  //host: "190.228.29.43",
  user: "musicola2017",
  password: " Enikma94",
  database: "musicola2017",
  insecureAuth: true
});
var sess;
app.get("/",function(req,res){
    res.sendFile(__dirname + '/public/login.html');
    app.use(express.static(__dirname + '/public'));
    sess=req.session;
});


// socket.emit es para el cliente especifico
// io.emit es para todos
io.on('connection',function(socket){  
    console.log('Un guacho conectado');

    socket.on('entro-sala',function(sala){
	    traer_canciones(socket.handshake.session.sala, function(res){
	    	if(res){
	            socket.emit('cargar-canciones',res);
	        } 
	    });
      reproduciendo(socket.handshake.session.sala, function(res){
        if(res){
              socket.emit('cargar-reproductor',res);
          }
      });
      traer_canciones_imagenes(socket.handshake.session.sala, function(res){
        if(res){
              socket.emit('cargar-imagenes-reproductor',res);
          } 
      });
    });




    socket.on('actualizar-todo',function(sala){
      if(sala == undefined){
        var sala = socket.handshake.session.sala;
      }
      traer_canciones(sala, function(res){
        if(res){
              io.in(sala).emit('cargar-canciones',res);
          } 
      });
      reproduciendo(sala, function(res){
        if(res){
              io.in(sala).emit('cargar-reproductor',res);
          }
      });
      traer_canciones_imagenes(sala, function(res){
        if(res){
              io.in(sala).emit('cargar-imagenes-reproductor',res);
          }
      });
    });

    socket.on('buscar-sala',function(sala){
      buscar_sala(sala,function(res){
          socket.handshake.session.sala = sala;
          socket.join(sala);
          socket.emit('sala-encontrada',res);
      });
    }); 
    socket.on('buscar-persona',function(){
      persona(socket.handshake.session.pkusuario,function(res){
              socket.emit('persona-encontrada',res);
      });
    });
    socket.on('login',function(response){
      login(response,function(res){
          socket.emit('login-encontrado',res[0]); 
          socket.handshake.session.pkusuario = res[1];
          socket.handshake.session.estado = res[2];
          socket.handshake.session.sala = "";
          socket.handshake.session.save();    
      });
    });

    socket.on('buscar-cancion',function(titulo,artista){
      buscar_cancion(socket.handshake.session.sala,titulo,artista,function(res){
        socket.emit('canciones-encontradas', res);
      });
    });
    socket.on('cambiar-estado-cancion',function(pkcancion,resubido){
      cambiar_estado_cancion(pkcancion,resubido,socket.handshake.session.sala,function(res){
        socket.emit('resp-cancion', res);
      });
    });
    socket.on('subir-tema',function(datos,video,idfa){
      subir_tema(datos,video,idfa,socket.handshake.session.sala,function(res){
        socket.emit('resp-tema',res);
      });
    });
    socket.on('like-tema',function(pktema){
      like(pktema,socket.handshake.session.sala,socket.handshake.session.pkusuario,function(res){
        socket.emit('resp-like',res);
      });
    });


    //reproductor
    socket.on('reproducir-sala',function(sala){
      reproductor_consulta(sala,function(res){
        socket.emit('resp-repsala',res);
      });
    });
    socket.on('repro-estador',function(sala,pk,pkcancion){
      estado_r(sala,pk,pkcancion,function(res){

      });
    });




});

  
var login = function (data,callback) {
  con.connect(function(err) {

    var img = data.picture.data.url;
    var img = img.replace("https://scontent.xx.fbcdn.net/v/", "");
    var respuesta;
    var estadouser;
    var resp = false;

    con.query("SELECT * FROM personas WHERE id_persona = "+data.id,function(err,rows){
            
            if(!err) {
              if (rows.length != 0) {
                respuesta=rows[0]['pkpersona'];
                estadouser=rows[0]['estado'];
                resp= true;
                var arr = [ resp, respuesta, estadouser];
                callback(arr); 
              }
              if(rows.length!=0 && rows[0]['img']!= img){
                con.query("UPDATE personas SET img ="+img+" WHERE id_persona ="+data.id,function(err,rows){
                       });
              }else if(rows.length==0){
                con.query("INSERT INTO personas (nombre, img, id_persona) VALUES ('"+data.name+"','"+img+"','"+data.id+"')",function(err,rows){
                        respuesta=rows.insertId;
                        estadouser="";
                        resp= true;
                        var arr = [ resp, respuesta, estadouser];
                        if (!err) {
                          callback(arr); 
                        }
                      });
              }
              
            
            }
      

        });

  });
}

var buscar_cancion = function (sala,titulo,artista,callback) {
  //var titulo = titulo.replace(/'/g, ''); 
  //var artista = artista.replace(/'/g, ''); 
  con.connect(function(err) {
    con.query('SELECT * FROM cansala INNER JOIN (SELECT * FROM canciones WHERE nombre LIKE "%'+titulo+'%" OR artista_nombre LIKE "%'+artista+'%") canciones ON canciones.pkcancion = cansala.fkcancion WHERE cansala.fksala = (SELECT pksala FROM sala WHERE random_key = "'+sala+'" LIMIT 1)',function(err,rows){
            if(!err) {
              callback(rows);
            } else {
              //throw err;
              return;
            }

        });
  });
}
var cambiar_estado_cancion = function (pkcancion,resubido,sala,callback) {
  con.connect(function(err) {
    con.query("SELECT * FROM cansala INNER JOIN canciones ON cansala.fkcancion = canciones.pkcancion WHERE fkcancion = '"+pkcancion+"' AND fksala = (SELECT pksala FROM sala WHERE random_key = '"+sala+"' LIMIT 1)",function(err,rows){
            if(!err) {
              if (rows[0]['estado'] != "T" && rows[0]['estado'] != "R") {
                con.connect(function(err) {
                  con.query("UPDATE cansala SET `estado`='T',`reproducido`='0',`fkresubido`='"+resubido+"' WHERE fkcancion = '"+pkcancion+"' AND fksala = '"+rows[0]['fksala']+"'",function(err,rows){
                          if(!err) {
                            var respuesta = [{estado: 1, error: ""}];
                            callback(respuesta);
                          } else {
                            var respuesta = [{estado: 0, error: "Hubo un error"}];
                            callback(respuesta);
                          }

                      });
                });
              } else {
                var respuesta = [{estado: 0, error: "La canción ya está en la lista o sonando."}];
                callback(respuesta);
              }
            } else {
              var respuesta = [{estado: 0, error: "Hubo un error"}];
              callback(respuesta);
            }

        });
  });
}
var subir_tema = function (datos,video,idfa,sala,callback) {
  var esala = 0;
  var etema = 0;
  con.connect(function(err) {
    con.query("SELECT * FROM canciones WHERE id = '"+datos.id+"'",function(err,rows){
            if(!err) {
              esala = 1;
              numRows = rows.length;
              if (numRows <= 0) {
                con.connect(function(err) {
                  con.query('INSERT INTO canciones(`id`, `nombre`, `nombre_corto`, `duracion`, `preescucha`, `artista_id`, `artista_nombre`, `artista_imagen`, `album_id`, `album_nombre`, `album_imagen`, `video_id`) VALUES ("'+datos.id+'","'+datos.title+'","'+datos.title_short+'","'+datos.duration+'","'+datos.preview+'","'+datos.artist.id+'","'+datos.artist.name+'","'+datos.artist.picture_xl+'","'+datos.album.id+'","'+datos.album.title+'","'+datos.album.cover_xl+'","'+video+'")',function(err,rows){
                          if(!err) {
                            var id_cancion = rows.insertId;
                            con.connect(function(err) {
                              con.query("INSERT INTO cansala (fkcancion,fksala,fkpersona,estado,reproducido) SELECT '"+id_cancion+"',pksala,'"+idfa+"','T',0 FROM sala WHERE random_key='"+sala+"' LIMIT 1",function(err,rows){
                                      if(!err) {
                                        etema = 1;
                                        var arr = [{estadosala:esala,estadotema:etema}];
                                        callback(arr);
                                      }

                                  });
                          
                            });
                          } else {
                            //throw err;
                          }
                      });
                });
              } else {
                var id_cancion = rows[0]['pkcancion'];
                con.connect(function(err) {
                              con.query("INSERT INTO cansala (fkcancion,fksala,fkpersona,estado,reproducido) SELECT '"+id_cancion+"',pksala,'"+idfa+"','T',0 FROM sala WHERE random_key='"+sala+"' LIMIT 1",function(err,rows){
                                      if(!err) {
                                        etema = 1;
                                        var arr = [{estadosala:esala,estadotema:etema}];
                                        callback(arr);
                                      }

                                  });
                          
                            });
              }
              
            } else {
              //throw err;
              return;
            }

        });
  });
}
var traer_canciones = function (sala,callback) {
  con.connect(function(err) {
    con.query("SELECT canciones.*, personas.img, personas.nombre AS nombrepersona, resubido.nombre AS resunom, resubido.img AS resuimg, (SELECT COUNT(canciones_up.pkup) FROM canciones_up WHERE canciones_up.fkcancion = canciones.pkcancion AND canciones_up.estado != 'F' ) AS numerito FROM cansala INNER JOIN canciones ON canciones.pkcancion = cansala.fkcancion LEFT JOIN personas ON personas.pkpersona = cansala.fkpersona LEFT JOIN personas AS resubido ON resubido.pkpersona = cansala.fkresubido WHERE cansala.estado = 'T' AND cansala.fksala = (SELECT pksala FROM sala WHERE random_key = "+sala+" LIMIT 1) ORDER BY numerito DESC, cansala.fecha_modif ASC",function(err,rows){
            if(!err) {
              var arr = [rows, sala];
              callback(arr);
            } else {
              //throw err;
              return;
            }

        });
  });
}
var traer_canciones_imagenes = function (sala,callback) {
  con.connect(function(err) {
      con.query("SELECT canciones.*, personas.img, personas.nombre AS nombrepersona, resubido.nombre AS resunom, resubido.img AS resuimg, (SELECT COUNT(canciones_up.pkup) FROM canciones_up WHERE fksala = (SELECT pksala FROM sala WHERE random_key = "+sala+" LIMIT 1) AND fkcancion = canciones.pkcancion) AS likes FROM cansala INNER JOIN canciones ON canciones.pkcancion = cansala.fkcancion LEFT JOIN personas ON personas.pkpersona = cansala.fkpersona LEFT JOIN personas AS resubido ON resubido.pkpersona = cansala.fkresubido WHERE cansala.estado = 'T' AND cansala.fksala = (SELECT pksala FROM sala WHERE random_key = "+sala+" LIMIT 1) ORDER BY likes DESC",function(err,rows){
            if(!err) {
              var arr = [rows, sala];
              callback(arr);
            } else {
              //throw err;
              return;
            }

        });
    });
}
var reproduciendo = function (sala,callback) {
  con.connect(function(err) {
    con.query("SELECT canciones.*, personas.nombre, personas.img, resubido.img AS resuimg, resubido.nombre AS resu FROM cansala INNER JOIN personas ON personas.pkpersona = cansala.fkpersona INNER JOIN canciones ON canciones.pkcancion = cansala.fkcancion LEFT JOIN personas AS resubido ON resubido.pkpersona = cansala.fkresubido WHERE cansala.estado = 'R' AND cansala.fksala = (SELECT pksala FROM sala WHERE random_key = "+sala+" LIMIT 1) LIMIT 1",function(err,rows){
            if(!err) {
              var arr = [rows, sala];
              callback(arr);
            } else {
              //throw err;
              return;
            }

        });
  });
}

var persona = function (pkpersona,callback) {
  con.connect(function(err) {
    con.query("SELECT * FROM personas WHERE pkpersona ="+pkpersona,function(err,rows){
            if(!err) {
              callback(rows);
              sess.pkpersona = rows[0]['pkpersona'];
            } else {
              //throw err;
              return;
            }

        });
  });
}

var buscar_sala = function (sala,callback) {
  con.connect(function(err) {
    con.query("SELECT * FROM sala WHERE random_key ="+sala,function(err,rows){
            if(!err) {
              numRows = rows.length;
              if (numRows != 0) {
                callback(true);
              } else {
                callback(false);
              }
            } else {
              //throw err;
              callback(false);
              return;
            }

        });
  });
}
var like = function (pkcancion,sala,id,callback) {
  con.connect(function(err) {
    con.query("SELECT * FROM cansala INNER JOIN canciones ON cansala.fkcancion = canciones.pkcancion WHERE  pkcancion="+pkcancion+" AND fksala=(SELECT pksala FROM sala WHERE random_key = "+sala+" LIMIT 1) LIMIT 1"+sala,function(err,rows){
            if(!err) {
              var control = 0;
              if (rows[0]['fkresubido']=='' || rows[0]['fkresubido']==0){
                if(rows[0]['fkpersona']!=id){
                  control=1;
                  
                }
              } else if(rows[0]['fkresubido']!=id){
                control=1;
                
              }
              numRows = rows.length;

              if(control){
                  con.query("SELECT * FROM canciones_up WHERE fkcancion ="+pkcancion+" AND fkusuario = "+id+" AND fksala="+sala,function(err,rows){
                  if(rows.length==0){
                    con.query("INSERT INTO canciones_up (fkcancion,fkusuario,fksala) VALUES ("+pkcancion+","+id+","+sala+")",function(err,rows){
                      if(!err) { 
                        callback(true);
                      }
                    });
                  }else{
                    con.query("DELETE FROM canciones_up WHERE fkcancion="+pkcancion+" AND fkusuario="+id+" AND fksala= "+sala+"",function(err,rows){
                      if(!err) { 
                        callback(true);
                      }
                    });
                  }
                  });
                  

              } else {
                callback(false);
              }


            } else {
              //throw err;
              callback(false);
              return;
            }

        });
  });
}
var reproductor_consulta = function (sala,callback) {
  var respuesta = '';
  con.connect(function(err) {
    con.query("SELECT cansala.pkcansala AS pktema, canciones.pkcancion, canciones.video_id AS url, personas.img, personas.nombre, (SELECT COUNT(canciones_up.pkup) FROM canciones_up WHERE canciones_up.fkcancion = canciones.pkcancion AND canciones_up.estado != 'F' ) AS numerito FROM cansala INNER JOIN canciones ON cansala.fkcancion = canciones.pkcancion LEFT JOIN personas ON personas.pkpersona = cansala.fkpersona      WHERE cansala.estado = 'T' AND cansala.reproducido != 1 AND fksala = (SELECT pksala FROM sala WHERE random_key = "+sala+" LIMIT 1) ORDER BY numerito DESC,cansala.fecha_modif ASC LIMIT 1",function(err,rows){
            if(!err) {
              numRows = rows.length;
              respuesta = rows;
              if (numRows == 0) {
                con.connect(function(err) {
                  con.query("SELECT pkcansala AS pktema, canciones.pkcancion, canciones.video_id AS url FROM cansala INNER JOIN canciones ON cansala.fkcancion = canciones.pkcancion WHERE cansala.estado = 'F' AND reproducido != 1 AND fksala = (SELECT pksala FROM sala WHERE random_key = "+sala+" LIMIT 1) ORDER BY RAND() LIMIT 1",function(err,rows){
                          if(!err) {
                            respuesta = rows;
                            numRows = rows.length;
                            if (numRows == 0) {
                              con.connect(function(err) {
                                con.query("UPDATE cansala SET cansala.estado = 'F', reproducido = '0' WHERE cansala.estado = 'R' OR reproducido = '1' AND fksala = (SELECT pksala FROM sala WHERE random_key = "+sala+" LIMIT 1)",function(err,rows){
                                        if(!err) {
                                          con.connect(function(err) {
                                            con.query("SELECT pkcansala AS pktema, canciones.pkcancion, canciones.video_id AS url  FROM cansala INNER JOIN canciones ON cansala.fkcancion = canciones.pkcancion WHERE fksala = (SELECT pksala FROM sala WHERE random_key = "+sala+" LIMIT 1) ORDER BY RAND() LIMIT 1",function(err,rows){
                                                    respuesta = rows;
                                                    if(!err) {
                                                      con.connect(function(err) {
                                                        con.query("UPDATE canciones_up SET canciones_up.estado = 'F' WHERE canciones_up.estado = 'T' AND fkcancion = '"+rows[0]['pktema']+"' AND fksala = (SELECT pksala FROM sala WHERE random_key = "+sala+" LIMIT 1)",function(err,rows){
                                                                if(!err) {
                                                                   callback(respuesta);
                                                                } else {
                                                                  callback(false);
                                                                  return;
                                                                }

                                                            });
                                                      });
                                                    } else {
                                                      callback(false);
                                                      return;
                                                    }

                                                });
                                          });
                                        } else {
                                          callback(false);
                                          return;
                                        }

                                    });
                              });
                            } else {
                              
                              con.connect(function(err) {
                                con.query("UPDATE canciones_up SET canciones_up.estado = 'F' WHERE canciones_up.estado = 'T' AND fkcancion = '"+rows[0]['pktema']+"' AND fksala = (SELECT pksala FROM sala WHERE random_key = "+sala+" LIMIT 1)",function(err,rows){
                                        if(!err) {
                                           callback(respuesta);
                                        } else {
                                          callback(false);
                                          return;
                                        }

                                    });
                              });
                            }
                          } else {
                            callback(false);
                            return;
                          }

                      });
                });
              } else {         
                   
                con.connect(function(err) {
                    con.query("UPDATE canciones_up SET canciones_up.estado = 'F' WHERE canciones_up.estado = 'T' AND fkcancion = '"+rows[0]['pktema']+"' AND fksala = (SELECT pksala FROM sala WHERE random_key = "+sala+" LIMIT 1)",function(err,rows){
                            if(!err) {
                               callback(respuesta);
                            } else {
                              callback(false);
                              return;
                            }

                        });
                  });
              }
            } else {
              callback(false);
              return;
            }

        });
  });
}
var estado_r = function (sala,pk,pkcancion,callback) {
  con.connect(function(err) {
    con.query("UPDATE cansala SET estado = 'R', reproducido = 1 WHERE pkcansala = '"+pk+"' AND fksala = (SELECT pksala FROM sala WHERE random_key = "+sala+" LIMIT 1) ",function(err,rows){
            if(!err) {
              con.connect(function(err) {
                  con.query("UPDATE cansala SET estado = 'F' WHERE estado = 'R' AND pkcansala !='"+pk+"' AND fksala = (SELECT pksala FROM sala WHERE random_key = "+sala+" LIMIT 1) ",function(err,rows){
                          if(!err) {
                            callback(true);
                          } else {
                            //throw err;
                            callback(false);
                            return;
                          }

                      });
                });
                con.connect(function(err) {
                  con.query("UPDATE canciones_up SET estado = 'F' WHERE fkcancion = '"+pkcancion+"' AND fksala = (SELECT pksala FROM sala WHERE random_key = "+sala+" LIMIT 1) ",function(err,rows){
                          if(!err) {
                            callback(true);
                          } else {
                            //throw err;
                            callback(false);
                            return;
                          }

                      });
                });
            } else {
              //throw err;
              callback(false);
              return;
            }

        });
  });
}
http.listen(8080,function(){
    console.log("Funcando en 8080");
});