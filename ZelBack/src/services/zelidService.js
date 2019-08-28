const mongodb = require('mongodb');
const config = require('config');
const bitcoinMessage = require('bitcoinjs-message');
const qs = require('qs');

const userconfig = require('../../../config/userconfig');
const log = require('../lib/log');

const { MongoClient } = mongodb;
const mongoUrl = `mongodb://${config.database.url}:${config.database.port}/`;
const goodchars = /^[1-9a-km-zA-HJ-NP-Z]+$/;

// MongoDB functions
function connectMongoDb(url, callback) {
  MongoClient.connect(url, (err, db) => {
    if (err) {
      callback(err);
    } else {
      callback(null, db);
    }
  });
}

function findInDatabase(database, collection, query, projection, callback) {
  database.collection(collection).find(query, projection)
    .toArray((err, results) => {
      if (err) {
        callback(err);
      } else {
        callback(null, results);
      }
    });
}

function findOneInDatabase(database, collection, query, projection, callback) {
  database.collection(collection).findOne(query, projection, (err, result) => {
    if (err) {
      callback(err);
    } else {
      callback(null, result);
    }
  });
}

function insertOneToDatabase(database, collection, value, callback) {
  database.collection(collection).insertOne(value, (err, result) => {
    if (err) {
      callback(err);
    } else {
      callback(null, result);
    }
  });
}

function findOneAndDeleteInDatabase(database, collection, query, projection, callback) {
  database.collection(collection).findOneAndDelete(query, projection, (err, result) => {
    if (err) {
      callback(err);
    } else {
      callback(null, result);
    }
  });
}

function removeDocumentsFromCollection(database, collection, query, callback) {
  // to remove all documents from collection, the query is just {}
  database.collection(collection).remove(query, (err, result) => {
    if (err) {
      callback(err);
    } else {
      callback(null, result);
    }
  });
}

// Verification functions
function verifyAdminSession(headers, callback) {
  if (headers && headers.zelidauth) {
    const auth = qs.parse(headers.zelidauth);
    // console.log(auth)
    if (auth.zelid && auth.signature) {
      // console.log(auth.zelid)
      // console.log(auth.signature)
      // console.log(userconfig.initial.zelid)
      if (auth.zelid === userconfig.initial.zelid) {
        connectMongoDb(mongoUrl, (err, db) => {
          if (err) {
            log.error('Cannot reach MongoDB');
            log.error(err);
            callback(null, false);
          }
          const database = db.db(config.database.local.database);
          const collection = config.database.local.collections.loggedUsers;
          const query = { $and: [{ signature: auth.signature }, { zelid: auth.zelid }] };
          const projection = {};
          findOneInDatabase(database, collection, query, projection, (err, result) => {
            if (err) {
              log.error('Error accessing local zelID collection');
              log.error(err);
              db.close();
              callback(null, false);
            }
            const loggedUser = result;
            // console.log(result)
            db.close();
            if (loggedUser) {
              // check if signature corresponds to message with that zelid
              let valid = false;
              try {
                valid = bitcoinMessage.verify(loggedUser.loginPhrase, auth.zelid, auth.signature);
              } catch (error) {
                callback(null, false);
              }
              // console.log(valid)
              if (valid) {
                // now we know this is indeed a logged admin
                // console.log('here')
                callback(null, true);
              }
            } else {
              callback(null, false);
            }
          });
        });
      } else {
        callback(null, false);
      }
    } else {
      callback(null, false);
    }
  } else {
    callback(null, false);
  }
}

