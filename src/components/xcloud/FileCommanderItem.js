import * as React from 'react';
import $ from 'jquery';
import PrettySize from 'prettysize';
import { Dropdown, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import './FileCommanderItem.scss';
import Icon from '../../assets/Icon';
import ActivityIndicator from '../ActivityIndicator';
import SanitizeFilename from 'sanitize-filename';
import TimeAgo from 'react-timeago';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

class FileCommanderItem extends React.Component {
  constructor(props, state) {
    super(props, state);
    this.state = {
      dragDropStyle: '',
      itemName: this.props.name,
      selectedColor: '',
      selectedIcon: 0,
      showDropdown: false,
      isLoading: this.props.isLoading,
      isDownloading: false,
      handleExternalDrop: this.props.handleExternalDrop,
    };

    // Folder colors definition
    this.colors = ['red', 'yellow', 'green', 'blue', 'purple', 'pink', 'grey'];
    // Folder icons definition (icon id is its index in array)
    this.icons = [
      'avatarcircleneutral',
      'backup',
      'barchart',
      'bell',
      'binoculars',
      'book',
      'bowl',
      'camera',
      'categories',
      'circlefilledcheckmark',
      'clappboard',
      'clipboard',
      'cloud',
      'controllerneoGeo',
      'dollarsign',
      'facehappy',
      'file',
      'heartfilled',
      'inbox',
      'lighton',
      'locklocked',
      'musicnote',
      'navigationcircle',
      'notifications',
      'path',
      'running',
      'starfilled',
      'video',
      'window',
      'yinyang',
    ];
  }

  handleDragOver = (event) => {
    // Allow only drop files into folders
    if (this.props.isFolder) {
      event.preventDefault();
      event.stopPropagation();
      this.setState({ dragDropStyle: 'dragOver' });
    }
  };

  handleDragLeave = (e) => {
    this.setState({ dragDropStyle: '' });
  };

  handleDragEnd = (e) => {
    $('#FileCommander-backTo').removeClass('drag-over');
  };

  handleDrop = (event) => {
    this.setState({ dragDropStyle: '' });
    // Move file or folder when its dropped
    event.preventDefault();
    event.stopPropagation();
    // Handle external drop
    if (event.dataTransfer.types && event.dataTransfer.types[0] !== 'text/plain') {
      return this.state.handleExternalDrop(event, this.props.id);
    }

    // Handle internal drop event
    if (event.currentTarget.dataset.isfolder === 'true') {
      const moveOpId = new Date().getTime();
      var data = JSON.parse(event.dataTransfer.getData('text/plain'));
      this.props.move(data, this.props.id, moveOpId);
    }

  };

  handleNameChange = (event) => {
    this.setState({ itemName: event.target.value });
  };

  handleColorSelection = (value, event) => {
    this.setState({ selectedColor: value });
  };

  handleIconSelection = (value, event) => {
    this.setState({ selectedIcon: value });
  };

  handleClickIcon = (value, event) => {
    if (this.props.icon && this.props.icon.name && this.props.icon.name === value) {
      this.setState({ selectedIcon: 0 }, () => {
        this.handleApplyChanges();
      });
    }
  };

  handleApplyChanges = () => {
    let metadata = {};

    // Check if is a valid FILENAME for any OS
    if (this.props.name !== this.state.itemName) {
      const sanitizedFilename = SanitizeFilename(this.state.itemName);

      if (sanitizedFilename !== this.state.itemName) {
        return toast.warn('Invalid file name');
      }
    }

    if (this.state.itemName && this.props.name !== this.state.itemName)
      metadata.itemName = this.state.itemName;
    if (this.props.isFolder) {
      // Changes on folder item
      if (this.state.selectedColor && this.props.color !== this.state.selectedColor)
        metadata.color = this.state.selectedColor;
      if (
        this.state.selectedIcon &&
        (!this.props.icon || this.props.icon.id !== this.state.selectedIcon)
      )
        metadata.icon = this.state.selectedIcon;

      if (this.state.selectedIcon === 0) {
        metadata.icon = 'none';
      }

      if (metadata.itemName || metadata.color || metadata.icon) {
        this.props.updateMeta(metadata, this.props.id, this.props.isFolder);
      }
    } else {
      // Changes on file item
      if (metadata.itemName) {
        this.props.updateMeta(metadata, this.props.rawItem.fileId, this.props.isFolder);
      }
    }
  };

  handleDropdownSelect = (isOpen, event, metadata) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      // When click off window, close it and apply changes
      this.setState({ showDropdown: isOpen });
      if (isOpen === false) this.handleApplyChanges();
    }
  };

  handleShowDropdown = () => {
    // Save changes when dropdown is closed
    if (this.state.showDropdown === true) this.handleApplyChanges();
    else {
      // Set item name when open context menu
      this.setState({ itemName: this.props.name });
    }
    this.setState({ showDropdown: !this.state.showDropdown });
  };

  resetMetadataChanges = (event, reset) => {
    event.stopPropagation();
    switch (reset) {
      case 'icon':
        $('#iconToggle label').removeClass('active');
        this.setState({ selectedIcon: 0 });
        break;
      case 'color':
        $('#colorToggle label').removeClass('active');
        this.setState({ selectedColor: '' });
        break;
      default:
        $('#iconToggle label').removeClass('active');
        $('#colorToggle label').removeClass('active');
        this.setState({ selectedColor: '', selectedIcon: 0 });
        break;
    }
  };

  getFolderIcon = () => {
    let localColor = this.state.selectedColor ? this.state.selectedColor : this.props.color;

    if (this.props.isLoading) {
      return (
        <div className="iconContainer">
          <Icon name="folder" color={localColor} height="75" alt="" />
          <ActivityIndicator color="#4385F4" />
        </div>
      );
    }

    if (this.props.icon || this.state.selectedIcon) {
      let localIcon = this.state.selectedIcon
        ? this.icons[this.state.selectedIcon - 1]
        : this.props.icon.name;

      return (
        <div className="iconContainer">
          <Icon name="folder" color={localColor} height="75" alt="" />
          <Icon className="folderIcon" name={localIcon} color={localColor} />
        </div>
      );
    } else {
      return <Icon name="folder" color={localColor} height="75" alt="" />;
    }
  };

  getFileIcon = () => {
    return (
      <div className="iconContainer fileIconContainer">
        <div className="type">
          <span className="extension">
            {!this.state.isLoading && !this.state.isDownloading ? this.props.type : ''}
          </span>
        </div>
        {this.state.isLoading || this.state.isDownloading ? <ActivityIndicator /> : ''}
      </div>
    );
  };

  itemClickHandler = (e) => {
    this.setState({ isDownloading: true }, () => {
      this.props
        .clickHandler(e)
        .then(() => {
          this.setState({ isDownloading: false });
        })
        .catch(() => {
          this.setState({ isDownloading: false });
        });
    });
  };

  componentDidUpdate(newProps) {
    if (newProps.isLoading !== this.state.isLoading) {
      this.setState({ isLoading: newProps.isLoading });
    }
  }

  render() {
    return (
      <div
        className={
          `FileCommanderItem` +
          (this.props.isSelected ? ' selected ' : ' ') +
          this.state.dragDropStyle
        }
        data-type={this.props.type}
        data-id={this.props.id}
        data-id-team={this.props.id_team}
        data-cloud-file-id={this.props.rawItem.id}
        data-cloud-folder-id={this.props.rawItem.folder_id}
        data-bridge-file-id={this.props.rawItem.fileId}
        data-bridge-bucket-id={this.props.rawItem.bucket}
        data-name={this.props.rawItem.name}
        data-isfolder={!!this.props.rawItem.isFolder}
        onClick={() => this.props.selectHandler(this.props.id, this.props.isFolder, false)}
        onDoubleClick={(e) => {
          if (e.target.className.includes('FileCommanderItem')) {
            this.itemClickHandler(e);
          }
        }}
        draggable={true}
        onDragStart={(e) => this.props.handleDragStart(e)}
        onDragOver={this.handleDragOver}
        onDragLeave={this.handleDragLeave}
        onDrop={this.handleDrop}
        onDragEnd={this.handleDragEnd}
      >
        <div className="properties">
          {/* Item context menu changes depending on folder or file*/}
          {this.props.isFolder ? (
            <Dropdown
              drop={'right'}
              show={this.state.showDropdown}
              onToggle={this.handleDropdownSelect}
            >
              <Dropdown.Toggle as={CustomToggle} handleShowDropdown={this.handleShowDropdown}>
                ...
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item as="span">
                  <input
                    className="itemNameInput"
                    type="text"
                    value={this.state.itemName}
                    onChange={this.handleNameChange}
                  />
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item as="span">Style color</Dropdown.Item>
                <ToggleButtonGroup
                  id="colorToggle"
                  className="toggleGroup"
                  name="colorSelection"
                  type="radio"
                  defaultValue={this.props.color}
                  onChange={this.handleColorSelection}
                >
                  {this.colors.map((value, i) => {
                    return (
                      <ToggleButton
                        className={`${value}Color`}
                        type="radio"
                        key={i}
                        value={value}
                      />
                    );
                  })}
                </ToggleButtonGroup>
                <Dropdown.Divider className="ponleunnombre" />
                <Dropdown.Item as="span">Cover icon</Dropdown.Item>
                <ToggleButtonGroup
                  id="iconToggle"
                  className="toggleGroup"
                  name="iconSelection"
                  type="radio"
                  defaultValue={this.props.icon ? this.props.icon.id : ''}
                  onChange={this.handleIconSelection}
                >
                  {this.icons.map((value, i) => {
                    return (
                      <ToggleButton
                        className={`${value}Icon`}
                        type="radio"
                        value={i + 1}
                        key={i}
                        onClick={() => this.handleClickIcon(value)}
                      />
                    );
                  })}
                </ToggleButtonGroup>
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <Dropdown
              drop={'right'}
              show={this.state.showDropdown}
              onToggle={this.handleDropdownSelect}
            >
              <Dropdown.Toggle as={CustomToggle} handleShowDropdown={this.handleShowDropdown}>
                ...
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item as="span">
                  <input
                    className="itemNameInput"
                    type="text"
                    value={this.state.itemName}
                    onChange={this.handleNameChange}
                  />
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item as="span">
                  <div>
                    <span className="propText">Type: </span>
                    <span className="propValue">
                      {this.props.type ? this.props.type.toUpperCase() : ''}
                    </span>
                  </div>
                </Dropdown.Item>
                <Dropdown.Item as="span">
                  <div>
                    <span className="propText">Size: </span>
                    <span className="propValue">{PrettySize(this.props.size)}</span>
                  </div>
                </Dropdown.Item>
                {/* <Dropdown.Item eventKey="4" as="span"><span className="propText">Added: </span></Dropdown.Item> */}
              </Dropdown.Menu>
            </Dropdown>
          )}
        </div>
        <div className="itemIcon">
          {this.props.isFolder ? this.getFolderIcon() : this.getFileIcon()}
        </div>
        <div className="name" title={this.props.name} onClick={this.itemClickHandler}>
          {this.props.name}
        </div>
        <div className="created">
          {this.props.created && !this.props.isFolder ? <TimeAgo date={this.props.created} /> : ''}
        </div>
      </div>
    );
  }
}

const CustomToggle = React.forwardRef(({ children, onClick, handleShowDropdown }, ref) => {
  return (
    <div
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        // Call dropdown to toggle show
        handleShowDropdown();
        onClick(e);
      }}
    >
      {children}
    </div>
  );
});

export default FileCommanderItem;
