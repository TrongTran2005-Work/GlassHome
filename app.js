const $ = id => document.getElementById(id);
const DEFAULT_LINKS = [
  {name:'Google',url:'https://google.com',mode:'auto',glyph:'G'},
  {name:'YouTube',url:'https://youtube.com',mode:'auto',glyph:'▶'},
  {name:'Gmail',url:'https://mail.google.com',mode:'auto',glyph:'✉'},
  {name:'Drive',url:'https://drive.google.com',mode:'auto',glyph:'△'},
  {name:'ChatGPT',url:'https://chatgpt.com',mode:'auto',glyph:'✳'},
  {name:'Facebook',url:'https://facebook.com',mode:'auto',glyph:'f'},
  {name:'TikTok',url:'https://tiktok.com',mode:'auto',glyph:'♪'},
  {name:'GitHub',url:'https://github.com',mode:'auto',glyph:'⌘'}
];
const hasChromeStorage = typeof chrome !== 'undefined' && !!chrome.storage?.local;
const store = {
  async get(keys){ if(hasChromeStorage) return chrome.storage.local.get(keys); const out={}; for(const k of keys){try{out[k]=JSON.parse(localStorage.getItem(k))}catch{}} return out; },
  async set(obj){ if(hasChromeStorage) return chrome.storage.local.set(obj); for(const [k,v] of Object.entries(obj)) localStorage.setItem(k,JSON.stringify(v)); },
  async remove(keys){ if(hasChromeStorage) return chrome.storage.local.remove(keys); (Array.isArray(keys)?keys:[keys]).forEach(k=>localStorage.removeItem(k)); }
};
let links=[...DEFAULT_LINKS], customBookmarks=[], joyCount=0, selectedEmoji='⭐', iconMode='auto', toastTimer, noteTimer, faviconPreviewTimer;
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2200)}
function openModal(id){$(id).classList.add('open')}
function closeModal(id){$(id).classList.remove('open')}
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
document.querySelectorAll('.modal-backdrop').forEach(back=>back.addEventListener('click',e=>{if(e.target===back)back.classList.remove('open')}));
function updateDayTracker(date){
  const elapsedSeconds=date.getHours()*3600+date.getMinutes()*60+date.getSeconds();
  const progress=Math.min(1,Math.max(0,elapsedSeconds/86400));
  const percent=progress*100;
  $('dayProgressFill').style.width=`${percent}%`;
  $('dayProgressPercent').textContent=`${percent.toFixed(2)}%`;
  $('dayProgress').setAttribute('aria-valuenow',percent.toFixed(2));
  const minuteOfDay=date.getHours()*60+date.getMinutes();
  const reminder=GLASSHOME_REMINDERS[Math.floor(minuteOfDay/15)];
  if($('dayReminder').dataset.time!==reminder.time){
    $('dayReminder').textContent=reminder.text;
    $('dayReminder').dataset.time=reminder.time;
  }
}
function updateClock(){const d=new Date(),hour12=$('hour12').checked; $('clock').textContent=new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit',hour12}).format(d);$('date').textContent=new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'numeric',month:'long'}).format(d).toUpperCase();const h=d.getHours(),name=$('displayName').value.trim();let greet=h<11?'Chào buổi sáng':h<18?'Chào buổi chiều':'Chào buổi tối';$('greeting').textContent=`${greet}${name?', '+name:''}. ${h<11?'Chúc bạn một ngày thật tốt lành.':h<18?'Hãy tận hưởng từng khoảnh khắc.':'Đã đến lúc thư giãn một chút.'}`;updateDayTracker(d)}
setInterval(updateClock,1000);
$('searchForm').addEventListener('submit',e=>{e.preventDefault();const q=$('searchInput').value.trim();if(q)location.href='https://www.google.com/search?q='+encodeURIComponent(q)});
function faviconUrl(url){try{return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(new URL(url).origin)}&sz=128`}catch{return ''}}
function renderDock(){const dock=$('dock');dock.replaceChildren();links.forEach((item,index)=>{const a=document.createElement('a');a.className='dock-item';a.href=item.url;a.target='_self';a.title=item.name;const icon=document.createElement('span');icon.className='dock-icon';if(item.mode==='upload'&&item.image){const img=document.createElement('img');img.src=item.image;img.alt='';icon.append(img)}else if(item.mode==='url'&&item.image){const img=document.createElement('img');img.src=item.image;img.alt='';img.onerror=()=>{icon.textContent=(item.glyph||item.name[0]||'?')};icon.append(img)}else if(item.mode==='auto'){const img=document.createElement('img');img.src=faviconUrl(item.url);img.alt='';img.onerror=()=>{icon.textContent=item.name.trim().charAt(0).toUpperCase()||'↗'};icon.append(img)}else icon.textContent=item.glyph||item.name.trim().charAt(0).toUpperCase();const label=document.createElement('span');label.className='dock-name';label.textContent=item.name;const edit=document.createElement('button');edit.className='dock-edit';edit.type='button';edit.textContent='✎';edit.title='Chỉnh sửa';edit.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();editLink(index)});a.append(icon,label,edit);dock.append(a)})}
function updateIconPreview(){
  clearTimeout(faviconPreviewTimer);
  const preview=$('iconPreview');
  preview.replaceChildren();
  if(iconMode==='auto'){
    const entered=$('linkUrl').value.trim();
    if(!entered){preview.textContent='?';return}
    const url=/^https?:\/\//i.test(entered)?entered:`https://${entered}`;
    const source=faviconUrl(url);
    if(!source){preview.textContent='↗';return}
    faviconPreviewTimer=setTimeout(()=>{
      if(iconMode!=='auto'||$('linkUrl').value.trim()!==entered)return;
      const image=document.createElement('img');
      image.alt='';
      image.onerror=()=>{
        if(image.isConnected&&iconMode==='auto'&&$('linkUrl').value.trim()===entered){
          preview.textContent=$('linkGlyph').value.trim()||$('linkName').value.trim().charAt(0).toUpperCase()||'↗';
        }
      };
      image.src=source;
      preview.replaceChildren(image);
    },180);
    return;
  }
  preview.textContent=iconMode==='url'?'↗':iconMode==='upload'?'▧':$('linkGlyph').value.trim()||'?';
}
function editLink(index=-1){
  $('linkForm').reset();
  $('linkIndex').value=index;
  $('linkTitle').textContent=index<0?'Thêm liên kết':'Chỉnh sửa liên kết';
  $('deleteLink').style.display=index<0?'none':'inline';
  iconMode='auto';
  if(index>=0){
    const item=links[index];
    $('linkName').value=item.name;
    $('linkUrl').value=item.url;
    $('linkGlyph').value=item.glyph||'';
    iconMode=item.mode||'auto';
    if(item.mode==='url')$('iconUrl').value=item.image||'';
  }
  document.querySelectorAll('[data-iconmode]').forEach(button=>button.classList.toggle('active',button.dataset.iconmode===iconMode));
  $('iconUrl').hidden=iconMode!=='url';
  $('iconFile').hidden=iconMode!=='upload';
  $('iconHelp').textContent=iconMode==='auto'?'Tự lấy favicon của website (cần Internet).':iconMode==='url'?'Dán đường dẫn ảnh biểu tượng.':'Chọn ảnh biểu tượng từ thiết bị.';
  updateIconPreview();
  openModal('linkBackdrop');
}
$('addLink').addEventListener('click',()=>editLink());
document.querySelectorAll('[data-iconmode]').forEach(b=>b.addEventListener('click',()=>{iconMode=b.dataset.iconmode;document.querySelectorAll('[data-iconmode]').forEach(x=>x.classList.toggle('active',x===b));$('iconUrl').hidden=iconMode!=='url';$('iconFile').hidden=iconMode!=='upload';$('iconHelp').textContent=iconMode==='auto'?'Tự lấy favicon của website (cần Internet).':iconMode==='url'?'Dán đường dẫn ảnh biểu tượng.':'Chọn ảnh biểu tượng từ thiết bị.';updateIconPreview()}));
$('linkUrl').addEventListener('input',updateIconPreview);
$('iconUrl').addEventListener('input',updateIconPreview);
$('iconFile').addEventListener('change',e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>1024*1024){toast('Ảnh icon tối đa 1 MB');e.target.value='';return}const reader=new FileReader();reader.onload=()=>{$('iconPreview').textContent='✓';$('iconHelp').textContent='Đã chọn ảnh biểu tượng.'; $('iconFile').dataset.data=reader.result};reader.readAsDataURL(f)});
$('linkForm').addEventListener('submit',async e=>{e.preventDefault();let url=$('linkUrl').value.trim();if(!/^https?:\/\//i.test(url))url='https://'+url;try{new URL(url)}catch{return toast('Địa chỉ website không hợp lệ')}const item={name:$('linkName').value.trim(),url,mode:iconMode,glyph:$('linkGlyph').value.trim()};if(iconMode==='url'){item.image=$('iconUrl').value.trim();if(!item.image)return toast('Hãy nhập link ảnh biểu tượng')}if(iconMode==='upload'){item.image=$('iconFile').dataset.data;if(!item.image)return toast('Hãy chọn ảnh biểu tượng')};const i=Number($('linkIndex').value);if(i>=0)links[i]=item;else links.push(item);await store.set({links});renderDock();closeModal('linkBackdrop');toast('Đã lưu liên kết')});
$('deleteLink').addEventListener('click',async()=>{const i=Number($('linkIndex').value);if(i>=0){links.splice(i,1);await store.set({links});renderDock();closeModal('linkBackdrop');toast('Đã xóa liên kết')}});
$('settingsOpen').addEventListener('click',()=>openModal('settingsBackdrop'));$('widgetsOpen').addEventListener('click',()=>openModal('widgetsBackdrop'));$('bookmarksOpen').addEventListener('click',()=>{openModal('bookmarksBackdrop');loadBookmarks()});
const functionMenu=$('functionMenu'),functionMenuToggle=$('functionMenuToggle');
function setFunctionMenuOpen(open){
  functionMenu.hidden=!open;
  functionMenuToggle.setAttribute('aria-expanded',String(open));
  functionMenuToggle.setAttribute('aria-label',open?'Đóng menu chức năng':'Mở menu chức năng');
}
functionMenuToggle.addEventListener('click',()=>setFunctionMenuOpen(functionMenu.hidden));
functionMenu.addEventListener('click',event=>{if(event.target.closest('button'))setFunctionMenuOpen(false)});
document.addEventListener('click',event=>{if(!document.querySelector('.function-rail').contains(event.target))setFunctionMenuOpen(false)});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!functionMenu.hidden){
    setFunctionMenuOpen(false);
    functionMenuToggle.focus();
  }
});
let functionMenuButtonSize=48,functionMenuUnframed=false;
function applyFunctionMenuSettings(size,unframed){
  const parsed=Number(size);
  functionMenuButtonSize=Number.isFinite(parsed)?Math.max(16,Math.min(48,Math.round(parsed))):48;
  functionMenuUnframed=!!unframed;
  functionMenuToggle.style.setProperty('--function-menu-size',functionMenuButtonSize+'px');
  functionMenuToggle.classList.toggle('is-unframed',functionMenuUnframed);
  $('functionMenuSizeInput').value=String(functionMenuButtonSize);
  $('functionMenuSizeValue').textContent=functionMenuButtonSize+'px';
  $('functionMenuUnframed').checked=functionMenuUnframed;
}
$('functionMenuSizeInput').addEventListener('change',async()=>{
  const input=$('functionMenuSizeInput'),value=Number(input.value);
  if(input.value.trim()===''||!Number.isInteger(value)||value<16||value>48){
    input.value=String(functionMenuButtonSize);
    toast('Kích thước nút menu phải từ 16 đến 48 px');
    return;
  }
  applyFunctionMenuSettings(value,functionMenuUnframed);
  await store.set({functionMenuSize:functionMenuButtonSize});
});
$('functionMenuUnframed').addEventListener('change',async()=>{
  applyFunctionMenuSettings(functionMenuButtonSize,$('functionMenuUnframed').checked);
  await store.set({functionMenuUnframed});
});
$('notes').addEventListener('input',()=>{$('noteStatus').textContent='ĐANG LƯU';clearTimeout(noteTimer);noteTimer=setTimeout(async()=>{await store.set({notes:$('notes').value});$('noteStatus').textContent='ĐÃ LƯU'},350)});
function resolveTheme(theme){return theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):theme==='dark'?'dark':'light'}
function applyTheme(theme,selectedTheme=theme){document.body.classList.toggle('theme-dark',theme==='dark');document.body.classList.toggle('theme-light',theme!=='dark');document.querySelectorAll('[data-theme]').forEach(b=>b.classList.toggle('active',b.dataset.theme===selectedTheme));}
document.querySelectorAll('[data-theme]').forEach(b=>b.addEventListener('click',async()=>{const selectedTheme=b.dataset.theme;applyTheme(resolveTheme(selectedTheme),selectedTheme);await store.set({theme:selectedTheme})}));
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',async event=>{if((await store.get(['theme'])).theme==='system')applyTheme(event.matches?'dark':'light','system')});
function applyWidgetVisibility(changedId=null,changedVisible=null){const seen=new Set();document.querySelectorAll('[data-widget]').forEach(input=>{const id=input.dataset.widget;if(seen.has(id))return;seen.add(id);const controls=[...document.querySelectorAll(`[data-widget="${id}"]`)];const visible=id===changedId?!!changedVisible:controls.some(x=>x.checked);$(id).style.display=visible?'':'none';controls.forEach(x=>x.checked=visible)})}
document.querySelectorAll('[data-widget]').forEach(c=>c.addEventListener('change',async()=>{applyWidgetVisibility(c.dataset.widget,c.checked);const visibleWidgets={};document.querySelectorAll('[data-widget]').forEach(x=>visibleWidgets[x.dataset.widget]=x.checked);await store.set({visibleWidgets})}));
$('hour12').addEventListener('change',async()=>{await store.set({hour12:$('hour12').checked});updateClock()});$('displayName').addEventListener('input',()=>{store.set({displayName:$('displayName').value});updateClock()});$('islandAlways').addEventListener('change',async()=>{document.querySelector('.dynamic-island').classList.toggle('always-lit',$('islandAlways').checked);await store.set({islandAlways:$('islandAlways').checked})});
const defaultIslandText='GLASSHOME · YOUR SPACE';
$('islandTextInput').addEventListener('input',async()=>{const text=$('islandTextInput').value;$('islandText').textContent=text;await store.set({islandText:text})});
const weatherCodes={0:['Trời quang','☀️'],1:['Ít mây','🌤️'],2:['Có mây','⛅'],3:['Nhiều mây','☁️'],45:['Sương mù','🌫️'],48:['Sương mù','🌫️'],51:['Mưa phùn','🌦️'],53:['Mưa phùn','🌦️'],55:['Mưa phùn dày','🌧️'],61:['Mưa nhẹ','🌦️'],63:['Mưa vừa','🌧️'],65:['Mưa lớn','🌧️'],80:['Mưa rào','🌦️'],81:['Mưa rào','🌧️'],82:['Mưa rào mạnh','⛈️'],95:['Dông','⛈️'],96:['Dông mưa đá','⛈️'],99:['Dông mạnh','⛈️']};
async function loadWeather(){const city=$('cityInput').value.trim()||'Ho Chi Minh City';$('weatherDesc').textContent='Đang cập nhật...';try{const geo=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=vi&format=json`).then(r=>{if(!r.ok)throw Error();return r.json()});if(!geo.results?.length)throw Error('Không tìm thấy địa điểm');const p=geo.results[0];const data=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`).then(r=>{if(!r.ok)throw Error();return r.json()});const c=data.current,[desc,icon]=weatherCodes[c.weather_code]||['Thời tiết thay đổi','☁️'];$('temperature').textContent=Math.round(c.temperature_2m)+'°';$('weatherPlace').textContent=[p.name,p.country].filter(Boolean).join(', ');$('weatherDesc').textContent=desc;$('weatherIcon').textContent=icon;$('weatherFeels').textContent='Cảm giác '+Math.round(c.apparent_temperature)+'°';$('weatherWind').textContent='Gió '+Math.round(c.wind_speed_10m)+' km/h'}catch{$('weatherDesc').textContent='Không thể tải dữ liệu thời tiết';$('weatherPlace').textContent='Kiểm tra kết nối hoặc địa điểm'}}
$('weatherRefresh').addEventListener('click',loadWeather);$('citySave').addEventListener('click',async()=>{const city=$('cityInput').value.trim();if(!city)return toast('Nhập tên thành phố');await store.set({city});await loadWeather();toast('Đã cập nhật địa điểm')});
function setWallpaper(url){$('wallpaper').style.backgroundImage=url?`url("${url}")`:'';$('wallpaperPreview').style.backgroundImage=url?`url("${url}")`:''}
$('wallpaperFile').addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>5*1024*1024){toast('Ảnh nền tối đa 5 MB');e.target.value='';return}const reader=new FileReader();reader.onload=async()=>{setWallpaper(reader.result);await store.set({wallpaper:reader.result});toast('Đã thay hình nền')};reader.readAsDataURL(file)});
$('applyWallpaper').addEventListener('click',async()=>{const url=$('wallpaperUrl').value.trim();if(!/^https?:\/\//i.test(url))return toast('Link ảnh phải bắt đầu bằng http hoặc https');setWallpaper(url);await store.set({wallpaper:url});toast('Đã áp dụng hình nền')});
$('defaultWallpaper').addEventListener('click',async()=>{await store.remove('wallpaper');setWallpaper('');$('wallpaperUrl').value='';toast('Đã khôi phục nền mặc định')});
$('blurRange').addEventListener('input',()=>{document.documentElement.style.setProperty('--wallblur',$('blurRange').value+'px');$('blurValue').textContent=$('blurRange').value+'px';store.set({wallblur:Number($('blurRange').value)})});$('dimRange').addEventListener('input',()=>{document.documentElement.style.setProperty('--dim',Number($('dimRange').value)/100);$('dimValue').textContent=$('dimRange').value+'%';store.set({dim:Number($('dimRange').value)})});
const pixelAdjustments=[
  {input:'clockTopOffsetRange',output:'clockTopOffsetValue',target:'app',property:'--clock-top-offset',key:'clockTopOffset',defaultValue:19},
  {input:'dayTrackerTopOffsetRange',output:'dayTrackerTopOffsetValue',target:'app',property:'--day-tracker-top-offset',key:'dayTrackerTopOffset',defaultValue:196},
  {input:'clockLeftOffsetRange',output:'clockLeftOffsetValue',target:'app',property:'--clock-left-offset',key:'clockLeftOffset',defaultValue:21},
  {input:'widgetRightOffsetRange',output:'widgetRightOffsetValue',target:'app',property:'--widget-right-offset',key:'widgetRightOffset',defaultValue:31},
  {input:'widgetGapRange',output:'widgetGapValue',target:'widgetColumn',property:'--widget-gap',key:'widgetGap',defaultValue:10},
  {input:'weatherRadius',output:'weatherRadiusValue',target:'weatherWidget',property:'border-radius',key:'weatherRadius',defaultValue:8},
  {input:'notesRadius',output:'notesRadiusValue',target:'notesWidget',property:'border-radius',key:'notesRadius',defaultValue:8},
  {input:'joyRadius',output:'joyRadiusValue',target:'joyWidget',property:'border-radius',key:'joyRadius',defaultValue:10},
  {input:'notesHeightRange',output:'notesHeightValue',target:'notesWidget',property:'height',key:'notesHeight',defaultValue:200},
  {input:'dockRadiusRange',output:'dockRadiusValue',target:'dock',property:'border-radius',key:'dockRadius',defaultValue:36}
];
function applyPixelAdjustment(setting,value){
  const min=Number($(setting.input).min),max=Number($(setting.input).max),number=Number(value);
  const normalized=Number.isFinite(number)?Math.max(min,Math.min(max,number)):setting.defaultValue;
  $(setting.input).value=String(normalized);
  $(setting.output).textContent=normalized+'px';
  $(setting.target).style.setProperty(setting.property,normalized+'px');
}
pixelAdjustments.forEach(setting=>$(setting.input).addEventListener('input',async()=>{
  const value=Number($(setting.input).value);
  applyPixelAdjustment(setting,value);
  await store.set({[setting.key]:value});
}));
function applyHydrationDimensions(width,height){
  const widget=$('hydrationWidget');
  const dimensions=[
    {input:'hydrationWidthRange',output:'hydrationWidthValue',property:'--hydration-widget-width',key:'width',value:width,min:180,max:420,fallback:320},
    {input:'hydrationHeightRange',output:'hydrationHeightValue',property:'--hydration-widget-height',key:'height',value:height,min:210,max:440,fallback:310}
  ];
  dimensions.forEach(dimension=>{
    const provided=dimension.value!=null&&Number.isFinite(Number(dimension.value));
    if(!provided)widget.style.removeProperty(dimension.property);
    const measured=provided?Number(dimension.value):parseFloat(getComputedStyle(widget)[dimension.key]);
    const normalized=Math.max(dimension.min,Math.min(dimension.max,Number.isFinite(measured)?measured:dimension.fallback));
    if(provided)widget.style.setProperty(dimension.property,normalized+'px');
    $(dimension.input).value=String(normalized);
    $(dimension.output).textContent=normalized+'px';
  });
}
let hydrationCollapsedWidth=48,hydrationCollapsedHeight=48,hydrationCollapsedDropWidth=20,hydrationCollapsedDropHeight=28;
function applyHydrationCollapsedDimensions(width,height,dropWidth=hydrationCollapsedDropWidth,dropHeight=hydrationCollapsedDropHeight){
  const widget=$('hydrationWidget');
  const dimensions=[
    {input:'hydrationCollapsedWidthRange',output:'hydrationCollapsedWidthValue',property:'--hydration-widget-collapsed-width',value:width,min:48,max:160,fallback:48,set:value=>hydrationCollapsedWidth=value},
    {input:'hydrationCollapsedHeightRange',output:'hydrationCollapsedHeightValue',property:'--hydration-widget-collapsed-height',value:height,min:48,max:160,fallback:48,set:value=>hydrationCollapsedHeight=value},
    {input:'hydrationCollapsedDropWidthRange',output:'hydrationCollapsedDropWidthValue',property:'--hydration-widget-collapsed-drop-width',value:dropWidth,min:10,max:64,fallback:20,set:value=>hydrationCollapsedDropWidth=value},
    {input:'hydrationCollapsedDropHeightRange',output:'hydrationCollapsedDropHeightValue',property:'--hydration-widget-collapsed-drop-height',value:dropHeight,min:10,max:64,fallback:28,set:value=>hydrationCollapsedDropHeight=value}
  ];
  dimensions.forEach(dimension=>{
    const measured=Number.isFinite(Number(dimension.value))?Number(dimension.value):dimension.fallback;
    const normalized=Math.max(dimension.min,Math.min(dimension.max,measured));
    dimension.set(normalized);
    widget.style.setProperty(dimension.property,normalized+'px');
    $(dimension.input).value=String(normalized);
    $(dimension.output).textContent=normalized+'px';
  });
}
async function saveHydrationCollapsedDimensions(){
  await store.set({hydrationCollapsedWidth,hydrationCollapsedHeight,hydrationCollapsedDropWidth,hydrationCollapsedDropHeight});
}
async function updateHydrationCollapsedDimensions(){
  applyHydrationCollapsedDimensions(
    $('hydrationCollapsedWidthRange').value,
    $('hydrationCollapsedHeightRange').value,
    $('hydrationCollapsedDropWidthRange').value,
    $('hydrationCollapsedDropHeightRange').value
  );
  await saveHydrationCollapsedDimensions();
}
for(const id of ['hydrationCollapsedWidthRange','hydrationCollapsedHeightRange','hydrationCollapsedDropWidthRange','hydrationCollapsedDropHeightRange'])$(id).addEventListener('input',updateHydrationCollapsedDimensions);
async function saveHydrationDimensions(){
  const width=Number($('hydrationWidthRange').value),height=Number($('hydrationHeightRange').value);
  applyHydrationDimensions(width,height);
  await store.set({hydrationWidgetWidth:width,hydrationWidgetHeight:height});
}
$('hydrationWidthRange').addEventListener('input',saveHydrationDimensions);
$('hydrationHeightRange').addEventListener('input',saveHydrationDimensions);
function applyDayTrackerFontSize(value){
  const control=$('dayTrackerFontRange'),min=Number(control.min),max=Number(control.max);
  const number=Number(value),normalized=Math.max(min,Math.min(max,Number.isFinite(number)?number:10));
  control.value=String(normalized);
  $('dayTrackerFontValue').textContent=normalized+'px';
  $('dayTracker').style.setProperty('--day-tracker-font-size',normalized+'px');
}
function applyDayProgressColor(color){
  const normalized=typeof color==='string'&&/^#[\da-f]{6}$/i.test(color)?color.toLowerCase():'';
  const fill=$('dayProgressFill');
  if(normalized)fill.style.setProperty('--day-progress-color',normalized);
  else fill.style.removeProperty('--day-progress-color');
  $('dayProgressColor').value=normalized||'#438bf2';
  $('dayProgressColorValue').textContent=normalized?normalized.toUpperCase():'Mặc định';
}
$('dayTrackerFontRange').addEventListener('input',async()=>{
  const value=Number($('dayTrackerFontRange').value);
  applyDayTrackerFontSize(value);
  await store.set({dayTrackerFontSize:value});
});
$('dayProgressColor').addEventListener('input',async()=>{
  const color=$('dayProgressColor').value;
  applyDayProgressColor(color);
  await store.set({dayProgressColor:color});
});
$('dayNotificationTest').addEventListener('click',async()=>{
  const button=$('dayNotificationTest'),status=$('dayNotificationStatus');
  if(typeof chrome==='undefined'||!chrome.permissions?.request||!chrome.permissions?.contains
    ||!chrome.runtime?.getURL){
    status.textContent='Chỉ dùng trong tiện ích Chrome/Edge';
    return;
  }

  button.disabled=true;
  status.textContent='Đang kiểm tra quyền thông báo...';
  try{
    const granted=await chrome.permissions.request({permissions:['notifications']});
    const hasPermission=granted&&await chrome.permissions.contains({permissions:['notifications']});
    if(!hasPermission){
      status.textContent='Chưa được cấp quyền thông báo';
      button.disabled=false;
      return;
    }
    await updateNotificationPermissionPopup();
    if(!chrome.notifications?.create){
      console.error('Quyền đã cấp nhưng API thông báo không khả dụng.');
      status.textContent='Đã cấp quyền nhưng API thông báo không khả dụng';
      button.disabled=false;
      return;
    }

    status.textContent='Đã cấp quyền; đang gửi thông báo thử...';
    chrome.notifications.create('glasshome-day-notification-test',{
      type:'basic',
      iconUrl:chrome.runtime.getURL('assets/icon128.png'),
      title:'GlassHome · Kiểm tra thông báo',
      message:'Kênh thông báo hệ thống đang hoạt động.',
      contextMessage:'Tiến trình trong ngày',
      priority:0,
      requireInteraction:false
    },()=>{
      const error=chrome.runtime.lastError;
      if(error){
        console.error('Không thể gửi thông báo kiểm tra:',error.message);
        status.textContent='Có quyền nhưng không gửi được thông báo';
      }else status.textContent='Đã cấp quyền; thông báo thử đã gửi';
      button.disabled=false;
    });
  }catch(error){
    console.error('Không thể kiểm tra quyền thông báo:',error);
    status.textContent='Không thể kiểm tra quyền thông báo';
    button.disabled=false;
  }
});
async function updateNotificationPermissionPopup(){
  const popup=$('notificationPermissionPopup'),button=$('notificationPermissionGrant');
  const status=$('notificationPermissionPopupStatus');
  if(typeof chrome==='undefined'||!chrome.permissions?.contains){
    popup.hidden=false;
    button.disabled=true;
    status.textContent='Mở GlassHome từ tiện ích Chrome/Edge để cấp quyền.';
    return;
  }
  button.disabled=!chrome.permissions.request;
  try{
    const granted=await chrome.permissions.contains({permissions:['notifications']});
    popup.hidden=granted;
    status.textContent=granted?'':'Quyền chưa được cấp. Cửa sổ này sẽ còn hiển thị.';
  }catch(error){
    console.error('Không thể kiểm tra quyền thông báo khi mở tab:',error);
    popup.hidden=false;
    status.textContent='Không thể kiểm tra quyền; hãy thử cấp quyền thông báo.';
  }
}
$('notificationPermissionGrant').addEventListener('click',async()=>{
  const button=$('notificationPermissionGrant'),status=$('notificationPermissionPopupStatus');
  if(typeof chrome==='undefined'||!chrome.permissions?.request||!chrome.permissions?.contains){
    button.disabled=true;
    status.textContent='Mở GlassHome từ tiện ích Chrome/Edge để cấp quyền.';
    return;
  }
  button.disabled=true;
  status.textContent='Đang yêu cầu quyền thông báo...';
  try{
    const requested=await chrome.permissions.request({permissions:['notifications']});
    const granted=requested&&await chrome.permissions.contains({permissions:['notifications']});
    if(!granted){
      status.textContent='Quyền chưa được cấp; cửa sổ này sẽ tiếp tục hiển thị.';
      button.disabled=false;
      return;
    }
    $('dayNotificationStatus').textContent='Đã cấp quyền thông báo';
    await updateNotificationPermissionPopup();
  }catch(error){
    console.error('Không thể yêu cầu quyền thông báo:',error);
    status.textContent='Không thể cấp quyền thông báo. Hãy thử lại.';
    button.disabled=false;
  }
});
if(typeof chrome!=='undefined'&&chrome.permissions?.onAdded?.addListener){
  chrome.permissions.onAdded.addListener(({permissions})=>{
    if(permissions.includes('notifications'))void updateNotificationPermissionPopup();
  });
}
if(typeof chrome!=='undefined'&&chrome.permissions?.onRemoved?.addListener){
  chrome.permissions.onRemoved.addListener(({permissions})=>{
    if(permissions.includes('notifications'))void updateNotificationPermissionPopup();
  });
}
const defaultSignatureText='DESIGNED FOR YOUR EVERYDAY';
const defaultSupportUrl='https://trongtran2005-work.github.io/TrongDepTryy-HomePage/';
function normalizeSignatureUrl(value){
  const raw=value.trim();
  if(!raw)return '';
  try{
    const url=new URL(raw);
    return ['http:','https:'].includes(url.protocol)?url.href:null;
  }catch{
    return null;
  }
}
function applySignature(text,url){
  $('signatureTextInput').value=text;
  $('signatureUrlInput').value=url;
  $('signatureText').textContent=text;
  const link=$('signatureLink');
  if(url)link.href=url;
  else link.removeAttribute('href');
}
let supportWebsiteUrl='';
function applySupportUrl(url){
  supportWebsiteUrl=url;
  const link=$('supportInlineLink');
  link.textContent='hỗ trợ';
  if(url){
    link.href=url;
    link.target='_blank';
    link.rel='noopener noreferrer';
  }else{
    link.removeAttribute('href');
    link.removeAttribute('target');
    link.removeAttribute('rel');
  }
}
$('signatureSave').addEventListener('click',async()=>{
  const text=$('signatureTextInput').value;
  const url=normalizeSignatureUrl($('signatureUrlInput').value);
  if(url===null){toast('Liên kết phải là địa chỉ http:// hoặc https:// hợp lệ');return}
  applySignature(text,url);
  await store.set({signatureText:text,signatureUrl:url});
  toast('Đã lưu chân trang');
});
$('supportOpen').addEventListener('click',()=>{
  if(!supportWebsiteUrl){
    toast('Website hỗ trợ chưa được thiết lập');
    return;
  }
  window.open(supportWebsiteUrl,'_blank','noopener,noreferrer');
});
function setJoyEmoji(emoji){selectedEmoji=emoji;$('joyEmoji').textContent=emoji;$('customEmoji').value='';document.querySelectorAll('#emojiPicker button').forEach(b=>b.classList.toggle('active',b.textContent===emoji))}
document.querySelectorAll('#emojiPicker button').forEach(b=>b.addEventListener('click',async()=>{setJoyEmoji(b.textContent);await store.set({joyEmoji:selectedEmoji})}));$('customEmoji').addEventListener('input',async()=>{if($('customEmoji').value.trim()){selectedEmoji=$('customEmoji').value.trim();$('joyEmoji').textContent=selectedEmoji;document.querySelectorAll('#emojiPicker button').forEach(b=>b.classList.remove('active'));await store.set({joyEmoji:selectedEmoji})}});
function launchJoy(){joyCount++;$('joyCount').textContent=joyCount;store.set({joyCount});const layer=$('joyLayer'),rect=$('joyTrigger').getBoundingClientRect(),originX=rect.left+rect.width/2,originY=rect.top+rect.height/2;const symbols=[selectedEmoji,'✨','💫','⭐','🫧','🌟'];const count=30;for(let i=0;i<count;i++){const particle=document.createElement('span');particle.className='flying-joy';particle.textContent=symbols[Math.floor(Math.random()*symbols.length)];particle.style.left=originX+'px';particle.style.top=originY+'px';particle.style.setProperty('--x','0px');particle.style.setProperty('--y','0px');particle.style.setProperty('--dx1',(Math.random()*260-130)+'px');particle.style.setProperty('--dy1',(Math.random()*240-120)+'px');particle.style.setProperty('--dx2',(Math.random()*innerWidth*.95-innerWidth*.475)+'px');particle.style.setProperty('--dy2',(Math.random()*innerHeight*.85-innerHeight*.425)+'px');particle.style.setProperty('--dx3',(Math.random()*innerWidth*.95-innerWidth*.475)+'px');particle.style.setProperty('--dy3',(Math.random()*innerHeight*.85-innerHeight*.425)+'px');particle.style.setProperty('--size',(18+Math.random()*28)+'px');particle.style.setProperty('--duration',(1.6+Math.random()*1.5)+'s');layer.append(particle);particle.addEventListener('animationend',()=>particle.remove(),{once:true})}const btn=$('joyTrigger');btn.animate([{transform:'scale(1)'},{transform:'scale(.97)'},{transform:'scale(1)'}],{duration:230});}
$('joyTrigger').addEventListener('click',launchJoy);$('resetJoy').addEventListener('click',async()=>{joyCount=0;$('joyCount').textContent='0';await store.set({joyCount:0});toast('Đã đặt lại số đếm')});
const hydrationCore=globalThis.GLASS_HOME_HYDRATION;
let hydrationData=null,hydrationSelectedAmount=250,hydrationAlertTimer=null,hydrationRenderedDate='',hydrationCollapsed=false;
function setHydrationCollapsed(collapsed){
  hydrationCollapsed=!!collapsed;
  $('hydrationWidget').classList.toggle('is-collapsed',hydrationCollapsed);
  const expanded=String(!hydrationCollapsed),label=hydrationCollapsed?'Mở widget nhắc uống nước':'Thu gọn widget nhắc uống nước';
  for(const id of ['hydrationCollapse','hydrationDropToggle']){
    $(id).setAttribute('aria-expanded',expanded);
    $(id).setAttribute('aria-label',label);
    $(id).title=hydrationCollapsed?'Mở widget': 'Thu gọn widget';
  }
}
function normalizeHydrationData(data){
  const defaults=JSON.parse(JSON.stringify(hydrationCore.defaults));
  const current=data&&typeof data==='object'?data:{};
  return {...defaults,...current,settings:{...defaults.settings,...(current.settings||{})},historyByDate:current.historyByDate&&typeof current.historyByDate==='object'?current.historyByDate:{}};
}
function hydrationEntries(dateKey=hydrationCore.getDateKey()){
  const entries=hydrationData?.historyByDate?.[dateKey];
  return Array.isArray(entries)?entries:[];
}
function hydrationTotal(entries=hydrationEntries()){
  return entries.reduce((sum,entry)=>sum+(Number.isFinite(Number(entry.amount))?Number(entry.amount):0),0);
}
function hydrationMessage(total,goal,date=new Date()){
  if(total>=goal)return 'Tuyệt vời! Hôm nay bạn đã chạm mục tiêu rồi ✨';
  const messages=[
    'Một ngụm nước, thêm chút năng lượng.',
    'Hydration check! Đừng để cơ thể thành sa mạc.',
    'Đứng dậy uống nước nào, cây cũng cần tưới mà!',
    'Uống nước đi, đừng chỉ uống cà phê!',
    'Bạn làm việc chăm chỉ rồi, nghỉ một chút nhé.'
  ];
  return messages[(date.getHours()*4+Math.floor(date.getMinutes()/15))%messages.length];
}
function formatHydrationAmount(value){return Math.round(value).toLocaleString('vi-VN')}
function renderHydration(now=Date.now(),renderHistory=false){
  if(!hydrationData)return;
  const entries=hydrationEntries(),total=hydrationTotal(entries),settings=hydrationData.settings;
  const dateKey=hydrationCore.getDateKey(new Date(now));
  const goal=Math.max(100,Number(settings.dailyGoalMl)||2000),ratio=Math.min(1,total/goal);
  $('hydrationTotal').textContent=formatHydrationAmount(total);
  $('hydrationGoalLabel').textContent='/ '+formatHydrationAmount(goal)+' ml';
  $('hydrationWater').style.height=(ratio*100)+'%';
  $('hydrationProgress').setAttribute('aria-valuenow',String(Math.round(ratio*100)));
  $('hydrationProgress').classList.toggle('goal-reached',total>=goal);
  const message=hydrationMessage(total,goal,new Date(now)),messageNode=$('hydrationMessage');
  if(messageNode.textContent!==message){messageNode.classList.remove('fade-in');void messageNode.offsetWidth;messageNode.textContent=message;messageNode.classList.add('fade-in')}
  $('hydrationToggle').textContent=settings.remindersEnabled?'Ⅱ':'▶';
  $('hydrationToggle').title=settings.remindersEnabled?'Tạm dừng nhắc nhở':'Bật nhắc nhở';
  $('hydrationToggle').setAttribute('aria-pressed',String(!!settings.remindersEnabled));
  $('hydrationRemindersEnabled').checked=!!settings.remindersEnabled;
  const next=Number(hydrationData.nextReminderAt);
  if(!settings.remindersEnabled){$('hydrationCountdown').textContent='Đang tạm dừng'}
  else if(!Number.isFinite(next)||next<=0){$('hydrationCountdown').textContent='Kiểm tra khung giờ nhắc'}
  else{
    const seconds=Math.max(0,Math.ceil((next-now)/1000));
    const hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60),remaining=seconds%60;
    $('hydrationCountdown').textContent='Lần nhắc tiếp theo '+(hours?String(hours).padStart(2,'0')+':':'')+String(minutes).padStart(2,'0')+':'+String(remaining).padStart(2,'0');
  }
  document.querySelectorAll('[data-hydration-amount]').forEach(button=>button.classList.toggle('selected',Number(button.dataset.hydrationAmount)===hydrationSelectedAmount));
  $('hydrationSelectedAmount').textContent=formatHydrationAmount(hydrationSelectedAmount)+' ml';
  if(renderHistory||dateKey!==hydrationRenderedDate){
    $('hydrationHistory').replaceChildren();
    const history=entries.slice().sort((a,b)=>Number(b.timestamp)-Number(a.timestamp));
    if(!history.length){const empty=document.createElement('p');empty.className='hydration-history-empty';empty.textContent='Chưa có lần ghi nhận nào hôm nay.';$('hydrationHistory').append(empty)}
    history.forEach(entry=>{const row=document.createElement('div');row.className='hydration-history-row';const time=document.createElement('time');time.textContent=new Date(Number(entry.timestamp)).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});const amount=document.createElement('span');amount.textContent='+'+formatHydrationAmount(entry.amount)+' ml';row.append(time,amount);$('hydrationHistory').append(row)});
    hydrationRenderedDate=dateKey;
  }
}
function showHydrationAlert(message){
  $('hydrationAlertMessage').textContent=message;
  $('hydrationAlert').hidden=false;
  clearTimeout(hydrationAlertTimer);
  hydrationAlertTimer=setTimeout(()=>$('hydrationAlert').hidden=true,60000);
}
async function saveHydrationData(next){
  hydrationData=normalizeHydrationData(next);
  await store.set({hydrationData});
  renderHydration(Date.now(),true);
}
async function fireHydrationReminder(){
  const latest=normalizeHydrationData((await store.get(['hydrationData'])).hydrationData);
  const dueAt=Number(latest.nextReminderAt),now=Date.now();
  if(!latest.settings.remindersEnabled||!Number.isFinite(dueAt)||dueAt<=0||dueAt>now)return;
  const currentAllowed=hydrationCore.getNextAllowedTime(now,latest.settings.startTime,latest.settings.endTime)===now;
  if(!currentAllowed){
    latest.nextReminderAt=hydrationCore.getNextAllowedTime(now+hydrationCore.getIntervalMinutes(latest.settings)*60000,latest.settings.startTime,latest.settings.endTime);
    await saveHydrationData(latest);
    return;
  }
  if(Number(latest.lastReminderAt)!==dueAt){
    latest.lastReminderAt=dueAt;
    latest.nextReminderAt=hydrationCore.getNextAllowedTime(now+hydrationCore.getIntervalMinutes(latest.settings)*60000,latest.settings.startTime,latest.settings.endTime);
    latest.snoozedUntil=null;
  }else if(Number(latest.nextReminderAt)<=now){
    latest.nextReminderAt=hydrationCore.getNextAllowedTime(now+hydrationCore.getIntervalMinutes(latest.settings)*60000,latest.settings.startTime,latest.settings.endTime);
  }
  hydrationData=latest;
  if(Number(hydrationData.lastHomeReminderAt)!==dueAt){
    hydrationData.lastHomeReminderAt=dueAt;
    await store.set({hydrationData});
    showHydrationAlert(hydrationMessage(hydrationTotal(),Number(hydrationData.settings.dailyGoalMl)||2000,new Date()));
  }else await store.set({hydrationData});
  renderHydration();
}
async function tickHydration(){
  if(!hydrationData)return;
  if(hydrationData.settings.remindersEnabled&&Number(hydrationData.nextReminderAt)<=Date.now())await fireHydrationReminder();
  renderHydration();
}
async function initHydration(){
  const stored=await store.get(['hydrationData','hydrationCollapsed','hydrationCollapsedWidth','hydrationCollapsedHeight','hydrationCollapsedDropWidth','hydrationCollapsedDropHeight']);
  hydrationData=normalizeHydrationData(stored.hydrationData);
  applyHydrationCollapsedDimensions(stored.hydrationCollapsedWidth??48,stored.hydrationCollapsedHeight??48,stored.hydrationCollapsedDropWidth??20,stored.hydrationCollapsedDropHeight??28);
  setHydrationCollapsed(stored.hydrationCollapsed===true);
  hydrationSelectedAmount=Math.max(1,Math.min(3000,Number(hydrationData.settings.selectedAmount)||250));
  if(!stored||hydrationData.nextReminderAt==null||!Number.isFinite(Number(hydrationData.nextReminderAt))||Number(hydrationData.nextReminderAt)<=Date.now()){
    hydrationData.nextReminderAt=hydrationCore.getNextReminderAt({...hydrationData,nextReminderAt:null});
  }
  $('hydrationInterval').value=String(hydrationData.settings.intervalMinutes);
  $('hydrationCustomInterval').value=hydrationData.settings.customIntervalMinutes||60;
  $('hydrationCustomInterval').hidden=hydrationData.settings.intervalMinutes!=='custom';
  $('hydrationStart').value=hydrationData.settings.startTime||'07:00';
  $('hydrationEnd').value=hydrationData.settings.endTime||'22:30';
  $('hydrationDailyGoal').value=[1500,2000,2500].includes(Number(hydrationData.settings.dailyGoalMl))?String(hydrationData.settings.dailyGoalMl):'custom';
  $('hydrationCustomGoal').value=hydrationData.settings.dailyGoalMl;
  $('hydrationCustomGoal').hidden=$('hydrationDailyGoal').value!=='custom';
  const hasPermission=typeof chrome!=='undefined'&&chrome.permissions?.contains
    ? await chrome.permissions.contains({permissions:['notifications']})
    : false;
  if(!hasPermission)hydrationData.settings.backgroundNotifications=false;
  $('hydrationBackgroundNotifications').checked=!!hydrationData.settings.backgroundNotifications;
  await store.set({hydrationData});
  renderHydration(Date.now(),true);
}
async function recordHydration(amount){
  const value=Math.round(Number(amount));
  if(!Number.isFinite(value)||value<1||value>3000){toast('Nhập lượng nước từ 1 đến 3.000 ml');return}
  const latest=normalizeHydrationData((await store.get(['hydrationData'])).hydrationData);
  const dateKey=hydrationCore.getDateKey(),entries=latest.historyByDate[dateKey]||(latest.historyByDate[dateKey]=[]);
  entries.push({id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,amount:value,timestamp:Date.now()});
  latest.snoozedUntil=null;
  latest.nextReminderAt=latest.settings.remindersEnabled
    ?hydrationCore.getNextAllowedTime(Date.now()+hydrationCore.getIntervalMinutes(latest.settings)*60000,latest.settings.startTime,latest.settings.endTime)
    :null;
  await saveHydrationData(latest);
  $('hydrationAlert').hidden=true;
  const button=$('hydrationQuickDrink');
  button.classList.remove('ripple');void button.offsetWidth;button.classList.add('ripple');
  setTimeout(()=>button.classList.remove('ripple'),550);
}
async function undoHydration(){
  const latest=normalizeHydrationData((await store.get(['hydrationData'])).hydrationData),dateKey=hydrationCore.getDateKey(),entries=latest.historyByDate[dateKey]||[];
  if(!entries.length){toast('Chưa có lần uống nào để hoàn tác');return}
  const lastIndex=entries.reduce((best,entry,index)=>Number(entry.timestamp)>=Number(entries[best].timestamp)?index:best,0);
  entries.splice(lastIndex,1);
  if(!entries.length)delete latest.historyByDate[dateKey];
  await saveHydrationData(latest);
  toast('Đã hoàn tác lần ghi nhận gần nhất');
}
async function snoozeHydration(){
  const latest=normalizeHydrationData((await store.get(['hydrationData'])).hydrationData);
  if(!latest.settings.remindersEnabled)return;
  latest.snoozedUntil=Date.now()+10*60000;
  latest.nextReminderAt=hydrationCore.getNextAllowedTime(latest.snoozedUntil,latest.settings.startTime,latest.settings.endTime);
  $('hydrationAlert').hidden=true;
  await saveHydrationData(latest);
}
function setHydrationSelection(amount){
  const value=Math.round(Number(amount));
  if(!Number.isFinite(value)||value<1||value>3000)return false;
  hydrationSelectedAmount=value;
  if(hydrationData)hydrationData.settings.selectedAmount=value;
  renderHydration();
  return true;
}
document.querySelectorAll('[data-hydration-amount]').forEach(button=>button.addEventListener('click',async()=>{setHydrationSelection(button.dataset.hydrationAmount);if(hydrationData)await store.set({hydrationData})}));
$('hydrationCustomAmount').addEventListener('input',()=>{if($('hydrationCustomAmount').value)setHydrationSelection($('hydrationCustomAmount').value)});
$('hydrationCustomAmount').addEventListener('change',async()=>{if(setHydrationSelection($('hydrationCustomAmount').value)&&hydrationData)await store.set({hydrationData})});
$('hydrationQuickDrink').addEventListener('click',()=>recordHydration(hydrationSelectedAmount));
$('hydrationUndo').addEventListener('click',undoHydration);$('hydrationUndoHistory').addEventListener('click',undoHydration);
$('hydrationSettingsOpen').addEventListener('click',()=>openModal('hydrationSettingsBackdrop'));
$('hydrationCollapse').addEventListener('pointerdown',event=>event.stopPropagation());
$('hydrationDropToggle').addEventListener('pointerdown',event=>event.stopPropagation());
async function toggleHydrationCollapsed(event){
  event.preventDefault();
  event.stopPropagation();
  const collapsed=!hydrationCollapsed;
  await store.set({hydrationCollapsed:collapsed});
  setHydrationCollapsed(collapsed);
}
$('hydrationCollapse').addEventListener('click',toggleHydrationCollapsed);
$('hydrationDropToggle').addEventListener('click',toggleHydrationCollapsed);
$('hydrationToggle').addEventListener('click',async()=>{
  const latest=normalizeHydrationData((await store.get(['hydrationData'])).hydrationData);
  latest.settings.remindersEnabled=!latest.settings.remindersEnabled;
  latest.snoozedUntil=null;
  latest.nextReminderAt=latest.settings.remindersEnabled?hydrationCore.getNextReminderAt({...latest,nextReminderAt:null}):null;
  if(!latest.settings.remindersEnabled)$('hydrationAlert').hidden=true;
  await saveHydrationData(latest);
});
$('hydrationInterval').addEventListener('change',()=>{$('hydrationCustomInterval').hidden=$('hydrationInterval').value!=='custom'});
$('hydrationCustomInterval').addEventListener('change',()=>{const value=Number($('hydrationCustomInterval').value);$('hydrationCustomInterval').setCustomValidity(value<5||value>480?'Nhập từ 5 đến 480 phút':'')});
$('hydrationDailyGoal').addEventListener('change',()=>{$('hydrationCustomGoal').hidden=$('hydrationDailyGoal').value!=='custom'});
$('hydrationCustomGoal').addEventListener('change',()=>{const value=Number($('hydrationCustomGoal').value);$('hydrationCustomGoal').setCustomValidity(value<100||value>10000?'Nhập mục tiêu từ 100 đến 10.000 ml':'')});
$('hydrationRemindersEnabled').addEventListener('change',async()=>{
  const latest=normalizeHydrationData((await store.get(['hydrationData'])).hydrationData);
  latest.settings.remindersEnabled=$('hydrationRemindersEnabled').checked;
  latest.snoozedUntil=null;
  latest.nextReminderAt=latest.settings.remindersEnabled?hydrationCore.getNextReminderAt({...latest,nextReminderAt:null}):null;
  await saveHydrationData(latest);
});
$('hydrationBackgroundNotifications').addEventListener('change',async()=>{
  const enabled=$('hydrationBackgroundNotifications').checked;
  if(enabled){
    if(typeof chrome==='undefined'||!chrome.permissions?.request){$('hydrationBackgroundNotifications').checked=false;toast('Thông báo nền chỉ khả dụng trong Chrome/Edge extension');return}
    let granted=false;
    try{granted=await chrome.permissions.request({permissions:['notifications']})}
    catch(error){console.error('Không thể yêu cầu quyền thông báo:',error)}
    if(!granted){$('hydrationBackgroundNotifications').checked=false;toast('Chưa cấp quyền thông báo nền');return}
  }
  const latest=normalizeHydrationData((await store.get(['hydrationData'])).hydrationData);
  latest.settings.backgroundNotifications=enabled;
  if(enabled&&latest.settings.remindersEnabled&&!Number(latest.nextReminderAt))latest.nextReminderAt=hydrationCore.getNextReminderAt(latest);
  await saveHydrationData(latest);
  toast(enabled?'Đã bật thông báo nền':'Đã tắt thông báo nền');
});
$('hydrationSettingsSave').addEventListener('click',async()=>{
  const intervalChoice=$('hydrationInterval').value,customInterval=Number($('hydrationCustomInterval').value),goalChoice=$('hydrationDailyGoal').value,customGoal=Number($('hydrationCustomGoal').value);
  if(intervalChoice==='custom'&&(!Number.isFinite(customInterval)||customInterval<5||customInterval>480)){toast('Khoảng nhắc tùy chỉnh phải từ 5 đến 480 phút');return}
  const goal=goalChoice==='custom'?customGoal:Number(goalChoice);
  if(!Number.isFinite(goal)||goal<100||goal>10000){toast('Mục tiêu phải từ 100 đến 10.000 ml');return}
  if(!$('hydrationStart').value||!$('hydrationEnd').value||$('hydrationStart').value===$('hydrationEnd').value){toast('Giờ bắt đầu và kết thúc phải khác nhau');return}
  const latest=normalizeHydrationData((await store.get(['hydrationData'])).hydrationData);
  latest.settings.intervalMinutes=intervalChoice==='custom'?'custom':Number(intervalChoice);
  latest.settings.customIntervalMinutes=customInterval||60;
  latest.settings.startTime=$('hydrationStart').value;
  latest.settings.endTime=$('hydrationEnd').value;
  latest.settings.dailyGoalMl=goal;
  latest.settings.remindersEnabled=$('hydrationRemindersEnabled').checked;
  latest.settings.selectedAmount=hydrationSelectedAmount;
  latest.snoozedUntil=null;
  latest.nextReminderAt=latest.settings.remindersEnabled?hydrationCore.getNextReminderAt({...latest,nextReminderAt:null}):null;
  await saveHydrationData(latest);
  closeModal('hydrationSettingsBackdrop');
  toast('Đã lưu cài đặt nhắc uống nước');
});
$('hydrationSnooze').addEventListener('click',snoozeHydration);
$('hydrationMarkDrank').addEventListener('click',()=>recordHydration(200));
if(typeof chrome!=='undefined'&&chrome.storage?.onChanged?.addListener)chrome.storage.onChanged.addListener((changes,area)=>{
  if(area!=='local'||!changes.hydrationData?.newValue)return;
  hydrationData=normalizeHydrationData(changes.hydrationData.newValue);
  renderHydration(Date.now(),true);
  const last=Number(hydrationData.lastReminderAt),lastHome=Number(hydrationData.lastHomeReminderAt);
  if(last>lastHome&&Date.now()-last<90000&&hydrationData.settings.remindersEnabled){
    hydrationData.lastHomeReminderAt=last;
    void store.set({hydrationData});
    showHydrationAlert(hydrationMessage(hydrationTotal(),Number(hydrationData.settings.dailyGoalMl)||2000,new Date()));
  }
});
setInterval(()=>{void tickHydration()},1000);
async function loadBookmarks(){const box=$('bookmarkList');box.replaceChildren();const custom=customBookmarks.map((b,i)=>({...b,custom:true,index:i}));let native=[];if(typeof chrome!=='undefined'&&chrome.bookmarks?.getTree){try{const tree=await chrome.bookmarks.getTree();const walk=nodes=>nodes.forEach(n=>{if(n.url)native.push({name:n.title||n.url,url:n.url});if(n.children)walk(n.children)});walk(tree)}catch{}}const all=[...custom,...native];const query=$('bookmarkSearch').value.trim().toLowerCase();const filtered=all.filter(b=>(b.name+' '+b.url).toLowerCase().includes(query));if(!filtered.length){const p=document.createElement('p');p.className='empty-bookmarks';p.textContent=all.length?'Không tìm thấy bookmark phù hợp.':'Bạn chưa có bookmark nào. Dùng mục “Lưu bookmark mới” ở trên để thêm.';box.append(p);return}filtered.forEach(b=>{const row=document.createElement('div');row.className='bookmark-row';const link=document.createElement('a');link.href=b.url;link.textContent=b.name;link.title=b.url;link.target='_self';const marker=document.createElement('span');marker.textContent='↗';row.append(marker,link);if(b.custom){const del=document.createElement('button');del.textContent='×';del.title='Xóa bookmark';del.addEventListener('click',async()=>{customBookmarks.splice(b.index,1);await store.set({customBookmarks});loadBookmarks()});row.append(del)}box.append(row)})}
$('bookmarkSearch').addEventListener('input',loadBookmarks);$('saveBookmark').addEventListener('click',async()=>{const name=$('bookmarkName').value.trim(),urlRaw=$('bookmarkUrl').value.trim();if(!name||!urlRaw)return toast('Nhập tên và địa chỉ bookmark');const url=/^https?:\/\//i.test(urlRaw)?urlRaw:'https://'+urlRaw;try{new URL(url)}catch{return toast('Địa chỉ không hợp lệ')}customBookmarks.unshift({name,url});await store.set({customBookmarks});$('bookmarkName').value='';$('bookmarkUrl').value='';loadBookmarks();toast('Đã lưu bookmark')});
async function init(){
  void updateNotificationPermissionPopup();
  const d=await store.get(['links','notes','wallpaper','theme','city','visibleWidgets','joyCount','joyEmoji','hour12','islandAlways','islandText','widgetGap','weatherRadius','notesRadius','joyRadius','notesHeight','dockRadius','hydrationWidgetWidth','hydrationWidgetHeight','dayTrackerFontSize','dayProgressColor','signatureText','signatureUrl','supportUrl','wallblur','dim','displayName','customBookmarks','clockStyle','clockColor','functionMenuSize','functionMenuUnframed','clockFontFamily','clockFontScale','clockTopOffset','clockLeftOffset','widgetRightOffset','dayTrackerTopOffset']);
  if(Array.isArray(d.links)){
    let migrated=false;
    links=d.links.map(item=>{
      const defaultLink=DEFAULT_LINKS.find(link=>link.name===item.name&&link.url===item.url&&link.glyph===item.glyph);
      if(defaultLink&&item.mode==='glyph'&&!item.image){
        migrated=true;
        return {...item,mode:'auto'};
      }
      return item;
    });
    if(migrated)await store.set({links});
  }
  customBookmarks=Array.isArray(d.customBookmarks)?d.customBookmarks:[];
  renderDock();
  $('notes').value=d.notes||'';
  $('cityInput').value=d.city||'Ho Chi Minh City';
  joyCount=d.joyCount||0;
  $('joyCount').textContent=joyCount;
  setJoyEmoji(d.joyEmoji||'⭐');
  $('hour12').checked=!!d.hour12;
  activeClockStyle=applyClockStyle(d.clockStyle||'glass',d.clockColor||'#182536');
  activeClockColor=d.clockColor||'#182536';
  applyFunctionMenuSettings(d.functionMenuSize??48,d.functionMenuUnframed===true);
  applyClockFont(d.clockFontFamily??'georgia',d.clockFontScale??75);
  $('islandAlways').checked=d.islandAlways!==false;
  document.querySelector('.dynamic-island').classList.toggle('always-lit',$('islandAlways').checked);
  const islandText=typeof d.islandText==='string'?d.islandText:defaultIslandText;
  $('islandTextInput').value=islandText;
  $('islandText').textContent=islandText;
  $('displayName').value=d.displayName||'';
  applyHydrationDimensions(d.hydrationWidgetWidth??327,d.hydrationWidgetHeight??259);
  applyDayTrackerFontSize(d.dayTrackerFontSize==null?12:d.dayTrackerFontSize);
  applyDayProgressColor(d.dayProgressColor);
  const signatureText=typeof d.signatureText==='string'?d.signatureText:defaultSignatureText;
  const storedSignatureUrl=typeof d.signatureUrl==='string'?d.signatureUrl:'';
  const signatureUrl=normalizeSignatureUrl(storedSignatureUrl);
  if(signatureUrl===null){
    console.error('Đường dẫn chân trang đã lưu không hợp lệ.');
    toast('Liên kết chân trang đã lưu không hợp lệ; vui lòng cập nhật trong Tùy chỉnh.');
    applySignature(signatureText,'');
  }else applySignature(signatureText,signatureUrl);
  const storedSupportUrl=typeof d.supportUrl==='string'?d.supportUrl:'';
  const supportUrl=normalizeSignatureUrl(storedSupportUrl);
  if(supportUrl===null){
    console.error('Website hỗ trợ đã lưu không hợp lệ.');
    toast('Website hỗ trợ đã lưu không hợp lệ; đã khôi phục liên kết mặc định.');
    applySupportUrl(defaultSupportUrl);
  }else applySupportUrl(supportUrl||defaultSupportUrl);
  pixelAdjustments.forEach(setting=>applyPixelAdjustment(setting,d[setting.key]==null?setting.defaultValue:d[setting.key]));
  if(d.wallpaper)setWallpaper(d.wallpaper);
  if(d.wallblur!=null){$('blurRange').value=d.wallblur;$('blurValue').textContent=d.wallblur+'px';document.documentElement.style.setProperty('--wallblur',d.wallblur+'px')}
  const dim=d.dim==null?6:d.dim;
  $('dimRange').value=String(dim);
  $('dimValue').textContent=dim+'%';
  document.documentElement.style.setProperty('--dim',dim/100);
  const selectedTheme=d.theme||'light';
  applyTheme(resolveTheme(selectedTheme),selectedTheme);
  if(d.visibleWidgets){document.querySelectorAll('[data-widget]').forEach(c=>c.checked=d.visibleWidgets[c.dataset.widget]!==false);applyWidgetVisibility()}
  await initHydration();
  updateClock();
  scheduleClockFontLayout();
  loadWeather();
}

// GlassHome 4.1: corrected viewport anchors, clock color mode and free layout.
let suggestionItems=[],suggestionIndex=-1,suggestTimer=null,layoutEnabled=false;
const searchBox=$('searchSuggestions'),searchField=$('searchInput');
function hideSuggestions(){searchBox.hidden=true;searchBox.replaceChildren();suggestionItems=[];suggestionIndex=-1}
function chooseSuggestion(value){searchField.value=value;hideSuggestions();$('searchForm').requestSubmit()}
function renderSuggestions(items){suggestionItems=items.slice(0,8);suggestionIndex=-1;searchBox.replaceChildren();suggestionItems.forEach((value,i)=>{const b=document.createElement('button');b.type='button';b.className='suggestion-item';b.textContent=value;b.addEventListener('mousedown',e=>e.preventDefault());b.addEventListener('click',()=>chooseSuggestion(value));searchBox.append(b)});searchBox.hidden=!suggestionItems.length}
searchField.addEventListener('input',()=>{clearTimeout(suggestTimer);const q=searchField.value.trim();if(q.length<2){hideSuggestions();return}suggestTimer=setTimeout(async()=>{try{const r=await fetch('https://suggestqueries.google.com/complete/search?client=firefox&q='+encodeURIComponent(q));const data=await r.json();renderSuggestions(Array.isArray(data[1])?data[1]:[])}catch{hideSuggestions()}},180)});
searchField.addEventListener('keydown',e=>{if(searchBox.hidden)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();suggestionIndex=(suggestionIndex+(e.key==='ArrowDown'?1:-1)+suggestionItems.length)%suggestionItems.length;[...searchBox.children].forEach((n,i)=>n.classList.toggle('active',i===suggestionIndex))}else if(e.key==='Enter'&&suggestionIndex>=0){e.preventDefault();chooseSuggestion(suggestionItems[suggestionIndex])}else if(e.key==='Escape')hideSuggestions()});
searchField.addEventListener('blur',()=>setTimeout(hideSuggestions,160));
function setGlassStrength(v){const n=Math.max(0,Math.min(100,Number(v)));document.documentElement.style.setProperty('--glass-strength',n/100);document.documentElement.style.setProperty('--glass-blur',(4+n*.30)+'px');document.documentElement.style.setProperty('--glass-saturate',(120+n*.85)+'%');document.documentElement.style.setProperty('--glass-alpha',(0.18+n*.0042).toFixed(3));document.documentElement.style.setProperty('--glass-border-alpha',(0.28+n*.0062).toFixed(3));document.documentElement.style.setProperty('--clock-glass-alpha',(0.08+n*.0030).toFixed(3));document.documentElement.style.setProperty('--clock-border-alpha',(0.25+n*.0065).toFixed(3));document.documentElement.style.setProperty('--clock-dark-alpha',(0.22+n*.0024).toFixed(3));$('glassValue').textContent=n+'%'}
$('glassRange').addEventListener('input',()=>{setGlassStrength($('glassRange').value);store.set({glassStrength:Number($('glassRange').value)})});
function setClockGap(v){const n=Number(v);document.documentElement.style.setProperty('--clock-gap',n+'px');$('clockGapValue').textContent=n+'px'}
$('clockGapRange').addEventListener('input',()=>{setClockGap($('clockGapRange').value);store.set({clockGap:Number($('clockGapRange').value)})});
function applyClockStyle(style='glass',color='#182536'){
  const normalized=style==='color'?'color':'glass';
  document.body.classList.toggle('clock-colored',normalized==='color');
  document.documentElement.style.setProperty('--clock-color',color||'#182536');
  $('clockColor').value=color||'#182536';
  $('clockColorValue').textContent=(color||'#182536').toUpperCase();
  $('clockColorRow').classList.toggle('visible',normalized==='color');
  document.querySelectorAll('[data-clockstyle]').forEach(b=>b.classList.toggle('active',b.dataset.clockstyle===normalized));
  return normalized;
}
const clockFonts={
  system:'',
  arial:'Arial,sans-serif',
  georgia:'Georgia,serif',
  trebuchet:'"Trebuchet MS",sans-serif',
  verdana:'Verdana,sans-serif',
  courier:'"Courier New",monospace'
};
let clockFontFamily='georgia',clockFontScale=75,clockFontLayoutFrame=0;
function applyClockFont(family,scale){
  clockFontFamily=Object.prototype.hasOwnProperty.call(clockFonts,family)?family:'georgia';
  const parsed=Number(scale);
  clockFontScale=Number.isFinite(parsed)?Math.max(70,Math.min(130,Math.round(parsed/5)*5)):75;
  $('clockFontFamily').value=clockFontFamily;
  $('clockFontScale').value=String(clockFontScale);
  $('clockFontScaleValue').textContent=clockFontScale+'%';
  if(clockFonts[clockFontFamily])$('clock').style.fontFamily=clockFonts[clockFontFamily];
  else $('clock').style.removeProperty('font-family');
  $('clock').style.zoom=String(1.25*clockFontScale/100);
  scheduleClockFontLayout();
}
function updateClockFontLayout(){
  $('clock').style.zoom=String(1.25*clockFontScale/100);
}
function scheduleClockFontLayout(){
  if(clockFontLayoutFrame)cancelAnimationFrame(clockFontLayoutFrame);
  clockFontLayoutFrame=requestAnimationFrame(()=>{
    clockFontLayoutFrame=0;
    updateClockFontLayout();
  });
}
window.addEventListener('resize',scheduleClockFontLayout);
if('ResizeObserver'in window){
  const clockFontObserver=new ResizeObserver(scheduleClockFontLayout);
  clockFontObserver.observe(document.querySelector('.clock-block'));
}
$('clockFontFamily').addEventListener('change',async()=>{
  applyClockFont($('clockFontFamily').value,$('clockFontScale').value);
  await store.set({clockFontFamily});
});
$('clockFontScale').addEventListener('input',()=>{
  applyClockFont(clockFontFamily,$('clockFontScale').value);
  void store.set({clockFontScale});
});
let activeClockStyle='glass',activeClockColor='#182536';
document.querySelectorAll('[data-clockstyle]').forEach(b=>b.addEventListener('click',async()=>{activeClockStyle=applyClockStyle(b.dataset.clockstyle,activeClockColor);await store.set({clockStyle:activeClockStyle,clockColor:activeClockColor})}));
$('clockColor').addEventListener('input',async()=>{activeClockColor=$('clockColor').value;activeClockStyle=applyClockStyle('color',activeClockColor);await store.set({clockStyle:activeClockStyle,clockColor:activeClockColor})});
const layoutTargets=[...document.querySelectorAll('[data-draggable="true"]')];
function applyLayoutPoint(el,point){const appRect=$('app').getBoundingClientRect();el.style.position='fixed';el.style.left=(point.x*appRect.width)+'px';el.style.top=(point.y*appRect.height)+'px';el.style.right='auto';el.style.bottom='auto';el.style.transform='none';}
async function restoreLayout(){
  const d=await store.get(['freeLayout','glassStrength','clockGap','layoutVersion']);
  if(d.glassStrength!=null){$('glassRange').value=d.glassStrength;setGlassStrength(d.glassStrength)}else setGlassStrength(0);
  if(d.clockGap!=null){$('clockGapRange').value=d.clockGap;setClockGap(d.clockGap)}else setClockGap(-1);
  // v4.1 changes the default anchor points; discard only legacy free-layout coordinates once.
  if(d.layoutVersion!==41){await store.remove('freeLayout');await store.set({layoutVersion:41});return}
  if(!d.freeLayout)return;
  const widgetKeys=['weather','notes','joy'];
  const hasWidgetPoints=widgetKeys.some(k=>d.freeLayout[k]);
  let widgetRects=[];
  if(hasWidgetPoints){widgetRects=[...document.querySelectorAll('#widgetColumn .glass-card')].map(el=>({el,rect:el.getBoundingClientRect()}));$('widgetColumn').style.display='contents';}
  for(const el of layoutTargets){
    const key=el.dataset.layoutKey,point=d.freeLayout[key];
    if(point){applyLayoutPoint(el,point);continue}
    // Keep unmodified cards in their designed position when any sibling was customized.
    const snapshot=widgetRects.find(x=>x.el===el);
    if(snapshot){el.style.position='fixed';el.style.left=snapshot.rect.left+'px';el.style.top=snapshot.rect.top+'px';el.style.right='auto';el.style.bottom='auto';el.style.transform='none';el.dataset.freePlaced='1'}
  }
  scheduleClockFontLayout();
}
function setLayoutMode(on){layoutEnabled=!!on;if(layoutEnabled){const cards=[...document.querySelectorAll('#widgetColumn .glass-card')].map(el=>({el,r:el.getBoundingClientRect()}));$('widgetColumn').style.display='contents';for(const {el,r} of cards){if(!el.dataset.freePlaced){el.style.position='fixed';el.style.left=r.left+'px';el.style.top=r.top+'px';el.style.right='auto';el.style.bottom='auto';el.dataset.freePlaced='1'}}}document.body.classList.toggle('layout-editing',layoutEnabled);$('layoutModeBtn').textContent=layoutEnabled?'Hoàn tất':'Bật sắp xếp';toast(layoutEnabled?'Kéo từng khu vực để sắp xếp':'Đã lưu bố cục')}
$('layoutModeBtn').addEventListener('click',()=>setLayoutMode(!layoutEnabled));
$('app').addEventListener('click',e=>{if(layoutEnabled){e.preventDefault();e.stopPropagation()}},true);
layoutTargets.forEach(el=>{let start=null;el.addEventListener('pointerdown',e=>{if(!layoutEnabled||e.button!==0)return;if(e.target.closest('input,textarea,select'))return;e.preventDefault();const appRect=$('app').getBoundingClientRect(),rect=el.getBoundingClientRect();if(!el.dataset.freePlaced){el.style.position='fixed';el.style.left=(rect.left)+'px';el.style.top=(rect.top)+'px';el.style.right='auto';el.style.bottom='auto';el.style.transform='none';el.dataset.freePlaced='1'}start={x:e.clientX,y:e.clientY,left:parseFloat(el.style.left)||0,top:parseFloat(el.style.top)||0,appRect};el.setPointerCapture(e.pointerId)});el.addEventListener('pointermove',e=>{if(!start)return;const maxX=Math.max(0,start.appRect.width-el.offsetWidth),maxY=Math.max(0,start.appRect.height-el.offsetHeight);const x=Math.max(0,Math.min(maxX,start.left+e.clientX-start.x)),y=Math.max(0,Math.min(maxY,start.top+e.clientY-start.y));el.style.left=x+'px';el.style.top=y+'px'});const finish=async()=>{if(!start)return;start=null;const appRect=$('app').getBoundingClientRect(),rect=el.getBoundingClientRect(),all=(await store.get(['freeLayout'])).freeLayout||{};all[el.dataset.layoutKey]={x:Math.max(0,Math.min(1,(rect.left-appRect.left)/appRect.width)),y:Math.max(0,Math.min(1,(rect.top-appRect.top)/appRect.height))};await store.set({freeLayout:all})};el.addEventListener('pointerup',finish);el.addEventListener('pointercancel',finish)});
const hydrationResizeHandle=$('hydrationResizeHandle');
let hydrationResizeStart=null;
hydrationResizeHandle.addEventListener('pointerdown',e=>{
  if(!layoutEnabled||e.button!==0)return;
  e.preventDefault();
  e.stopPropagation();
  const rect=$('hydrationWidget').getBoundingClientRect();
  hydrationResizeStart={x:e.clientX,y:e.clientY,width:rect.width,height:rect.height};
  hydrationResizeHandle.setPointerCapture(e.pointerId);
});
hydrationResizeHandle.addEventListener('pointermove',e=>{
  if(!hydrationResizeStart)return;
  e.preventDefault();
  const width=Math.round(hydrationResizeStart.width+e.clientX-hydrationResizeStart.x);
  const height=Math.round(hydrationResizeStart.height+e.clientY-hydrationResizeStart.y);
  if(hydrationCollapsed)applyHydrationCollapsedDimensions(width,height);
  else applyHydrationDimensions(width,height);
});
const finishHydrationResize=async()=>{
  if(!hydrationResizeStart)return;
  hydrationResizeStart=null;
  if(hydrationCollapsed)await saveHydrationCollapsedDimensions();
  else await saveHydrationDimensions();
};
hydrationResizeHandle.addEventListener('pointerup',finishHydrationResize);
hydrationResizeHandle.addEventListener('pointercancel',finishHydrationResize);
window.addEventListener('resize',()=>{if(layoutEnabled)return;});
restoreLayout();

init();
