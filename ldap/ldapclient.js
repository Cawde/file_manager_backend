const ldap = require('ldapjs');
const bcrypt = require("bcrypt");
const SALT_COUNT = 10;

const ldapConfig = {
  url: 'ldap://localhost:389',
  bindDN: 'cn=admin,dc=filemanager',
  bindCredentials: 'shegotmotion',
};

const client = ldap.createClient({
  url: ldapConfig.url,
});

client.bind(ldapConfig.bindDN, ldapConfig.bindCredentials, (bindErr) => {
  if (bindErr) {
    console.error('LDAP Bind Error:', bindErr);
    return;
  }

  console.log('LDAP Bind Successful');

  // Function to add an OU if it doesn't exist
  const addOU = (ou) => {
    const ouEntry = {
      dn: `ou=${ou},dc=filemanager`,
      attributes: {
        objectClass: ['top', 'organizationalUnit'],
        ou: ou,
      },
    };

    client.add(ouEntry.dn, ouEntry.attributes, (ouAddErr) => {
      if (ouAddErr && ouAddErr.name !== 'EntryAlreadyExistsError') {
        console.error(`Error adding ${ou} OU:`, ouAddErr);
      } else if (!ouAddErr) {
        console.log(`${ou} OU added successfully`);
      }
    });
  };

  // Add organizational units (OUs) if they don't exist
  addOU('people');
  addOU('groups');

  // Add a user entry
  const userEntry = {
    dn: 'uid=testuser,ou=people,dc=filemanager',
    attributes: {
      objectClass: ['top', 'person', 'organizationalPerson', 'inetOrgPerson'],
      uid: 'testuser',
      cn: 'Test User',
      sn: 'User',
      userPassword: 'testpassword',
    },
  };

  client.add(userEntry.dn, userEntry.attributes, (addErr) => {
    if (addErr) {
      console.error('LDAP Add Error:', addErr);
    } else {
      console.log('User Added Successfully');
    }

    // Search for the added user
    client.search('dc=filemanager', { scope: 'sub', filter: '(uid=testuser)' }, (searchErr, searchRes) => {
      if (searchErr) {
        console.error('LDAP Search Error:', searchErr);
        return;
      }

      searchRes.on('searchEntry', (entry) => {
        console.log('Found Test User:');
        console.log('DN:', entry.objectName);

        // Print each attribute and its values
        entry.attributes.forEach((attribute) => {
          console.log(`${attribute.type}: ${attribute.vals.join(', ')}`);
        });
      });

      searchRes.on('end', () => {
        client.unbind();
      });
    });
  });
  
});