<?php
if ( ! defined( 'ABSPATH' ) ) exit;

// 1. Crear Empresa
 = get_user_by( 'login', 'orquestacionbots' );
if ( !  ) {
     = wp_create_user( 'orquestacionbots', 'Orquestacion2026!', 'info@orquestacionbots.com' );
     = new WP_User(  );
    ->set_role( 'empresa_formativa' );
    ->display_name = 'ORQUESTACION BOTS';
    wp_update_user(  );
} else {
     = ->ID;
}

// 2. Crear Curso
 = wp_insert_post( [
    'post_title'  => 'prueba orquetacion',
    'post_type'   => 'curso',
    'post_status' => 'publish',
] );

update_post_meta( , 'empresa_id',  );
update_post_meta( , 'modalidad', 'teleformacion' );
update_post_meta( , 'diagnostico_codigo', 'ORQTEST01' );
update_post_meta( , 'confirmacion_codigo', 'ORQCONF01' );

// 3. Crear 15 Alumnos
 = [];
for (  = 1;  <= 15; ++ ) {
     = sprintf( '%02d',  );
     = 'alumno_orq_' . ;
     = 'alumno' .  . '.orquestacion@creamosia.com';
      = 'AlumnoOrq2026!' . ;
       = sprintf( '123456%02dA',  );
     = 'Alumno Orquestacion ' . ;

     = get_user_by( 'login',  );
    if ( !  ) {
         = wp_create_user( , ,  );
         = new WP_User(  );
        ->set_role( 'alumno' );
        ->display_name = ;
        wp_update_user(  );
    } else {
         = ->ID;
        wp_set_password( ,  );
    }

    update_user_meta( , 'gc_dni',  );
    update_user_meta( , 'gc_empresa', 'ORQUESTACION BOTS' );
    update_user_meta( , 'gc_cif', 'B76135190' );
    update_user_meta( , 'gc_telefono', '+34 600 000 ' .  );
    update_user_meta( , 'gc_cursos', [  ] );
    update_user_meta( , 'empresa_id',  );

    [] = [
        'id'       => ,
        'login'    => ,
        'email'    => ,
        'pass'     => ,
        'dni'      => ,
        'nombre'   => 
    ];
}

// 4. Crear Sesion Online
 = wp_insert_post( [
    'post_title'  => 'Sesion de Prueba - Orquestacion',
    'post_type'   => 'sesion_online',
    'post_status' => 'publish',
] );

 = date( 'Y-m-d H:i:s', strtotime( '+1 day 10:00:00' ) );
  = home_url( '/aula-virtual/?sesion_id=' .  );

update_post_meta( , 'curso_id',  );
update_post_meta( , 'empresa_id',  );
update_post_meta( , 'fecha_sesion',  );
update_post_meta( , 'duracion_min', 60 );
update_post_meta( , 'plataforma', 'jitsi' );
update_post_meta( , 'enlace_videollamada',  );
update_post_meta( , 'estado', 'programada' );
update_post_meta( , 'aforo_maximo', 25 );

echo json_encode( [
    'status'     => 'success',
    'empresa_id' => ,
    'curso_id'   => ,
    'sesion_id'  => ,
    'link'       => ,
    'alumnos'    => 
], JSON_PRETTY_PRINT );
