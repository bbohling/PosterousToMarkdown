var fs = require("fs");
var path = require("path");
var mkdirp = require('mkdirp');
var mustache = require('mustache');
var md = require('html-md')
var moment = require('moment');

//var file = "/Users/Shared/Posterous - bbohling.com/2012.09.07-13.16.02 PosterousBackup - bohling@gmail.com/Brandon Bohling {Again}/2009.09.01 Pix/post.json";
//var file = "/Users/Shared/Posterous - bbohling.com/2012.09.07-13.16.02 PosterousBackup - bohling@gmail.com/Brandon Bohling {Again}/2010.10.30 Maui Photos/post.json";
var sourceDirectory = '/Users/bbohling/Code/github/PosterousToMarkdown/data/Posterous - bbohling.com/2012.09.07-13.16.02 PosterousBackup - bohling@gmail.com/Brandon Bohling {Again}';
var templateFile = "postTemplate.md";
var postYear;
var postMonth;

function logit(msg, type) {
  var prefix = '';
  var type = '';
  if (type = 'error') {
    prefix = '> ERROR: ';
  }
  console.log(prefix + msg);
}

readDirectory(sourceDirectory, function (err, files) {
  if (err) {
    logit('Bad start!', 'error');
    return;
  }
  files.forEach(function (fileObject) {
    var objectPath = sourceDirectory + '/' + fileObject;
    fsCheck(objectPath, function (err, stat) {
      if (err) {
        logit('Sibling error: ' + objectPath, 'error');
      }
      if (stat && stat.isDirectory()) {
        var postPath = objectPath + '/post.json';
        fsCheck(postPath, function (err, stat) {
          if (err) {
            logit('Could not access post.json: ' + postPath);
            return;
          }
          if (stat && stat.isFile()) {
            readAndSavePost(postPath, path);
            copyImages(objectPath);
          }
        });  
      }
    });
       
  });
})



function readAndSavePost(postPath) {
  fsReadFile(postPath, function (err, content) {
    if (err) {
      console.log('DoIt error: ' + err);
      return;
    }
    var data = JSON.parse(content);

    var tmpDate = moment(data.display_date);
    var slug = data.slug;
    var postTitle = data.title;
    var publish = !data.draft;
    var tags = data.tags;
    var content = md(data.body_full);

    // Get date parts for storing images
    var dt = new Date(tmpDate);
    var year = dt.getFullYear();
    postYear = year;
    var month = dt.getMonth() + 1;
    postMonth = month;
    var monthDay = dt.getDate(); 
    var postDate = moment(data.display_date).format("YYYY-MM-DD HH:mm");
    var fileName = moment(data.display_date).format("YYYY-MM-DD") + '-' + slug;

    post = {
      date: postDate,
      title: postTitle,
      publish: publish,
      tags: tags,
      content: content,
      fileName: fileName
    };

    fsReadFile(templateFile, function (err, data) {
      if (err) {
        console.log('Error: ' + err);
        return;
      }
      var postText = mustache.to_html(data, post);
      var savePostAs = "output/" + post.fileName + ".md";
      fsSaveFile(savePostAs, postText);
    });
  });
}

function copyImages(imagePath) {
  var imagesFolder = imagePath + '/images';

  fsCheck(imagesFolder, function (err, stat) {
    if (err) {
      logit('copyImages: ' + imagesFolder, 'error');
      return;
    }
    if (stat && stat.isDirectory()) {
      readDirectory(imagesFolder, function (err, images) {
        if (err) {
          logit('read image dir: ' + imagesFolder, 'error');
          return;
        }
        // logit('i: ' + images);
        images.forEach(function (image) {
          var imagePath = imagesFolder + '/' + image;
          fsCheck(imagePath, function (err, stat) {
            if (err) {
              logit('image: ' + imagePath, 'error');
              return;
            }
            if (stat && stat.isFile()) {
              if ((path.extname(imagePath) == 'jpg') || (path.extname(imagePath) == 'png') || (path.extname(imagePath) == 'gif')) {
                var folderPath = 'uploads/' + postYear + '/' + postMonth;
                logit('fp: ' + folderPath);
                fsMakeDirectory(folderPath, function(err) { 
                  if (err) {
                    logit('mkdir: ' + folderPath, 'error');
                    return;
                  }
                  copyFile(path, folderPath + '/' + image, cb);
                });
              }
            }
          });
        });
      });
    } 
  });
}

function readDirectory(directoryPath, callback) {
  fs.readdir(directoryPath, function (err, files) {
    if (err) {
      return callback(err);
    }
    callback(null, files);
  });
}

function fsCheck(fsPath, callback) {
  fs.stat(fsPath, function (err, stat) {
    if (err) {
      return callback(err);
    }
    callback(null, stat);
  });
}

function fsReadFile(file, callback) {
  fs.readFile(file, 'utf8', function (err, fileContents) {
    if (err) {
      return callback(err);
    }
    callback(null, fileContents);
  });
}

function fsSaveFile(postPath, postText, callback) {
  fs.writeFile(postPath, postText, 'utf8', function (err) {
    if (err) {
      return callback(err);
    }
    console.log('Save file: done');
  });
}

function fsMakeDirectory(folderPath, callback) {
  mkdirp(folderPath, function(err) { 
    if (err) {
      return callback(err);
    }
    callback(err);
  });
}

function copyFile(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}