// ==UserScript==
// @name        TweetDeck Paste Image
// @namespace   gaeulbyul.userscript
// @description Ʈ������ Ŭ������ �ٿ��ֱ�(Ctrl-V)�� �̹����� ���ε��ϴ� ����� �߰��Ѵ�.
// @author      Gaeulbyul
// @license     WTFPL
// @include     https://tweetdeck.twitter.com/
// @version     0.3b1
// @run-at      document-end
// @grant       none
// ==/UserScript==

/* tweetdeck-paste-image.user.js
 * Ʈ���� �÷��̾��� ���, �ش� ��ũ��Ʈ ������ 'script'������ �־��ּ���.
 * ���̾������� �׸�����Ű(Greasemonkey)�� �ʿ��մϴ�.
 * ũ��/�����/��ߵ�� ���۸�Ű(Tampermonkey)�� �ʿ��մϴ�.
 */

var catcher = $('<div>')
    .attr('contenteditable',true)
    .css('opacity', 0)
    .appendTo(document.body)
    .focus();

function dataURIToBlob (dataURI) {
    var [ mimeString, encodedData ] = dataURI.split(',');
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
        byteString = atob(encodedData);
    } else {
        byteString = unescape(encodedData);
    }
    var type = mimeString.match(/^data:(.+);/)[1];
    var ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    var blob = new Blob([ ia ], { type });
    return blob;
}

function waitClipboard () {
    var cer = catcher[0];
    var child = cer.childNodes && cer.childNodes[0];
    if (child) {
        if (child.tagName === 'IMG') {
            var file = dataURIToBlob(child.src);
            pasteFile([ file ]);
        }
        cer.innerHTML = '';
    } else {
        setTimeout(waitClipboard, 100);
    }
}

function pasteFile (files) {
    // Ʈ�� �Է�â�� ���� ���Ŀ� ��� �� ����
    if (!$('.app-content').hasClass('is-open')) {
        $(document).trigger("uiComposeTweet", { type: 'tweet' });
    }
    $(document).trigger('uiFilesAdded', { files });
}

$(document.body).on('paste', function (event) {
    try {
        var clipdata = event.originalEvent.clipboardData;
        var items = clipdata.items;
        var item = items[0];
    } catch (e) {
        catcher.focus();
        setTimeout(waitClipboard, 300);
        return;
    }
    if (item.kind !== 'file') return;
    var file = [ item.getAsFile() ];
    pasteFile(file);
});

/* Firefox Ŭ������ ���� ������ ��ũ:
 * http://stackoverflow.com/a/21378950
 * http://joelb.me/blog/2011/code-snippet-accessing-clipboard-images-with-javascript/
 * http://stackoverflow.com/a/5100158 (dataURIToBlob)
*/