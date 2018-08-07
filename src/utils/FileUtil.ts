import * as fs from "fs";
import * as path from 'path';
import * as rimraf from 'rimraf';

/**
 * 清理目录, 默认不清理当前的目录
 * @param dirPath 要清理的目录
 * @param clearSelf 是否把当前目录一起删掉
 */
export function clearDir(dirPath: string, clearSelf: boolean = false) {
    if (!fs.existsSync(dirPath)) {
        console.warn('要清理的目录不存在');
        return;
    }
    let s = fs.lstatSync(dirPath);
    if (s.isDirectory()) {
        if (clearSelf) {
            rimraf(dirPath, (err) => {
                if (err) {
                    console.warn('清理目录错误');
                } else {
                    console.log(`清理 ${dirPath} 成功`);
                }
            });
        } else {
            let files = fs.readdirSync(dirPath);
            for (const ifile of files) {
                let fileUrl = path.join(dirPath, ifile);
                clearDir(fileUrl, true);
            }
        }
    } else {
        rimraf(dirPath, (err) => {
            if (err) {
                console.warn('清理目录错误');
            } else {
                console.log(`清理 ${dirPath} 成功`);
            }
        });
    }
}

export function isIgnoreDir(from: string, ignores?: IIgnoreOption) {
    if (!ignores) {
        return false;
    }
    for (const el of ignores.dir) {
        if (from.match(el)) {
            return true;
        }
    }
    return false;
}

export function isIgnoreFile(from: string, ignores?: IIgnoreOption) {
    if (!ignores) {
        return false;
    }
    for (const el of ignores.file) {
        if (from.match(el)) {
            return true;
        }
    }
    return false;
}

export interface IIgnoreOption {
    dir?: string[];
    file?: string[];
}

/**
 * 递归创建目录
 * @param dirPath 需要创建目录的路径
 */
export function createDir(dirPath: string, callback?: () => void) {
    fs.exists(dirPath, (exi) => {
        if (exi) {
            callback.apply(null);
        } else {
            createDir(path.dirname(dirPath), () => {
                fs.mkdir(dirPath, callback);
            });
        }
    });
}
