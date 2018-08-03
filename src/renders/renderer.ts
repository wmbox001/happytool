// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
import { ipcRenderer } from "electron";
import * as fs from "fs";

let crtPackVer: {
    chkZip?: boolean, chkHash?: boolean, chkWeb?: boolean, crtVer?: string,
    packBinPath?: string, outResPath?: string, wxgamePath?: string
};
const verPath = __dirname + '/pack_ver.json';

var chkZip: HTMLInputElement = document.getElementById('chkZip') as HTMLInputElement;
let chkHash: HTMLInputElement = document.getElementById('chkHash') as HTMLInputElement;
let chkWeb: HTMLInputElement = document.getElementById('chkWeb') as HTMLInputElement;
let txtLastWebVer: HTMLInputElement = document.getElementById('txtLastWebVer') as HTMLInputElement;
let txtWebVer: HTMLInputElement = document.getElementById('txtWebVer') as HTMLInputElement;
let packBinPath: HTMLInputElement = document.getElementById('packBinPath') as HTMLInputElement;
let outResPath: HTMLInputElement = document.getElementById('outResPath') as HTMLInputElement;
let wxgamePath: HTMLInputElement = document.getElementById('wxgamePath') as HTMLInputElement;
let txtLog: HTMLTextAreaElement = document.getElementById('txtLog') as HTMLTextAreaElement;

let crtPathId: string = '';

onload = () => {
    fs.readFile(verPath, (err, data) => {
        if (err) {
            console.log('err', err);

        } else {
            // crtPackVer = data.toJSON();
            console.log(data);

        }
        crtPackVer = {};
        initPage();
    });
};

function initPage() {

    chkZip.checked = crtPackVer.chkZip;
    chkHash.checked = crtPackVer.chkHash;
    chkWeb.checked = crtPackVer.chkWeb;

    txtLastWebVer.value = crtPackVer.crtVer ? crtPackVer.crtVer : '0.0.0';
    txtWebVer.value = crtPackVer.crtVer ? crtPackVer.crtVer : '0.0.0';
    packBinPath.value = crtPackVer.packBinPath ? crtPackVer.packBinPath : '';
    outResPath.value = crtPackVer.outResPath ? crtPackVer.outResPath : '';
    wxgamePath.value = crtPackVer.wxgamePath ? crtPackVer.wxgamePath : '';

    txtLog.value = '';
}
