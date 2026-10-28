import { createHash } from 'node:crypto';
const recipient='izzany.cdkl@gmail.com';
const services=new Set(['Business strategy','Operations & processes','Digital transformation','Something else / I’m not sure yet']);
// A warm-instance guard, supplemented by a Vercel Firewall rate-limit rule in production.
const attempts=new Map();
const WINDOW=10*60*1000;
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,error:'Please submit the enquiry form using POST.'});}
 if(!(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return res.status(415).json({ok:false,error:'Please send a JSON enquiry.'});
 if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)return res.status(403).json({ok:false,error:'Please submit your enquiry from our website.'});}catch{return res.status(403).json({ok:false,error:'Invalid request origin.'});}}
 let body;
 try{const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);if(!raw||Buffer.byteLength(raw)>12000)return res.status(413).json({ok:false,error:'Your enquiry is too long.'});body=typeof req.body==='string'?JSON.parse(req.body):req.body;}catch{return res.status(400).json({ok:false,error:'Please check your enquiry and try again.'});}
 if(!body||typeof body!=='object'||Array.isArray(body))return res.status(400).json({ok:false,error:'Invalid enquiry.'});
 const clean=(key,max)=>typeof body[key]==='string'&&body[key].trim().length<=max?body[key].trim():'';
 const name=clean('name',100),email=clean('email',254),company=clean('company',150),service=clean('service',100),message=clean('message',5000),submissionId=clean('submissionId',36);
 if(body.website)return res.status(400).json({ok:false,error:'Unable to accept this submission. Please email us directly.'});
 if(name.length<2||/[\r\n]/.test(name)||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!services.has(service)||message.length<10||body.consent!==true||! /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(submissionId)||(body.company&&(!company||typeof body.company!=='string'))){return res.status(400).json({ok:false,error:'Please provide your name, a valid email, a solution, a message of 10–5,000 characters, and consent to contact you.'});}
 if(!process.env.RESEND_API_KEY||!process.env.ENQUIRY_FROM)return res.status(503).json({ok:false,error:'Online enquiries are temporarily unavailable. Please email izzany.cdkl@gmail.com directly.'});
 const now=Date.now();for(const [key,value] of attempts){if(now-value.start>WINDOW)attempts.delete(key);}
 const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
 const ipKey=createHash('sha256').update(ip).digest('hex');const record=attempts.get(ipKey)||{start:now,count:0};
 if(record.count>=5){res.setHeader('Retry-After',String(Math.ceil((WINDOW-(now-record.start))/1000)));return res.status(429).json({ok:false,error:'You’ve sent several enquiries recently. Please try again in 10 minutes, or email us directly.'});}
 record.count++;attempts.set(ipKey,record);
 const text=`New enquiry from the JW Consulting website\n\nName: ${name}\nEmail: ${email}\nCompany: ${company||'Not provided'}\nService: ${service}\n\nMessage:\n${message}\n\nThe sender agreed to be contacted about this enquiry.`;
 const payload={from:process.env.ENQUIRY_FROM,to:[recipient],reply_to:email,subject:`JW Consulting enquiry — ${service}`,text};
 const key=createHash('sha256').update(submissionId+JSON.stringify(payload)).digest('hex');
 try{const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(payload),signal:AbortSignal.timeout(10000)});const result=await response.json();if(!response.ok||!result.id)return res.status(502).json({ok:false,error:'We couldn’t send your enquiry right now. Please try again shortly, or email izzany.cdkl@gmail.com.'});return res.status(200).json({ok:true});}
 catch{return res.status(502).json({ok:false,error:'The email service is temporarily unavailable. Please retry, or email izzany.cdkl@gmail.com.'});}
}
