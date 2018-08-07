import * as fs from "fs";
import { IPackVer } from "../renders/renderer";
import * as path from 'path';
import * as uglify from 'uglify-js';
import * as http from 'http';
import * as crypto from 'crypto';
import * as rimraf from 'rimraf';
import { outputLog } from "./LogUtil";
import { isIgnoreFile, isIgnoreDir, IIgnoreOption, createDir } from "./FileUtil";
import { paserHtml, saveWebHtml, saveZxSdk } from './PaserHtmlUtil';


export class PackWxgame {

    private cfg: IPackVer;
    private mergeJsList: any[] = [];
    private htmlTxt = '';
    private jsTxt = '';
    private outputCodeName = 'code.js';
    private verJson: any = {};
    private zxsdkName = '';
    private insertCodeTemplate = `<script type="text/javascript" src="code.js?t=${Date.now()}"></script>\n`;

    public startPack(cfg: IPackVer) {
        this.cfg = cfg;

        this.initPackSetting(this.doPack);
    }

    private initPackSetting(cb?: () => void) {
        let out = this.cfg.outCodePath;
        let verPath = path.join(this.cfg.outResPath, this.cfg.crtVer);
        console.log(`开始清理 ${out} 和 ${verPath} 目录`);

        rimraf(out, (err) => {
            if (err) {
                console.warn(`清理目录${out}出错`);
                return;
            }
            rimraf(verPath, (err2) => {
                if (err) {
                    console.warn(`清理目录${verPath}出错`);
                    return;
                }
                if (cb != null) {
                    cb.apply(this);
                }
            });
        });
    }

    private doPack() {
        console.log(`开始解析html文件`);

        let htmlObj = paserHtml(this.cfg.packBinPath);
        this.mergeJsList = htmlObj.js;
        this.htmlTxt = htmlObj.html;

        if (this.cfg.chkWeb) {
            if (!fs.existsSync(this.cfg.outCodePath)) {
                fs.mkdirSync(this.cfg.outCodePath);
            }
            let webPath = path.join(this.cfg.outCodePath, 'web');
            fs.mkdir(webPath, (err) => {
                if (err) {
                    console.warn('web目录创建失败');
                    return;
                }
                let tempIdx = this.htmlTxt.indexOf('</body>');
                this.htmlTxt = this.htmlTxt.substr(0, tempIdx) + this.insertCodeTemplate + this.htmlTxt.substr(tempIdx);
                // 将index.html写入web目录
                saveWebHtml(this.htmlTxt, webPath);
            });
        }
        if (this.cfg.chkWx) {
            let wxPath = path.join(this.cfg.outCodePath, 'wxgame');
            fs.mkdir(wxPath, (err) => {
                if (err) {
                    console.warn('wxgame 目录创建失败');
                    return;
                }
                // 将zxsdk写入小游戏的目录
                this.downloadZxSdk(wxPath);
                this.saveConfigJS(wxPath);
                this.saveWxgameJS(wxPath);
            });
        }

        // 遍历需要打包的目录
        // 将所有js文件都写入同一个js文件中, 并压缩
        this.scanAndMergeJs(this.cfg.packBinPath);

        // 新建资源版本目录, 并且将资源目录文件单独拷贝到新版本目录中
        // 将所有加载资源进行hash改名
        this.createResVerFolder();

        // 将所有的table中的json文件合并
        // this.mergeTableFiles();

        // 运行自定义脚本(比如:首次发布小游戏,需要修改小游戏config.js文件和game.js文件之类)
        /*this.runCustomBat(); */
    }

