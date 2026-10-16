const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

function server({failCommit=false}={}) {
 const records=new Map([
  ['admin_users/owner',{role:'SUPERADMIN',status:'ACTIVE',name:'Existing owner'}],
  ['admin_users/admin-a',{role:'TENANT_ADMIN',status:'ACTIVE',tenantId:'a'}],
  ['tenants/a',{name:'Company A'}],['tenants/b',{name:'Company B'}],
  ['sites/site-a',{name:'Site A',tenantId:'a'}],['sites/site-b',{name:'Site B',tenantId:'b'}],
 ]);
 let serial=0;const created=[],deleted=[];
 const ref=(key)=>({id:key.split('/').pop(),key,get:async()=>({exists:records.has(key),id:key.split('/').pop(),data:()=>records.get(key)})});
 const db={collection:name=>({doc:id=>ref(`${name}/${id||`record-${++serial}`}`)}),batch:()=>{
  const pending=[];return {create:(reference,data)=>pending.push([reference.key,data]),commit:async()=>{if(failCommit)throw Error('storage unavailable');for(const [key] of pending)if(records.has(key))throw Error('already exists');for(const [key,data]of pending)records.set(key,data)}};
 }};
 class HttpsError extends Error{constructor(code,message){super(message);this.code=code}}
 const auth={createUser:async(data)=>{if(created.some(u=>u.email===data.email)){const e=Error('duplicate');e.code='auth/email-already-exists';throw e}const user={...data,uid:`uid-${created.length+1}`};created.push(user);return user},deleteUser:async(id)=>deleted.push(id)};
 const loaded={exports:{}};
 const req=(name)=>{
  if(name==='firebase-admin/app')return{initializeApp(){}};
  if(name==='firebase-admin/auth')return{getAuth:()=>auth};
  if(name==='firebase-admin/firestore')return{getFirestore:()=>db,FieldValue:{serverTimestamp:()=>'<server-time>'}};
  if(name==='firebase-functions/v2/https')return{HttpsError,onCall:fn=>fn};
  if(name==='./userPolicy.js')return require('../functions/lib/userPolicy.js');
  throw Error(name);
 };
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../functions/lib/index.js'),'utf8'),{module:loaded,exports:loaded.exports,require:req,console:{error(){},log(){}}});
 const invoke=(uid,user)=>loaded.exports.createTenantAdmin({auth:uid?{uid,token:{}}:null,data:{user}});
 return{invoke,records,created,deleted};
}
const user=(extra={})=>({name:'New administrator',email:'ADMIN@EXAMPLE.TEST',temporaryPassword:'Temporary123!xx',role:'TENANT_ADMIN',tenantId:'a',status:'ACTIVE',...extra});

test('creation produces matching Auth UID and active administrator profile, without persisting the password',async()=>{
 const app=server();const result=await app.invoke('owner',user({tenantName:'forged name',roleOverride:'SUPERADMIN'}));
 assert.equal(result.uid,app.created[0].uid);
 const profile=app.records.get(`admin_users/${result.uid}`);
 assert.equal(profile.status,'ACTIVE');assert.equal(profile.email,'admin@example.test');assert.equal(profile.tenantName,'Company A');
 assert.equal(profile.roleOverride,undefined);assert.equal(profile.temporaryPassword,undefined);
 assert.equal(app.records.get('admin_users/owner').name,'Existing owner');
 assert.equal(JSON.stringify([...app.records]).includes('Temporary123!xx'),false);
});
test('invalid and cross-tenant requests create no Auth accounts',async()=>{
 for(const [uid,data,code]of [
  [null,user(),'unauthenticated'],['admin-a',user(),'permission-denied'],
  ['admin-a',user({role:'GUARD',tenantId:'b',assignedSiteId:'site-b'}),'permission-denied'],
  ['owner',user({tenantId:'missing'}),'not-found'],['owner',user({role:'OWNER'}),'invalid-argument'],
  ['owner',user({assignedSiteId:'site-b'}),'permission-denied'],['owner',user({role:'GUARD'}),'invalid-argument'],
 ]){const app=server();await assert.rejects(app.invoke(uid,data),e=>e.code===code);assert.equal(app.created.length,0)}
});
test('guard provisioning links the validated site and keeps operational status separate from account access',async()=>{
 const app=server();const result=await app.invoke('admin-a',user({role:'GUARD',assignedSiteId:'site-a'}));
 const profile=app.records.get(`guards/${result.uid}`);assert.equal(profile.siteId,'site-a');assert.equal(profile.status,'offline');assert.equal(profile.accountStatus,'ACTIVE');
});
test('failed profile persistence rolls back the newly created Auth login',async()=>{
 const app=server({failCommit:true});await assert.rejects(app.invoke('owner',user()),e=>e.code==='internal');
 assert.deepEqual(app.deleted,[app.created[0].uid]);assert.equal(app.records.has(`admin_users/${app.created[0].uid}`),false);
});
test('duplicate emails report a useful error and never delete the existing login',async()=>{
 const app=server();await app.invoke('owner',user());await assert.rejects(app.invoke('owner',user()),e=>e.code==='already-exists');assert.deepEqual(app.deleted,[]);
});
