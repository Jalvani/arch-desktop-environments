$(document).ready(function() {
  chrome.extension.sendRequest({action: 'getSettings'}, function(settings) {
    $('html > head').append($('<style> \
      #fb-unseen-overlay { \
        display: -webkit-box; \
        position: fixed; \
        top: 0; bottom: 0; left: 0; right: 0; \
        z-index: 1000; \
        background: rgba(0, 0, 0, 0.5); \
        -webkit-box-align: center; \
        -webkit-box-pack: center; \
      } \
      #fb-unseen-overlay h2 { \
        display: block; \
        background: #3b5998; \
        padding: 0.5em 0.2em; \
        color: #fff; \
        font-size: 1.4em; \
      } \
      #fb-unseen-overlay p { \
        padding: 0.2em; \
      } \
      #fb-unseen-container { \
        background: #fff; \
        width: 650px; \
        height: 400px \
      } \
      #fb-unseen-buttons { \
        width: 100%; \
        text-align: center; \
      } \
      #fb-unseen-buttons .inputbutton { \
        width: 150px; \
        margin: auto; \
      } \
      </style>'));
    $('html > body').prepend($('<div id="fb-unseen-overlay"><div id="fb-unseen-container"> \
      <h2>Facebook Chat unseen</h2> \
      <p>Thank you for using Facebook Chat unseen. This extension is free and I develop it \
      in my spare time, but it would be great to earn a bit money from it. \
      Do you allow me to insert additional ads on facebook? The ad is a box, \
      sliding in from the bottom left edge into the page containing a banner. \
      You can change this setting at any time in the options of Facebook Chat unseen. </p> \
      <div id="fb-unseen-buttons"> \
        <a class="inputbutton" id="enable-ads">Yes, enable ads</a> \
        <a class="inputbutton" id="disable-ads">No, don’t show me ads</a> \
      </div> \
      </div></div>'));
  })
})
