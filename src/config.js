const electron = require('electron');
const {app} = electron;
const fs = require('fs');
const path = require('path');
const Util = require('./util');

module.exports = {
  // 설정파일 로드
  _filePath: Util.getUserDataPath() + '/config.json',
  _defaultConfig: {
    twColorMention: '#cb4f5f',
    twColorHashtag: '#2b7bb9',
    twColorURL: '#a84dba',
    customizeColumnSize: '310',
    customFontSize: '',
    quoteServer: 'https://quote.sapphire.sh',
    altImageViewer: '',
    tivClickForNextImage: 'on',
    enableOpenLinkinPopup: 'on',
    enableOpenImageinPopup: 'on',
    useSquareProfileImage: false,
    useCounterClear: false,
    autoReloadCycle: 12,
    enableUserNotes: false,
    detectUpdate: true,
  },
  data: {},
  load () {
    const config = this._defaultConfig;
    let userConfig;
    const fc = fs.constants; // shortcut
    try {
      fs.accessSync(this._filePath, (fc.F_OK | fc.R_OK | fc.W_OK));
      userConfig = JSON.parse(fs.readFileSync(this._filePath, 'utf8'));
    } catch (e) {
      userConfig = {};
    }
    Object.assign(config, userConfig);

    this.data = config;
    return config;
  },
  // 설정파일 저장
  save () {
    const jsonStr = JSON.stringify(this.data, null, 2);
    fs.writeFileSync(this._filePath, jsonStr, 'utf8');
  },
};
