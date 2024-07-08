class UserDTO {
    constructor(firstName, lastName, email, role) {
        this.nombre = firstName;
        this.apellido = lastName;
        this.email = email;
        this.role = role;
    }
}

module.exports = UserDTO;