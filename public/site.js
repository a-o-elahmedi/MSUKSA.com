const ar=document.documentElement.lang==='ar';
const say=(en,arabic)=>ar?arabic:en;
const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('#main-nav');
toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open')){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.focus();}});
document.querySelector('.language-switch')?.addEventListener('click',e=>{
 const current=new URL(location.href),target=new URL(e.currentTarget.href);
 const category=current.searchParams.get('category');
 if(category)target.searchParams.set('category',category);
 e.currentTarget.href=target.href;
});
const form=document.querySelector('#enquiry-form');
if(form){
 const category=form.elements.category,table=document.querySelector('#table-fields'),result=document.querySelector('#email-result');
 const setCategory=()=>{const on=category.value==='control-room-table';table.hidden=!on;table.disabled=!on;};
 const preset=new URLSearchParams(location.search).get('category');
 if([...category.options].some(o=>o.value===preset))category.value=preset;
 setCategory();category.addEventListener('change',setCategory);
 form.addEventListener('input',()=>{result.hidden=true;});
 form.addEventListener('submit',event=>{
  event.preventDefault();
  for(const field of form.querySelectorAll('input[required],textarea[required]')){
   if(field.disabled||field.closest('fieldset[disabled]'))continue;
   field.setCustomValidity(field.value.trim()? '':say('Please complete this field.','يرجى تعبئة هذا الحقل.'));
   if(field.name==='requirements'&&field.value.trim().length<20)field.setCustomValidity(say('Please describe your requirement in at least 20 characters.','يرجى وصف المتطلبات بما لا يقل عن 20 حرفاً.'));
  }
  if(!form.reportValidity())return;
  const data=new FormData(form);
  const labels={name:say('Name','الاسم'),company:say('Company','الشركة'),telephone:say('Telephone','الهاتف'),email:say('Email','البريد الإلكتروني'),location:say('Project location','موقع المشروع'),quantity:say('Quantity','الكمية'),dates:say('Required dates','المواعيد المطلوبة'),room:say('Room measurements','قياسات الغرفة'),length:say('Table length','طول الطاولة'),stations:say('Operator stations','محطات التشغيل'),cabinets:say('Cabinet requirements','متطلبات الخزائن'),requirements:say('Requirements','المتطلبات')};
  const selected=category.selectedOptions[0].textContent;
  const lines=[say('Hello MSU,','مرحباً فريق MSU،'),' ',say('Quotation enquiry: ','طلب عرض سعر: ')+selected,''];
  for(const [key,label] of Object.entries(labels)){const value=data.get(key)?.trim();if(value)lines.push(`${label}: ${value}`);}
  if(category.value==='control-room-table')lines.push('',say('Fixed worktop height: 750 mm. Fixed depth: 650 mm.','ارتفاع سطح العمل ثابت: 750 مم. العمق ثابت: 650 مم.'));
  const body=lines.join('\n');
  document.querySelector('#email-preview').value=body;
  document.querySelector('#open-email').href=`mailto:info@msuksa.com?subject=${encodeURIComponent('MSU — '+selected)}&body=${encodeURIComponent(body)}`;
  document.querySelector('#copy-status').textContent='';
  result.hidden=false;document.querySelector('#result-title').focus();
 });
 form.addEventListener('input',e=>{if('setCustomValidity'in e.target)e.target.setCustomValidity('');});
 document.querySelector('#copy-email').addEventListener('click',async()=>{
  const preview=document.querySelector('#email-preview'),status=document.querySelector('#copy-status');
  try{await navigator.clipboard.writeText(preview.value);status.textContent=say('Copied. Paste into your email and send to info@msuksa.com.','تم النسخ. الصق النص في بريدك وأرسله إلى info@msuksa.com.');}
  catch{preview.focus();preview.select();status.textContent=say('Automatic copying is unavailable. The text is selected; copy it manually.','النسخ التلقائي غير متاح. تم تحديد النص؛ انسخه يدوياً.');}
 });
}
