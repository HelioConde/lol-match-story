(() => {
  const cfg=window.LMS_ADS||{};
  const publisher=String(cfg.publisherId||'').trim();
  const slots=cfg.slots||{};
  const consentKey='lms-ads-consent';
  const configured=publisher.startsWith('ca-pub-') && Object.values(slots).some(Boolean);
  if(!configured){
    document.querySelectorAll('[data-ad-slot]').forEach(host=>host.classList.add('hidden'));
    return;
  }

  function loadAds(){
    if(document.querySelector('script[data-lms-adsense]'))return;
    const s=document.createElement('script');
    s.async=true;
    s.crossOrigin='anonymous';
    s.dataset.lmsAdsense='true';
    s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(publisher);
    s.onload=()=>{
      document.querySelectorAll('[data-ad-slot]').forEach(host=>{
        const slot=slots[host.dataset.adSlot];
        if(!slot||host.dataset.loaded==='true')return;
        host.dataset.loaded='true';
        const ins=document.createElement('ins');
        ins.className='adsbygoogle';
        ins.style.display='block';
        ins.dataset.adClient=publisher;
        ins.dataset.adSlot=slot;
        ins.dataset.adFormat='auto';
        ins.dataset.fullWidthResponsive='true';
        host.replaceChildren(ins);
        try{(window.adsbygoogle=window.adsbygoogle||[]).push({});}catch{}
      });
    };
    document.head.appendChild(s);
  }

  function removeBanner(){document.querySelector('#adsConsent')?.remove();}
  function choose(value){
    localStorage.setItem(consentKey,value);
    removeBanner();
    if(value==='granted')loadAds();
  }

  const current=localStorage.getItem(consentKey);
  if(current==='granted'){loadAds();return;}
  if(current==='denied')return;

  const box=document.createElement('section');
  box.id='adsConsent';
  box.className='ads-consent';
  box.setAttribute('role','dialog');
  box.setAttribute('aria-label','Preferências de anúncios');
  box.innerHTML='<div><strong>Anúncios opcionais</strong><p>O site funciona sem anúncios personalizados. Você pode permitir o carregamento do provedor de anúncios ou continuar sem ele.</p></div><div class="ads-consent-actions"><button type="button" data-ads-choice="denied">Continuar sem anúncios</button><button type="button" class="primary" data-ads-choice="granted">Permitir anúncios</button></div>';
  document.body.appendChild(box);
  box.querySelectorAll('[data-ads-choice]').forEach(btn=>btn.addEventListener('click',()=>choose(btn.dataset.adsChoice)));
})();