function verifyUserSession(headers, callback) {
  if (headers && headers.zelidauth) {
    const auth = qs.parse(headers.zelidauth);
    // console.log(auth)
    if (auth.zelid && auth.signature) {
      connectMongoDb(mongoUrl, (err, db) => {
        if (err) {
          log.error('Cannot reach MongoDB');
          log.error(err);
          callback(null, false);
        }
        const database = db.db(config.database.local.database);
        const collection = config.database.local.collections.loggedUsers;
        const query = { $and: [{ signature: auth.signature }, { zelid: auth.zelid }] };
        const projection = {};
        findOneInDatabase(database, collection, query, projection, (err, result) => {
          if (err) {
            log.error('Error accessing local zelID collection');
            log.error(err);
            db.close();
            callback(null, false);
          }
          const loggedUser = result;
          // console.log(result)
          db.close();
          if (loggedUser) {
            // check if signature corresponds to message with that zelid
            let valid = false;
            try {
              valid = bitcoinMessage.verify(loggedUser.loginPhrase, auth.zelid, auth.signature);
            } catch (error) {
              callback(null, false);
            }
            // console.log(valid)
            if (valid) {
              // now we know this is indeed a logged admin
              // console.log('here')
              callback(null, true);
            }
          } else {
            callback(null, false);
          }
        });
      });
    } else {
      callback(null, false);
    }
  } else {
    callback(null, false);
  }
}

function verifyZelTeamSession(headers, callback) {
  if (headers && headers.zelidauth) {
    const auth = qs.parse(headers.zelidauth);
    // console.log(auth)
    if (auth.zelid && auth.signature) {
      if (auth.zelid === config.zelTeamZelId || auth.zelid === userconfig.initial.zelid) { // admin is considered zelteam.
        connectMongoDb(mongoUrl, (err, db) => {
          if (err) {
            log.error('Cannot reach MongoDB');
            log.error(err);
            callback(null, false);
          }
          const database = db.db(config.database.local.database);
          const collection = config.database.local.collections.loggedUsers;
          const query = { $and: [{ signature: auth.signature }, { zelid: auth.zelid }] };
          const projection = {};
          findOneInDatabase(database, collection, query, projection, (err, result) => {
            if (err) {
              log.error('Error accessing local zelID collection');
              log.error(err);
              db.close();
              callback(null, false);
            }
            const loggedUser = result;
            // console.log(result)
            db.close();
            if (loggedUser) {
              // check if signature corresponds to message with that zelid
              let valid = false;
              try {
                valid = bitcoinMessage.verify(loggedUser.loginPhrase, auth.zelid, auth.signature);
              } catch (error) {
                callback(null, false);
              }
              // console.log(valid)
              if (valid) {
                // now we know this is indeed a logged admin
                // console.log('here')
                callback(null, true);
              }
            } else {
              callback(null, false);
            }
          });
        });
      } else {
        callback(null, false);
      }
    } else {
      callback(null, false);
    }
  } else {
    callback(null, false);
  }
}

function loginPhrase(req, res) {
  const timestamp = new Date().getTime();
  const validTill = timestamp + (15 * 60 * 1000); // 15 minutes
  const phrase = timestamp + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  /* const activeLoginPhrases = [
     {
       loginPhrase: 1565356121335e9obp7h17bykbbvub0ts488wnnmd12fe1pq88mq0v,
       createdAt: 2019-08-09T13:08:41.335Z,
       expireAt: 2019-08-09T13:23:41.335Z
     }
] */
  connectMongoDb(mongoUrl, (err, db) => {
    if (err) {
      log.error('Cannot reach MongoDB');
      log.error(err);
      const errMessage = {
        status: 'error',
        data: {
          message: 'Cannot reach MongoDB',
        },
      };
      return res.json(errMessage);
    }
    const database = db.db(config.database.local.database);
    const collection = config.database.local.collections.activeLoginPhrases;
    database.collection(collection).createIndex({ createdAt: 1 }, { expireAfterSeconds: 900 });
    const newLoginPhrase = {
      loginPhrase: phrase,
      createdAt: new Date(timestamp),
      expireAt: new Date(validTill),
    };
    const value = newLoginPhrase;
    insertOneToDatabase(database, collection, value, (err, result) => {
      if (err) {
        log.error('Error creating new Login Phrase');
        log.error(err);
        const errMessage = {
          status: 'error',
          data: {
            message: 'Error creating new Login Phrase',
          },
        };
        return res.json(errMessage);
      }
      db.close();
      return res.json(phrase);
    });
  });
}

