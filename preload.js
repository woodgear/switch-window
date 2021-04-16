const exec = require('child_process').exec;

async function cmd(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(error)
            }
            resolve(stdout ? stdout : stderr);
        });
    });
}

function takeCaptureGroup(data, regex, group) {
    return data.match(regex)[group]
}

const WMCTRL_LIST_REGEX = /(0x[^\s]*)\s*([^\s]*)\s*([^\s]*)\s*(.*)/
function parseWmctrl(lines) {
    const list = lines.split(/\r?\n/) // split into lines
        .filter(line => line.length != 0); // ingore invalid line
    return list.map(line => takeCaptureGroup(line, WMCTRL_LIST_REGEX, 4))
}

class Wmctrl {
    constructor() {

    }
    async list() {
        const list = await cmd("wmctrl -l")
        return parseWmctrl(list)
    }
    async active(win) {
        await cmd(`wmctrl -a "${win.trim()}"`)
    }
}

const wmctrl = new Wmctrl();

async function asyncEnter(utools, action, callbackSetList) {
    const winList = await wmctrl.list()
    callbackSetList(winList.map(win => {
        return { title: win }
    }))
}

async function asyncSearch(utools, action, searchWord, callbackSetList) {
    const winList = await wmctrl.list()
    callbackSetList(
        winList.filter(win => win.toLowerCase().includes(searchWord.toLowerCase()))
            .map(win => {
                return { title: win }
            }))
}

async function asyncSelect(utools, action, itemData, callbackSetList) {
    window.utools.hideMainWindow()
    await wmctrl.active(itemData.title)
}

window.exports = {
    "sw": {
        mode: "list",
        args: {
            enter: (action, callbackSetList) => {
                asyncEnter(window.utools, action, callbackSetList)
            },
            search: (action, searchWord, callbackSetList) => {
                asyncSearch(window.utools, action, searchWord, callbackSetList)
            },
            select: (action, itemData, callbackSetList) => {
                asyncSelect(window.utools, action, itemData, callbackSetList)
            },
            placeholder: "搜索"
        }
    }
}