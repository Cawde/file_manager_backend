const client = require("./client");
const bcrypt = require("bcrypt");
const SALT_COUNT = 10;

async function createPath({ userId, fileName}) {
  try {
    const hashedPath = await bcrypt.hash(fileName, SALT_COUNT);
    const {
      rows: [path],
    } = await client.query(
      `
            INSERT INTO paths(path, "ownerId")
            VALUES($1, $2)
            RETURNING *;`,
      [hashedPath, userId]
    );
    return `./files/${hashedPath}`;
  } catch (error) {
    throw error;
  }
}

async function getAllPaths() {
    try {
      const { rows } = await client.query(`
          SELECT * 
          FROM paths;
      `);
      return rows;
    } catch (error) {
      throw error;
    }
}

async function getPath(userId) {
    try {
        const { rows } = await client.query(`
            SELECT * 
            FROM paths
            WHERE "ownerId"=$1
        `, [userId]);
        return rows;
    } catch (error) {
        throw error;
    }
}

async function deletePath(id) {
  try {
    await client.query(
      `
      DELETE FROM paths 
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
  createPath,
  deletePath,
  getAllPaths,
  getPath
};