function verifyLogin(req, res) {
  // Phase 2 - check that request is valid
  let body = '';
  req.on('data', (data) => {
    body += data;
  });
  req.on('end', () => {
    const processedBody = qs.parse(body);
    const { address } = processedBody;
    const { signature } = processedBody;
    const { message } = processedBody;
    const timestamp = new Date().getTime();

    if (!goodchars.test(address)) {
      const errMessage = {
        status: 'error',
        data: {
          message: 'ZelID is not valid',
        },
      };
      return res.json(errMessage);
    }

    if (address[0] !== '1') {
      const errMessage = {
        status: 'error',
        data: {
          message: 'ZelID is not valid',
        },
      };
      return res.json(errMessage);
    }

    if (address.length > 34 || address.length < 25) {
      const errMessage = {
        status: 'error',
        data: {
          message: 'ZelID is not valid',
        },
      };
      return res.json(errMessage);
    }

    // First Check that this message is valid - has not old timestamp, is at least 40 chars and was generated by us (is stored in our db)
    if (address === undefined || address === '') {
      const errMessage = {
        status: 'error',
        data: {
          message: 'No ZelID is specified',
        },
      };
      return res.json(errMessage);
    }

    if (message === undefined || message === '') {
      const errMessage = {
        status: 'error',
        data: {
          message: 'No message is specified',
        },
      };
      return res.json(errMessage);
    }

    if (message.length < 40) {
      const errMessage = {
        status: 'error',
        data: {
          message: 'Signed message is not valid',
        },
      };
      return res.json(errMessage);
    }

    if (message.substring(0, 13) < (timestamp - 900000) || message.substring(0, 13) > timestamp) {
      const errMessage = {
        status: 'error',
        data: {
          message: 'Signed message is not valid',
        },
      };
      return res.json(errMessage);
    }

    if (signature === undefined || signature === '') {
      const errMessage = {
        status: 'error',
        data: {
          message: 'No signature is specified',
        },
      };
      return res.json(errMessage);
    }
    // Basic checks passed. First check if message is in our activeLoginPhrases collection

    connectMongoDb(mongoUrl, (err, db) => {
      if (err) {
        log.error('Cannot reach MongoDB');
        log.error(err);
        const errMessage = {
          status: 'error',
          data: {
            message: 'Cannot reach MongoDB',
          },
        };
        db.close();
        return res.json(errMessage);
      }
      const database = db.db(config.database.local.database);
      const collection = config.database.local.collections.activeLoginPhrases;
      const query = { loginPhrase: message };
      const projection = {};
      findOneInDatabase(database, collection, query, projection, (err, result) => {
        if (err) {
          log.error('Error verifying Login');
          log.error(err);
          const errMessage = {
            status: 'error',
            data: {
              message: 'Error verifying Login',
            },
          };
          db.close();
          return res.json(errMessage);
        }

        if (result) {
          // It is present in our database
          if (result.loginPhrase.substring(0, 13) < timestamp) {
            // Second verify that this address signed this message
            let valid = false;
            try {
              valid = bitcoinMessage.verify(message, address, signature);
            } catch (error) {
              const errMessage = {
                status: 'error',
                data: {
                  message: 'Invalid signature',
                },
              };
              return res.json(errMessage);
            }
            if (valid) {
              // Third associate that address, signature and message with our database
              // TODO signature hijacking? What if middleware guy knows all of this?
              // TODO do we want to have some timelimited logins? not needed now
              // Do we want to store sighash too? Nope we are verifying if provided signature is ok. In localStorage we are storing zelid, message, signature
              // const sighash = crypto
              //   .createHash('sha256')
              //   .update(signature)
              //   .digest('hex')
              const newLogin = {
                zelid: address,
                loginPhrase: message,
                signature,
              };
              let privilage = 'user';
              if (address === config.zelTeamZelId) {
                privilage = 'zelteam';
              } else if (address === userconfig.initial.zelid) {
                privilage = 'admin';
              }
              const loggedUsersCollection = config.database.local.collections.loggedUsers;
              const value = newLogin;
              insertOneToDatabase(database, loggedUsersCollection, value, (err, result) => {
                db.close();
                if (err) {
                  log.error('Error Logging user');
                  log.error(err);
                  const errMessage = {
                    status: 'error',
                    data: {
                      message: 'Unable to login',
                    },
                  };
                  return res.json(errMessage);
                }
                const resMessage = {
                  status: 'success',
                  data: {
                    message: 'Successfully logged in',
                    zelid: address,
                    loginPhrase: message,
                    signature,
                    privilage,
                  },
                };
                return res.json(resMessage);
              });
            } else {
              const errMessage = {
                status: 'error',
                data: {
                  message: 'Invalid signature.',
                },
              };
              db.close();
              return res.json(errMessage);
            }
          } else {
            const errMessage = {
              status: 'error',
              data: {
                message: 'Signed message is no longer valid. Please request a new one.',
              },
            };
            db.close();
            return res.json(errMessage);
          }
        } else {
          const errMessage = {
            status: 'error',
            data: {
              message: 'Signed message is no longer valid. Please request a new one.',
            },
          };
          db.close();
          return res.json(errMessage);
        }
      });
    });
  });
}

