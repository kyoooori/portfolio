const $=s=>document.querySelector(s),box=$('#chat'),log=$('#log'),btn=$('#chat-btn'),msgs=[];
btn.onclick=()=>{const o=box.classList.toggle('open');btn.setAttribute('aria-expanded',o);if(o)$('#q').focus()};
const add=(c,t)=>{const p=document.createElement('p');p.className=c;p.textContent=t;log.append(p);log.scrollTop=log.scrollHeight;return p};
box.querySelector('form').onsubmit=async e=>{e.preventDefault();const t=$('#q').value.trim();if(!t)return;$('#q').value='';
add('u',t);msgs.push({role:'user',content:t});const w=add('a','…');
try{const r=await fetch('/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messages:msgs.slice(-10)})});
const d=await r.json();w.textContent=d.reply||'Something went wrong. Please try again.';msgs.push({role:'assistant',content:w.textContent})}
catch{w.textContent='Could not reach the chatbot. Please try again.'}};
