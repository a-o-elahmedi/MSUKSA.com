import fs from 'node:fs';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
const dir='C:/Users/pc/Documents/Codex/2026-10-20/yo/outputs';
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.pdf')&&!f.endsWith('_AR.pdf'))){const doc=await getDocument({data:new Uint8Array(fs.readFileSync(dir+'/'+f)),useSystemFonts:true}).promise;let text='';for(let i=1;i<=doc.numPages;i++){const p=await doc.getPage(i);text+=(await p.getTextContent()).items.map(x=>x.str).join(' ')+'\n';}fs.writeFileSync('.tools/'+f+'.txt',text);console.log(f+'\n'+text);}
