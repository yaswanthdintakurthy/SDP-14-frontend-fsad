export type Role = "student" | "faculty" | "admin";

export interface MockUser {
  id: string;
  name: string;
  role: Role;
  password: string;
}

// In-memory users store. This resets when the dev server reloads.
const users: MockUser[] = [];

export function listUsers(): MockUser[] {
  return users.slice();
}

export function findUser(id: string, role: Role) {
  return users.find((u) => u.id === id && u.role === role) || null;
}

export function signupUser(user: MockUser) {
  const exists = findUser(user.id, user.role);
  if (exists) {
    const err: any = new Error("User already exists");
    err.code = "EXISTS";
    throw err;
  }
  users.push(user);
  return user;
}

export function loginUser(id: string, role: Role, password: string) {
  const found = findUser(id, role);
  if (!found) {
    const err: any = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }
  if (found.password !== password) {
    const err: any = new Error("Invalid password");
    err.code = "INVALID_PASSWORD";
    throw err;
  }
  return found;
}

export function clearUsers() {
  users.length = 0;
}

// Optionally seed a demo admin for convenience
if (users.length === 0) {
  users.push({ id: "admin", name: "Administrator", role: "admin", password: "admin" });
}

export default {
  listUsers,
  findUser,
  signupUser,
  loginUser,
  clearUsers,
};
