const {ipcRenderer} = require('electron');
const noUiSlider = require('nouislider');

const schema = require('./config-schema');
const path = require('path');
const fs = require('fs');
const Util = require('./util');

function saveConfig (config) {
  ipcRenderer.send('save-config', config);
}

function loadConfig () {
  return ipcRenderer.sendSync('load-config');
}

let config;

function onload () {
  initializeComponents();

  config = loadConfig();
  const wrapper = document.getElementById('wrapper');
  // 트윗덱 테마를 바탕으로 설정창 테마 변경.
  const theme = ipcRenderer.sendSync('request-theme');
  if (theme === 'dark') {
    wrapper.classList.add('dark');
  }

  const settingsTop = wrapper.getElementsByClassName('top')[0];
  const settingsMain = wrapper.getElementsByTagName('main')[0];
  const topHeight = window.getComputedStyle(settingsTop).height;
  settingsMain.style.marginTop = topHeight;
  settingsMain.style.height = `calc(100% - ${topHeight})`;

  // 로딩한 config를 바탕으로 input/textarea의 값을 세팅한다.
  for (const key of Object.keys(config)) {
    const value = config[key];
    const elem = document.getElementById(key);
    if (!elem) continue;
    if (elem.type === 'checkbox') {
      elem.checked = Boolean(value);
    } else if (elem.type === 'file') {

    } else {
      elem.value = value;
    }
  }
  const settingForm = document.getElementById('settingform');

  const save = event => {
    const settingElements = settingForm.querySelectorAll('input, textarea, select');
    for (const elem of settingElements) {
      let value = elem.value;
      if (elem.id === '') continue;
      if (typeof value === 'string') {
        value = value.trim();
      }
      if (elem.type === 'file') {
        if (!(elem.files && elem.files.length > 0)) continue;
        if (elem.id !== 'notiAlarmSoundSource') {
          console.info(elem.files[0].path);
          config[elem.id] = elem.files[0];
          continue;
        }
        // check to valid sound file
        try {
          const blobUrl = URL.createObjectURL(document.querySelector('input[type="file"]').files[0]);
          const audio = new Audio(blobUrl);
          audio.addEventListener('canplaythrough', () => {
            URL.revokeObjectURL(blobUrl);
            audio.remove();
            const ext = elem.files[0].name.substr(elem.files[0].name.lastIndexOf('.'));
            fs.createReadStream(elem.files[0].path).pipe(fs.createWriteStream(path.join(Util.getUserDataPath(), 'alarmfile')))
              .on('error', function (e) {
                alert('Cannot copy audio file');
              });
            alert('Successfully registered alarm file');
            config['notiAlarmSoundExt'] = ext;
            elem.value = '';
          });
          audio.addEventListener('error', e => {
            alert('Invalid or not supported audio file');
            URL.revokeObjectURL(blobUrl);
            audio.remove();
            elem.value = '';
          });
        } catch (e) {
          /* eslint-disable quotes */
          alert("Can't load file");
          URL.revokeObjectURL(blobUrl);
          elem.value = '';
        }
      } else if (elem.type === 'checkbox') {
        config[elem.id] = elem.checked ? value : null;
      } else {
        config[elem.id] = value;
      }
    }
    saveConfig(config);
    ipcRenderer.send('apply-config');
  };

  window.addEventListener('beforeunload', save);
  settingForm.addEventListener('change', save);
}

document.addEventListener('DOMContentLoaded', onload);
window.addEventListener('beforeunload', () => saveConfig(config));

function initializeComponents () {
  const form = document.querySelector('#settingform > section');
  for (const obj of schema) {
    switch (obj._type) {
      case 'section':
        var e = document.createElement('header');
        e.innerHTML = `<span>${obj.label}</span>`;
        form.appendChild(e);
        break;
      case 'subsection':
        var e = document.createElement('div');
        e.className = 'settings-item sub-header';
        e.innerHTML = obj.label;
        form.appendChild(e);
        break;
      case 'entry':
        initializeEntries(obj, form);
        break;
      default:
        console.warn(`Unrecognized item type: '${obj._type}'`);
        break;
    }
  }
}

function initializeEntries (entry, form) {
  const e = document.createElement('div');
  e.className = 'settings-item';

  switch (entry.valueType) {
    case 'bool':
      e.innerHTML = `<label><input type="checkbox" id="${entry.name}"><label for="${entry.name}"><div></div></label>${entry.label}</label>`;
      break;
    case 'text':
      e.innerHTML = `<input type="text" id="${entry.name}">`;
      break;
    case 'longtext':
      e.innerHTML = `<textarea id="${entry.name}" rows="5"></textarea>`;
      break;
    case 'enum':
      const opts = entry.options.map(x => `<option value="${x.value}">${x.label}</option>`).join('');
      e.innerHTML = `<select name="${entry.name}" id="${entry.name}">${opts}</select>`;
      break;
    case 'alarmfile':
      e.innerHTML = `<label><input id="${entry.name}" type="file"><label for="${entry.name}"><div></div></label><div>${entry.label}</div></label>`;
      // const fileInput = e.querySelector('input[type="file"]');
      break;
    case 'number': {
      e.innerHTML = `<div id="${entry.name}Slider"></div><div><input type="text" id="${entry.name}"></div>`;
      const slider = e.querySelector(`#${entry.name}Slider`);
      const text = e.querySelector(`#${entry.name}`);
      createSlider(entry, slider, text);
    } break;
    default:
      console.warn(`Unrecognized entry value type: '${entry.valueType}'`);
      break;
  }
  form.appendChild(e);

  if (entry.description) {
    const e = document.createElement('div');
    e.className = 'settings-item description' + (entry.valueType === 'bool' ? ' for-checkbox' : '');
    e.innerHTML = entry.description;
    form.appendChild(e);
  }
}

function createSlider (entry, slider, text) {
  noUiSlider.create(slider, {
    start: [ require('./config').load()[entry.name] || 0 ],
    step: entry.step,
    range: {
      min: [ entry.min ],
      max: [ entry.max ],
    },
    format: {
      to (value) {
        return Math.floor(value);
      },
      from (value) {
        return value;
      },
    },
  });
  let tTime;
  slider.noUiSlider.on('update', (values, handle) => {
    text.value = values[handle];
    if (!tTime || tTime + 100 < new Date().getTime()) {
      const event = new Event('change');
      const settingForm = document.getElementById('settingform');
      settingForm.dispatchEvent(event);
      tTime = new Date().getTime();
    }
  });
  text.addEventListener('change', e => {
    slider.noUiSlider.set(e.target.value);
  });
}