function activeLoginPhrases(req, res) {
  verifyAdminSession(req.headers, (error, authorized) => {
    if (error) {
      return res.json(error);
    }
    if (authorized === true) {
      connectMongoDb(mongoUrl, (err, db) => {
        if (err) {
          log.error('Cannot reach MongoDB');
          log.error(err);
          const errMessage = {
            status: 'error',
            data: {
              message: 'Cannot reach MongoDB',
            },
          };
          return res.json(errMessage);
        }

        const database = db.db(config.database.local.database);
        const collection = config.database.local.collections.activeLoginPhrases;
        const query = {};
        const projection = {
          projection: {
            _id: 0, loginPhrase: 1, createdAt: 1, expireAt: 1,
          },
        };
        findInDatabase(database, collection, query, projection, (err, results) => {
          db.close();
          if (err) {
            log.error('Error accessing local zelID collection');
            log.error(err);
            const errMessage = {
              status: 'error',
              data: {
                message: 'Error accessing local zelID collection.',
              },
            };
            db.close();
            return res.status(500).json(errMessage);
          }
          db.close();
          return res.json(results);
        });
      });
    } else {
      const errMessage = {
        status: 'error',
        data: {
          message: 'Unauthorized. Access denied.',
        },
      };
      return res.json(errMessage);
    }
  });
}

function loggedUsers(req, res) {
  verifyAdminSession(req.headers, (error, authorized) => {
    if (error) {
      return res.json(error);
    }
    if (authorized === true) {
      connectMongoDb(mongoUrl, (err, db) => {
        if (err) {
          log.error('Cannot reach MongoDB');
          log.error(err);
          const errMessage = {
            status: 'error',
            data: {
              message: 'Cannot reach MongoDB',
            },
          };
          return res.json(errMessage);
        }

        const database = db.db(config.database.local.database);
        const collection = config.database.local.collections.loggedUsers;
        const query = {};
        const projection = { projection: { _id: 0, zelid: 1, loginPhrase: 1 } };
        findInDatabase(database, collection, query, projection, (err, results) => {
          db.close();
          if (err) {
            log.error('Error accessing local zelID collection');
            log.error(err);
            const errMessage = {
              status: 'error',
              data: {
                message: 'Error accessing local zelID collection.',
              },
            };
            return res.json(errMessage);
          }
          return res.json(results);
        });
      });
    } else {
      const errMessage = {
        status: 'error',
        data: {
          message: 'Unauthorized. Access denied.',
        },
      };
      return res.json(errMessage);
    }
  });
}

