export class UserDTO {
  constructor(user) {
    if (!user) return null;

    const data = user.toObject ? user.toObject() : user;

    this.id = data._id || data.id;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.email = data.email;
    this.role = data.role;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static from(user) {
    if (!user) return null;
    return new UserDTO(user);
  }

  static fromMany(users) {
    if (!users) return [];
    return users.map((u) => new UserDTO(u));
  }
}
