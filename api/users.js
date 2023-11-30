const express = require('express');
const bcrypt = require('bcrypt');
const ldap = require('ldapjs');
const usersRouter = express.Router();
const logger = require('./logger'); // Import the logger
const SALT_COUNT = 10;

usersRouter.use((req, res, next) => {
    logger.info(`Request: ${req.method} ${req.originalUrl}`);
    next();
});

usersRouter.get('/test', (req, res) => {
    res.send('Test route works!');
 });

// Use admin credentials for binding in performLdapOperation
const ldapConfig = {
    url: 'ldap://localhost:389',
    bindDN: `cn=admin,dc=filemanager`, // Admin DN for binding
    bindCredentials: 'shegotmotion', // Admin password for binding
  };
  
  const performLdapOperation = async (req, res, operationCallback) => {
    try {
      const ldapClient = ldap.createClient({
        url: ldapConfig.url,
      });
  
      ldapClient.bind(ldapConfig.bindDN, ldapConfig.bindCredentials, (bindErr) => {
        if (bindErr) {
          console.error('LDAP Bind Error:', bindErr);
          res.status(401).send('Authentication Failed');
          ldapClient.unbind();
          return;
        }
  
        // Continue with the provided callback function
        operationCallback(ldapClient, res);
      });
    } catch (error) {
      console.error('LDAP Operation Error:', error);
      res.status(500).send('LDAP Operation Error');
    }
};

//================================ Register a new user=================================//
usersRouter.post('/register', async (req, res) => {
    performLdapOperation(req, res, (client) => {
      const { username, password } = req.body;
      const hashedPassword = bcrypt.hashSync(password, SALT_COUNT);
  
      // Check if the user already exists
  
      client.search("dc=filemanager", { scope: 'sub', filter: `(uid=${username})`}, (searchErr, searchRes) => {
        if (searchErr) {
          console.error('LDAP Search Error:', searchErr);
          res.status(500).send('LDAP Search Error');
          return;
        }
  
        const entries = [];
        searchRes.on('searchEntry', (entry) => {
          entries.push(entry);
        });
  
        searchRes.on('end', () => {
          if (entries.length > 0) {
            // User already exists
            res.status(409).send({
                message: 'User already exists'
            });
          } else {
            // Add a new user entry
            const userEntry = {
              dn: `uid=${username},ou=people,dc=filemanager`,
              attributes: {
                objectClass: ['top', 'person', 'organizationalPerson', 'inetOrgPerson'],
                uid: username,
                cn: username,
                sn: username,
                userPassword: hashedPassword,
              },
            };
  
            client.add(userEntry.dn, userEntry.attributes, (addErr) => {
              if (addErr) {
                console.error('LDAP Add Error:', addErr);
                res.status(500).send('LDAP Add Error');
              } else {
                console.log('User Added Successfully');
                res.status(200).send('User Added Successfully');
                logger.info(`User registered: ${username}`);
              }
  
              client.unbind();
            });
          }
        });
      });
    });
});

//================================ Log in ==================================//
usersRouter.post('/login', async (req, res, next) => {
    console.log('Login attempt for username:', req.body.username);
    performLdapOperation(req, res, (client) => {
        const { username, password } = req.body;
        const hashedPassword = bcrypt.hashSync(password, SALT_COUNT);
    
        // Check if the user already exists
        let ldapHash;
        client.search('dc=filemanager', { scope: 'sub', filter: `(uid=${username})` }, (searchErr, searchRes) => {
            if (searchErr) {
              console.error('LDAP Search Error:', searchErr);
              return;
            }

      
            searchRes.on('searchEntry', (entry) => {
                console.log('Found Test User:');
                console.log('DN:', entry.objectName);
              
                // Print each attribute and its values
                entry.attributes.forEach((attribute) => {
                // Split the string into lines
                if (attribute.type === "userPassword") {
                    ldapHash = attribute.vals.join(', ');
                }
                console.log(`${attribute.type}: ${attribute.vals.join(', ')}`);
                // Find the line that contains 'userPassword'
                });
                console.log("Here's the ldapHash variable: " + ldapHash);
                console.log({
                    hashedPassword,
                    ldapHash
                })
                const passwordsMatch = bcrypt.compareSync(password, ldapHash);
                if (passwordsMatch) {
                    res.send({
                        success: "you're logged in!",
                        hash: ldapHash
                    });
                } else {
                    next({
                        error: "IncorrectCredentialsError",
                        message: "Username or password is incorrect",
                    });
                    return;
                }
              });

            searchRes.on('end', () => {
              client.unbind();
            });
          });
      });
});


// Delete user
usersRouter.delete('/delete', async (req, res) => {
  performLdapOperation(req, res, (client) => {
    // Delete the user entry
    client.del(req.body.username, (deleteErr) => {
      if (deleteErr) {
        console.error('LDAP Delete Error:', deleteErr);
        res.status(500).send('LDAP Delete Error');
      } else {
        console.log('User Deleted Successfully');
        res.status(200).send('User Deleted Successfully');
      }

      client.unbind();
    });
  });
});

module.exports = usersRouter;