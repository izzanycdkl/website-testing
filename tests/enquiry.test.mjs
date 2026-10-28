import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/enquiry.js';
const valid={name:'Alex Tan',email:'alex@example.com',company:'Example',service:'Business strategy',message:'I would like help planning our next business phase.',consent:true,submissionId:'00a0a000-0000-4000-8000-000000000000'};
let ip=0;
async function request(body=valid,overrides={}){const req={method:'POST',headers:{'content-type':'application/json',host:'jw.example','x-forwarded-for':`192.0.2.${++ip}`},body,...overrides};const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(s){this.code=s;return this;},json(v){this.body=v;return this;}};await handler(req,res);return res;}
test('rejects invalid requests, consent, origin, and oversize input before sending',async()=>{
 assert.equal((await request(valid,{method:'GET'})).code,405);
 assert.equal((await request({...valid,consent:false})).code,400);
 assert.equal((await request({...valid,email:'bad'})).code,400);
 assert.equal((await request({...valid,name:'Bad\r\nHeader'})).code,400);
 assert.equal((await request({...valid,website:'bot'})).code,400);
 assert.equal((await request({...valid,message:'x'.repeat(13000)})).code,413);
 assert.equal((await request(valid,{headers:{'content-type':'application/json',host:'jw.example',origin:'https://evil.example'}})).code,403);
});
test('reports missing email configuration honestly',async()=>{delete process.env.RESEND_API_KEY;delete process.env.ENQUIRY_FROM;assert.equal((await request()).code,503);});
test('sends only to fixed recipient, uses reply-to and retries with same idempotency key',async()=>{
 process.env.RESEND_API_KEY='test-key';process.env.ENQUIRY_FROM='JW <test@example.com>';const original=global.fetch;const calls=[];
 try{global.fetch=async(url,options)=>{calls.push({url,options});return{ok:true,json:async()=>({id:'mock-accepted-id'})};};assert.equal((await request()).code,200);assert.equal((await request()).code,200);const sent=JSON.parse(calls[0].options.body);assert.deepEqual(sent.to,['izzany.cdkl@gmail.com']);assert.equal(sent.reply_to,valid.email);assert.equal(calls[0].options.headers['Idempotency-Key'],calls[1].options.headers['Idempotency-Key']);assert.ok(sent.text.includes(valid.message));}
 finally{global.fetch=original;}
});
test('provider rejection never returns a success',async()=>{const original=global.fetch;try{global.fetch=async()=>({ok:false,json:async()=>({message:'secret provider diagnostic'})});const res=await request();assert.equal(res.code,502);assert.equal(res.body.ok,false);assert.ok(!res.body.error.includes('secret'));}finally{global.fetch=original;}});
test('throttles repeated enquiries on a warm instance',async()=>{const original=global.fetch;try{global.fetch=async()=>({ok:true,json:async()=>({id:'mock'})});const overrides={headers:{'content-type':'application/json',host:'jw.example','x-forwarded-for':'192.0.2.250'}};for(let i=0;i<5;i++)assert.equal((await request(valid,overrides)).code,200);assert.equal((await request(valid,overrides)).code,429);}finally{global.fetch=original;delete process.env.RESEND_API_KEY;delete process.env.ENQUIRY_FROM;}});
