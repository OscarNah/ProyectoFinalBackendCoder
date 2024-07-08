// public/js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form');
    const deleteButtons = document.querySelectorAll('.eliminar-usuario');
  
    forms.forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = form.dataset.id;
        const role = form.querySelector('select[name="role"]').value;
  
        try {
          const response = await fetch(`/api/users/admin/${userId}/role?role=${role}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            }
          });
  
          if (response.ok) {
            const updatedUser = await response.json();
            console.log('Rol actualizado:', updatedUser);
  
            // Mostrar alerta de éxito con SweetAlert
            Swal.fire({
              icon: 'success',
              title: '¡Éxito!',
              text: `Se ha actualizado el rol de ${updatedUser.first_name} ${updatedUser.last_name}.`,
              confirmButtonText: 'Aceptar'
            }).then(() => {
              // Aquí puedes actualizar la interfaz si lo deseas
            });
  
          } else {
            console.error('Error al cambiar rol:', response.statusText);
            // Mostrar alerta de error con SweetAlert
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Hubo un problema al cambiar el rol del usuario.',
              confirmButtonText: 'Aceptar'
            });
          }
        } catch (error) {
          console.error('Error al cambiar rol:', error);
          // Mostrar alerta de error con SweetAlert
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al cambiar el rol del usuario.',
            confirmButtonText: 'Aceptar'
          });
        }
      });
    });
  
    deleteButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        const userId = button.dataset.id;
  
        try {
          const response = await fetch(`/api/users/admin/${userId}`, {
            method: 'DELETE'
          });
  
          if (response.ok) {
            const data = await response.json();
            console.log('Usuario eliminado:', data);
  
            // Mostrar alerta de éxito con SweetAlert
            Swal.fire({
              icon: 'success',
              title: '¡Éxito!',
              text: `Se ha eliminado al usuario ${data.first_name} ${data.last_name}.`,
              confirmButtonText: 'Aceptar'
            }).then(() => {
              // Aquí puedes actualizar la interfaz si lo deseas
            });
  
          } else {
            console.error('Error al eliminar usuario:', response.statusText);
            // Mostrar alerta de error con SweetAlert
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Hubo un problema al eliminar el usuario.',
              confirmButtonText: 'Aceptar'
            });
          }
        } catch (error) {
          console.error('Error al eliminar usuario:', error);
          // Mostrar alerta de error con SweetAlert
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al eliminar el usuario.',
            confirmButtonText: 'Aceptar'
          });
        }
      });
    });
  });
  