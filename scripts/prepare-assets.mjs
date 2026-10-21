import sharp from 'sharp';
import fs from 'node:fs/promises';
const source='C:/Users/pc/Documents/Codex/2026-10-20/yo';
const brand='C:/Users/pc/OneDrive/Desktop/MSU/Company profile';
const local='source-images';
const exists=p=>fs.stat(p).then(()=>true,()=>false);
// Each job runs only when its source file is present, so the script works on machines without the original folders.
const jobs=[
 [brand+'/Company profile banner.jpg',s=>s.extract({left:670,top:0,width:1378,height:610}).resize(1600).webp({quality:85}),'hero.webp'],
 [source+'/work/brand/MSU-logo-navy-gold-transparent.png',s=>s.trim().resize({height:120}).png(),'logo.png'],
 [source+'/outputs/MSU_Control_Room_Table_Render_Hero.jpg',s=>s.resize(1400).webp({quality:83}),'table.webp'],
 [source+'/outputs/MSU_Control_Room_Table_Render_Detail.jpg',s=>s.resize(1100).webp({quality:83}),'table-detail.webp'],
 [local+'/guard-room-front-barrier.jpg',s=>s.resize({height:1100}).webp({quality:83}),'security.webp'],
 [local+'/guard-room-interior.jpg',s=>s.resize(1100).webp({quality:82}),'security-interior.webp'],
 [local+'/guard-room-door-elevation.jpg',s=>s.resize({height:1100}).webp({quality:82}),'security-door.webp'],
 [local+'/guard-room-front-photo.jpg',s=>s.resize({height:1100}).webp({quality:82}),'security-front.webp'],
 // Left panel only: the right-hand panels of this collage carry a third-party logo and must not be published.
 [local+'/guard-room-collage-with-logo.jpg',s=>s.extract({left:0,top:0,width:930,height:1024}).resize(900).webp({quality:82}),'security-aerial.webp'],
 [local+'/server-room-exterior.jpg',s=>s.resize(1400).webp({quality:83}),'server.webp'],
 [local+'/server-room-interior.png',s=>s.resize(1200).webp({quality:83}),'server-interior.webp'],
];
for(const [from,fn,to] of jobs){if(await exists(from))await fn(sharp(from)).toFile('public/assets/'+to);else console.warn('Skipped (source missing):',from);}
// Only public sales brochures; never copy the source folder or internal drawings.
for(const [slug,name] of [['security-room','Security_Room'],['server-room','Server_Room'],['control-room-table','Control_Room_Table']])for(const lang of ['en','ar']){const from=`${source}/outputs/MSU_${name}_Sales_Brochure${lang==='ar'?'_AR':''}.pdf`;if(await exists(from))await fs.copyFile(from,`public/brochures/${slug}-${lang}.pdf`);}
console.log('Optimised approved marketing assets and copied public brochures.');