    private downloadZxSdk(outputPath: string) {
        let zxsdkReg = new RegExp(/src="http(\S*?).js/g);
        let zxsdkResult = zxsdkReg.exec(this.htmlTxt);
        // console.log('zx', zxsdkResult);
        let zxurl = zxsdkResult[0].substr(5);
        let zxtemp = zxurl.split('/');
        this.zxsdkName = zxtemp[zxtemp.length - 1];
        saveZxSdk(zxurl, outputPath);
    }

    private saveConfigJS(outputPath: string) {
        let cfg = this.cfg.configjs.replace('{VER}', this.cfg.crtVer);
        fs.writeFileSync(path.join(outputPath, 'config.js'), cfg);
        outputLog("写入wxgame的config.js成功");
    }

    private saveWxgameJS(outputPath: string) {
        let gamejs = this.cfg.gamejs.replace('{ZXSDK}', './' + this.zxsdkName);
        fs.writeFileSync(path.join(outputPath, 'game.js'), gamejs);
        outputLog("写入wxgame的game.js成功");
    }

    private scanAndMergeJs(binPath: string) {
        outputLog("准备压缩js...");
        for (let el of this.mergeJsList) {
            let jsUri: string = el + '';
            if (jsUri.indexOf('libs/') === 0) {
                if (jsUri.indexOf('libs/min/') < 0) {
                    jsUri = jsUri.replace('libs/', 'libs/min/');
                    jsUri = jsUri.replace('.js', '.min.js');
                }
            }
            // console.log('jsUri:', jsUri);
            let jsPath = path.join(binPath, jsUri);
            let existJs = fs.existsSync(jsPath);
            if (!existJs) {
                console.warn('没有这个js文件', jsUri);
                return;
            }
            let jsfile = fs.readFileSync(jsPath).toString();
            // console.log('jsfile', jsfile);
            if (jsUri.indexOf('.min.js') > 0) {
                this.jsTxt += (jsfile + ';');
            } else {
                let rst = uglify.minify(jsfile, {
                    mangle: true,
                    fromString: true
                });
                this.jsTxt += (rst.code + ';');
            }
        }
        console.log('压缩js文件成功, 准备开始写入...');
        outputLog("压缩js文件成功, 准备开始写入...");
        if (this.cfg.chkWx) {
            let wxPath = path.join(this.cfg.outCodePath, 'wxgame');
            fs.writeFile(path.join(wxPath, this.outputCodeName), this.jsTxt, (err: any) => {
                if (err) {
                    console.warn('写入压缩文件失败');
                    outputLog("写入压缩文件失败!");
                } else {
                    console.log('写入wxgame code.js文件成功');
                    outputLog("写入wxgame code.js文件成功");
                }
            });
        }
        if (this.cfg.chkWeb) {
            let webPath = path.join(this.cfg.outCodePath, 'web');
            fs.writeFile(path.join(webPath, this.outputCodeName), this.jsTxt, (err: any) => {
                if (err) {
                    console.warn('写入压缩文件失败');
                    outputLog("写入压缩文件失败!");
                } else {
                    console.log('写入web code.js文件成功');
                    outputLog("写入web code.js文件成功");
                }
            });
        }
    }

    private createResVerFolder() {
        let verPath = path.join(this.cfg.outResPath, this.cfg.crtVer);
        let resPath = path.join(verPath, 'res');
        let srcPath = path.join(this.cfg.packBinPath, 'res');

        fs.mkdirSync(verPath);
        fs.mkdirSync(resPath);
        this.readyCpFile(srcPath, resPath, verPath);
    }

    private readyCpFile(srcPath: string, resPath: string, verPath: string) {
        outputLog("生成资源的目录: " + resPath);
        this.cpFileAndHash(srcPath, resPath, { dir: ['/\W+\.svn/g'], file: ['/\W+\.js\.map/g'] });
        console.log('hash并且拷贝资源文件完毕');
        outputLog("hash并且拷贝资源文件完毕");

        fs.writeFileSync(path.join(verPath, `res_${this.cfg.crtVer}.json`), JSON.stringify(this.verJson));
        outputLog("写入wever版本文件成功");
    }

    private cpFileAndHash(fromDir: string, toDir: string, ignores?: IIgnoreOption) {
        let s = fs.lstatSync(fromDir);
        if (s.isDirectory()) {
            let ig = isIgnoreDir(fromDir, ignores); // '/\W+\.svn/g' | '/\W+\.js\.map/g'
            if (ig) {
                return;
            }
            let files = fs.readdirSync(fromDir);
            for (const ifile of files) {
                let fileUrl = path.join(fromDir, ifile);
                this.cpFileAndHash(fileUrl, path.join(toDir, ifile), ignores);
            }
        } else {
            let ig = isIgnoreFile(fromDir, ignores); // '/\W+\.svn/g' | '/\W+\.js\.map/g'
            if (ig) {
                return;
            }
            let fileBuffer = fs.readFileSync(fromDir);
            let md5 = crypto.createHash('md5');
            md5.update(fileBuffer);
            let md5Str = md5.digest('hex');
            let fnext = path.extname(fromDir);
            let fnHead = path.basename(fromDir, fnext);
            let fn = fnHead + '_' + md5Str.substr(0, 8) + fnext;
            let realFn = path.join(path.dirname(toDir), fn);
            // console.log(fn, toDir, realFn);
            let verpath = path.join(this.cfg.outResPath, this.cfg.crtVer);
            let verKey = path.relative(verpath, toDir).split(path.sep).join('/');
            let verValue = path.relative(verpath, realFn).split(path.sep).join('/');
            console.log(verKey);
            this.verJson[verKey] = verValue;

            createDir(path.dirname(toDir), () => {
                outputLog(fn);
                fs.writeFileSync(realFn, fileBuffer, { flag: 'w+' });
            });
        }
    }

    private mergeTableFiles() {
        let toTablePath = path.join(this.cfg.outResPath, this.cfg.crtVer, 'res', 'table');
        let srcTablePath = path.join(this.cfg.packBinPath, 'res', 'table');

    }

}
