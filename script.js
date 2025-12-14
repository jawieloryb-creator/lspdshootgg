fetch('/api/officers').then(r=>r.json()).then(data=>{
  document.getElementById('counter').innerText = 'Online: ' + data.filter(o=>o.status==='online').length;
  document.getElementById('list').innerHTML = data.map(o=>
    `<li class='${o.status}'>${o.discordUsername} | ${o.rank} | ${o.badgeNumber} | ${o.status}</li>`
  ).join('');
});