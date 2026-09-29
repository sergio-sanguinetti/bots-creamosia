# 🚀 Datos de Prueba — Orquestación de Cursos y Bots (WordPress)

Este documento contiene la información oficial de los recursos creados en el sitio WordPress [creamosia.com](https://creamosia.com) para pruebas de integración y orquestación.

---

## 🏢 1. Datos de la Empresa
| Parámetro | Valor |
|---|---|
| **Nombre de la Empresa** | `ORQUESTACION BOTS` |
| **ID de Usuario (Empresa)** | `47` |
| **Usuario (Login)** | `orquestacionbots` |
| **Contraseña** | `Orquestacion2026!` |
| **Email** | `info@orquestacionbots.com` |
| **Rol en WordPress** | `empresa_formativa` |

---

## 📚 2. Datos del Curso
| Parámetro | Valor |
|---|---|
| **Título del Curso** | `prueba orquetacion` |
| **ID de Curso (Post ID)** | `17066` |
| **Empresa Vinculada** | `ORQUESTACION BOTS` (ID: 47) |
| **Modalidad** | Teleformación |
| **Código Diagnóstico** | `ORQTEST01` |
| **Código Confirmación** | `ORQCONF01` |

---

## 🎥 3. Sesión Online e Integración Jitsi
| Parámetro | Valor |
|---|---|
| **Título de la Sesión** | `Sesión de Prueba - Orquestación` |
| **ID de la Sesión** | `17067` |
| **Plataforma** | Jitsi Meet (`meet.jit.si`) |
| **Estado** | `programada` |
| **Aforo Máximo** | 25 participantes |
| **Enlace Directo al Aula Virtual** | [Acceder a la Sesión Online](https://creamosia.com/aula-virtual/?sesion_id=17067) |

> 🔗 **URL del Aula Virtual:** `https://creamosia.com/aula-virtual/?sesion_id=17067`

---

## 👨‍🎓 4. Lista de 15 Alumnos Registrados y Matriculados

Todos los alumnos fueron creados con el rol `alumno`, asignados a la empresa **ORQUESTACION BOTS** y matriculados en el curso **prueba orquetacion** (ID: 17066).

| ID | Nombre Completo | DNI / NIE | Usuario (Login) | Email | Contraseña | Teléfono |
|---|---|---|---|---|---|---|
| **48** | Alumno Orquestacion 01 | `12345601A` | `alumno_orq_01` | `alumno01.orquestacion@creamosia.com` | `AlumnoOrq2026!01` | `+34 600 000 01` |
| **49** | Alumno Orquestacion 02 | `12345602A` | `alumno_orq_02` | `alumno02.orquestacion@creamosia.com` | `AlumnoOrq2026!02` | `+34 600 000 02` |
| **50** | Alumno Orquestacion 03 | `12345603A` | `alumno_orq_03` | `alumno03.orquestacion@creamosia.com` | `AlumnoOrq2026!03` | `+34 600 000 03` |
| **51** | Alumno Orquestacion 04 | `12345604A` | `alumno_orq_04` | `alumno04.orquestacion@creamosia.com` | `AlumnoOrq2026!04` | `+34 600 000 04` |
| **52** | Alumno Orquestacion 05 | `12345605A` | `alumno_orq_05` | `alumno05.orquestacion@creamosia.com` | `AlumnoOrq2026!05` | `+34 600 000 05` |
| **53** | Alumno Orquestacion 06 | `12345606A` | `alumno_orq_06` | `alumno06.orquestacion@creamosia.com` | `AlumnoOrq2026!06` | `+34 600 000 06` |
| **54** | Alumno Orquestacion 07 | `12345607A` | `alumno_orq_07` | `alumno07.orquestacion@creamosia.com` | `AlumnoOrq2026!07` | `+34 600 000 07` |
| **55** | Alumno Orquestacion 08 | `12345608A` | `alumno_orq_08` | `alumno08.orquestacion@creamosia.com` | `AlumnoOrq2026!08` | `+34 600 000 08` |
| **56** | Alumno Orquestacion 09 | `12345609A` | `alumno_orq_09` | `alumno09.orquestacion@creamosia.com` | `AlumnoOrq2026!09` | `+34 600 000 09` |
| **57** | Alumno Orquestacion 10 | `12345610A` | `alumno_orq_10` | `alumno10.orquestacion@creamosia.com` | `AlumnoOrq2026!10` | `+34 600 000 10` |
| **58** | Alumno Orquestacion 11 | `12345611A` | `alumno_orq_11` | `alumno11.orquestacion@creamosia.com` | `AlumnoOrq2026!11` | `+34 600 000 11` |
| **59** | Alumno Orquestacion 12 | `12345612A` | `alumno_orq_12` | `alumno12.orquestacion@creamosia.com` | `AlumnoOrq2026!12` | `+34 600 000 12` |
| **60** | Alumno Orquestacion 13 | `12345613A` | `alumno_orq_13` | `alumno13.orquestacion@creamosia.com` | `AlumnoOrq2026!13` | `+34 600 000 13` |
| **61** | Alumno Orquestacion 14 | `12345614A` | `alumno_orq_14` | `alumno14.orquestacion@creamosia.com` | `AlumnoOrq2026!14` | `+34 600 000 14` |
| **62** | Alumno Orquestacion 15 | `12345615A` | `alumno_orq_15` | `alumno15.orquestacion@creamosia.com` | `AlumnoOrq2026!15` | `+34 600 000 15` |

---

## 🛠️ Notas de Integración
* **Autenticación en Aula Virtual:** Cuando un usuario ingresa a la URL con sesión de WordPress iniciada, el plugin `gestion-cursos` reconoce su rol (`alumno`, `tutor` o `empresa_formativa`) y otorga los permisos correspondientes en Jitsi.
* **Control de Asistencia:** Al presionar **Entrar a la sala**, se registra automáticamente la hora de entrada y el sistema envía latidos (*heartbeat*) cada pocos segundos para registrar el tiempo neto conectado para la normativa FUNDAE.
