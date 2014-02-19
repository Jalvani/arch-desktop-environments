var _gaq = _gaq || [];
_gaq.push(['_setAccount', '']);
_gaq.push(['_gat._anonymizeIp']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})()

document.addEventListener('DOMContentLoaded', function() {
    var settings = new Store('settings', {
      'show_mark_as_read': true,
      'block_chat_seen': true,
      'block_typing_indicator': false
      // TODO
      // 'block_group_seen': false
    })
    var p = document.createElement('p');
    if (settings.get('block_chat_seen')) {
      chrome.browserAction.setIcon({path: 'icon48.disabled.png'})
      settings.set('block_chat_seen', false)
      _gaq.push(['_trackEvent', 'Popup', 'quickToggle', 'disabled'])
      var text = document.createTextNode('Facebook Chat unseen disabled. All your friends will now see if you read their messages.')
    } else {
      chrome.browserAction.setIcon({path: 'icon48.png'})
      settings.set('block_chat_seen', true)
      _gaq.push(['_trackEvent', 'Popup', 'quickToggle', 'enabled'])
      var text = document.createTextNode('Facebook Chat unseen enabled. Your friends will not be notified when you read their messages.')
    }
    p.appendChild(text);
    document.body.appendChild(p);
})