function logoutCurrentSession(req, res) {
  verifyUserSession(req.headers, (error, authorized) => {
    if (error) {
      return res.json(error);
    }
    if (authorized === true) {
      const auth = qs.parse(req.headers.zelidauth);
      connectMongoDb(mongoUrl, (err, db) => {
        if (err) {
          log.error('Cannot reach MongoDB');
          log.error(err);
          const errMessage = {
            status: 'error',
            data: {
              message: 'Cannot reach MongoDB',
            },
          };
          return res.json(errMessage);
        }
        const database = db.db(config.database.local.database);
        const collection = config.database.local.collections.loggedUsers;
        const query = { $and: [{ signature: auth.signature }, { zelid: auth.zelid }] };
        const projection = {};
        findOneAndDeleteInDatabase(database, collection, query, projection, (err, result) => {
          db.close();
          if (err) {
            log.error('Error accessing local zelID collection');
            log.error(err);
            const errMessage = {
              status: 'error',
              data: {
                message: 'Error accessing local zelID collection.',
              },
            };
            return res.json(errMessage);
          }
          // console.log(result)
          const message = {
            status: 'success',
            data: {
              message: 'Successfully logged out',
            },
          };
          return res.json(message);
        });
      });
    } else {
      const errMessage = {
        status: 'error',
        data: {
          message: 'Unauthorized. Access denied.',
        },
      };
      return res.json(errMessage);
    }
  });
}

function logoutAllSessions(req, res) {
  verifyUserSession(req.headers, (error, authorized) => {
    if (error) {
      return res.json(error);
    }
    if (authorized === true) {
      const auth = qs.parse(req.headers.zelidauth);
      connectMongoDb(mongoUrl, (err, db) => {
        if (err) {
          log.error('Cannot reach MongoDB');
          log.error(err);
          const errMessage = {
            status: 'error',
            data: {
              message: 'Cannot reach MongoDB',
            },
          };
          return res.json(errMessage);
        }
        const database = db.db(config.database.local.database);
        const collection = config.database.local.collections.loggedUsers;
        const query = { zelid: auth.zelid };
        removeDocumentsFromCollection(database, collection, query, (err, result) => {
          db.close();
          if (err) {
            log.error('Error accessing local zelID collection');
            log.error(err);
            const errMessage = {
              status: 'error',
              data: {
                message: 'Error accessing local zelID collection.',
              },
            };
            return res.json(errMessage);
          }
          // console.log(result)
          const message = {
            status: 'success',
            data: {
              message: 'Successfully logged out all sessions',
            },
          };
          return res.json(message);
        });
      });
    } else {
      const errMessage = {
        status: 'error',
        data: {
          message: 'Unauthorized. Access denied.',
        },
      };
      return res.json(errMessage);
    }
  });
}

function logoutAllUsers(req, res) {
  verifyAdminSession(req.headers, (error, authorized) => {
    if (error) {
      return res.json(error);
    }
    if (authorized === true) {
      connectMongoDb(mongoUrl, (err, db) => {
        if (err) {
          log.error('Cannot reach MongoDB');
          log.error(err);
          const errMessage = {
            status: 'error',
            data: {
              message: 'Cannot reach MongoDB',
            },
          };
          return res.json(errMessage);
        }
        const database = db.db(config.database.local.database);
        const collection = config.database.local.collections.loggedUsers;
        const query = {};
        removeDocumentsFromCollection(database, collection, query, (err, result) => {
          db.close();
          if (err) {
            log.error('Error accessing local zelID collection');
            log.error(err);
            const errMessage = {
              status: 'error',
              data: {
                message: 'Error accessing local zelID collection.',
              },
            };
            return res.json(errMessage);
          }
          // console.log(result)
          const message = {
            status: 'success',
            data: {
              message: 'Successfully logged out all sessions',
            },
          };
          return res.json(message);
        });
      });
    } else {
      const errMessage = {
        status: 'error',
        data: {
          message: 'Unauthorized. Access denied.',
        },
      };
      return res.json(errMessage);
    }
  });
}

