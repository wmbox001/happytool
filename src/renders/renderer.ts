// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
import { ipcRenderer } from "electron";
import * as fs from "fs";
import { PackWxgame } from "../utils/PackWxgame";
import * as path from 'path';

export interface IPackVer {
    chkZip?: boolean; chkHash?: boolean; chkWeb?: boolean; chkWx?: boolean;
    crtVer?: string; packBinPath?: string; outResPath?: string; outCodePath?: string;
    configjs?: string; gamejs?: string;
}

let crtPackVer: IPackVer = {};
let packWx = new PackWxgame();

const packVerName = 'pack_ver.json';

const packCfgPath = path.join(__dirname, '../pack_cfg.json'); // 这个文件是用来做本地的pack_ver.json文件的记录的
let packCfg: any = {};

var chkZip: HTMLInputElement = document.getElementById('chkZip') as HTMLInputElement;
let chkHash: HTMLInputElement = document.getElementById('chkHash') as HTMLInputElement;
let chkWeb: HTMLInputElement = document.getElementById('chkWeb') as HTMLInputElement;
let chkWx: HTMLInputElement = document.getElementById('chkWx') as HTMLInputElement;
let txtLastWebVer: HTMLSpanElement = document.getElementById('txtLastWebVer') as HTMLSpanElement;
let txtWebVer: HTMLInputElement = document.getElementById('txtWebVer') as HTMLInputElement;
let packBinPath: HTMLInputElement = document.getElementById('packBinPath') as HTMLInputElement;
let outResPath: HTMLInputElement = document.getElementById('outResPath') as HTMLInputElement;
let outCodePath: HTMLInputElement = document.getElementById('outCodePath') as HTMLInputElement;
let configjs: HTMLTextAreaElement = document.getElementById('configjs') as HTMLTextAreaElement;
let gamejs: HTMLTextAreaElement = document.getElementById('gamejs') as HTMLTextAreaElement;
let txtLog: HTMLTextAreaElement = document.getElementById('txtLog') as HTMLTextAreaElement;

let crtPathId: string = '';

onload = () => {
    console.log('packCfgPath:', packCfgPath);

    fs.readFile(packCfgPath, (err, data) => {
        if (err) {
            console.log('err', err);
            return;
        }
        packCfg = JSON.parse(data.toString());
        console.log('packCfg', packCfg);

        if (!packCfg.last) {
            console.log('packCfg 数据没有last字段');
            return;
        }
        fs.readFile(path.join(packCfg.last, packVerName), (err1, data1) => {
            if (err1) {
                console.log('没有这个配置');
                return;
            }
            crtPackVer = JSON.parse(data1.toString());
            initPage();
        });
    });
};

function initPage() {

    chkZip.checked = crtPackVer.chkZip;
    chkHash.checked = crtPackVer.chkHash;
    chkWeb.checked = crtPackVer.chkWeb;
    chkWx.checked = crtPackVer.chkWx;

    txtLastWebVer.textContent = crtPackVer.crtVer ? crtPackVer.crtVer : '0.0.0';
    txtWebVer.value = crtPackVer.crtVer ? crtPackVer.crtVer : '0.0.0';
    packBinPath.value = crtPackVer.packBinPath ? crtPackVer.packBinPath : '';
    outResPath.value = crtPackVer.outResPath ? crtPackVer.outResPath : '';
    outCodePath.value = crtPackVer.outCodePath ? crtPackVer.outCodePath : '';

    configjs.value = crtPackVer.configjs ? crtPackVer.configjs : 'var config = {};module.exports = config;';
    gamejs.value = crtPackVer.gamejs ? crtPackVer.gamejs : 'require("./code.js");';
    txtLog.value = '';
}

function setPackVer() {
    crtPackVer.chkZip = chkZip.checked;
    crtPackVer.chkHash = chkHash.checked;
    crtPackVer.chkWeb = chkWeb.checked;
    crtPackVer.chkWx = chkWx.checked;
    crtPackVer.crtVer = txtWebVer.value;
    crtPackVer.packBinPath = packBinPath.value;
    crtPackVer.outResPath = outResPath.value;
    crtPackVer.outCodePath = outCodePath.value;
    crtPackVer.configjs = configjs.value;
    crtPackVer.gamejs = gamejs.value;
    console.log('setPackVer', crtPackVer);
}

document.getElementById('btnPack').addEventListener('click', (event) => {
    setPackVer();
    if (!crtPackVer.chkWx && !crtPackVer.chkWeb) {
        alert('微信小游戏和web游戏发布, 至少选一个才能发布');
        return;
    }
    packWx.startPack(crtPackVer);

    packCfg.last = crtPackVer.packBinPath;
    fs.writeFileSync(packCfgPath, JSON.stringify(packCfg));

    let crtPackVerPath = path.join(crtPackVer.packBinPath, packVerName);
    fs.writeFile(crtPackVerPath, JSON.stringify(crtPackVer), (err) => {
        if (err) {
            console.log(`写入${crtPackVerPath}失败`);
            return;
        }
    });
});

document.getElementById('selectBinPath').addEventListener('click', (event) => {
    crtPathId = 'packBinPath';
    ipcRenderer.send('open-file-dialog');
});
document.getElementById('selectResPath').addEventListener('click', (event) => {
    crtPathId = 'outResPath';
    ipcRenderer.send('open-file-dialog');
});
document.getElementById('selectWxPath').addEventListener('click', (event) => {
    crtPathId = 'wxgamePath';
    ipcRenderer.send('open-file-dialog');
});

ipcRenderer.on('selected-directory', (event: any, dirPath: string[]) => {
    (document.getElementById(crtPathId) as HTMLInputElement).value = `${dirPath}`;

    if (crtPathId === 'packBinPath') {
        // 这里也是导入pack_ver.json的目录
        let packVerPath = path.join(dirPath[0], packVerName);
        // console.log('path', packVerPath);

        if (fs.existsSync(packVerPath)) {
            let verCfg = fs.readFileSync(packVerPath).toString();
            crtPackVer = JSON.parse(verCfg);
            initPage();
        }
    }
});
