const client = require("./client");
const { createUser, createPath, getAllUsers } = require("./index");
const { getAllPaths, getPath } = require("./paths");
async function dropTables() {
  console.log("dropping tables");
  try {
    await client.query(`
            DROP TABLE IF EXISTS paths;
            DROP TABLE IF EXISTS users;
        `);
    console.log("finished dropping tables");
  } catch (error) {
    console.log("error dropping tables");
    throw error;
  }
}

async function createTables() {
  try {
    await client.query(`
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            "isAdmin" BOOLEAN DEFAULT FALSE
        );
        
        CREATE TABLE paths (
            id SERIAL PRIMARY KEY,
            path VARCHAR(255) NOT NULL,
            "ownerId" INTEGER NOT NULL

            
        );
        `);
  } catch (error) {
    console.log("error building tables");
    throw error;
  }
}

async function createInitialUsers() {
    console.log("Starting to create users...");

    try {
      const usersToCreate = [
        {
          username: "blank",
          password: "testing",
          email: "blank@filemanager.com",
          isAdmin: true,
        },
        {
            username: "bozo",
            password: "rip",
            email: "bozo@loa.com",
            isAdmin: false,
        }
      ];
      const users = await Promise.all(
        usersToCreate.map((user) => createUser(user))
      );
  
      console.log("Users created:");
      console.log(users);
      console.log("Finished creating users!");
    } catch (error) {
      console.error("Error creating users!");
      throw error;
    }
  }

  async function createInitialPaths() {
    try {
      console.log("starting to create paths");
      const pathsToCreate = [
        {
            userId: 1,
            fileName: "C9YIuTrUMAAeyiD.png"
        },
        {
            userId: 2,
            fileName: "files/nibelart-cammy-sf6-low2.jpg"
        }
      ];
  
      const paths = await Promise.all(pathsToCreate.map((path) => createPath(path)));
  
      console.log("paths created:");
      console.log(paths);
  
      console.log("Finished creating paths!");
    } catch (error) {
      console.error("error creating paths");
      throw error;
    }
  }

  async function getInitialPath() {
    try {
        console.log("trying to get a path");
        const path = await getPath(1);
    
        console.log("paths retrieved:");
        console.log(path);
    
        console.log("Finished retrieving path!");
      } catch (error) {
        console.error("error creating paths");
        throw error;
      }
  }

  async function rebuildDB() {
    try {
      client.connect();
      await dropTables();
      await createTables();
      await createInitialUsers();
      await createInitialPaths();
      await getInitialPath();
    } catch (error) {
      console.log("Error during rebuildDB");
      throw error;
    }
  }
  
  module.exports = {
    rebuildDB,
  };