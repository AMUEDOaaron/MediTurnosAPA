# Medi-Turnos — Sistema completo de Turnos Médicos

## Cómo ejecutarlo

1. Abrí la carpeta en la terminal.
2. Instalá las dependencias:
   ```bash
   npm install
   ```
3. Arrancá el backend (incluye la base de datos):
   ```bash
   npm start
   ```
4. Abrí el navegador en:
   ```
   http://localhost:3000
   ```

## Logins (todos con contraseña **1234**)

| Rol              | Usuario                     | Contraseña | Redirige a                     |
|------------------|-----------------------------|------------|--------------------------------|
| **Admin**        | `admin`                     | `1234`     | permisos.html                  |
| **Secretaría**   | `secretaria`                | `1234`     | secretaria.html                |
| **Doctora**      | `doctora` o `profesional`   | `1234`     | profesional-dashboard.html     |
| **Paciente**     | `paciente` o `32456789`     | `1234`     | pacientes.html                 |

## Estructura principal

- `index.html` → Menú de acceso a todos los roles
- `admin-login.html` → Login Administrador
- `secretaria-login.html` → Login Secretaría
- `profesional-login.html` → Login Doctora / Profesional
- `pacientes-login.html` → Login Paciente
- `server.js` → Backend + base de datos JSON (`database.json`)
- `permisos.html` → Consola Master de permisos
- `secretaria.html` → Panel administrativo
- `profesional-dashboard.html` → Agenda del médico
- `pacientes.html` → Portal del paciente

## Base de datos

Se crea automáticamente el archivo `database.json` con:
- Usuarios de los 4 roles
- Turnos
- Pacientes

Todo se guarda en ese archivo (persistente).
