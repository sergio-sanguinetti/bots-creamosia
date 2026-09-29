import paramiko

php_content = """<?php
/*
Plugin Name: Orquestador Bot REST API
Description: Endpoints REST API para sincronizacion de logs y datos entre el sistema de Bots y WordPress.
Version: 1.1.0
Author: LoDigitalizo Team
*/

if (!defined('ABSPATH')) exit;

add_action('rest_api_init', function () {
    register_rest_route('orquestador/v1', '/update-bot-log', array(
        'methods'  => 'POST',
        'callback' => 'orq_api_update_bot_log',
        'permission_callback' => 'orq_api_check_permission',
    ));

    register_rest_route('orquestador/v1', '/sync-data', array(
        'methods'  => 'GET',
        'callback' => 'orq_api_sync_data',
        'permission_callback' => 'orq_api_check_permission',
    ));
});

function orq_api_check_permission($request) {
    $token = $request->get_header('X-Orquestador-Token');
    if (!$token) {
        $token = $request->get_param('token');
    }
    if ($token === 'OrqBotSecret2026!') {
        return true;
    }
    return new WP_Error('rest_forbidden', 'Token de autorizacion invalido.', array('status' => 401));
}

function orq_api_update_bot_log($request) {
    global $wpdb;
    
    $params = $request->get_json_params();
    if (empty($params)) {
        $params = $request->get_body_params();
    }

    $login = isset($params['login']) ? sanitize_text_field($params['login']) : '';
    $ip = isset($params['ip']) ? sanitize_text_field($params['ip']) : '';
    $user_agent = isset($params['user_agent']) ? sanitize_text_field($params['user_agent']) : '';

    if (empty($login) || empty($ip)) {
        return new WP_REST_Response(array('success' => false, 'message' => 'Faltan parametros login o ip'), 400);
    }

    // 1. Actualizar wp_gc_accesos
    $table_accesos = $wpdb->prefix . 'gc_accesos';
    $updated_accesos = 0;
    
    $last_acceso = $wpdb->get_var($wpdb->prepare(
        "SELECT id FROM {$table_accesos} WHERE login = %s ORDER BY id DESC LIMIT 1",
        $login
    ));

    if ($last_acceso) {
        $updated_accesos = $wpdb->update(
            $table_accesos,
            array('ip' => $ip, 'user_agent' => $user_agent),
            array('id' => $last_acceso),
            array('%s', '%s'),
            array('%d')
        );
    }

    // 2. Actualizar wp_gc_asistencia
    $table_asistencia = $wpdb->prefix . 'gc_asistencia';
    $updated_asistencia = 0;

    $user = get_user_by('login', $login);
    $user_id = $user ? $user->ID : 0;
    $dni = $user ? get_user_meta($user_id, 'gc_dni', true) : '';

    $last_asistencia = null;
    if ($user_id > 0 && !empty($dni)) {
        $last_asistencia = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$table_asistencia} WHERE user_id = %d OR dni = %s ORDER BY id DESC LIMIT 1",
            $user_id, $dni
        ));
    } else if ($user_id > 0) {
        $last_asistencia = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$table_asistencia} WHERE user_id = %d ORDER BY id DESC LIMIT 1",
            $user_id
        ));
    }

    if ($last_asistencia) {
        $updated_asistencia = $wpdb->update(
            $table_asistencia,
            array('ip' => $ip, 'user_agent' => $user_agent),
            array('id' => $last_asistencia),
            array('%s', '%s'),
            array('%d')
        );
    }

    return new WP_REST_Response(array(
        'success' => true,
        'login' => $login,
        'ip' => $ip,
        'user_agent' => $user_agent,
        'updated_accesos' => $updated_accesos,
        'updated_asistencia' => $updated_asistencia
    ), 200);
}

function orq_api_sync_data($request) {
    global $wpdb;

    // Solo obtener usuarios con rol 'alumno'
    $users = get_users(array(
        'role__in' => array('alumno'),
        'number' => 500,
        'orderby' => 'ID',
        'order' => 'ASC'
    ));

    $employees_list = array();
    foreach ($users as $u) {
        $dni = get_user_meta($u->ID, 'gc_dni', true);
        $empresa = get_user_meta($u->ID, 'gc_empresa', true);
        if (empty($empresa)) $empresa = 'ORQUESTACION BOTS';

        $employees_list[] = array(
            'id' => 'wp_user_' . $u->ID,
            'name' => $u->display_name ? $u->display_name : $u->user_login,
            'login' => $u->user_login,
            'dni' => $dni ? $dni : '123456' . str_pad($u->ID, 2, '0', STR_PAD_LEFT) . 'A',
            'email' => $u->user_email,
            'companyName' => $empresa,
            'wp_user_id' => $u->ID
        );
    }

    return new WP_REST_Response(array(
        'success' => true,
        'timestamp' => date('Y-m-d H:i:s'),
        'role_filtered' => 'alumno',
        'total_users' => count($employees_list),
        'employees' => $employees_list
    ), 200);
}
"""

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect('76.13.51.90', username='root', password='PvZ(UILEi8H4n.OG', timeout=15)
    sftp = client.open_sftp()

    mu_dir = '/var/www/creamosia.com/wp-content/mu-plugins'
    remote_path = f"{mu_dir}/orquestador-api.php"
    with sftp.file(remote_path, 'w') as f:
        f.write(php_content)

    print(f"Successfully updated {remote_path} with 'alumno' role filter")
    sftp.close()
    client.close()
except Exception as e:
    print("Error:", e)
