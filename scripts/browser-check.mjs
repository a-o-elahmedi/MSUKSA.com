// Renders every built page in Chrome at desktop and mobile widths and checks layout, images, menu, language switch and the enquiry form.
// Usage: node scripts/browser-check.mjs [screenshot-dir]   (expects `npm run dev` on port 3000)
import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const base='http://127.0.0.1:3000', shots=process.argv[2];
const sitemap=await fs.readFile('dist/sitemap.xml','utf8');
const routes=[...sitemap.matchAll(/<loc>https:\/\/msuksa\.com(.*?)<\/loc>/g)].map(m=>m[1]);
const browser=await chromium.launch({channel:'chrome'});
const problems=[];
if(shots)await fs.mkdir(shots,{recursive:true});
for(const [name,viewport] of [['desktop',{width:1440,height:900}],['tablet',{width:820,height:1100}],['mobile',{width:390,height:844}]]){
 const page=await browser.newPage({viewport});
 page.on('console',m=>{if(m.type()==='error')problems.push(`${name} ${page.url()}: console ${m.text()}`);});
 page.on('requestfailed',r=>problems.push(`${name}: failed request ${r.url()}`));
 for(const route of routes){
  await page.goto(base+route,{waitUntil:'networkidle'});
  const r=await page.evaluate(()=>({
   overflow:document.documentElement.scrollWidth-innerWidth,
   broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src),
   tiny:[...document.querySelectorAll('body *')].filter(e=>e.childElementCount===0&&e.textContent.trim()&&e.offsetParent&&parseFloat(getComputedStyle(e).fontSize)<10).map(e=>e.textContent.trim().slice(0,30)),
   wide:[...document.querySelectorAll('body *')].filter(e=>{const b=e.getBoundingClientRect();return b.width&&(b.right>innerWidth+1||b.left<-1)&&!e.closest('.hero-image')}).map(e=>e.className||e.tagName).slice(0,5),
  }));
  if(r.overflow>0)problems.push(`${name} ${route}: horizontal overflow ${r.overflow}px ${r.wide.join(', ')}`);
  if(r.broken.length)problems.push(`${name} ${route}: broken images ${r.broken.join(', ')}`);
  if(r.tiny.length)problems.push(`${name} ${route}: text under 10px: ${r.tiny.slice(0,4).join(' | ')}`);
  if(shots&&/^\/(en|ar)\/(|products\/control-room-table\/|contact\/)$/.test(route))await page.screenshot({path:path.join(shots,`${name}${route.replaceAll('/','_')}.png`),fullPage:true});
 }
 if(name==='mobile'){
  await page.goto(base+'/ar/products/');
  await page.click('.menu-toggle');
  if(!await page.isVisible('#main-nav'))problems.push('mobile: menu does not open');
  await page.keyboard.press('Escape');
  if(await page.isVisible('#main-nav'))problems.push('mobile: Escape does not close menu');
 }
 await page.close();
}
const page=await browser.newPage();
await page.goto(base+'/en/products/server-room/'.replace('server-room','prefabricated-server-room'));
await page.click('.language-switch');
if(!page.url().endsWith('/ar/products/prefabricated-server-room/'))problems.push(`language switch went to ${page.url()}`);
await page.goto(base+'/en/contact/?category=control-room-table');
if(await page.inputValue('#category')!=='control-room-table')problems.push('category preset ignored');
if(!await page.isVisible('#table-fields'))problems.push('table fields hidden for control-room table');
await page.click('.language-switch');
if(!page.url().endsWith('/ar/contact/?category=control-room-table'))problems.push(`contact language switch lost category: ${page.url()}`);
await page.goto(base+'/en/contact/?category=control-room-table');
await page.click('#enquiry-form button[type=submit]');
if(await page.isVisible('#email-result'))problems.push('empty form produced a result');
const fill={name:'Test Person',company:'Test Co',telephone:'+966 50 000 0000',email:'test@example.com',location:'Riyadh',room:'6 x 4 m',length:'5 m',stations:'3',cabinets:'Two cabinets',requirements:'Control-room table for a monitoring room.'};
for(const [k,v] of Object.entries(fill))await page.fill('#'+k,v);
await page.fill('#email','not-an-email');
await page.click('#enquiry-form button[type=submit]');
if(await page.isVisible('#email-result'))problems.push('invalid email accepted');
await page.fill('#email','test@example.com');
await page.click('#enquiry-form button[type=submit]');
const href=await page.getAttribute('#open-email','href');
if(!await page.isVisible('#email-result')||!href.startsWith('mailto:info@msuksa.com?')||!decodeURIComponent(href).includes('Operator stations: 3'))problems.push('mailto draft not prepared correctly');
if(/sent successfully|thank you for your enquiry/i.test(await page.textContent('#email-result')))problems.push('result implies delivery');
await page.selectOption('#category','lighting-poles');
if(await page.isVisible('#table-fields'))problems.push('table fields visible for other category');
await browser.close();
if(problems.length){console.error(problems.join('\n'));process.exit(1);}
console.log(`Browser check passed for ${routes.length} pages at desktop, tablet and mobile widths, plus menu, language switch and enquiry form.`);
