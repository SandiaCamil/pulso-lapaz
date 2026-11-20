const AdminAuth = {
    exigir() {
        if (!Sesion.activa()) {
        location.replace('login.html');
        return false;
        }
        return true;
    },
    salir() {
        Sesion.salir();
        location.replace('login.html');
    }
};