function wsRespondLoginPhrase(ws, req) {
  const { loginphrase } = req.params;
  // console.log(loginphrase)
  // respond with object containing address and signature to received message
  let connclosed = false;
  ws.onclose = (evt) => {
    // console.log(evt)
    connclosed = true;
  };
  ws.onerror = (evt) => {
    log.error(evt);
    connclosed = true;
  };

  connectMongoDb(mongoUrl, (err, db) => {
    if (err) {
      log.error('Cannot reach MongoDB');
      log.error(err);
      const errMessage = {
        status: 'error',
        data: {
          message: 'Cannot reach MongoDB',
        },
      };
      // ws.clients.forEach(function each(client) {
      //   if (client !== ws && client.readyState === WebSocket.OPEN) {
      //     client.send(data);
      //   }
      if (!connclosed) {
        try {
          ws.send(qs.stringify(errMessage));
          ws.close();
        } catch (e) {
          log.error(e);
        }
      }
    }

    const database = db.db(config.database.local.database);
    const collection = config.database.local.collections.loggedUsers;
    const query = { loginPhrase: loginphrase };
    const projection = {};
    function searchDatabase() {
      findOneInDatabase(database, collection, query, projection, (err, result) => {
        if (err) {
          log.error('Error looking for Login');
          log.error(err);
          const errMessage = {
            status: 'error',
            data: {
              message: 'Error looking for Login',
            },
          };
          db.close();
          if (!connclosed) {
            try {
              ws.send(qs.stringify(errMessage));
              ws.close();
            } catch (e) {
              log.error(e);
            }
          }
        }

        if (result) {
          // user is logged, all ok
          let privilage = 'user';
          if (result.zelid === config.zelTeamZelId) {
            privilage = 'zelteam';
          } else if (result.zelid === userconfig.initial.zelid) {
            privilage = 'admin';
          }
          const message = {
            status: 'success',
            data: {
              message: 'Successfully logged in',
              zelid: result.zelid,
              loginPhrase: result.loginPhrase,
              signature: result.signature,
              privilage,
            },
          };
          if (!connclosed) {
            try {
              ws.send(qs.stringify(message));
              ws.close();
            } catch (e) {
              log.error(e);
            }
          }
          db.close();
        } else {
          // check if this loginPhrase is still active. If so rerun this searching process
          const activeLoginPhrasesCollection = config.database.local.collections.activeLoginPhrases;
          findOneInDatabase(database, activeLoginPhrasesCollection, query, projection, (err, result) => {
            if (err) {
              log.error('Error searching for login phrase');
              log.error(err);
              const errMessage = {
                status: 'error',
                data: {
                  message: 'Error searching for login phrase',
                },
              };
              db.close();
              if (!connclosed) {
                try {
                  ws.send(qs.stringify(errMessage));
                  ws.close();
                } catch (e) {
                  log.error(e);
                }
              }
            }
            if (result) {
              setTimeout(() => {
                if (!connclosed) {
                  searchDatabase();
                }
              }, 500);
            } else {
              const errMessage = {
                status: 'error',
                data: {
                  message: 'Signed message is no longer valid. Please request a new one.',
                },
              };
              db.close();
              if (!connclosed) {
                try {
                  ws.send(qs.stringify(errMessage));
                  ws.close();
                } catch (e) {
                  log.error(e);
                }
              }
            }
          });
        }
      });
    }
    searchDatabase();
  });
}

module.exports = {
  loginPhrase,
  verifyLogin,
  activeLoginPhrases,
  loggedUsers,
  logoutCurrentSession,
  logoutAllSessions,
  logoutAllUsers,
  wsRespondLoginPhrase,
};
