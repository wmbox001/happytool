export function outputLog(txt: string) {
    let el = document.getElementById('txtLog') as HTMLTextAreaElement;
    el.value += (txt + '\n');
}
