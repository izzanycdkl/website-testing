const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open menu');}
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close menu':'Open menu');});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
document.addEventListener('click',e=>{if(!e.target.closest('.header'))closeMenu();});
if('IntersectionObserver' in window){document.body.classList.add('js-ready');const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}});},{threshold:.08});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));}
document.querySelectorAll('[data-service]').forEach(a=>a.addEventListener('click',()=>{document.querySelector('#service').value=a.dataset.service;}));
document.querySelector('#year').textContent=new Date().getFullYear();
const privacy=document.querySelector('#privacy-dialog');
document.querySelectorAll('.privacy-trigger').forEach(button=>button.addEventListener('click',()=>privacy.showModal()));
document.querySelector('#close-privacy').addEventListener('click',()=>privacy.close());
privacy.addEventListener('click',event=>{if(event.target===privacy){const r=privacy.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)privacy.close();}});
const form=document.querySelector('#enquiry-form');
const status=document.querySelector('#form-status');
function newSubmissionId(){const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
let submissionId=newSubmissionId();
form.addEventListener('input',()=>{submissionId=newSubmissionId();});
form.addEventListener('submit',async event=>{
 event.preventDefault();if(!form.reportValidity())return;
 const button=form.querySelector('[type=submit]');if(button.disabled)return;
 const label=button.querySelector('.submit-label');button.disabled=true;label.textContent='Sending your enquiry…';form.setAttribute('aria-busy','true');status.textContent='';
 const data=Object.fromEntries(new FormData(form));data.consent=form.elements.consent.checked;data.submissionId=submissionId;
 try{const response=await fetch('/api/enquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(20000)});const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.error||'We couldn’t send your enquiry. Please try again, or email izzany.cdkl@gmail.com.');status.dataset.state='success';status.textContent='Thank you. Your enquiry has been submitted to JW Consulting. We look forward to speaking with you.';form.reset();submissionId=newSubmissionId();}
 catch(error){status.dataset.state='error';status.textContent=error.name==='TimeoutError'?'The connection timed out. Please retry; the same enquiry will not be sent twice. You can also email izzany.cdkl@gmail.com.':error.message.includes('JSON')||error instanceof TypeError?'We couldn’t reach the enquiry service. Please email izzany.cdkl@gmail.com or try again shortly.':error.message;}
 finally{button.disabled=false;label.textContent='Send your enquiry';form.removeAttribute('aria-busy');}
});
