import * as path from 'path';
import * as fs from "fs";
import * as http from 'http';

/**
 * 解析html文件, 将index.html中的注释删掉, 并得到需要合并的js文件列表
 * @param binPath html的文件路径
 * @param htmlName html的文件名, 默认是index.html
 */
export function paserHtml(binPath: string, htmlName: string = "index.html") {
    let jsList: string[] = [];
    let htmlStr = '';
    let htmlPath = path.join(binPath, htmlName);
    htmlStr = fs.readFileSync(htmlPath).toString();
    // 删除其中的注释
    let docReg = new RegExp(/<!--.*-->/g);
    htmlStr = htmlStr.replace(docReg, '');
    // 提取需要合并的js列表
    let jsReg = new RegExp(/src="(\S*?)js">/g);
    let result = jsReg.exec(htmlStr);

    while (result) {
        if (jsList.indexOf(result[1]) === -1) {
            jsList.push(result[1] + 'js');
        }
        result = jsReg.exec(htmlStr);
    }
    // console.log(jsList);
    let scriptReg = new RegExp(/<script[^>]*?><\/script>/g);
    htmlStr = htmlStr.replace(scriptReg, '');

    return {
        js: jsList,
        html: htmlStr
    };
}

/**
 * 保存发布web的html文件
 * @param htmlSrc 需要导出的html的内容
 * @param outputPath 导出html的路径
 * @param htmlName html的文件名
 */
export function saveWebHtml(htmlSrc: string, outputPath: string, htmlName: string = 'index.html') {
    let htmlPath = path.join(outputPath, htmlName);
    fs.writeFile(htmlPath, htmlSrc, (err) => {
        if (err) {
            console.warn('写入html文件失败');
            return;
        }
        console.log(`写入${htmlName}文件成功`);
    });
}

/**
 * 保存zxsdk到指定目录
 * @param sdkUrl sdk的远程地址
 * @param outputPath 存放的目录
 */
export function saveZxSdk(sdkUrl: string, outputPath: string) {
    let zxtemp = sdkUrl.split('/');
    let zxsdkName = zxtemp[zxtemp.length - 1];
    sdkUrl = sdkUrl + '?t=' + Date.now();
    http.get(sdkUrl, (res) => {
        // console.log('res', res);
        res.setEncoding('utf8');
        let totalData = '';
        res.on('data', (data) => {
            totalData += data;
        }).on('end', () => {
            // console.log('zx sdk 加载完毕');
            let sdkPath = path.join(outputPath, zxsdkName);
            fs.writeFile(sdkPath, totalData, (err: any) => {
                if (err) {
                    console.warn('写入zxsdk失败');
                } else {
                    console.log('写入zxsdk文件成功');
                }
            });
        });
    });
}
