// Static checks over the production build: links, assets, SEO metadata, language pairs and content rules.
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist'), origin='https://msuksa.com';
const errors=[], titles=new Map(), descriptions=new Map();
const fail=(page,msg)=>errors.push(`${page}: ${msg}`);
const exists=p=>fs.stat(p).then(()=>true,()=>false);
async function walk(dir){const out=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else if(e.name==='index.html')out.push(p);}return out;}
const pages=(await walk(root)).filter(p=>/[\\/](en|ar)[\\/]/.test(p));
if(pages.length<20)fail('dist',`only ${pages.length} language pages built`);
const attr=(html,re)=>[...html.matchAll(re)].map(m=>m[1]);
for(const file of pages){
 const html=await fs.readFile(file,'utf8'), rel='/'+path.relative(root,path.dirname(file)).replaceAll('\\','/')+'/';
 const lang=rel.split('/')[1], other=lang==='en'?'ar':'en';
 if(!html.includes(`<html lang="${lang}" dir="${lang==='ar'?'rtl':'ltr'}">`))fail(rel,'wrong lang/dir');
 const title=html.match(/<title>(.*?)<\/title>/)?.[1], desc=html.match(/<meta name="description" content="(.*?)"/)?.[1];
 if(!title)fail(rel,'missing title');else if(titles.has(title))fail(rel,`duplicate title with ${titles.get(title)}`);else titles.set(title,rel);
 if(!desc||desc.length<50)fail(rel,'missing or short description');else if(descriptions.has(desc))fail(rel,'duplicate description');else descriptions.set(desc,rel);
 if(!html.includes(`<link rel="canonical" href="${origin}${rel}">`))fail(rel,'canonical mismatch');
 for(const l of ['en','ar','x-default'])if(!html.includes(`hreflang="${l}"`))fail(rel,`missing hreflang ${l}`);
 const h1=(html.match(/<h1[\s>]/g)||[]).length;if(h1!==1)fail(rel,`${h1} h1 elements`);
 for(const img of html.match(/<img[^>]*>/g)||[])if(!/\salt="/.test(img))fail(rel,`image without alt: ${img}`);
 for(const json of attr(html,/<script type="application\/ld\+json">(.*?)<\/script>/g)){try{const d=JSON.parse(json);if(/"(aggregateRating|review|offers|price\w*|availability)":/i.test(json))fail(rel,'structured data contains rating/review/price');if(!d['@graph'])fail(rel,'no @graph');}catch{fail(rel,'invalid JSON-LD');}}
 const sw=html.match(/class="language-switch" href="([^"]+)"/)?.[1];
 if(sw!==rel.replace(`/${lang}/`,`/${other}/`))fail(rel,`language switch points to ${sw}`);
 if(/turnkey|everything included|data-centre certified|testimonial/i.test(html))fail(rel,'prohibited claim wording');
 const digits=html.replace(/<[^>]+>/g,' ').replace(/[^\d]/g,'');
 if(!digits.includes('966501231878'))fail(rel,'corrected telephone number missing');
 for(const href of [...attr(html,/(?:href|src)="(\/[^"#?]*)/g)]){
  let target=path.join(root,decodeURIComponent(href));
  if(href.endsWith('/'))target=path.join(target,'index.html');
  if(!await exists(target))fail(rel,`broken link ${href}`);
 }
 for(const tel of attr(html,/href="tel:([^"]+)"/g))if(tel!=='+966501231878')fail(rel,`unexpected tel ${tel}`);
 for(const mail of attr(html,/href="mailto:([^"?]+)/g))if(mail!=='info@msuksa.com')fail(rel,`unexpected mailto ${mail}`);
 if(rel.includes('/control-room-table/')){if(!html.includes('750')||!html.includes('650'))fail(rel,'fixed dimensions missing');if(/(?<!not )adjustable|10 m model|15 m model/i.test(html))fail(rel,'adjustable/standard model wording');}
}
const sitemap=await fs.readFile(path.join(root,'sitemap.xml'),'utf8');
const locs=attr(sitemap,/<loc>(.*?)<\/loc>/g);
if(locs.length!==pages.length)fail('sitemap',`${locs.length} URLs for ${pages.length} pages`);
for(const loc of locs)if(!await exists(path.join(root,loc.replace(origin,''),'index.html')))fail('sitemap',`missing ${loc}`);
const robots=await fs.readFile(path.join(root,'robots.txt'),'utf8');
if(!/User-agent: OAI-SearchBot\s+Allow: \//.test(robots)||!robots.includes('Sitemap:'))fail('robots.txt','OAI-SearchBot allowance or sitemap missing');
for(const pdf of (await fs.readdir(path.join(root,'brochures'))))if(!/-(en|ar)\.pdf$/.test(pdf)||/drawing|cad|cutting|fabrication|internal/i.test(pdf))fail('brochures',`unexpected file ${pdf}`);
if(errors.length){console.error(errors.join('\n'));console.error(`\n${errors.length} problem(s) found.`);process.exit(1);}
console.log(`Checked ${pages.length} pages, ${locs.length} sitemap URLs, robots.txt and brochures: no problems found.`);
