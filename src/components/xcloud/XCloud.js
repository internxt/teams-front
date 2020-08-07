import * as React from 'react';
import { Link } from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import $ from 'jquery';
import _ from 'lodash';
import fileDownload from 'js-file-download';
import update from 'immutability-helper';
import Popup from 'reactjs-popup';
import async from 'async';

import FileCommander from './FileCommander';
import NavigationBar from '../navigationBar/NavigationBar';
import history from '../../lib/history';
import { removeAccents } from '../../lib/utils';
import closeTab from '../../assets/Dashboard-Icons/close-tab.svg';

import PopupShare from '../PopupShare';
import './XCloud.scss';

import { getHeaders } from '../../lib/auth';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

class XCloud extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      email: '',
      isAuthorized: false,
      isInitialized: false,
      isActivated: null,
      token: '',
      chooserModalOpen: false,
      rateLimitModal: false,
      currentFolderId: null,
      currentFolderBucket: null,
      currentCommanderItems: [],
      namePath: [],
      sortFunction: null,
      searchFunction: null,
      popupShareOpened: false,
      showDeleteItemsPopup: false,
    };

    this.moveEvent = {};
  }

  componentDidMount = () => {
    // When user is not signed in, redirect to login
    if (!this.props.user || !this.props.isAuthenticated) {
      history.push('/login');
    } else {
      this.isUserActivated()
        .then((data) => {
          // If user is signed in but is not activated set property isActivated to false
          const isActivated = data.activated;
          if (isActivated) {
            if (!this.props.user.root_folder_id) {
              // Initialize user in case that is not done yet
              this.userInitialization()
                .then((resultId) => {
                  this.getFolderContent(resultId);
                })
                .catch((error) => {
                  const errorMsg = error ? error : '';
                  toast.warn('User initialization error ' + errorMsg);
                  history.push('/login');
                });
            } else {
              this.getFolderContent(this.props.user.root_folder_id);
            }

            this.setState({ isActivated, isInitialized: true });
          }

          if (data.activatedTeam) {
            this.teamInitialization(data.teamId).then((teamInit) => {
              this.getFolderContent(this.props.user.root_folder_id);
            }).catch((err) => {
              console.log(err);
            });
          }
        })
        .catch((error) => {
          console.log('Error getting user activation status: ' + error);
          localStorage.clear();
          history.push('/login');
        });
    }
  };

  teamInitialization = (idTeam) => {
    return new Promise((resolve, reject) => {
      fetch('/api/initialize', {
        method: 'post',
        headers: getHeaders(true, true),
        body: JSON.stringify({
          email: this.props.user.email,
          mnemonic: localStorage.getItem('xMnemonic'),
          idTeam: idTeam
        }),
      })
        .then((response) => {
          if (response.status === 200) {
            response.json().then((r_body) => {
              resolve(r_body);
            });
          } else {
            reject(null);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  userInitialization = () => {
    return new Promise((resolve, reject) => {
      fetch('/api/initialize', {
        method: 'post',
        headers: getHeaders(true, true),
        body: JSON.stringify({
          email: this.props.user.email,
          mnemonic: localStorage.getItem('xMnemonic'),
        }),
      })
        .then((response) => {
          if (response.status === 200) {
            // Successfull intialization
            this.setState({ isInitialized: true });
            // Set user with new root folder id
            response.json().then((body) => {
              let updatedUser = this.props.user;
              updatedUser.root_folder_id = body.user.root_folder_id;
              this.props.handleKeySaved(updatedUser);
              resolve(body.user.root_folder_id);
            });
          } else {
            reject(null);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  isUserActivated = () => {
    return fetch('/api/user/isactivated', {
      method: 'get',
      headers: getHeaders(true, false),
    })
      .then((response) => response.json())
      .catch((error) => {
        console.log('Error getting user activation');
      });
  };

  setSortFunction = (newSortFunc) => {
    // Set new sort function on state and call getFolderContent for refresh files list
    this.setState({ sortFunction: newSortFunc });
    this.getFolderContent(this.state.currentFolderId);
  };

  setSearchFunction = (e) => {
    // Set search function depending on search text input and refresh items list
    const searchString = removeAccents(e.target.value.toString()).toLowerCase();
    let func = null;
    if (searchString) {
      func = function (item) {
        return item.name.toLowerCase().includes(searchString);
      };
    }
    this.setState({ searchFunction: func });
    this.getFolderContent(this.state.currentFolderId);
  };

  createFolder = () => {
    const folderName = prompt('Please enter folder name');
    if (folderName && folderName !== '') {
      fetch(`/api/storage/folder`, {
        method: 'post',
        headers: getHeaders(true, true),
        body: JSON.stringify({
          parentFolderId: this.state.currentFolderId,
          folderName,
          teamId:  _.last(this.state.namePath) && _.last(this.state.namePath).hasOwnProperty('id_team') ? _.last(this.state.namePath).id_team : null
        }),
      })
        .then(async (res) => {
          if (res.status !== 201) {
            const body = await res.json();
            throw body.error ? body.error : 'createFolder error';
          }
          this.getFolderContent(this.state.currentFolderId, false);
        })
        .catch((err) => {
          if (err.includes('already exists')) {
            toast.warn('Folder with same name already exists');
          } else {
            toast.warn(`"${err}"`);
          }
        });
    } else {
      toast.warn('Invalid folder name');
    }
  };

  folderNameExists = (folderName) => {
    return this.state.currentCommanderItems.find(
      (item) => item.isFolder && item.name === folderName,
    );
  };

  fileNameExists = (fileName, type) => {
    return this.state.currentCommanderItems.find(
      (item) => !item.isFolder && item.name === fileName && item.type === type,
    );
  };

  getNextNewName = (originalName, i) => `${originalName} (${i})`;

  getNewFolderName = (name) => {
    let exists = true;
    let i = 1;
    let newName;
    const currentFolder = this.state.currentCommanderItems.filter((item) => item.isFolder);
    while (exists) {
      newName = this.getNextNewName(name, i);
      exists = currentFolder.find((folder) => folder.name === newName);
      i += 1;
    }

    return newName;
  };

  getNewFileName = (name, type) => {
    let exists = true;
    let i = 1;
    let newName;
    const currentFiles = this.state.currentCommanderItems.filter((item) => !item.isFolder);
    while (exists) {
      newName = this.getNextNewName(name, i);
      exists = currentFiles.find((file) => file.name === newName && file.type === type);
      i += 1;
    }

    return newName;
  };

  getNewName = (name, type) => {
    // if has type is file
    if (type) {
      return this.getNewFileName(name, type);
    }

    return this.getNewFolderName(name);
  };

  createFolderByName = (folderName, parentFolderId) => {
    console.log('Create folder: %s', folderName);
    // No parent id implies is a directory created on the current folder, so let's show a spinner
    if (!parentFolderId) {
      let __currentCommanderItems;
      if (this.folderNameExists(folderName)) {
        folderName = this.getNewName(folderName);
      }
      __currentCommanderItems = this.state.currentCommanderItems;
      __currentCommanderItems.push({
        name: folderName,
        isLoading: true,
        isFolder: true,
      });

      this.setState({ currentCommanderItems: __currentCommanderItems });
    } else {
      folderName = this.getNewName(folderName);
    }

    parentFolderId = parentFolderId || this.state.currentFolderId;

    return new Promise((resolve, reject) => {
      fetch(`/api/storage/folder`, {
        method: 'post',
        headers: getHeaders(true, true),
        body: JSON.stringify({
          parentFolderId,
          folderName,
          teamId: _.last(this.state.namePath) && _.last(this.state.namePath).hasOwnProperty('id_team') ? _.last(this.state.namePath).id_team : null
        }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (res.status !== 201) {
            throw data;
          }
          return data;
        })
        .then(resolve)
        .catch(reject);
    });
  };

  openFolder = (e) => {
    return new Promise((resolve) => {
      this.getFolderContent(e.id, true, e.id_team || null);
      resolve();
    });
  };

  getFolderContent = (rootId, updateNamePath = true, teamId = null) => {
    var route = '';
    if (teamId) {
      route = `/api/storage/folder/${rootId}/${teamId}`;
    } else {
      route = `/api/storage/folder/${rootId}`;
    }

    fetch(route, {
      method: 'get',
      headers: getHeaders(true, true),
    })
      .then((res) => {
        if (res.status !== 200) {
          throw res;
        } else {
          return res.json();
        }
      })
      .then((data) => {
        this.deselectAll();

        // Set new items list
        let newCommanderFolders = _.map(data.children, (o) =>
          _.extend({ isFolder: true, isSelected: false, isLoading: false, isDowloading: false }, o),
        );
        let newCommanderFiles = data.files;

        // Apply search function if is set
        if (this.state.searchFunction) {
          newCommanderFolders = newCommanderFolders.filter(this.state.searchFunction);
          newCommanderFiles = newCommanderFiles.filter(this.state.searchFunction);
        }

        // Apply sort function if is set
        if (this.state.sortFunction) {
          newCommanderFolders.sort(this.state.sortFunction);
          newCommanderFiles.sort(this.state.sortFunction);
        }
        this.setState({
          currentCommanderItems: _.concat(newCommanderFolders, newCommanderFiles),
          currentFolderId: data.id,
          currentFolderBucket: data.bucket,
        });

        if (updateNamePath) {
          // Only push path if it is not the same as actual path
          if (
            this.state.namePath.length === 0 ||
            this.state.namePath[this.state.namePath.length - 1].id !== data.id
          ) {
            const folderName = this.props.user.root_folder_id === data.id ? 'All Files' : data.name;
            this.setState({
              namePath: this.pushNamePath({
                name: folderName,
                id: data.id,
                bucket: data.bucket,
                id_team: data.id_team
              }),
              isAuthorized: true,
            });
          }
        }
      })
      .catch((err) => {
        if (err.status === 401) {
          history.push('/login');
        }
      });
  };

  updateMeta = (metadata, itemId, isFolder) => {
    // Apply changes on metadata depending on type of item
    const data = JSON.stringify({ metadata });
    if (isFolder) {
      fetch(`/api/storage/folder/${itemId}/meta`, {
        method: 'post',
        headers: getHeaders(true, true),
        body: data,
      })
        .then(() => {
          this.getFolderContent(this.state.currentFolderId);
        })
        .catch((error) => {
          console.log(`Error during folder customization. Error: ${error} `);
        });
    } else {
      fetch(`/api/storage/file/${itemId}/meta`, {
        method: 'post',
        headers: getHeaders(true, true),
        body: data,
      })
        .then(() => {
          this.getFolderContent(this.state.currentFolderId);
        })
        .catch((error) => {
          console.log(`Error during file customization. Error: ${error} `);
        });
    }
  };

  clearMoveOpEvent = (moveOpId) => {
    delete this.moveEvent[moveOpId];
  };

  decreaseMoveOpEventCounters = (isError, moveOpId) => {
    this.moveEvent[moveOpId].errors += isError;
    this.moveEvent[moveOpId].total -= 1;
    this.moveEvent[moveOpId].resolved += 1;
  };

  move = (items, destination, moveOpId) => {
    // Don't want to request this...
    if (
      items
        .filter((item) => item.isFolder)
        .map((item) => item.id)
        .includes(destination)
    ) {
      return toast.warn(`You can't move a folder inside itself'`);
    }

    // Init default operation properties
    if (!this.moveEvent[moveOpId]) {
      this.moveEvent[moveOpId] = {
        total: 0,
        errors: 0,
        resolved: 0,
        itemsLength: items.length,
      };
    }

    // Increment operation property values
    this.moveEvent[moveOpId].total += items.length;

    // Move Request body
    const data = { destination };
    let keyOp; // Folder or File
    // Fetch for each first levels items
    items.forEach((item) => {
      keyOp = item.isFolder ? 'Folder' : 'File';
      data[keyOp.toLowerCase() + 'Id'] = item.fileId || item.id;
      fetch(`/api/storage/move${keyOp}`, {
        method: 'post',
        headers: getHeaders(true, true),
        body: JSON.stringify(data),
      }).then(async (res) => {
        const response = await res.json();
        const success = res.status === 200;
        const moveEvent = this.moveEvent[moveOpId];

        // Decreasing counters...
        this.decreaseMoveOpEventCounters(!success, moveOpId);

        if (!success) {
          toast.warn(`Error moving ${keyOp.toLowerCase()} '${response.item.name}`);
        } else {
          // Remove myself
          let currentCommanderItems = this.state.currentCommanderItems.filter((commanderItem) =>
            item.isFolder
              ? !commanderItem.isFolder ||
                (commanderItem.isFolder && !(commanderItem.id === item.id))
              : commanderItem.isFolder ||
                (!commanderItem.isFolder && !(commanderItem.fileId === item.fileId)),
          );
          // update state for updating commander items list
          this.setState({ currentCommanderItems });
        }

        if (moveEvent.total === 0) {
          this.clearMoveOpEvent(moveOpId);
          // If empty folder list move back
          if (!this.state.currentCommanderItems.length) {
            this.folderTraverseUp();
          }
        }
      });
    });
  };

  downloadFile = (id) => {
    return new Promise((resolve) => {
      fetch(`/api/storage/file/${id}`, {
        method: 'GET',
        headers: getHeaders(true, true),
      })
        .then((res) => {
          if (res.status !== 200) {
            throw res;
          } else {
            return res;
          }
        })
        .then((res) => {
          res
            .blob()
            .then((blob) => {
              const name = Buffer.from(res.headers.get('x-file-name'), 'base64').toString('utf8');
              fileDownload(blob, name);
              resolve();
            })
            .catch((err) => {
              throw err;
            });
        })
        .catch((err) => {
          if (err.status === 401) {
            history.push('/login');
          } else if (err.status === 402) {
            this.setState({ rateLimitModal: true });
          } else {
            err.json().then((res) => {
              toast.warn(
                'Error downloading file:\n' +
                  err.status +
                  ' - ' +
                  err.statusText +
                  '\n' +
                  res.message +
                  '\nFile id: ' +
                  id,
              );
            });
          }
          resolve();
        });
    });
  };

  openUploadFile = () => {
    $('input#uploadFileControl').val(null);
    $('input#uploadFileControl').trigger('click');
  };

  upload = (file, parentFolderId) => {
    return new Promise((resolve, reject) => {
      if (!parentFolderId) {
        return reject(Error('No folder ID provided'));
      }

      console.log('Upload file:', file.name);

      const uploadUrl = `/api/storage/folder/${parentFolderId}/upload`;

      // Headers with Auth & Mnemonic
      let headers = getHeaders(true, true);
      headers.delete('content-type');

      // Data
      const data = new FormData();
      data.append('xfile', file);

      fetch(uploadUrl, {
        method: 'POST',
        headers: headers,
        body: data,
      })
        .then(async (res) => {
          let data;
          try {
            data = await res.json();
          } catch (err) {
            console.error('Upload response data is not a JSON', err);
          }
          if (data) {
            return { res: res, data: data };
          } else {
            throw res;
          }
        })
        .then(({ res, data }) => resolve({ res, data }))
        .catch(reject);
    });
  };

  handleUploadFiles = (files, parentFolderId) => {
    files = Array.from(files);
    var re = /(?:\.([^.]+))?$/;
    let __currentCommanderItems = this.state.currentCommanderItems;
    let currentFolderId = this.state.currentFolderId;
    parentFolderId = parentFolderId || currentFolderId;

    for (let i = 0; i < files.length; i++) {
      if (files[i].size >= 314572800) {
        let arr = Array.from(files);
        arr.splice(i, 1);
        files = arr;
        toast.warn(
          `File too large.\nYou can only upload or download files of up to 200 MB through the web app`,
        );
      }
    }

    for (let i = 0; i < files.length; i++) {
      let newName;
      let fileAtt = re.exec(files[i].name);
      if (this.fileNameExists(files[i].name.replace(fileAtt[0], ''), fileAtt[1])) {
        newName = this.getNewName(files[i].name.replace(fileAtt[0], ''), fileAtt[1]);
        files[i].newName = newName;
      }
    }

    if (parentFolderId === currentFolderId) {
      const newCommanderItems = files.map((file) => {
        return { name: file.newName || file.name, size: file.size, isLoading: true };
      });
      __currentCommanderItems = __currentCommanderItems.concat(newCommanderItems);
      this.setState({ currentCommanderItems: __currentCommanderItems });
    }

    return new Promise((resolve, reject) => {
      async.eachSeries(
        files,
        (file, next) => {
          this.upload(file, parentFolderId)
            .then(({ res, data }) => {
              if (res.status === 402) {
                this.setState({ rateLimitModal: true });
                throw res.status;
              }

              if (res.status === 500) {
                throw data.message;
              }

              if (parentFolderId === currentFolderId) {
                let index = __currentCommanderItems.findIndex(
                  (obj) => obj.name === (file.newName || file.name),
                );
                __currentCommanderItems[index].isLoading = false;
                __currentCommanderItems[index].type = re.exec(file.name)[1];
                this.setState({ currentCommanderItems: __currentCommanderItems }, () => next());
              } else {
                next();
              }
            })
            .catch((err) => {
              let index = __currentCommanderItems.findIndex(
                (obj) => obj.name === (file.newName || file.name),
              );
              __currentCommanderItems.splice(index, 1);
              this.setState({ currentCommanderItems: __currentCommanderItems }, () => next(err));
            });
        },
        (err, results) => {
          if (err) {
            console.error('Error uploading:', err);
            reject(err);
            toast.warn(`"${err}"`);
          } else if (parentFolderId === currentFolderId) {
            resolve();

            this.getFolderContent(
              currentFolderId,
              true,
              _.last(this.state.namePath).id_team || null
            );
          } else {
            resolve();
          }
        },
      );
    });
  };

  uploadFile = (e) => this.handleUploadFiles(e.target.files);

  uploadDroppedFile = (e, uuid) => this.handleUploadFiles(e, uuid);

  shareItem = () => {
    const selectedItems = this.getSelectedItems();
    if (selectedItems && selectedItems.length === 1) {
      this.setState({ popupShareOpened: true });
    } else {
      toast.warn('Please select at least one file or folder to share');
    }
  };

  deleteItems = () => {
    if (this.getSelectedItems().length > 0) {
      this.setState({ showDeleteItemsPopup: true });
    } else {
      toast.warn('Please select at least one file or folder to delete');
    }
  };

  confirmDeleteItems = () => {
    const selectedItems = this.getSelectedItems();
    //const bucket = _.last(this.state.namePath).bucket;
    const fetchOptions = {
      method: 'DELETE',
      headers: getHeaders(true, false),
    };
    if (selectedItems.length === 0) return;
    const deletionRequests = _.map(selectedItems, (v, i) => {
      const url = v.isFolder
        ? `/api/storage/folder/${v.id}`
        : `/api/storage/folder/${v.folderId}/file/${v.id}`;
      return (next) =>
        fetch(url, fetchOptions)
          .then(() => next())
          .catch(next);
    });

    async.parallel(deletionRequests, (err, result) => {
      if (err) {
        throw err;
      } else {
        this.getFolderContent(this.state.currentFolderId, false);
      }
    });
  };

  selectItems = (items, isFolder, unselectOthers = true) => {
    if (typeof items === 'number') {
      items = [items];
    }

    this.state.currentCommanderItems.forEach((item) => {
      const isTargetItem = items.indexOf(item.id) !== -1 && item.isFolder === isFolder;
      if (isTargetItem) {
        item.isSelected = !item.isSelected;
      } else {
        if (unselectOthers) {
          item.isSelected = false;
        } else {
          item.isSelected = !!item.isSelected;
        }
      }
    });

    this.setState({ currentCommanderItems: this.state.currentCommanderItems });
  };

  deselectAll() {
    this.state.currentCommanderItems.forEach((item) => {
      item.isSelected = false;
    });
    this.setState({ currentCommanderItems: this.state.currentCommanderItems });
  }

  getSelectedItems() {
    return this.state.currentCommanderItems.filter((o) => o.isSelected === true);
  }

  folderTraverseUp() {
    this.setState(this.popNamePath(), () => {
      this.getFolderContent(_.last(this.state.namePath).id, false, _.last(this.state.namePath).id_team);
    });
  }

  pushNamePath(path) {
    return update(this.state.namePath, { $push: [path] });
  }

  popNamePath() {
    return (previousState, currentProps) => {
      return {
        ...previousState,
        namePath: _.dropRight(previousState.namePath),
      };
    };
  }

  openChooserModal() {
    this.setState({ chooserModalOpen: true });
  }

  closeModal = () => {
    this.setState({ chooserModalOpen: false });
  };

  closeRateLimitModal = () => {
    this.setState({ rateLimitModal: false });
  };

  goToStorage = () => {
    history.push('/storage');
  };

  render() {
    // Check authentication
    if (this.props.isAuthenticated && this.state.isActivated && this.state.isInitialized) {
      return (
        <div className="App d-flex flex-column">
          <NavigationBar
            showFileButtons={true}
            showSettingsButton={true}
            createFolder={this.createFolder}
            uploadFile={this.openUploadFile}
            uploadHandler={this.uploadFile}
            deleteItems={this.deleteItems}
            setSearchFunction={this.setSearchFunction}
            shareItem={this.shareItem}
            style
          />

          <FileCommander
            currentCommanderItems={this.state.currentCommanderItems}
            openFolder={this.openFolder}
            downloadFile={this.downloadFile}
            selectItems={this.selectItems}
            namePath={this.state.namePath}
            handleFolderTraverseUp={this.folderTraverseUp.bind(this)}
            uploadDroppedFile={this.uploadDroppedFile}
            createFolderByName={this.createFolderByName}
            setSortFunction={this.setSortFunction}
            move={this.move}
            updateMeta={this.updateMeta}
            currentFolderId={this.state.currentFolderId}
            getFolderContent={this.getFolderContent}
          />

          {this.getSelectedItems().length > 0 && this.state.popupShareOpened ? (
            <PopupShare
              open={this.state.popupShareOpened}
              item={this.getSelectedItems()[0]}
              onClose={() => {
                this.setState({ popupShareOpened: false });
              }}
            />
          ) : (
            ''
          )}

          <Popup
            open={this.state.showDeleteItemsPopup}
            closeOnDocumentClick
            onClose={() => this.setState({ showDeleteItemsPopup: false })}
            className="popup--full-screen"
          >
            <div className="popup--full-screen__content">
              <div className="popup--full-screen__close-button-wrapper">
                <img
                  src={closeTab}
                  onClick={() => this.setState({ showDeleteItemsPopup: false })}
                  alt="Close tab"
                />
              </div>
              <div className="message-wrapper">
                <h1>Delete item{this.getSelectedItems().length > 1 ? 's' : ''}</h1>
                <h2>
                  Please confirm you want to delete this item
                  {this.getSelectedItems().length > 1 ? 's' : ''}. This action can’t be undone.
                </h2>
                <div className="buttons-wrapper">
                  <div
                    className="default-button button-primary"
                    onClick={() => {
                      this.confirmDeleteItems();
                      this.setState({ showDeleteItemsPopup: false });
                    }}
                  >
                    Confirm
                  </div>
                </div>
              </div>
            </div>
          </Popup>

          <Popup open={this.state.chooserModalOpen} closeOnDocumentClick onClose={this.closeModal}>
            <div>
              <a href={'xcloud://' + this.state.token + '://' + JSON.stringify(this.props.user)}>
                Open mobile app
              </a>
              <a href="/" onClick={this.closeModal}>
                Use web app
              </a>
            </div>
          </Popup>

          <Popup
            open={this.state.rateLimitModal}
            closeOnDocumentClick
            onClose={this.closeRateLimitModal}
            className="popup--full-screen"
          >
            <div className="popup--full-screen__content">
              <div className="popup--full-screen__close-button-wrapper">
                <img src={closeTab} onClick={this.closeRateLimitModal} alt="Close tab" />
              </div>
              <div className="message-wrapper">
                <h1> You have run out of storage. </h1>
                <h2>
                  In order to start uploading more files please click the button below to upgrade
                  your storage plan.
                </h2>
                <div className="buttons-wrapper">
                  <div className="default-button button-primary" onClick={this.goToStorage}>
                    Upgrade my storage plan
                  </div>
                </div>
              </div>
            </div>
          </Popup>
        </div>
      );
    } else {
      // Cases of access error
      // Not authenticated
      if (!this.props.isAuthenticated) {
        return (
          <div className="App">
            <h2>
              Please <Link to="/login">login</Link> into your Internxt Drive account
            </h2>
          </div>
        );
      }
      // User not activated
      if (this.state.isActivated === false) {
        return (
          <div className="App">
            <Alert variant="danger">
              <h3>Your account needs to be activated!</h3>
              <p> Search your mail inbox for activation mail and follow its instructions </p>
            </Alert>
          </div>
        );
      }
      // If is waiting for async method return blank page
      return <div></div>;
    }
  }
}

export default XCloud;
