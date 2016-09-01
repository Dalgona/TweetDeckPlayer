module.exports = {
  twimg_media: 'twimg.com/media',
  twimg_profile: 'twimg.com/profile_images',

  // 트위터 이미지의 원본 크기를 가리키는 링크를 반환
  getOrigPath (_href) {
    var href = _href;
    if (href.search(this.twimg_media) !== -1) {
      var pos = href.substr(href.lastIndexOf('/')).lastIndexOf(':');
      if (pos == -1)
        pos = href.substr(href.lastIndexOf('/')).length;
      href = href.substr(0, href.lastIndexOf('/') + pos) + ":orig";
    } else {
      if (href.search(this.twimg_profile) !== -1) {
        var pos = href.substr(href.lastIndexOf('/')).lastIndexOf('_');
        if (pos == -1)
          pos = href.substr(href.lastIndexOf('/')).lastIndexOf('.');
        href = href.substr(0, href.lastIndexOf('/') + pos) + href.substr(href.lastIndexOf('.'));
      }
    }
    return href;
  },

  // 주어진 링크의 파일 이름을 반환
  getFileName (_href) {
    var href = _href;
    href = href.substr(_href.lastIndexOf('/') + 1);
    if (href.search(':') !== -1) {
      href = href.substr(0, href.search(':'));
    }

    return href;
  },

  // 파일의 확장자를 반환
  getFileExtension (_href) {
    // 파일 경로에서 파일 이름을 가져옴
    var filename = this.getFileName(_href);

    // 확장자가 없는 경우 공백 반환
    if (filename.lastIndexOf('.') === -1) return '';

    // 확장자를 반환
    return filename.substr(filename.lastIndexOf('.') + 1);
  },
};
