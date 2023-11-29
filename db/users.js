const client = require("./client");
const bcrypt = require("bcrypt");
const SALT_COUNT = 10;

async function createUser({ email, username, password, isAdmin }) {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_COUNT);
    const {
      rows: [user],
    } = await client.query(
      `
            INSERT INTO users(email, username, password, "isAdmin")
            VALUES($1, $2, $3, $4) 
            ON CONFLICT (username) DO NOTHING
            RETURNING *;`,
      [email, username, hashedPassword, isAdmin]
    );
    delete user.password;
    return user;
  } catch (error) {
    throw error;
  }
}

async function getAllUsers() {
  try {
    const { rows } = await client.query(`
        SELECT * 
        FROM users;
    `);
    return rows;
  } catch (error) {
    throw error;
  }
}

async function getUser({ username, password }) {
  try {
    const user = await getUserByUsername(username);
    const hashedPassword = user.password;
    const passwordsMatch = await bcrypt.compare(password, hashedPassword);
    if (passwordsMatch) {
      delete user.password;
      return user;
    }
  } catch (error) {
    throw error;
  }
}

async function getUserById(id) {
  try {
    const {
      rows: [user],
    } = await client.query(
      `
            SELECT * 
            FROM users 
            WHERE id=$1`,
      [id]
    );

    if (!user) {
      return null;
    }
    return user;
  } catch (error) {
    throw error;
  }
}

async function getUserByUsername(username) {
  try {
    const {
      rows: [user],
    } = await client.query(
      `
            SELECT * FROM users
            WHERE username=$1;`,
      [username]
    );

    return user;
  } catch (error) {
    throw error;
  }
}

async function getUserByEmail(email) {
  try {
    const { rows } = await client.query(
      `  
            SELECT * FROM users
            WHERE email=$1;`,
      [email]
    );

    return rows;
  } catch (error) {
    throw error;
  }
}

async function updateUser({ id, email, username, password, isAdmin }) {
  const fields = {
    email: email,
    username: username,
    password: password,
    isAdmin: isAdmin,
  };

  if (email === undefined || email === null) delete fields.email;
  if (username === undefined || username === null) delete fields.username;
  if (password === undefined || password === null) delete fields.password;
  if (isAdmin === undefined || isAdmin === null) delete fields.isAdmin;

  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");

  // return early if this is called without fields
  if (setString.length === 0) {
    return;
  }

  try {
    const {
      rows: [users],
    } = await client.query(
      `
      UPDATE users
      SET ${setString}
      WHERE id=${id}
      RETURNING *;
      `,
      Object.values(fields)
    );
    
    return users;
  } catch (error) {
    throw error;
  }
}

async function deleteUser(id) {
  try {
    await client.query(
      `
      DELETE FROM orders 
      WHERE "userId"=$1
      `,
      [id]
    );

    const {
      rows: [user],
    } = await client.query(
      `
      DELETE FROM users
      WHERE id=$1
      RETURNING *;
      `,
      [id]
    );

    return user;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createUser,
  getAllUsers,
  getUser,
  getUserById,
  getUserByUsername,
  getUserByEmail,
  updateUser,
  deleteUser,
};